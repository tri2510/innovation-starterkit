import type { CaseStudy, BusinessModelType, CaseStudyPhaseType } from "@/types/innovation";

let caseStudiesCache: CaseStudy[] | null = null;

/**
 * Load all case studies from static JSON file
 * Uses caching in production for performance
 */
export async function getCaseStudies(): Promise<CaseStudy[]> {
  // Return cached data if available (production optimization)
  if (caseStudiesCache) {
    return caseStudiesCache;
  }

  try {
    // Dynamic import to support hot-reload in development
    const data = await import("@/data/case-studies/index.json");
    caseStudiesCache = data.caseStudies as CaseStudy[];
    return data.caseStudies as CaseStudy[];
  } catch (error) {
    console.error("Error loading case studies:", error);
    return [];
  }
}

/**
 * Get a single case study by ID
 */
export async function getCaseStudyById(id: string): Promise<CaseStudy | null> {
  const studies = await getCaseStudies();
  return studies.find((study) => study.id === id) || null;
}

/**
 * Get featured case studies
 */
export async function getFeaturedCaseStudies(): Promise<CaseStudy[]> {
  const studies = await getCaseStudies();
  return studies.filter((study) => study.featured);
}

/**
 * Filter case studies by business model
 */
export async function getCaseStudiesByBusinessModel(model: BusinessModelType): Promise<CaseStudy[]> {
  const studies = await getCaseStudies();
  return studies.filter((study) => study.businessModel === model);
}

/**
 * Filter case studies by industry/search term
 */
export async function searchCaseStudies(query: string): Promise<CaseStudy[]> {
  if (!query.trim()) {
    return getCaseStudies();
  }

  const studies = await getCaseStudies();
  const lowerQuery = query.toLowerCase();

  return studies.filter(
    (study) =>
      study.title.toLowerCase().includes(lowerQuery) ||
      study.company.toLowerCase().includes(lowerQuery) ||
      study.industry.toLowerCase().includes(lowerQuery) ||
      study.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      study.keyLearnings.some((learning) =>
        learning.toLowerCase().includes(lowerQuery)
      )
  );
}

/**
 * Filter case studies with multiple filters
 */
export async function filterCaseStudies(filters: {
  businessModel?: BusinessModelType;
  search?: string;
  featured?: boolean;
}): Promise<CaseStudy[]> {
  let studies = await getCaseStudies();

  if (filters.businessModel) {
    studies = studies.filter((s) => s.businessModel === filters.businessModel);
  }

  if (filters.featured) {
    studies = studies.filter((s) => s.featured);
  }

  if (filters.search) {
    const lowerQuery = filters.search.toLowerCase();
    studies = studies.filter(
      (study) =>
        study.title.toLowerCase().includes(lowerQuery) ||
        study.company.toLowerCase().includes(lowerQuery) ||
        study.industry.toLowerCase().includes(lowerQuery) ||
        study.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  return studies;
}

/**
 * Get recommended case studies based on user's idea
 * Matches by business model and industry
 */
export async function getRecommendedCaseStudies(
  userIndustry?: string,
  userBusinessModel?: BusinessModelType
): Promise<CaseStudy[]> {
  const studies = await getCaseStudies();
  const recommendations: Array<{ study: CaseStudy; score: number }> = [];

  for (const study of studies) {
    let score = 0;

    // Match by business model (high weight)
    if (userBusinessModel && study.businessModel === userBusinessModel) {
      score += 3;
    }

    // Match by industry (medium weight)
    if (userIndustry) {
      const lowerUserIndustry = userIndustry.toLowerCase();
      if (study.industry.toLowerCase().includes(lowerUserIndustry)) {
        score += 2;
      }
    }

    // Featured studies get a small boost
    if (study.featured) {
      score += 1;
    }

    if (score > 0) {
      recommendations.push({ study, score });
    }
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, 5).map((r) => r.study);
}

/**
 * Get phase data for a specific case study
 */
export async function getCaseStudyPhase(
  caseStudyId: string,
  phase: CaseStudyPhaseType
): Promise<CaseStudy["phases"][CaseStudyPhaseType] | null> {
  const study = await getCaseStudyById(caseStudyId);
  if (!study) return null;

  return study.phases[phase];
}

/**
 * Get all unique business models from case studies
 */
export async function getBusinessModels(): Promise<BusinessModelType[]> {
  const studies = await getCaseStudies();
  const models = new Set<BusinessModelType>();
  studies.forEach((study) => models.add(study.businessModel));
  return Array.from(models);
}

/**
 * Get all unique industries from case studies
 */
export async function getIndustries(): Promise<string[]> {
  const studies = await getCaseStudies();
  const industries = new Set<string>();
  studies.forEach((study) => industries.add(study.industry));
  return Array.from(industries).sort();
}

/**
 * Clear the cache (useful for development hot-reload)
 */
export function clearCache(): void {
  caseStudiesCache = null;
}
