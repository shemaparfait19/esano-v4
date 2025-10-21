# 📄 ONE-PAGE CHEAT SHEET - Print This!

## Project Summary
**eSANO** - DNA Matching Platform | Next.js + TypeScript + Firebase | 929-line custom algorithm

---

## The Algorithm (6 Steps)
1. **Parse** → Extract SNPs from DNA file
2. **IBS** → Count 0/1/2 matching alleles per SNP  
3. **IBD** → Find 50+ consecutive IBS2 (inherited segments)
4. **Kinship** → `(0.5 × IBS1 + IBS2) / total`
5. **Estimate** → Use thresholds: 0.25 = parent/child
6. **Return** → Sorted matches with confidence

---

## Key File Locations
| What | Where | Line |
|------|-------|------|
| Main algorithm | `src/app/api/dna/match/route.ts` | 1-929 |
| Parse SNPs | Same file | 263 |
| Compare DNA | Same file | 447 |
| Calculate IBS | Same file | 485 |
| Detect IBD | Same file | 533 |
| Calculate kinship | Same file | 622 |
| Estimate relationship | Same file | 729 |
| Upload API | `src/app/api/dna/upload/route.ts` | 8 |
| Relatives page | `src/app/dashboard/relatives/page.tsx` | 134 |
| Match card | `src/components/dashboard/relative-card.tsx` | 26 |

---

## Key Formulas
**Kinship:** `(0.5 × IBS1 + IBS2) / total`  
**cM:** `basePairs / 1,000,000`  
**Confidence:** `baseConfidence × (segments / expected)`

---

## Kinship Thresholds
| Value | Relationship |
|-------|-------------|
| 0.50 | Identical twins |
| 0.25 | Parent-child, Full siblings |
| 0.125 | Half-siblings, Grandparent |
| 0.0625 | First cousins |

---

## Key Terms
- **SNP:** Position where DNA differs
- **IBS0:** No shared alleles
- **IBS1:** Share 1 allele
- **IBS2:** Share both alleles
- **IBD:** Inherited DNA segment (50+ SNPs, 5+ cM)
- **cM:** CentiMorgan (genetic distance)

---

## Demo Flow (3 min)
1. Open `/dashboard/dna-analysis`
2. Upload `parent-dna.txt`
3. Login as different user
4. Upload `child-dna.txt`
5. Click "Find Matches"
6. Show: "Match Found • 76%"
7. Navigate to `/dashboard/relatives`

---

## Top 10 Questions

**Q: What does it do?**  
A: Finds genetic relatives from DNA files by comparing SNPs and calculating kinship.

**Q: Did you write the algorithm?**  
A: Yes, 929 lines from scratch. No DNA libraries used.

**Q: Where is the code?**  
A: `src/app/api/dna/match/route.ts` - Lines 1-929

**Q: Explain the algorithm**  
A: Parse SNPs → Calculate IBS → Detect IBD → Calculate kinship → Estimate relationship

**Q: What is kinship?**  
A: Number from 0-1 measuring relatedness. 0.25 = parent-child (share 50% DNA)

**Q: What is IBD?**  
A: Inherited DNA segments. Long runs (50+ SNPs) prove relationship, not chance.

**Q: Time complexity?**  
A: O(N × M) - N users, M SNPs. Optimized with caching and limits.

**Q: How prevent false positives?**  
A: Require IBD segments (not just kinship), 500+ SNP overlap, 50% confidence minimum

**Q: Why Next.js?**  
A: SSR for SEO, API routes (no separate backend), TypeScript, easy deployment

**Q: Biggest challenge?**  
A: Test data (516 SNPs vs 500K). Solution: Modified thresholds, kinship-based fallback.

---

## Opening (30 sec)
"My project is eSANO, a DNA matching platform. The core is a **929-line custom algorithm** I built from scratch that compares genetic markers, calculates kinship, and finds relatives. Tech stack: Next.js, TypeScript, Firebase. I can demo or explain any code section."

---

## Closing (30 sec)
"This project demonstrates deep technical skills (custom algorithm, genetics knowledge), problem-solving (format variations, performance), and real-world impact (rebuild Rwandan family connections). Thank you."

---

## If Stuck
1. Point to `src/app/api/dna/match/route.ts` Line 447
2. Say: "Here's the main comparison function"
3. Explain: "Calculates IBS, detects IBD, determines kinship"

---

## Confidence Booster
✅ 929 lines of original code  
✅ No DNA libraries used  
✅ Based on research papers  
✅ Handles real + test data  
✅ Full-stack implementation  
**YOU GOT THIS! 🚀**

---

**Print this. Keep it handy. You're ready! 💪**
