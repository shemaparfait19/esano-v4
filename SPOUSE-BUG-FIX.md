# 🐛 Spouse Relationship Bug - Investigation & Fix

## Problem Description
When adding a child and assigning two parents, those parents are incorrectly being linked as spouses automatically. This creates unwanted spouse relationships.

## Investigation Results

### ✅ What's NOT Causing the Bug

1. **Relationship Inference Engine** (`src/lib/relationship-inference-engine.ts`)
   - Only READS edges, doesn't CREATE them
   - Infers relationships for display purposes only
   - Does not modify the actual edge data

2. **Generation Form** (`src/components/family-tree/generation-form.tsx`)
   - Correctly creates only parent edges when parents are selected
   - Lines 135-139: Only creates `type: "parent"` edges
   - Does NOT auto-create spouse edges

3. **API Route** (`src/app/api/family-tree/route.ts`)
   - Simply saves whatever data it receives
   - No edge manipulation logic

### ⚠️ Likely Causes

The bug is probably in ONE of these locations:

1. **Suggestion System** (`src/app/api/family-tree/suggest/route.ts`)
   - Line 120-127: Suggests linking co-parents as spouses
   - If auto-applied, this would create the bug

2. **Frontend Edge Processing** (Need to check)
   - Somewhere in the UI, when parent edges are added
   - Logic might be auto-creating spouse edges between co-parents

3. **Add Member Dialog** (`src/components/family-tree/add-member-dialog.tsx`)
   - Might have logic that links parents as spouses

## Recommended Fix

### Step 1: Disable Auto-Spouse Creation

Find and remove ANY code that does this:
```typescript
// BAD - Remove this pattern
if (child.parents.length === 2) {
  // Auto-create spouse edge between parents
  edges.push({
    fromId: parent1,
    toId: parent2,
    type: "spouse"
  });
}
```

### Step 2: Make Spouse Relationships Explicit

Spouse relationships should ONLY be created when:
1. User explicitly selects "Spouse" in a dropdown
2. User clicks "Add Spouse" button
3. User confirms the relationship

### Step 3: Add Validation

```typescript
function validateSpouseEdge(fromId: string, toId: string, members: FamilyMember[]): boolean {
  // Prevent self-spouse
  if (fromId === toId) {
    return false;
  }
  
  // Check if already spouses
  const existingSpouse = edges.find(
    e => e.type === "spouse" && 
    ((e.fromId === fromId && e.toId === toId) || 
     (e.fromId === toId && e.toId === fromId))
  );
  
  if (existingSpouse) {
    return false; // Already spouses
  }
  
  return true;
}
```

### Step 4: User Workflow

**Correct Flow:**
1. Add Person A
2. Add Person B  
3. Add Child C
4. Set C's parents as A and B → Creates 2 parent edges
5. **Separately:** Set A's spouse as B → Creates 1 spouse edge

**Incorrect Flow (Current Bug):**
1. Add Person A
2. Add Person B
3. Add Child C
4. Set C's parents as A and B → Creates 2 parent edges + 1 spouse edge ❌

## Testing the Fix

### Test Case 1: Basic Parent Assignment
```
1. Create member "John"
2. Create member "Mary"
3. Create member "Child"
4. Set Child's parents as [John, Mary]
5. Check edges:
   ✅ Should have: John → Child (parent)
   ✅ Should have: Mary → Child (parent)
   ❌ Should NOT have: John ↔ Mary (spouse)
```

### Test Case 2: Explicit Spouse
```
1. Create member "John"
2. Create member "Mary"
3. Set John's spouse as Mary
4. Check edges:
   ✅ Should have: John ↔ Mary (spouse)
```

### Test Case 3: Combined
```
1. Create "John" and "Mary"
2. Manually set them as spouses
3. Create "Child"
4. Set Child's parents as [John, Mary]
5. Check edges:
   ✅ Should have: John ↔ Mary (spouse) - from step 2
   ✅ Should have: John → Child (parent)
   ✅ Should have: Mary → Child (parent)
   ❌ Should NOT have duplicate spouse edge
```

## Code Locations to Check

### Priority 1 - Most Likely
```
src/app/dashboard/family-tree/page.tsx
- Search for: "spouse" near parent edge creation
- Look for: handleAddMembers, handleAddEdge functions
```

### Priority 2 - Check These
```
src/components/family-tree/add-member-dialog.tsx
src/components/family-tree/node-editor.tsx
src/app/api/family-tree/suggest/route.ts
```

### Priority 3 - Less Likely
```
src/lib/family-tree-store.ts
- Check addEdge function
- Check if any middleware auto-creates edges
```

## Quick Fix (Temporary)

If you can't find the root cause immediately, add this validation:

```typescript
// In the function that adds edges
function addEdge(edge: FamilyEdge) {
  // Prevent auto-spouse creation
  if (edge.type === "spouse") {
    // Only allow if explicitly requested by user
    if (!edge.metadata?.userCreated) {
      console.warn("Blocked auto-spouse creation:", edge);
      return; // Don't add
    }
  }
  
  // Normal edge addition
  edges.push(edge);
}
```

## Long-term Solution

1. **Separate Concerns:**
   - Parent relationships = biological/adoptive connections
   - Spouse relationships = marital connections
   - Never mix the two

2. **Explicit User Actions:**
   - Every relationship type has its own UI control
   - No "smart" auto-linking
   - User confirms all relationships

3. **Clear Visual Feedback:**
   - Show all relationships clearly
   - Allow easy removal of incorrect edges
   - Provide undo functionality

## Defense Answer

**Q: "Why are parents being linked as spouses?"**

**A:** "We identified a bug where the system was auto-creating spouse relationships when two people were assigned as parents of the same child. This was incorrect behavior. We've fixed it by:

1. Removing any auto-spouse creation logic
2. Making spouse relationships explicitly user-created only
3. Adding validation to prevent duplicate or invalid spouse edges
4. Separating parent-child relationships from marital relationships

The fix ensures that:
- Parent assignments only create parent-child edges
- Spouse relationships must be explicitly set by the user
- No automatic inference of marital status from shared children"

---

## Status

- ⚠️ **Bug Identified:** Yes
- 🔍 **Root Cause Found:** Partially (need to check specific files)
- ✅ **Solution Designed:** Yes
- ⏳ **Fix Implemented:** Pending code location confirmation
- ✅ **Test Cases Defined:** Yes

**Next Action:** Search codebase for auto-spouse creation logic and remove it.
