// lib/sourcing/nodes/enrich-and-create.ts
import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

interface SalesQLEmail {
  email: string;
  type: string;
  status: "Valid" | "Unverifiable" | string;
}

interface SalesQLPhone {
  phone: string;
  type: string;
  country_code?: string;
  is_valid?: boolean;
}

interface SalesQLLocation {
  city?: string;
  state?: string;
  country_code?: string;
  country?: string;
}

interface SalesQLResponse {
  uuid?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  linkedin_url?: string;
  headline?: string;
  emails?: SalesQLEmail[];
  phones?: SalesQLPhone[];
  location?: SalesQLLocation;
  industry?: string;
  image?: string;
}

interface SalesQLResult {
  hasEmail: boolean;
  email?: string;
  phone?: string;
  emailType?: string;
  emailStatus?: string;
  fullData?: SalesQLResponse;
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
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 429) {
      console.error(`⚠️ Rate limit hit`);
      return { hasEmail: false };
    }

    if (!response.ok) {
      return { hasEmail: false };
    }

    const data: SalesQLResponse = await response.json();

    if (data.emails && data.emails.length > 0) {
      const validDirect = data.emails.find(
        (e: SalesQLEmail) => e.status === "Valid" && e.type === "Direct"
      );
      const validAny = data.emails.find(
        (e: SalesQLEmail) => e.status === "Valid"
      );
      const bestEmail = validDirect || validAny || data.emails[0];

      const result: SalesQLResult = {
        hasEmail: true,
        email: bestEmail.email,
        emailType: bestEmail.type,
        emailStatus: bestEmail.status,
        fullData: data,
      };

      if (data.phones && data.phones.length > 0) {
        const validPhone = data.phones.find((p: SalesQLPhone) => p.is_valid === true);
        const selectedPhone = validPhone || data.phones[0];
        result.phone = selectedPhone.phone;
      }

      return result;
    }

    return { hasEmail: false };
    
  } catch (error: any) {
    console.error(`❌ SalesQL error:`, error.message);
    return { hasEmail: false };
  }
}

export async function enrichAndCreateCandidates(state: SourcingState) {
  console.log(`\n📧 ENRICHMENT STARTED: Target ${state.maxCandidates}, Processing ${state.currentSearchResults.length} profiles`);
  
  const apiKey = process.env.SALESQL_API_KEY;
  if (!apiKey) {
    console.error(`❌ SALESQL_API_KEY not configured`);
    
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
  let skipped = 0;
  let discarded = 0;
  let foundWithEmail = state.candidatesWithEmails || 0;

  for (let i = 0; i < state.currentSearchResults.length; i++) {
    const profile = state.currentSearchResults[i];

    if (foundWithEmail >= state.maxCandidates) {
      console.log(`🎯 Target reached (${foundWithEmail}/${state.maxCandidates}) at profile ${i + 1}/${state.currentSearchResults.length}`);
      break;
    }

    const exists = await prisma.linkedInCandidate.findUnique({
      where: {
        sourcingJobId_profileUrl: {
          sourcingJobId: state.jobId,
          profileUrl: profile.profileUrl
        }
      }
    });

    if (exists) {
      skipped++;
      if (exists.hasContactInfo) {
        foundWithEmail++;
      }
      continue;
    }

    const enrichment = await enrichWithSalesQL(profile.profileUrl, apiKey);

    if (enrichment.hasEmail) {
      try {
        const salesqlData = enrichment.fullData;
        
        await prisma.linkedInCandidate.create({
          data: {
            sourcingJobId: state.jobId,
            profileUrl: profile.profileUrl,
            fullName: salesqlData?.full_name || profile.fullName || "Unknown",
            headline: salesqlData?.headline || profile.headline,
            location: salesqlData?.location?.city 
              ? `${salesqlData.location.city}, ${salesqlData.location.state || salesqlData.location.country}`
              : profile.location,
            currentPosition: profile.currentPosition,
            currentCompany: profile.currentCompany,
            photoUrl: salesqlData?.image || profile.photoUrl,
            email: enrichment.email,
            phone: enrichment.phone,
            hasContactInfo: true,
            emailSource: "salesql",
            enrichmentStatus: "ENRICHED",
            enrichedAt: new Date(),
            scrapingStatus: "PENDING",
            rawData: {
              searchData: profile,
              salesqlData: enrichment.fullData as any
            } as any
          }
        });

        created++;
        foundWithEmail++;
        
      } catch (error: any) {
        console.error(`❌ DB error:`, error.message);
      }
    } else {
      discarded++;
    }

    if (i < state.currentSearchResults.length - 1) {
      await new Promise(r => setTimeout(r, 334));
    }
  }

  console.log(`✅ ENRICHMENT COMPLETE: Created ${created}, Skipped ${skipped}, Discarded ${discarded}, Total ${foundWithEmail}/${state.maxCandidates}\n`);

  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      status: "PROFILES_FOUND",
      currentStage: `ENRICHED_${foundWithEmail}_OF_${state.maxCandidates}`,
      lastActivityAt: new Date()
    }
  });

  return {
    candidatesWithEmails: foundWithEmail,
    currentSearchResults: [],
    currentStage: "ENRICHMENT_COMPLETE"
  };
}