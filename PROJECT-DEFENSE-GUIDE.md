# 🎓 DNA MATCHING SYSTEM - PROJECT DEFENSE GUIDE

## Quick Reference Card
**Project:** eSANO - DNA Matching & Genealogy Platform  
**Tech Stack:** Next.js 14, TypeScript, Firebase, Gemini AI  
**Core Feature:** DNA comparison algorithm (929 lines, custom-built)  
**Algorithm:** SNP parsing → IBS calculation → IBD detection → Kinship → Relationship

---

## 1. SYSTEM ARCHITECTURE

### Stack
- **Frontend:** Next.js 14 (React), TypeScript, TailwindCSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **AI:** Google Gemini API (optional)

### Project Structure
```
src/
├── app/
│   ├── dashboard/
│   │   ├── dna-analysis/page.tsx    ← Upload DNA
│   │   ├── relatives/page.tsx       ← View matches
│   │   └── profile/[userId]/        ← User profiles
│   └── api/
│       ├── dna/
│       │   ├── upload/route.ts      ← Save DNA file
│       │   └── match/route.ts       ← DNA matching engine ⭐
│       └── requests/route.ts        ← Connection requests
├── components/
│   └── dashboard/
│       ├── dna-upload-form.tsx      ← Upload UI
│       ├── dna-match-finder.tsx     ← Find matches UI
│       └── relative-card.tsx        ← Match display card
└── lib/
    └── dna-analysis.ts              ← Helper functions
```

---

## 2. DNA MATCHING ALGORITHM (THE CORE)

### Location: `src/app/api/dna/match/route.ts` (929 lines)

### The Algorithm (6 Steps):

#### Step 1: **Parse SNPs** (Line 263-340)
```typescript
function parseAndFilterSNPs(text: string): SNP[]
```
**What:** Extract genetic markers from raw DNA file  
**Input:** "rs123456  1  12345  A  G  AG"  
**Output:** `{ rsid: "rs123456", chromosome: "1", position: 12345, genotype: [1, 0] }`

**Key Points:**
- SNP = Single Nucleotide Polymorphism (position where DNA differs)
- Supports 23andMe, AncestryDNA, MyHeritage formats
- Converts genotypes: A/G → [1,0], 0/1 → [0,1]

#### Step 2: **Calculate IBS** (Line 485-531)
```typescript
function calculateIBS(snp1: SNP, snp2: SNP): 0 | 1 | 2
```
**What:** Count shared alleles at each position  
**Returns:**
- **IBS0:** No shared alleles (0/0 vs 1/1) → Different
- **IBS1:** Share 1 allele (0/1 vs 1/1) → Half-match
- **IBS2:** Share both alleles (1/1 vs 1/1) → Full match

**Example:**
```
Person A: 0/1  (has both variants)
Person B: 1/1  (only variant 1)
Result: IBS1 (share one "1")
```

#### Step 3: **Detect IBD Segments** (Line 533-620)
```typescript
function detectIBDSegments(snps1: SNP[], snps2: SNP[]): IBDSegment[]
```
**What:** Find long stretches of identical DNA  
**Criteria:**
- Requires 50+ consecutive IBS2 SNPs
- Must be ≥5 centiMorgans (cM) long
- Indicates shared ancestry (inherited from same ancestor)

**Why Important:** Random matching is short, inheritance is long!

#### Step 4: **Calculate Kinship** (Line 622-659)
```typescript
function calculateKinship(ibs0, ibs1, ibs2): number
```
**Formula:** `kinship = (0.5 × IBS1 + IBS2) / totalSNPs`

**Interpretation:**
| Kinship | Relationship |
|---------|-------------|
| 0.50 | Identical twins |
| 0.25 | Parent-child, Full siblings |
| 0.125 | Half-siblings, Grandparent |
| 0.0625 | First cousins |
| <0.01 | Unrelated |

#### Step 5: **Estimate Relationship** (Line 729-851)
```typescript
function estimateRelationship(analysis): RelationshipEstimate
```
**Logic:**
```
if kinship >= 0.354: "Identical twins"
if kinship >= 0.177 AND kinship <= 0.354:
    if totalIBD >= 3300 cM: "Parent-child"
    if segments >= 15 AND totalIBD >= 2000: "Full siblings"
    if kinship >= 0.20 AND segments >= 3: "Parent-child" (test data)
if kinship >= 0.088: "Half-siblings"
if kinship >= 0.044: "First cousins"
else: "Distant relative"
```

