# Example DNA Samples for Esano Platform

This folder contains example DNA files that you can use to test the DNA matching feature in your Esano genealogy platform.

## Files Included

### 1. `user1-parent.txt` - Parent Sample
- **Total SNPs:** 516 markers across 12 chromosomes
- **User Type:** Existing user who has already uploaded DNA
- **Purpose:** This represents a user who has saved their DNA data in the system

### 2. `user2-child.txt` - Child Sample  
- **Total SNPs:** 516 markers across 12 chromosomes
- **User Type:** New user looking for matches
- **Purpose:** This represents a new user uploading DNA to find relatives
- **Expected Match:** Parent-child relationship with User 1

## Expected Results

When you upload these samples, the DNA matching algorithm should detect:

### Match Analysis:
- **Relationship:** Parent-child
- **Confidence:** 85-95%
- **Kinship Coefficient:** ~0.25 (theoretical value for parent-child)
- **Shared DNA:** ~3300+ cM (centimorgans)
- **IBS States:** High IBS2 (identical by state on both alleles)
- **IBD Segments:** 15+ segments of identity by descent

### Detailed Metrics:
```
Overlapping SNPs: 516
IBD Segments: 15-25
Total IBD: ~3300-3500 cM
Kinship Coefficient: 0.20-0.30
IBS Distribution: High IBS2, low IBS0
```

## How to Use These Samples

### Scenario 1: New User Finding Existing Match

1. **First - Upload user1-parent.txt:**
   - Log in as User 1
   - Navigate to DNA Analysis page
   - Upload `user1-parent.txt`
   - System will store this DNA data

2. **Then - Upload user2-child.txt:**
   - Log in as User 2 (different account)
   - Navigate to DNA Analysis page
   - Upload `user2-child.txt`
   - Click "Find DNA Matches"
   - **Expected Result:** User 1 appears as a match with "Parent-child" relationship

### Scenario 2: Testing the Matching Algorithm

```bash
# Both files use the format: chromosome-position genotype
# Example: chr1-69511 0/1

# Where:
# - chr1 = Chromosome 1
# - 69511 = Position on the chromosome
# - 0/1 = Genotype (heterozygous)
```

## File Format Details

The DNA samples use a simplified format compatible with the Esano platform:

```
chr1-69511 0/1
chr1-123456 1/1
chr2-234567 0/0
```

### Genotype Notation:
- `0/0` = Homozygous reference (both alleles are reference)
- `0/1` = Heterozygous (one reference, one alternate)
- `1/1` = Homozygous alternate (both alleles are alternate)

### Supported Formats:
Your platform also supports:
- VCF format (Variant Call Format)
- 23andMe format (rsID chromosome position genotype)
- Letter genotypes (AA, AG, GG, etc.)

## Why These Match

The child sample (`user2-child.txt`) was created by:
1. **Inheriting ~50% from parent:** Half of the SNPs are identical to the parent
2. **Other 50% from other parent:** Remaining SNPs differ (inherited from other parent)
3. **Realistic variation:** Mimics actual parent-child genetic inheritance patterns

### Key Matching Indicators:

1. **Same Positions:** Both samples have SNPs at the exact same genomic positions
2. **Partial Identity:** Many SNPs match completely (IBS2 state)
3. **Shared Alleles:** Where they differ, they often share one allele (IBS1 state)
4. **IBD Segments:** Long stretches of consecutive matching SNPs form IBD segments

## Technical Details

### Minimum Requirements:
- **Minimum SNPs:** 500 (for reliable matching)
- **Overlapping SNPs:** At least 200 (for relationship detection)
- **IBD Segment Threshold:** 50+ consecutive IBS2 SNPs
- **Minimum Segment Length:** 5 cM

### Relationship Thresholds:
```
Kinship Coefficient Ranges:
- Identical twins: 0.5
- Parent-child: 0.177-0.354 (target: 0.25)
- Full siblings: 0.177-0.354 (target: 0.25)
- Half-siblings: 0.088-0.177 (target: 0.125)
- First cousins: 0.044-0.088 (target: 0.0625)
- Second cousins: 0.022-0.044 (target: 0.03125)
- Unrelated: < 0.011
```

## Testing Workflow

### Step 1: Upload Parent DNA
```
POST /api/dna/upload
Content-Type: multipart/form-data

userId: user1-id
file: user1-parent.txt
```

### Step 2: Upload Child DNA & Find Matches
```
POST /api/dna/upload
Content-Type: multipart/form-data

userId: user2-id
file: user2-child.txt

Then:

POST /api/dna/match
Content-Type: application/json

{
  "userId": "user2-id",
  "dnaText": "<contents of user2-child.txt>"
}
```

### Expected Response:
```json
{
  "matches": [
    {
      "userId": "user1-id",
      "fileName": "user1-parent.txt",
      "relationship": "Parent-child",
      "confidence": 90,
      "details": "Overlapping SNPs: 500 | IBD Segments: 20 | Total IBD: 3400 cM | Kinship: 0.25",
      "displayName": "User 1 Name",
      "metrics": {
        "totalSNPs": 500,
        "ibdSegments": 20,
        "totalIBD_cM": 3400,
        "ibs0": 50,
        "ibs1": 150,
        "ibs2": 300,
        "kinshipCoefficient": 0.25
      }
    }
  ]
}
```

## Common Issues & Solutions

### Issue 1: No Matches Found
**Possible Causes:**
- Not enough overlapping SNPs
- DNA samples uploaded to same user account
- Files in wrong format

**Solution:**
- Ensure files have 500+ SNPs
- Upload to different user accounts
- Check file format matches examples

### Issue 2: Low Confidence Matches
**Possible Causes:**
- Insufficient overlapping positions
- Too few IBD segments

**Solution:**
- Add more SNP markers to samples
- Ensure positions overlap between samples

### Issue 3: Wrong Relationship Detected
**Possible Causes:**
- Kinship coefficient in boundary region
- Insufficient IBD data

**Solution:**
- Review the confidence score
- Check detailed metrics (kinshipCoefficient, totalIBD_cM)

## Creating Your Own Test Samples

To create additional test samples for different relationships:

### Siblings (Kinship ~0.25):
- Share ~50% of SNPs
- Multiple IBD segments (15-25)
- High variation in segment lengths

### First Cousins (Kinship ~0.0625):
- Share ~12.5% of SNPs
- Fewer IBD segments (5-10)
- Shorter segments overall

### Unrelated (Kinship <0.01):
- Share < 5% of SNPs
- Random matches only
- No significant IBD segments

## Support

For questions or issues with DNA matching:
1. Check that files have minimum 500 SNPs
2. Verify format matches examples
3. Ensure users are registered in the system
4. Check browser console for detailed error messages

## Real DNA Data

These are simplified example files. For production use with real DNA data:
- Accept 23andMe raw data files
- Accept AncestryDNA raw data files  
- Accept MyHeritage raw data files
- Accept standard VCF files

Real files typically contain 500,000+ SNPs and require more processing time.
