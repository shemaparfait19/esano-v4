# Enhanced Family Tree Sharing System

## Current Issues
1. ❌ When viewing a shared tree, it replaces the user's own tree (using `?ownerId=xxx`)
2. ❌ No way to see multiple shared trees at once
3. ❌ No distinction between "My Trees" and "Shared with Me"
4. ❌ Limited collaboration features

## New Architecture

### 1. **Multi-Tree Dashboard**
Users can manage multiple trees:
- **My Family Trees** - Trees they own
- **Shared with Me** - Trees others shared (read-only or edit access)
- **Collaborative Trees** - Trees they co-own

### 2. **Enhanced Sharing Features**

#### For Tree Owner (Source):
- ✅ Share with multiple people simultaneously
- ✅ Set granular permissions per person:
  - **Viewer** - Read-only access
  - **Editor** - Can add/edit members and relationships
  - **Co-Owner** - Full access including sharing with others
- ✅ Track who viewed/edited when
- ✅ Revoke access anytime
- ✅ Get notifications when editors make changes
- ✅ View change history with author attribution
- ✅ Temporary shares (expire after X days)
- ✅ Share specific branches only (not entire tree)

#### For Receiver (Destination):
- ✅ Browse all shared trees in a dedicated section
- ✅ Switch between their tree and shared trees easily
- ✅ Bookmark favorite shared trees
- ✅ Request access to trees they discover
- ✅ Get notifications when:
  - New tree is shared with them
  - Owner updates shared tree
  - Their edit permissions change
- ✅ Leave comments/suggestions on nodes (like Google Docs)
- ✅ Export shared trees (if owner allows)
- ✅ Compare shared tree with their own tree (find common ancestors)

### 3. **Collaboration Features**

#### Real-time Collaboration:
- 🔥 See who else is viewing the tree (presence indicators)
- 🔥 Live cursor positions of other editors
- 🔥 Real-time updates when others make changes
- 🔥 Conflict resolution when two people edit same node

#### Communication:
- 💬 Comments on specific members
- 💬 Suggestions mode (propose changes without directly editing)
- 💬 @mentions to notify specific collaborators
- 💬 Chat panel for discussing the tree

#### Version Control:
- 📜 Full edit history with rollback capability
- 📜 See who changed what and when
- 📜 Compare versions side-by-side
- 📜 Create snapshots/milestones

### 4. **Privacy & Security**
- 🔒 Password-protected shares
- 🔒 Link-based sharing (anyone with link)
- 🔒 Audit logs of all access
- 🔒 Watermark shared exports with owner info
- 🔒 Blur sensitive information for certain viewers

### 5. **Advanced Features**

#### Smart Merging:
- 🤝 Merge two family trees when connections are found
- 🤝 Suggest potential connections between trees
- 🤝 Resolve duplicate members across trees

#### Analytics Dashboard:
- 📊 View statistics: most active editors, recent changes
- 📊 Tree growth over time
- 📊 Engagement metrics per collaborator

#### Workflows:
- 🔄 Approval workflow for edits (owner reviews before applying)
- 🔄 Task assignments (e.g., "Add photos for these members")
- 🔄 Research mode (collect sources and citations)

## Database Schema Changes

### Collections:

```typescript
// familyTreeShares (existing - enhanced)
{
  id: string,
  ownerId: string,
  targetUserId: string,
  targetEmail: string,
  role: 'viewer' | 'editor' | 'co-owner',
  permissions: {
    canEdit: boolean,
    canShare: boolean,
    canExport: boolean,
    canComment: boolean,
    canViewHistory: boolean,
  },
  expiresAt?: Date,
  branchRestriction?: string[], // node IDs if sharing only a branch
  createdAt: Date,
  updatedAt: Date,
  lastViewedAt?: Date,
  viewCount: number,
}

// familyTreeComments (new)
{
  id: string,
  treeOwnerId: string,
  memberId: string,
  authorId: string,
  authorName: string,
  content: string,
  type: 'comment' | 'suggestion',
  status: 'open' | 'resolved' | 'rejected',
  mentions: string[],
  createdAt: Date,
  updatedAt: Date,
}

// familyTreeChanges (new)
{
  id: string,
  treeOwnerId: string,
  editorId: string,
  editorName: string,
  changeType: 'add_member' | 'edit_member' | 'delete_member' | 'add_edge' | 'delete_edge',
  targetId: string,
  before: any,
  after: any,
  createdAt: Date,
}

// familyTreePresence (existing - used for real-time)
{
  userId: string,
  userName: string,
  color: string,
  cursorX: number,
  cursorY: number,
  lastActive: Date,
}
```

## Implementation Phases

### Phase 1: Multi-Tree View ✅ (Start Here)
- Create shared trees list page
- Allow switching between own tree and shared trees
- Maintain separate state for each tree

### Phase 2: Enhanced Permissions
- Implement granular permission system
- Add co-owner role
- Branch-level sharing

### Phase 3: Collaboration Features
- Comments system
- Suggestions mode
- Change history

### Phase 4: Real-time Features
- Live presence
- Real-time updates
- Conflict resolution

### Phase 5: Advanced Features
- Tree merging
- Analytics
- Workflows
