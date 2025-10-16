"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useFamilyTreeStore } from "@/lib/family-tree-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isValid } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Link as LinkIcon, 
  User, 
  ChevronRight,
  Edit2,
  X,
  Save,
  ArrowLeft,
  Heart,
  Baby,
  Users as UsersIcon,
  GitBranch,
  UserCog,
  UserPlus,
  UserMinus,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface MemberViewProps {
  memberId: string;
  onClose?: () => void;
  onEdit?: (memberId: string) => void;
  onView?: (memberId: string) => void;
  className?: string;
}

export function MemberView({ memberId, onClose, onEdit, onView, className }: MemberViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const member = useFamilyTreeStore((state) => 
    state.members.find(m => m.id === memberId)
  );
  const edges = useFamilyTreeStore((state) => state.edges);
  const members = useFamilyTreeStore((state) => state.members);
  const tree = useFamilyTreeStore((state) => state.tree);
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editData, setEditData] = useState<Partial<typeof member>>({});
  
  useEffect(() => {
    if (member) {
      setEditData({ ...member });
    }
  }, [member]);

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <UserX className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Member Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested family member could not be found.</p>
        {onClose && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Family Tree
          </Button>
        )}
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMMM d, yyyy') : '—';
    } catch (e) {
      return '—';
    }
  };

  // Calculate age
  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    
    const birth = parseISO(birthDate);
    if (!isValid(birth)) return null;
    
    const endDate = deathDate ? parseISO(deathDate) : new Date();
    if (deathDate && !isValid(endDate)) return null;
    
    let years = endDate.getFullYear() - birth.getFullYear();
    const months = endDate.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && endDate.getDate() < birth.getDate())) {
      years--;
    }
    
    return years;
  };

  // Get relationships
  const parents = useMemo(() => 
    edges
      .filter(e => e.toId === member.id && e.type === 'parent')
      .map(e => members.find(m => m.id === e.fromId))
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by gender (mothers first, then fathers, then others)
        const genderOrder = { female: 1, male: 2, other: 3 };
        return (
          (genderOrder[a?.gender as keyof typeof genderOrder] || 3) - 
          (genderOrder[b?.gender as keyof typeof genderOrder] || 3)
        );
      }),
    [edges, member.id, members]
  );

  const children = useMemo(() => 
    edges
      .filter(e => e.fromId === member.id && e.type === 'parent')
      .map(e => ({
        member: members.find(m => m.id === e.toId),
        relationship: e.relationshipType || 'child'
      }))
      .filter(item => item.member)
      .sort((a, b) => {
        // Sort by birth date if available
        if (a.member?.birthDate && b.member?.birthDate) {
          return new Date(a.member.birthDate).getTime() - new Date(b.member.birthDate).getTime();
        }
        return 0;
      }),
    [edges, member.id, members]
  );

  const spouses = useMemo(() => 
    edges
      .filter(e => (e.fromId === member.id || e.toId === member.id) && e.type === 'spouse')
      .map(e => ({
        member: members.find(m => m.id === (e.fromId === member.id ? e.toId : e.fromId)),
        relationship: e.relationshipType || 'spouse',
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: !e.endDate
      }))
      .filter(item => item.member)
      .sort((a, b) => {
        // Sort by relationship start date if available
        if (a.startDate && b.startDate) {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        // Current relationships first
        if (a.isCurrent !== b.isCurrent) {
          return a.isCurrent ? -1 : 1;
        }
        return 0;
      }),
    [edges, member.id, members]
  );

  const siblings = useMemo(() => {
    const parentIds = edges
      .filter(e => e.toId === member.id && e.type === 'parent')
      .map(e => e.fromId);
    
    if (parentIds.length === 0) return [];
    
    const siblingIds = new Set<string>();
    
    // Find all children of the same parents
    parentIds.forEach(parentId => {
      edges
        .filter(e => e.fromId === parentId && e.type === 'parent' && e.toId !== member.id)
        .forEach(e => siblingIds.add(e.toId));
    });
    
    return Array.from(siblingIds)
      .map(id => members.find(m => m.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by birth date if available
        if (a?.birthDate && b?.birthDate) {
          return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
        }
        return 0;
      });
  }, [edges, member.id, members]);

  const handleUpdateMember = async () => {
    try {
      // Call your update function from the store
      // await updateMember(member.id, editData);
      setIsEditing(false);
      // Optionally show a success message
      // toast({
      //   title: "Member updated",
      //   description: `${editData.fullName || 'Member'} has been updated successfully.`,
      // });
    } catch (error) {
      console.error("Failed to update member:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to update member. Please try again.",
      //   variant: "destructive",
      // });
    }
  };

  const handleViewMember = (id: string) => {
    if (onView) {
      onView(id);
    } else if (searchParams?.get('ownerId')) {
      router.push(`/dashboard/ancestry?view=member&memberId=${id}&ownerId=${searchParams.get('ownerId')}`);
    } else {
      router.push(`/dashboard/family-tree?view=member&memberId=${id}`);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(member.id);
    } else {
      setIsEditing(true);
    }
  };

  const renderRelationshipBadge = (relationship: string) => {
    const relationshipMap: Record<string, { label: string; variant: string; icon?: React.ReactNode }> = {
      'mother': { label: 'Mother', variant: 'pink' },
      'father': { label: 'Father', variant: 'blue' },
      'parent': { label: 'Parent', variant: 'purple' },
      'child': { label: 'Child', variant: 'green' },
      'son': { label: 'Son', variant: 'blue' },
      'daughter': { label: 'Daughter', variant: 'pink' },
      'spouse': { label: 'Spouse', variant: 'red' },
      'wife': { label: 'Wife', variant: 'pink' },
      'husband': { label: 'Husband', variant: 'blue' },
      'sibling': { label: 'Sibling', variant: 'purple' },
      'brother': { label: 'Brother', variant: 'blue' },
      'sister': { label: 'Sister', variant: 'pink' },
      'grandparent': { label: 'Grandparent', variant: 'orange' },
      'grandmother': { label: 'Grandmother', variant: 'pink' },
      'grandfather': { label: 'Grandfather', variant: 'blue' },
      'grandchild': { label: 'Grandchild', variant: 'green' },
      'aunt': { label: 'Aunt', variant: 'pink' },
      'uncle': { label: 'Uncle', variant: 'blue' },
      'cousin': { label: 'Cousin', variant: 'purple' },
      'nephew': { label: 'Nephew', variant: 'blue' },
      'niece': { label: 'Niece', variant: 'pink' },
      'guardian': { label: 'Guardian', variant: 'yellow' },
    };

    const rel = relationship.toLowerCase();
    const { label, variant } = relationshipMap[rel] || { label: relationship, variant: 'outline' };
    
    return (
      <Badge variant={variant as any} className="text-xs capitalize">
        {label}
      </Badge>
    );
  };

  const renderMemberCard = (member: any, relationship?: string, meta?: any) => (
    <Card 
      key={member.id} 
      className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => handleViewMember(member.id)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-background">
            <AvatarImage src={member.avatarUrl} alt={member.fullName} />
            <AvatarFallback className="bg-muted">
              {member.fullName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{member.fullName}</h4>
              {relationship && (
                <div className="ml-auto">
                  {renderRelationshipBadge(relationship)}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {member.birthDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(member.birthDate)}</span>
                  {!member.deathDate && member.birthDate && (
                    <span className="text-xs text-muted-foreground">
                      (Age {calculateAge(member.birthDate)})
                    </span>
                  )}
                </div>
              )}
              {member.deathDate && (
                <div className="flex items-center gap-1 text-rose-600">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Deceased: {formatDate(member.deathDate)}</span>
                  {member.birthDate && (
                    <span className="text-xs">
                      (Age {calculateAge(member.birthDate, member.deathDate)})
                    </span>
                  )}
                </div>
              )}
            </div>
            {meta?.startDate && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(meta.startDate)}
                {meta.endDate ? ` - ${formatDate(meta.endDate)}` : ' - Present'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderRelationshipSection = (title: string, items: any[], relationship: string, icon: React.ReactNode) => {
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title} ({items.length})</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => 
            renderMemberCard(
              item.member || item, 
              relationship,
              item
            )
          )}
        </div>
      </div>
    );
  };

  const renderInfoRow = (label: string, value: React.ReactNode, icon?: React.ReactNode) => (
    <div className="flex items-start gap-3">
      {icon && <div className="text-muted-foreground mt-1">{icon}</div>}
      <div className="flex-1">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col space-y-4">
          {/* Header with back button and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
              )}
              <h1 className="text-2xl font-bold tracking-tight">
                {member.fullName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditClick}
                className="gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            </div>
          </div>

          {/* Basic info row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Gender</div>
              <div className="capitalize">{member.gender || '—'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatDate(member.birthDate)}</span>
                {member.birthDate && !member.deathDate && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (Age {calculateAge(member.birthDate)})
                  </span>
                )}
              </div>
            </div>
            {member.deathDate && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date of Death</div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-rose-600" />
                  <span className="text-rose-700">{formatDate(member.deathDate)}</span>
                  {member.birthDate && (
                    <span className="text-xs text-rose-600 ml-1">
                      (Age {calculateAge(member.birthDate, member.deathDate)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {member.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{member.location}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs 
          defaultValue="overview" 
          className="w-full"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <div className="border-b">
            <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="overview" 
                className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="family" 
                className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Family
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Gallery
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Biography */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Biography</h3>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>
                {member.biography ? (
                  <div className="prose prose-sm max-w-none">
                    {member.biography.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-muted-foreground">No biography added</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Add a biography to tell the story of {member.firstName || 'this person'}'s life.</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Biography
                    </Button>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {renderInfoRow(
                    'Full Name',
                    member.fullName,
                    <User className="h-4 w-4" />
                  )}
                  {renderInfoRow(
                    'Date of Birth',
                    member.birthDate ? formatDate(member.birthDate) : '—',
                    <Calendar className="h-4 w-4" />
                  )}
                  {member.deathDate && renderInfoRow(
                    'Date of Death',
                    formatDate(member.deathDate),
                    <Heart className="h-4 w-4 text-rose-600" />
                  )}
                  {renderInfoRow(
                    'Birthplace / Residence',
                    member.location || '—',
                    <MapPin className="h-4 w-4" />
                  )}
                  {member.occupation && renderInfoRow(
                    'Occupation',
                    member.occupation,
                    <Briefcase className="h-4 w-4" />
                  )}
                  {member.education && renderInfoRow(
                    'Education',
                    member.education,
                    <GraduationCap className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Notes */}
              {member.notes && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Notes</h3>
                  <div className="prose prose-sm max-w-none p-4 bg-muted/20 rounded-lg">
                    {member.notes}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="family" className="space-y-8">
              {/* Immediate Family */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Immediate Family</h3>
                
                {/* Parents */}
                {parents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Parents ({parents.length})</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {parents.map((parent) => 
                        parent && renderMemberCard(
                          parent, 
                          parent.gender === 'female' ? 'mother' : 
                          parent.gender === 'male' ? 'father' : 'parent'
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Spouses */}
                {spouses.length > 0 && renderRelationshipSection(
                  'Spouses & Partners',
                  spouses,
                  'spouse',
                  <Heart className="h-4 w-4" />
                )}

                {/* Siblings */}
                {siblings.length > 0 && renderRelationshipSection(
                  'Siblings',
                  siblings,
                  'sibling',
                  <Users className="h-4 w-4" />
                )}

                {/* Children */}
                {children.length > 0 && renderRelationshipSection(
                  'Children',
                  children,
                  'child',
                  <Baby className="h-4 w-4" />
                )}

                {(parents.length === 0 && spouses.length === 0 && siblings.length === 0 && children.length === 0) && (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-muted-foreground">No family members added yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start by adding {member.firstName || 'this person'}'s immediate family members.
                    </p>
                    <div className="mt-4 flex justify-center gap-3">
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Parent
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Add Spouse
                      </Button>
                      <Button variant="outline" size="sm">
                        <Baby className="h-4 w-4 mr-2" />
                        Add Child
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Extended Family */}
              {(parents.length > 0 || siblings.length > 0 || children.length > 0) && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-medium">Extended Family</h3>
                  
                  {/* Grandparents */}
                  {parents.some(p => p) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Grandparents</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {parents.flatMap(parent => 
                          edges
                            .filter(e => e.toId === parent?.id && e.type === 'parent')
                            .map(e => ({
                              member: members.find(m => m.id === e.fromId),
                              relationship: e.relationshipType || 'grandparent'
                            }))
                            .filter(item => item.member)
                            .map((item, i) => (
                              <div key={i}>
                                {item.member && renderMemberCard(
                                  item.member,
                                  item.relationship,
                                  { parentName: parents.find(p => p?.id === item.member?.id)?.fullName }
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aunts & Uncles */}
                  {parents.some(p => p) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Aunts & Uncles</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {parents.flatMap(parent => 
                          edges
                            .filter(e => 
                              e.type === 'parent' && 
                              e.toId !== member.id &&
                              edges.some(p => 
                                p.type === 'parent' && 
                                p.fromId === parent?.id && 
                                p.toId !== member.id
                              )
                            )
                            .map(e => ({
                              member: members.find(m => m.id === e.toId),
                              relationship: e.relationshipType || 'aunt/uncle'
                            }))
                            .filter(item => item.member && !parents.some(p => p?.id === item.member?.id))
                            .map((item, i) => (
                              <div key={i}>
                                {item.member && renderMemberCard(
                                  item.member,
                                  item.relationship,
                                  { parentName: parents.find(p => p?.id === item.member?.id)?.fullName }
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cousins */}
                  {siblings.some(s => s) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Cousins</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {siblings.flatMap(sibling => 
                          edges
                            .filter(e => e.fromId === sibling?.id && e.type === 'parent')
                            .map(e => ({
                              member: members.find(m => m.id === e.toId),
                              relationship: 'cousin'
                            }))
                            .filter(item => item.member)
                            .map((item, i) => (
                              <div key={i}>
                                {item.member && renderMemberCard(
                                  item.member,
                                  item.relationship,
                                  { parentName: siblings.find(s => s?.id === item.member?.id)?.fullName }
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Life Events</h3>
                {member.birthDate || member.deathDate || (member.timeline && member.timeline.length > 0) ? (
                  <div className="space-y-4">
                    {member.birthDate && (
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Baby className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Born</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(member.birthDate)}
                            {member.location && ` • ${member.location}`}
                          </div>
                        </div>
                      </div>
                    )}

                    {member.timeline?.map((event, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(event.date)}
                            {event.location && ` • ${event.location}`}
                          </div>
                          {event.description && (
                            <div className="mt-2 text-sm">{event.description}</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {member.deathDate && (
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">Passed Away</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(member.deathDate)}
                            {member.deathLocation && ` • ${member.deathLocation}`}
                            {member.birthDate && (
                              <span> (Age {calculateAge(member.birthDate, member.deathDate)})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-muted-foreground">No timeline events</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add important life events to {member.firstName || 'this person'}'s timeline.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="gallery">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-muted-foreground">No photos or documents</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload photos, documents, or other media to {member.firstName || 'this person'}'s gallery.
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                  <AvatarFallback>{member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <div>{member.fullName}</div>
                    </div>
                    {member.birthDate && (
                      <div>
                        <Label className="text-muted-foreground">Birth Date</Label>
                        <div>{format(new Date(member.birthDate), 'PPP')}</div>
                      </div>
                    )}
                    {member.deathDate && (
                      <div>
                        <Label className="text-muted-foreground">Death Date</Label>
                        <div>{format(new Date(member.deathDate), 'PPP')}</div>
                      </div>
                    )}
                    {member.gender && (
                      <div>
                        <Label className="text-muted-foreground">Gender</Label>
                        <div className="capitalize">{member.gender}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="space-y-2">
                    {member.location && (
                      <div>
                        <Label className="text-muted-foreground">Location</Label>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{member.location}</span>
                        </div>
                      </div>
                    )}
                    {member.ethnicity && (
                      <div>
                        <Label className="text-muted-foreground">Ethnicity</Label>
                        <div>{member.ethnicity}</div>
                      </div>
                    )}
                    {member.originRegion && (
                      <div>
                        <Label className="text-muted-foreground">Origin Region</Label>
                        <div>{member.originRegion}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {member.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="p-4 bg-muted/20 rounded-lg">
                    {member.notes}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="family" className="mt-6">
            <div className="space-y-6">
              {parents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Parents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parents.map(parent => (
                      <div key={parent.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer" onClick={() => handleViewMember(parent.id)}>
                        <div className="font-medium">{parent.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {parent.birthDate ? format(new Date(parent.birthDate), 'yyyy') : ''}
                          {parent.deathDate ? ` - ${format(new Date(parent.deathDate), 'yyyy')}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {spouses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Spouse{spouses.length > 1 ? 's' : ''}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {spouses.map(spouse => (
                      <div key={spouse.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer" onClick={() => handleViewMember(spouse.id)}>
                        <div className="font-medium">{spouse.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {spouse.birthDate ? format(new Date(spouse.birthDate), 'yyyy') : ''}
                          {spouse.deathDate ? ` - ${format(new Date(spouse.deathDate), 'yyyy')}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {children.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Children ({children.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {children.map(child => (
                      <div key={child.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer" onClick={() => handleViewMember(child.id)}>
                        <div className="font-medium">{child.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {child.birthDate ? format(new Date(child.birthDate), 'yyyy') : ''}
                          {child.deathDate ? ` - ${format(new Date(child.deathDate), 'yyyy')}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {siblings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Siblings ({siblings.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {siblings.map(sibling => (
                      <div key={sibling.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer" onClick={() => handleViewMember(sibling.id)}>
                        <div className="font-medium">{sibling.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {sibling.birthDate ? format(new Date(sibling.birthDate), 'yyyy') : ''}
                          {sibling.deathDate ? ` - ${format(new Date(sibling.deathDate), 'yyyy')}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-6">
            {member.timeline && member.timeline.length > 0 ? (
              <div className="space-y-4">
                {member.timeline.map((event, index) => (
                  <div key={index} className="border-l-2 pl-4 py-2">
                    <div className="font-medium">{event.title || 'Event'}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'PPP')}
                    </div>
                    {event.description && (
                      <p className="mt-1">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No timeline events found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      </Card>
    </div>
  );
}

// Add missing icon components
function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L9 18" />
    </svg>
  );
}

function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default MemberView;