#### Step 6: **Complete Analysis** (Line 447-483)
```typescript
function analyzeKinship(snps1, snps2): KinshipAnalysis
```
1. Find overlapping SNPs
2. Calculate all IBS states
3. Detect IBD segments
4. Calculate kinship coefficient
5. Estimate relationship
6. Calculate confidence score
7. Return complete analysis

---

## 3. DATA FLOW

### Complete Journey:
```
1. USER UPLOADS DNA
   ↓
   DnaUploadForm → POST /api/dna/upload
   ↓
   Save to Firestore: users/{userId}/dnaData
   ↓
   Trigger analyzeDna() action
   ↓
   Compare with all users → Save matches

2. VIEW MATCHES
   ↓
   Navigate to /dashboard/relatives
   ↓
   Load: users/{userId}/analysis/relatives
   ↓
   Fetch names/photos from users/{matchId}
   ↓
   Display RelativeCard for each match

3. CONNECT WITH MATCH
   ↓
   Click "Connect" → POST /api/requests
   ↓
   Save: connectionRequests/{requestId}
   ↓
   Other user accepts
   ↓
   Create: connections/{connectionId}
```

---

## 4. DATABASE SCHEMA

### Firestore Structure:
```
users/{userId}/
├── userId: string
├── email: string
├── fullName: string
├── dnaData: string (max 200KB)
├── dnaFileName: string
├── analysis/
│   ├── relatives: [
│   │     { userId, relationshipProbability, sharedCentimorgans }
│   │   ]
│   ├── ancestry: { ethnicityEstimates, summary }
│   └── insights: { healthInsights, traitInsights }
└── updatedAt: timestamp

dna_data/{docId}/
├── userId: string
├── fileName: string
├── textSample: string (first 1MB)
└── fullData: string (complete DNA)

connections/{id}/
├── participants: [userId1, userId2]
└── status: "connected"

connectionRequests/{id}/
├── fromUserId: string
├── toUserId: string
└── status: "pending" | "accepted"
```

---

## 5. KEY DEFENSE QUESTIONS & ANSWERS

### Q: What problem does this solve?
**A:** After the genocide, many Rwandans lost family connections. This platform helps discover genetic relatives through DNA analysis and rebuild family trees.

### Q: What is your original contribution?
**A:** Built the entire DNA matching algorithm from scratch (929 lines). Implemented:
- SNP parsing for multiple formats
- IBS/IBD calculation without libraries
- Kinship coefficient formula
- Relationship estimation logic
- Database schema for DNA storage

### Q: Explain the algorithm in simple terms
**A:**
1. **Parse DNA:** Read file, extract 516 genetic markers
2. **Compare:** For each marker, count how many match (0, 1, or 2 alleles)
3. **Find Segments:** Look for long runs of full matches (inherited DNA)
4. **Calculate Kinship:** Math formula based on matching percentage
5. **Estimate Relationship:** Use kinship + segment length to determine "parent-child", "sibling", etc.

### Q: What is kinship coefficient?
**A:** A number (0 to 1) measuring genetic relatedness.
- **0.25 = Parent-child** (child inherits 50% from each parent)
- **0.125 = Grandparent** (inherited 50% → 25%)
- **0.0625 = Cousin** (inherited 50% → 25% → 12.5%)

**Formula:** `(0.5 × half-matches + full-matches) / total`

### Q: What is IBD and why is it important?
**A:** IBD = Identity By Descent = DNA inherited from common ancestor.
- **Key:** Long shared segments (5+ cM) prove relationship
- **Random matching:** Creates short segments
- **Real relatives:** Create many long segments

### Q: How do you handle different DNA file formats?
**A:** Multi-format parser tries:
1. Standard: "rsXXX CHR POS REF ALT GENOTYPE"
2. Simple: "chr1-12345 0/1"
3. VCF: "#CHROM POS ID REF ALT GT"
4. Raw: "AGTCAGTC..."

Extract position + genotype, skip invalid data.

### Q: How do you prevent false positives?
**A:** Multiple checks:
- Require 500+ overlapping SNPs
- Check IBD segments (not just kinship)
- Segments must be 5+ cM long
- Need 3+ segments minimum
- Confidence ≥ 50% threshold

### Q: What is the time complexity?
**A:** 
- **Upload:** O(M) - Parse M SNPs
- **Match:** O(N × M) - Compare with N users, M SNPs each
- **Optimization:** Cache parsed SNPs, limit to 50 users

### Q: How secure is the DNA data?
**A:**
- Firebase encryption at rest
- HTTPS in transit
- Authentication required
- User-specific access rules
- No DNA in client logs

### Q: Why Next.js?
**A:**
- Server-side rendering (SEO)
- API routes in same codebase
- File-based routing
- TypeScript support
- Easy deployment (Vercel)

