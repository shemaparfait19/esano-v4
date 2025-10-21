# 🧬 DNA Samples Quick Start

## What You Got

2 example DNA files that will match each other as **parent-child** relationship:

### 📁 Files Created

1. **`user1-parent.txt`** 
   - 516 SNP markers
   - Upload this FIRST as existing user
   
2. **`user2-child.txt`**
   - 516 SNP markers  
   - Upload this SECOND as new user looking for matches
   - Will match with user1-parent.txt

---

## ⚡ 2-Minute Test

### Upload #1 (Existing User)
```
1. Login as User A (e.g., john@test.com)
2. Go to: Dashboard → DNA Analysis
3. Upload: user1-parent.txt
4. Wait for success ✅
```

### Upload #2 (New User Finding Match)
```
1. Logout, Login as User B (e.g., jane@test.com)
2. Go to: Dashboard → DNA Analysis  
3. Upload: user2-child.txt
4. Click: "Find DNA Matches"
5. 🎉 See match with User A!
```

---

## ✅ Expected Match Result

```
╔════════════════════════════════════════╗
║  🎉 DNA Match Found!                   ║
║                                        ║
║  User: John Doe                        ║
║  Relationship: Parent-child            ║
║  Confidence: 90%                       ║
║  Shared DNA: ~3400 cM                  ║
║                                        ║
║  Overlapping SNPs: 516                 ║
║  IBD Segments: 20                      ║
║  Kinship: 0.25                         ║
╚════════════════════════════════════════╝
```

---

## 🔥 Key Points

✅ **516 SNPs** - Well above 500 minimum for reliable matching
✅ **Different users** - Must upload to separate accounts
✅ **Parent-child** - Expected relationship detection
✅ **90% confidence** - High accuracy match
✅ **Real algorithm** - Uses kinship coefficient, IBD segments, IBS states

---

## 📋 File Format

Simple chromosome-position genotype format:

```
chr1-69511 0/1
chr1-123456 1/1
chr2-234567 0/0
```

Where:
- `chr1` = Chromosome 1
- `69511` = Position
- `0/1` = Genotype (heterozygous)

---

## 🎯 What This Tests

1. ✅ DNA file upload functionality
2. ✅ SNP parsing (500+ markers)
3. ✅ Match detection algorithm
4. ✅ Relationship classification
5. ✅ Confidence scoring
6. ✅ User profile enrichment
7. ✅ Match display in UI

---

## 📚 More Info

- **Full Details:** See `README.md`
- **Step-by-Step:** See `TESTING-GUIDE.md`
- **Support:** Check browser console (F12) for errors

---

## 🚨 Common Issues

**No match found?**
- ✅ Uploaded to different user accounts?
- ✅ Both files uploaded successfully?
- ✅ Clicked "Find DNA Matches"?

**Wrong relationship?**
- Check confidence score
- Review detailed metrics
- Verify both files have 500+ SNPs

---

## 🎉 Success Criteria

Your DNA matching works if:
- [x] Both files upload without errors
- [x] Match detected between the two users
- [x] Relationship shows "Parent-child"
- [x] Confidence 85-95%
- [x] Can view matched user's profile

**That's it! You're ready to test DNA matching! 🧬**
