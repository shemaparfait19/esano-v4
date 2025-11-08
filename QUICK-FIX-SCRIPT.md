# 🔧 Quick Fix Script - Run in Browser Console

## The Problem
Your database is missing the parent edge from NYIAREZA to MUGABO, which causes the inference engine to create wrong relationships.

## Fix Script

1. Open your Family Tree page
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Paste this entire script and press Enter:

```javascript
(async function fixFamilyTree() {
  console.log('🔧 Starting family tree fix...');
  
  // Get current user
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    console.error('❌ No user found in localStorage');
    return;
  }
  
  const user = JSON.parse(userStr);
  const userId = user.uid;
  
  console.log('👤 User ID:', userId);
  
  // Fetch current tree
  const response = await fetch(`/api/family-tree?userId=${userId}`);
  const data = await response.json();
  
  if (!data.tree) {
    console.error('❌ No tree found');
    return;
  }
  
  console.log('📊 Current edges:', data.tree.edges.length);
  
  // Find member IDs
  const mugabo = data.tree.members.find(m => m.fullName?.includes('MUGABO'));
  const nyiareza = data.tree.members.find(m => m.fullName?.includes('NYIAREZA'));
  const musinga = data.tree.members.find(m => m.fullName?.includes('MUSINGA'));
  
  if (!mugabo || !nyiareza || !musinga) {
    console.error('❌ Could not find all members');
    console.log('Found:', { mugabo: !!mugabo, nyiareza: !!nyiareza, musinga: !!musinga });
    return;
  }
  
  console.log('✅ Found members:');
  console.log('  - MUGABO:', mugabo.id);
  console.log('  - NYIAREZA:', nyiareza.id);
  console.log('  - MUSINGA:', musinga.id);
  
  // Check existing edges
  const nyiarezaToMugaboParent = data.tree.edges.find(e => 
    e.type === 'parent' && 
    e.fromId === nyiareza.id && 
    e.toId === mugabo.id
  );
  
  const mugaboToNyiarezaSpouse = data.tree.edges.find(e =>
    e.type === 'spouse' &&
    ((e.fromId === mugabo.id && e.toId === nyiareza.id) ||
     (e.fromId === nyiareza.id && e.toId === mugabo.id))
  );
  
  let modified = false;
  
  // Add missing parent edge if needed
  if (!nyiarezaToMugaboParent) {
    console.log('➕ Adding missing parent edge: NYIAREZA → MUGABO');
    data.tree.edges.push({
      id: `edge_${Date.now()}_fix1`,
      fromId: nyiareza.id,
      toId: mugabo.id,
      type: 'parent',
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
    modified = true;
  } else {
    console.log('✅ Parent edge already exists');
  }
  
  // Remove bad spouse edge if exists
  if (mugaboToNyiarezaSpouse) {
    console.log('🗑️ Removing invalid spouse edge: MUGABO ↔ NYIAREZA');
    data.tree.edges = data.tree.edges.filter(e => e.id !== mugaboToNyiarezaSpouse.id);
    modified = true;
  } else {
    console.log('✅ No invalid spouse edge found');
  }
  
  if (!modified) {
    console.log('✅ No changes needed!');
    return;
  }
  
  // Save fixed tree
  console.log('💾 Saving fixed tree...');
  const saveResponse = await fetch('/api/family-tree', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      tree: data.tree
    })
  });
  
  if (saveResponse.ok) {
    console.log('✅ Tree fixed and saved!');
    console.log('🔄 Reloading page...');
    setTimeout(() => window.location.reload(), 1000);
  } else {
    console.error('❌ Failed to save:', await saveResponse.text());
  }
})();
```

## What This Does

1. ✅ Finds MUGABO, NYIAREZA, and MUSINGA members
2. ✅ Checks if NYIAREZA → MUGABO parent edge exists
3. ➕ Adds it if missing
4. 🗑️ Removes any MUGABO ↔ NYIAREZA spouse edge
5. 💾 Saves the fixed tree
6. 🔄 Reloads the page

## After Running

You should see:
```
✅ Found members
➕ Adding missing parent edge: NYIAREZA → MUGABO
✅ Tree fixed and saved!
🔄 Reloading page...
```

Then the page will reload and show correct relationships!

## Expected Result

**MUGABO Habimana:**
- Parent: MUSINGA RWABUGIRI ✅
- Parent: NYIAREZA ✅
- NO spouse relationship ✅

**NYIAREZA:**
- Spouse: MUSINGA RWABUGIRI ✅
- Child: MUGABO Habimana ✅

**MUSINGA RWABUGIRI:**
- Spouse: NYIAREZA ✅
- Child: MUGABO Habimana ✅
