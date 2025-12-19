/**
 * Clean raw Apify profile data - remove unnecessary fields
 * Keep only what's needed for AI processing and storage
 *
 * Supports dev_fusion/linkedin-profile-scraper format
 */
export function cleanProfileData(rawProfile: any): any {
  return {
    // Basic info - dev_fusion uses linkedinUrl/linkedinPublicUrl
    fullName: rawProfile.fullName || rawProfile.name,
    headline: rawProfile.headline,
    location: rawProfile.location || rawProfile.jobLocation,
    profileUrl: rawProfile.linkedinUrl || rawProfile.linkedinPublicUrl || rawProfile.profileUrl || rawProfile.url,
    photoUrl: rawProfile.photoUrl || rawProfile.photo,

    // Experience - dev_fusion uses jobTitle/companyName + experiences array
    currentPosition: rawProfile.jobTitle || rawProfile.position || rawProfile.currentPosition,
    currentCompany: rawProfile.companyName || rawProfile.company || rawProfile.currentCompany,
    experience: rawProfile.experiences?.map((exp: any) => ({
      title: exp.title || exp.jobTitle || exp.position,
      company: exp.companyName || exp.company,
      duration: exp.duration || exp.currentJobDuration || `${exp.jobStartedOn || exp.startDate || ''} - ${exp.jobEndedOn || exp.endDate || "Present"}`,
      description: exp.jobDescription || exp.description,
      location: exp.jobLocation || exp.location,
    })) || rawProfile.experience?.map((exp: any) => ({
      title: exp.title || exp.position,
      company: exp.company || exp.companyName,
      duration: exp.duration || `${exp.startDate} - ${exp.endDate || "Present"}`,
      description: exp.description,
    })),

    // Skills & Education
    skills: rawProfile.skills || [],
    education: rawProfile.education?.map((edu: any) => ({
      degree: edu.degree || edu.degreeName,
      school: edu.school || edu.schoolName,
      year: edu.year || edu.endDate,
    })),

    // Contact - dev_fusion uses mobileNumber
    email: rawProfile.email,
    phone: rawProfile.mobileNumber || rawProfile.phone || rawProfile.phoneNumber,

    // Keep minimal raw data for debugging
    _raw: {
      scrapedAt: new Date().toISOString(),
      actorRunId: rawProfile._actorRunId,
      succeeded: rawProfile.succeeded,
    },
  };
}

/**
 * Validate cleaned profile has minimum required data
 */
export function isValidProfile(profile: any): boolean {
  return !!(
    profile.fullName &&
    profile.profileUrl &&
    (profile.headline || profile.currentPosition || profile.experience?.length > 0)
  );
}

/**
 * Calculate if profile has contact information
 */
export function hasContactInfo(profile: any): boolean {
  return !!(profile.email || profile.phone);
}