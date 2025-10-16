/**
 * DNA Analysis Library
 * Provides deterministic genetic similarity calculations based on SNP data
 * NOT using AI - uses real genetic comparison algorithms
 */

export type SNP = {
  rsid: string;        // e.g., "rs12345678"
  chromosome: string;  // e.g., "1", "X", "Y", "MT"
  position: number;    // position on chromosome
  genotype: string;    // e.g., "AA", "AG", "GG", "--"
};

export type DNAComparisonResult = {
  sharedSNPs: number;
  totalCompared: number;
  matchPercentage: number;
  estimatedRelationship: string;
  confidence: 'high' | 'medium' | 'low';
  details: {
    identicalGenotypes: number;
    halfMatches: number;
    noMatches: number;
  };
};

/**
 * Parse DNA data from common formats (23andMe, AncestryDNA, MyHeritage)
 */
export function parseDNAData(rawData: string): SNP[] {
  const snps: SNP[] = [];
  const lines = rawData.split('\n');
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    
    // Try to parse as: rsid chromosome position genotype
    const rsid = parts[0];
    if (!rsid.startsWith('rs')) continue;
    
    const chromosome = parts[1];
    const position = parseInt(parts[2]);
    const genotype = parts[3];
    
    if (isNaN(position)) continue;
    
    snps.push({
      rsid,
      chromosome,
      position,
      genotype: genotype.toUpperCase(),
    });
  }
  
  return snps;
}

/**
 * Compare two DNA samples and calculate genetic similarity
 */
export function compareDNA(dna1: SNP[], dna2: SNP[]): DNAComparisonResult {
  // Create maps for quick lookup
  const dna1Map = new Map(dna1.map(snp => [snp.rsid, snp]));
  const dna2Map = new Map(dna2.map(snp => [snp.rsid, snp]));
  
  // Find overlapping SNPs
  const overlappingRSIDs = Array.from(dna1Map.keys()).filter(rsid => 
    dna2Map.has(rsid)
  );
  
  let identicalGenotypes = 0;
  let halfMatches = 0;
  let noMatches = 0;
  
  for (const rsid of overlappingRSIDs) {
    const snp1 = dna1Map.get(rsid)!;
    const snp2 = dna2Map.get(rsid)!;
    
    // Skip no-calls
    if (snp1.genotype === '--' || snp2.genotype === '--' || 
        snp1.genotype === '00' || snp2.genotype === '00') {
      continue;
    }
    
    const match = compareGenotypes(snp1.genotype, snp2.genotype);
    if (match === 2) identicalGenotypes++;
    else if (match === 1) halfMatches++;
    else noMatches++;
  }
  
  const totalCompared = identicalGenotypes + halfMatches + noMatches;
  
  // Calculate match percentage (full matches + half of half-matches)
  const sharedSNPs = identicalGenotypes + (halfMatches * 0.5);
  const matchPercentage = totalCompared > 0 
    ? (sharedSNPs / totalCompared) * 100 
    : 0;
  
  // Estimate relationship based on shared DNA
  const { relationship, confidence } = estimateRelationship(
    matchPercentage, 
    totalCompared
  );
  
  return {
    sharedSNPs: Math.round(sharedSNPs),
    totalCompared,
    matchPercentage: Math.round(matchPercentage * 100) / 100,
    estimatedRelationship: relationship,
    confidence,
    details: {
      identicalGenotypes,
      halfMatches,
      noMatches,
    },
  };
}

/**
 * Compare two genotypes
 * Returns: 2 = identical, 1 = half-match (share 1 allele), 0 = no match
 */
function compareGenotypes(g1: string, g2: string): number {
  // Normalize genotypes
  const alleles1 = g1.replace(/[\/\|]/, '').split('');
  const alleles2 = g2.replace(/[\/\|]/, '').split('');
  
  if (alleles1.length !== 2 || alleles2.length !== 2) return 0;
  
  // Check for identical genotypes
  if (g1 === g2) return 2;
  
  // Check for half-matches (one shared allele)
  const shared = alleles1.filter(a => alleles2.includes(a)).length;
  if (shared === 1) return 1;
  if (shared === 2) return 2;
  
  return 0;
}

/**
 * Estimate relationship based on % shared DNA
 * Based on established genetic relationships
 */
function estimateRelationship(
  matchPercentage: number,
  snpCount: number
): { relationship: string; confidence: 'high' | 'medium' | 'low' } {
  
  // Confidence based on number of SNPs compared
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (snpCount > 10000) confidence = 'high';
  else if (snpCount > 1000) confidence = 'medium';
  
  // Relationship estimation based on % shared DNA
  if (matchPercentage >= 48 && matchPercentage <= 52) {
    return { relationship: 'Parent/Child or Identical Twin', confidence };
  } else if (matchPercentage >= 44 && matchPercentage <= 54) {
    return { relationship: 'Full Sibling', confidence };
  } else if (matchPercentage >= 23 && matchPercentage <= 27) {
    return { relationship: 'Grandparent/Grandchild or Half-Sibling or Uncle/Aunt/Nephew/Niece', confidence };
  } else if (matchPercentage >= 11 && matchPercentage <= 14) {
    return { relationship: 'First Cousin', confidence };
  } else if (matchPercentage >= 5.5 && matchPercentage <= 8) {
    return { relationship: 'First Cousin Once Removed or Second Cousin', confidence };
  } else if (matchPercentage >= 2.5 && matchPercentage <= 4) {
    return { relationship: 'Second Cousin Once Removed or Third Cousin', confidence };
  } else if (matchPercentage >= 1 && matchPercentage <= 2) {
    return { relationship: 'Third Cousin Once Removed or Fourth Cousin', confidence };
  } else if (matchPercentage > 0.5) {
    return { relationship: 'Distant Relative (4th-6th Cousin)', confidence };
  } else {
    return { relationship: 'Not Related or Very Distant', confidence };
  }
}

/**
 * Calculate minimum SNPs needed for reliable comparison
 */
export function getMinimumSNPsRequired(): number {
  return 500; // Minimum for any meaningful comparison
}

/**
 * Validate DNA file quality
 */
export function validateDNAQuality(snps: SNP[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (snps.length < 100) {
    errors.push('Too few SNPs detected. Need at least 100 markers.');
  } else if (snps.length < 500) {
    warnings.push('Low SNP count. Results may not be reliable. Recommend 10,000+ SNPs.');
  }
  
  // Check for no-calls
  const noCalls = snps.filter(s => s.genotype === '--' || s.genotype === '00').length;
  const noCallRate = (noCalls / snps.length) * 100;
  
  if (noCallRate > 50) {
    errors.push(`Too many no-calls (${noCallRate.toFixed(1)}%). File may be corrupted.`);
  } else if (noCallRate > 20) {
    warnings.push(`High no-call rate (${noCallRate.toFixed(1)}%). May affect accuracy.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
