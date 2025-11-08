# 🔧 How to Fix Your Current Bad Relationship Data

## The Problem
You have an incorrect spouse edge in your database:
- `MUGABO Habimana ↔ NYIAREZA (Spouse)` ❌ WRONG!

NYIAREZA is MUGABO's **PARENT**, not spouse!

---

## How to Delete the Bad Edge

### Option 1: Use the Relationships Table (Easiest)

1. Go to your Family Tree page
2. Scroll down to the **"Family Relationships"** section
3. Find this row:
   ```
   MUGABO Habimana → Spouse → NYIAREZA → AI-Inferred
   ```
4. Click the **Delete** button (trash icon) on that row
5. Confirm deletion
6. The page will auto-save

### Option 2: Use Browser Console (Advanced)

If there's no delete button in the UI:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this code:

```javascript
// Get the current state
const state = window.__FAMILY_TREE_STORE__;
if (!state) {
  console.error("Store not found");
} else {
  // Find the bad edge
  const badEdge = state.edges.find(e => 
    e.type === "spouse" && 
    ((e.fromId.includes("MUGABO") && e.toId.includes("NYIAREZA")) ||
     (e.fromId.includes("NYIAREZA") && e.toId.includes("MUGABO")))
  );
  
  if (badEdge) {
    console.log("Found bad edge:", badEdge);
    // Remove it (you'll need to call the removeEdge function)
  }
}
```

### Option 3: Manually Edit Database (If needed)

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find collection: `familyTrees`
4. Find document: your user ID
5. Look in the `edges` array
6. Find and delete the edge where:
   - `type: "spouse"`
   - `fromId` or `toId` contains MUGABO
   - The other ID contains NYIAREZA
7. Save the document

---

## After Deleting

### Verify the Fix

After deleting, you should see:

✅ **Correct Relationships:**
```
MUSINGA RWABUGIRI:
  - Spouse: NYIAREZA
  - Child: MUGABO Habimana

NYIAREZA:
  - Spouse: MUSINGA RWABUGIRI
  - Child: MUGABO Habimana

MUGABO Habimana:
  - Parent: MUSINGA RWABUGIRI
  - Parent: NYIAREZA
```

❌ **NO MORE:**
```
MUGABO Habimana:
  - Spouse: NYIAREZA  ← This should be GONE!
```

---

## Prevention (Already Fixed!)

I've added validation to prevent this from happening again:

### 1. Form Validation ✅
- Red border warning when you select a parent as spouse
- Error message: "Warning: Spouse cannot be a parent!"
- Blocks form submission

### 2. Store Validation ✅
- `addEdge()` function now checks if spouse edge would create parent-child conflict
- Automatically blocks the edge with console error
- Edge is not added to the database

### 3. Date Validation ✅
- Birth/death dates must be realistic (1800-today)
- Death date must be after birth date

---

## Test the Fix

After deleting the bad edge, try adding a new member:

1. Add a person
2. Try to select their parent as their spouse
3. You should see:
   - **Red border** on spouse dropdown
   - **Warning icon** with message
   - **Form won't submit** if you try

This proves the validation is working! 🎉

---

## If You Still See the Bad Data

1. **Hard refresh** the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**
3. **Check Firebase** - the bad edge might still be in the database
4. **Delete it manually** from Firebase Console

---

## Summary

**What was wrong:** You accidentally selected NYIAREZA (parent) as MUGABO's spouse

**Why it happened:** Form fields were confusing, no validation

**What I fixed:**
- ✅ Added visual warnings
- ✅ Added form validation
- ✅ Added store-level validation
- ✅ Blocks submission of invalid relationships

**What you need to do:** Delete the bad edge using one of the methods above

---

## Need Help?

If you can't delete the edge, let me know and I can:
1. Add a "Delete" button to the relationships table
2. Add a "Fix Bad Data" button that auto-detects and removes invalid edges
3. Create a migration script to clean up all invalid relationships
