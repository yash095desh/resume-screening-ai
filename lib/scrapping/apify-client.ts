import { ApifyClient } from "apify-client";

// Initialize Apify client
const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
});

export interface LinkedInSearchInput {
  keywords: string[];
  titles: string[];
  experienceYears?: string;
  location?: string;
  maxResults: number;
}

export interface ProfileSearchResult {
  profileUrl: string;
  name: string;
  headline?: string;
  location?: string;
}

/**
 * Search LinkedIn profiles using Apify actor
 * Uses harvestapi/linkedin-profile-search for discovery
 */
export async function searchLinkedInProfiles(
  input: LinkedInSearchInput
): Promise<ProfileSearchResult[]> {
  try {
    console.log("🔍 Starting LinkedIn profile search...");

    // Build input for the actor
    const actorInput: any = {
      profileScraperMode: "Short",
      takePages: Math.ceil(input.maxResults / 25), // ✅ Already had this
      maxItems: input.maxResults, // ⭐ ADD THIS - KEY FIX
    };

    // Option 1: Use specific filters (RECOMMENDED)
    if (input.titles.length > 0) {
      actorInput.currentJobTitles = input.titles;
    }

    if (input.location) {
      // Use full location name to avoid LinkedIn's auto-suggestions
      actorInput.locations = [input.location];
    }

    // Option 2: Or use general search query (less precise)
    // if (input.keywords.length > 0 || input.titles.length > 0) {
    //   actorInput.searchQuery = buildLinkedInSearchQuery(input);
    // }

    console.log("Actor input:", JSON.stringify(actorInput, null, 2));

    // Run the actor
    const run = await client.actor("harvestapi/linkedin-profile-search").call(actorInput);

    // Check for rate limiting
    if (run.statusMessage === 'rate limited') {
      console.warn('⚠️ Rate limit hit. Waiting until next hour...');
      const now = new Date();
      const waitTime = 3600000 - (now.getMinutes() * 60000 + now.getSeconds() * 1000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Retry the request
      const retryRun = await client.actor("harvestapi/linkedin-profile-search").call(actorInput);
      const { items: retryItems } = await client.dataset(retryRun.defaultDatasetId).listItems();
      return mapSearchResults(retryItems);
    }

    // Get results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Ensure we never exceed maxResults
    const limitedItems = items.slice(0, input.maxResults);

    console.log(`✅ Found ${items.length} profiles (using ${limitedItems.length})`);


    return mapSearchResults(items);
  } catch (error) {
    console.error("❌ Error searching LinkedIn profiles:", error);
    throw new Error("Failed to search LinkedIn profiles");
  }
}

/**
 * Map search results to our interface
 */
function mapSearchResults(items: any[]): ProfileSearchResult[] {
  return items.map((item: any) => ({
    profileUrl: item.linkedinUrl || item.profileUrl || `https://linkedin.com/in/${item.publicIdentifier}`,
    name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
    headline: item.headline,
    location: item.location?.linkedinText || item.location,
  }));
}

/**
 * Scrape detailed LinkedIn profiles with email/phone enrichment
 * Uses dev_fusion/linkedin-profile-scraper which automatically includes contact info
 */
export async function scrapeLinkedInProfiles(
  profileUrls: string[]
): Promise<any[]> {
  try {
    console.log(`🔍 Starting profile scraping for ${profileUrls.length} profiles...`);

    // dev_fusion actor - simple and includes email/phone automatically!
    const run = await client.actor("dev_fusion/linkedin-profile-scraper").call({
      profileUrls: profileUrls,  // Only parameter needed!
    });

    // Wait for results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`✅ Scraped ${items.length} profiles successfully`);

    // Log success rate - dev_fusion uses 'succeeded', 'email', 'mobileNumber'
    const succeeded = items.filter((item: any) => item.succeeded).length;
    const withEmail = items.filter((item: any) => item.email).length;
    const withPhone = items.filter((item: any) => item.mobileNumber || item.phone || item.phoneNumbers?.length > 0).length;

    console.log(`📊 Stats: ${succeeded}/${items.length} succeeded, ${withEmail} emails found, ${withPhone} phones found`);

    return items;
  } catch (error) {
    console.error("❌ Error scraping profiles:", error);
    throw new Error("Failed to scrape LinkedIn profiles");
  }
}

/**
 * Scrape profiles in batches with parallel execution
 * Optimized for dev_fusion actor
 */
export async function scrapeProfilesInBatches(
  profileUrls: string[],
  batchSize: number = 20,  // Increased from 15 - dev_fusion is fast
  maxParallel: number = 3
): Promise<any[]> {
  const batches: string[][] = [];
  
  // Split into batches
  for (let i = 0; i < profileUrls.length; i += batchSize) {
    batches.push(profileUrls.slice(i, i + batchSize));
  }

  console.log(`📦 Split ${profileUrls.length} profiles into ${batches.length} batches`);

  const allResults: any[] = [];

  // Process batches in parallel groups
  for (let i = 0; i < batches.length; i += maxParallel) {
    const batchGroup = batches.slice(i, i + maxParallel);
    
    console.log(`⚡ Processing batch group ${Math.floor(i / maxParallel) + 1}/${Math.ceil(batches.length / maxParallel)}`);

    const results = await Promise.all(
      batchGroup.map((batch) => scrapeLinkedInProfiles(batch))
    );

    allResults.push(...results.flat());

    // Small delay between batch groups to be respectful
    if (i + maxParallel < batches.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return allResults;
}

/**
 * Complete workflow: Search + Enrich
 * This is the recommended approach combining both actors
 */
export async function searchAndEnrichProfiles(
  searchInput: LinkedInSearchInput
): Promise<any[]> {
  try {
    console.log('🚀 Starting complete workflow: Search + Enrich');
    
    // Step 1: Search for profiles (using Short mode = cheap)
    console.log('📍 Step 1: Searching for profiles...');
    const searchResults = await searchLinkedInProfiles(searchInput);
    
    if (searchResults.length === 0) {
      console.log('⚠️ No profiles found');
      return [];
    }
    
    console.log(`✅ Found ${searchResults.length} profiles to enrich`);
    
    // Step 2: Enrich with full details + email/phone
    console.log('📍 Step 2: Enriching profiles with contact info...');
    const profileUrls = searchResults.map(p => p.profileUrl);
    const enrichedProfiles = await scrapeProfilesInBatches(profileUrls);
    
    console.log('✅ Workflow complete!');
    
    return enrichedProfiles;
  } catch (error) {
    console.error('❌ Workflow error:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * // Search and enrich in one go
 * const results = await searchAndEnrichProfiles({
 *   titles: ['Software Engineer', 'Senior Developer'],
 *   keywords: ['React', 'TypeScript'],
 *   location: 'San Francisco, California',  // Use full name!
 *   maxResults: 100
 * });
 * 
 * // Or do it in steps:
 * const searchResults = await searchLinkedInProfiles({...});
 * const urls = searchResults.map(p => p.profileUrl);
 * const enriched = await scrapeProfilesInBatches(urls);
 */