### Q: Why Firebase?
**A:**
- Real-time updates
- Built-in authentication
- Scalable NoSQL
- No server management
- Free tier for development

### Q: Show me a specific code section
**A:** *(Point to any function)*

**Example - IBS Calculation:**
```typescript
// Line 485
function calculateIBS(snp1: SNP, snp2: SNP): 0 | 1 | 2 {
  const [a1, a2] = snp1.genotype;  // [0, 1]
  const [b1, b2] = snp2.genotype;  // [1, 1]
  
  let shared = 0;
  if (a1 === b1 || a1 === b2) shared++;
  if (a2 === b1 || a2 === b2) shared++;
  
  return shared as 0 | 1 | 2;
}
```

### Q: What were the biggest challenges?
**A:**
1. **Large files:** Limited to 10MB, sample first 1MB
2. **Different formats:** Built multi-format parser
3. **Test data (516 SNPs):** Modified thresholds to work with limited data
4. **False positives:** Require IBD segments, not just kinship
5. **Performance:** Limit comparisons, cache parsed SNPs

---

## 6. FILE LOCATIONS QUICK MAP

**DNA matching core:** `src/app/api/dna/match/route.ts` (929 lines)  
**DNA upload API:** `src/app/api/dna/upload/route.ts`  
**DNA analysis action:** `src/app/actions.ts`  
**Upload UI:** `src/components/dashboard/dna-upload-form.tsx`  
**Match finder UI:** `src/components/dashboard/dna-match-finder.tsx`  
**Relatives page:** `src/app/dashboard/relatives/page.tsx`  
**Match card UI:** `src/components/dashboard/relative-card.tsx`  
**Helper functions:** `src/lib/dna-analysis.ts`

---

## 7. DEMO SCRIPT

**Show DNA Upload:**
```
1. Navigate to /dashboard/dna-analysis
2. Upload example-dna-samples/parent-dna.txt
3. Show success message
4. Check Firestore: users/{userId}/dnaData populated
```

**Show Matching:**
```
1. Login as different user
2. Upload child-dna.txt
3. Click "Find Matches"
4. Show match card: "John Doe • Match Found • 76%"
5. Click "View Profile" (show it goes to correct user)
```

**Show Relatives Page:**
```
1. Navigate to /dashboard/relatives
2. Show saved matches display
3. Show name loaded (not user ID)
4. Click match card
```

**Show Code:**
```
1. Open src/app/api/dna/match/route.ts
2. Show analyzeKinship function (line 447)
3. Show calculateIBS function (line 485)
4. Show estimateRelationship (line 729)
5. Explain flow: parse → compare → calculate → estimate
```

---

## 8. TECHNICAL TERMS CHEAT SHEET

| Term | Definition | Example |
|------|------------|---------|
| **SNP** | Single Nucleotide Polymorphism | Position where DNA differs between people |
| **Genotype** | Alleles at a position | 0/1, A/G, 1/1 |
| **IBS** | Identity By State | Matching without knowing why |
| **IBD** | Identity By Descent | Matching because inherited |
| **Kinship** | Genetic relatedness | 0.25 = parent-child |
| **cM** | CentiMorgan | Unit of genetic distance |
| **Allele** | Version of a gene | At rs123: A or G |

---

## 9. FINAL CHECKLIST

Before defense, verify you can:
- ✅ Explain the algorithm (6 steps)
- ✅ Show DNA upload flow
- ✅ Demonstrate matching
- ✅ Point to code locations
- ✅ Explain IBS vs IBD
- ✅ Calculate kinship coefficient
- ✅ Describe database schema
- ✅ Show API endpoints
- ✅ Discuss challenges & solutions
- ✅ Defend original contribution

---

## 10. QUICK ANSWERS CARD

**"What does it do?"** → Finds genetic relatives from DNA files  
**"How?"** → Compares SNPs, calculates kinship, detects inherited segments  
**"Where's the code?"** → src/app/api/dna/match/route.ts (929 lines)  
**"What's novel?"** → Custom algorithm, no external DNA libraries  
**"Time complexity?"** → O(N × M) - N users, M SNPs each  
**"Security?"** → Firebase Auth, encrypted storage, user-specific access  
**"Accuracy?"** → Multiple validation layers, IBD required  
**"Stack?"** → Next.js, TypeScript, Firebase, Gemini AI

---

**Remember:** You built a complete DNA matching system from scratch. The core algorithm is 929 lines of original code. You understand genetics, algorithms, databases, and full-stack development. **You've got this!** 🎓🧬
