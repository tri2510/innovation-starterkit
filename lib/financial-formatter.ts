/**
 * Financial Assumptions Formatter
 *
 * Parses AI-generated assumptions text into structured display format
 */

export interface ParsedAssumptions {
  pricingModel?: string;
  customerAcquisition?: string;
  revenueCalculation?: string;
  growthRates?: string;
  costStructure?: string;
  dataSources?: string;
  raw?: string; // Fallback for unparsed text
}

/**
 * Parse AI assumptions text into structured components
 */
export function parseAssumptions(assumptions: string): ParsedAssumptions {
  const result: ParsedAssumptions = {};

  // Try to extract structured sections from the text
  const sections = assumptions.split(/\n\n+/);

  for (const section of sections) {
    const lower = section.toLowerCase();

    // Pricing Model section
    if (lower.includes('pricing') || lower.includes('$') && lower.includes('/month')) {
      result.pricingModel = section.trim();
    }
    // Customer Acquisition section
    else if (lower.includes('customer') || lower.includes('acquisition')) {
      result.customerAcquisition = section.trim();
    }
    // Revenue Calculation section
    else if (lower.includes('revenue') || lower.includes('year')) {
      if (!result.revenueCalculation) {
        result.revenueCalculation = section.trim();
      } else {
        result.revenueCalculation += '\n\n' + section.trim();
      }
    }
    // Growth Rates section
    else if (lower.includes('growth') || lower.includes('yoy')) {
      result.growthRates = section.trim();
    }
    // Cost Structure section
    else if (lower.includes('cost') || lower.includes('team') || lower.includes('expense')) {
      result.costStructure = section.trim();
    }
    // Data Sources section
    else if (lower.includes('benchmark') || lower.includes('source') || lower.includes('based on')) {
      result.dataSources = section.trim();
    }
  }

  // If no structured sections found, return raw text
  if (Object.keys(result).length === 0) {
    result.raw = assumptions;
  }

  return result;
}

/**
 * Extract key metrics from assumptions text for quick display
 */
export function extractKeyMetrics(assumptions: string): {
  pricing?: string;
  year1Customers?: string;
  year5Customers?: string;
  growthRate?: string;
} {
  const result: ReturnType<typeof extractKeyMetrics> = {};

  // Extract pricing (e.g., "$500/month", "$5,000/year")
  const pricingMatch = assumptions.match(/\$[\d,]+\/(?:month|year)/i);
  if (pricingMatch) {
    result.pricing = pricingMatch[0];
  }

  // Extract Year 1 customers (e.g., "Year 1: 100 customers")
  const year1Match = assumptions.match(/year\s*1[:\s]+(\d+)\s*customers?/i);
  if (year1Match) {
    result.year1Customers = year1Match[1];
  }

  // Extract Year 5 customers
  const year5Match = assumptions.match(/year\s*5[:\s]+(\d+)\s*customers?/i);
  if (year5Match) {
    result.year5Customers = year5Match[1];
  }

  // Extract growth rate (e.g., "150% YoY")
  const growthMatch = assumptions.match(/(\d+%)\s*(?:yoy|year-over-year|growth)/i);
  if (growthMatch) {
    result.growthRate = growthMatch[1];
  }

  return result;
}
