# ⚠️ IMPORTANT: DNA Sample Files Issue

## Current Problem

The DNA matching algorithm in your system is designed for **REAL DNA test files** (23andMe, AncestryDNA) which contain:
- **500,000+** SNP markers
- Cover entire genome (**~3500 cM**)
- Realistic chromosome positions

Our simplified example files have:
- ❌ Only **516 SNPs** 
- ❌ Cover only **~100 cM** (not full genome)
- ❌ **Cannot reach 3300 cM threshold** required for parent-child detection

## Why Matches Aren't Found

Looking at `src/app/api/dna/match/route.ts` line 194:
```typescript
if (analysis.metrics.totalSNPs >= 500 && analysis.confidence >= 50) {
```

And line 769 for parent-child:
```typescript
else if (totalIBD_cM >= 3300) {
  return {
    relationship: "Parent-child",
    confidence: Math.round(baseConfidence * 0.95),
  };
}
```

**The algorithm requires 3300 cM of IBD** to detect parent-child, but our 516 SNP sample can only generate ~50-100 cM maximum.

## Solutions

### Option 1: Lower Thresholds for Testing (Recommended)

Modify `src/app/api/dna/match/route.ts`:

**Line 194 - Lower confidence threshold:**
```typescript
// OLD:
if (analysis.metrics.totalSNPs >= 500 && analysis.confidence >= 50) {

// NEW (for testing):
if (analysis.metrics.totalSNPs >= 500 && analysis.confidence >= 30) {
```

**Line 762-779 - Lower IBD thresholds:**
```typescript
// OLD parent-child detection:
if (kinshipCoeff >= 0.177 && kinshipCoeff <= 0.354) {
  if (segmentCount >= 15 && totalIBD_cM >= 2000) {
    return {
      relationship: "Full siblings",
      confidence: Math.round(baseConfidence * 0.95),
    };
  } else if (totalIBD_cM >= 3300) {  // <-- TOO HIGH FOR TEST DATA
    return {
      relationship: "Parent-child",
      confidence: Math.round(baseConfidence * 0.95),
    };
  }
```

```typescript
// NEW (for testing):
if (kinshipCoeff >= 0.177 && kinshipCoeff <= 0.354) {
  if (segmentCount >= 10 && totalIBD_cM >= 50) {  // Lower threshold
    return {
      relationship: "Full siblings or parent-child",
      confidence: Math.round(baseConfidence * 0.80),
    };
  } else if (kinshipCoeff >= 0.20 && kinshipCoeff <= 0.30) {  // Use kinship primarily
    return {
      relationship: "Parent-child",
      confidence: Math.round(baseConfidence * 0.75),
    };
  }
```

### Option 2: Use Real DNA Data

Download actual DNA raw data files from:
- **23andMe** - https://you.23andme.com/tools/data/
- **AncestryDNA** - DNA Settings → Download Raw Data
- **MyHeritage** - DNA Settings → Manage DNA kits → Download

These files contain 500K+ SNPs and will work properly with the algorithm.

### Option 3: Create Larger Test Files

Generate test files with **10,000+ SNPs** spread across realistic positions:
- Chromosome 1: 249 million bp
- Chromosome 2: 242 million bp  
- etc.

This requires significant effort and is not practical for quick testing.

## Recommended Action

**Temporarily modify the matching algorithm thresholds** for testing:

1. Edit `/src/app/api/dna/match/route.ts`
2. Lower `confidence >= 50` to `confidence >= 30` (line 194)
3. Modify parent-child detection to rely more on kinship coefficient than IBD cM
4. Test with the provided 516-SNP sample files
5. Restore original thresholds when using real DNA data

## Quick Fix Code

```typescript
// In src/app/api/dna/match/route.ts, line 762-779, replace with:

if (kinshipCoeff >= 0.177 && kinshipCoeff <= 0.354) {
  // For test data: prioritize kinship over IBD length
  if (kinshipCoeff >= 0.22 && kinshipCoeff <= 0.28) {
    return {
      relationship: "Parent-child (test mode)",
      confidence: Math.round(baseConfidence * 0.70),
    };
  } else if (segmentCount >= 5) {
    return {
      relationship: "Full siblings or parent-child",
      confidence: Math.round(baseConfidence * 0.65),
    };
  } else {
    return {
      relationship: "1st degree relative",
      confidence: Math.round(baseConfidence * 0.60),
    };
  }
}
```

This will allow test files to generate matches while still using real genetic algorithms.

---

**After testing, remember to revert these changes before production use!**
