// lib/sourcing/nodes/enrich-and-create.ts
import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

interface SalesQLResult {
  hasEmail: boolean;
  email?: string;
  phone?: string;
  emailType?: string;
  emailStatus?: string;
  fullData?: any;
}

async function enrichWithSalesQL(
  linkedinUrl: string,
  apiKey: string
): Promise<SalesQLResult> {
  try {
    const response = await fetch(
      `https://api-public.salesql.com/v1/persons/enrich/?linkedin_url=${encodeURIComponent(linkedinUrl)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`SalesQL API error: ${response.status}`);
      return { hasEmail: false };
    }

    const data = await response.json();

    if (data.emails && data.emails.length > 0) {
      // Prioritize: Valid personal > Valid work > Any work > Any
      const validWork = data.emails.find(
        (e: any) => e.status === "Valid" && e.type === "work"
      );
      const validPersonal = data.emails.find(
        (e: any) => e.status === "Valid" && e.type === "personal"
      );
      const anyWork = data.emails.find((e: any) => e.type === "work");
      const bestEmail = validPersonal  || validWork || anyWork || data.emails[0];

      const result: SalesQLResult = {
        hasEmail: true,
        email: bestEmail.email,
        emailType: bestEmail.type,
        emailStatus: bestEmail.status,
        fullData: data,
      };

      // Get phone if available (no extra charge)
      if (data.phones && data.phones.length > 0) {
        const workPhone = data.phones.find((p: any) => p.type === "work");
        result.phone = ( data.phones[0]  ||  workPhone ).number;
      }

      return result;
    }

    return { hasEmail: false };
  } catch (error: any) {
    console.error(`SalesQL error:`, error.message);
    return { hasEmail: false };
  }
}

export async function enrichAndCreateCandidates(state: SourcingState) {
  console.log(`\n📧 ENRICHMENT & CREATE PHASE`);
  console.log(`📊 Processing ${state.currentSearchResults.length} profiles from search`);
  
  const apiKey = process.env.SALESQL_API_KEY;
  if (!apiKey) {
    console.error("❌ SALESQL_API_KEY not configured");
    
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        status: "FAILED",
        errorMessage: "SalesQL API key not configured",
        failedAt: new Date()
      }
    });
    
    return {
      errors: [{
        stage: "enrich_and_create",
        message: "SalesQL API key not configured",
        timestamp: new Date(),
        retryable: false
      }],
      currentStage: "ENRICHMENT_FAILED"
    };
  }

  let created = 0;
  let discarded = 0;

  for (const userProfile of state.currentSearchResults) {
    // Check if candidate already exists (resume support)
    const exists = await prisma.linkedInCandidate.findUnique({
      where: {
        sourcingJobId_profileUrl: {
          sourcingJobId: state.jobId,
          profileUrl: userProfile.profileUrl
        }
      }
    });

    if (exists) {
      console.log(`   ⚠️ ${userProfile.profileUrl} already exists, skipping`);
      if (exists.hasContactInfo) {
        created++; // Count it toward total
      }
      continue;
    }

    // Enrich with SalesQL
    console.log(`   Enriching: ${userProfile.fullName || userProfile.profileUrl}`);
    const enrichment = await enrichWithSalesQL(userProfile.profileUrl, apiKey);

    if (enrichment.hasEmail) {
      // ✅ CREATE CANDIDATE IMMEDIATELY with basic info + email
      try {
        await prisma.linkedInCandidate.create({
          data: {
            sourcingJobId: state.jobId,
            
            // === BASIC INFO FROM SEARCH ===
            profileUrl: userProfile.profileUrl,
            fullName: userProfile.fullName || "Unknown",
            headline: userProfile.headline,
            location: userProfile.location,
            currentPosition: userProfile.currentPosition,
            currentCompany: userProfile.currentCompany,
            photoUrl: userProfile.photoUrl,
            
            // === EMAIL FROM SALESQL (SAVED IMMEDIATELY) ===
            email: enrichment.email,
            phone: enrichment.phone,
            hasContactInfo: true,
            emailSource: "salesql",
            
            // === STATUS ===
            enrichmentStatus: "ENRICHED",
            enrichedAt: new Date(),
            scrapingStatus: "PENDING",
            
            // === RAW DATA ===
            rawData: {
              searchData: userProfile,
              salesqlData: enrichment.fullData
            }
          }
        });

        created++;
        console.log(`   ✓ Created: ${userProfile.fullName} (${enrichment.email})`);
      } catch (error: any) {
        console.error(`   ❌ Failed to create candidate:`, error.message);
      }
    } else {
      // DISCARD - no email found
      discarded++;
      console.log(`   ✗ No email: ${userProfile.fullName || userProfile.profileUrl} (discarded)`);
    }

    // Rate limiting: 1.2 seconds between calls (safe for 50/min limit)
    //TODO: this part must craifies with salesQl documentation
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  // Get final count from database
  const totalWithEmails = await prisma.linkedInCandidate.count({
    where: {
      sourcingJobId: state.jobId,
      hasContactInfo: true
    }
  });

  console.log(`\n✅ Enrichment complete:`);
  console.log(`   Created: ${created}`);
  console.log(`   Discarded: ${discarded}`);
  console.log(`   Total candidates with emails: ${totalWithEmails}/${state.maxCandidates}`);

  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      status: "PROFILES_FOUND",
      currentStage: `ENRICHED_${totalWithEmails}_OF_${state.maxCandidates}`,
      lastActivityAt: new Date()
    }
  });

  return {
    candidatesWithEmails: totalWithEmails,
    currentSearchResults: [], // Clear for next iteration
    currentStage: "ENRICHMENT_COMPLETE"
  };
}