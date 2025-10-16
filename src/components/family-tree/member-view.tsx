"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useFamilyTreeStore } from "@/lib/family-tree-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, MapPin, Users, FileText, Link as LinkIcon } from "lucide-react";

export function MemberView({ memberId, onClose }: { memberId: string; onClose?: () => void }) {
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
  const [editData, setEditData] = useState<Partial<typeof member>>({});
  
  useEffect(() => {
    if (member) {
      setEditData({ ...member });
    }
  }, [member]);

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Member not found</p>
      </div>
    );
  }

  // Get relationships
  const parents = edges
    .filter(e => e.toId === member.id && e.type === 'parent')
    .map(e => members.find(m => m.id === e.fromId))
    .filter(Boolean);

  const children = edges
    .filter(e => e.fromId === member.id && e.type === 'parent')
    .map(e => members.find(m => m.id === e.toId))
    .filter(Boolean);

  const spouses = edges
    .filter(e => (e.fromId === member.id || e.toId === member.id) && e.type === 'spouse')
    .map(e => members.find(m => m.id === (e.fromId === member.id ? e.toId : e.fromId)))
    .filter(Boolean);

  const siblings = edges
    .filter(e => 
      e.type === 'parent' && 
      parents.some(p => p?.id === e.fromId) && 
      e.toId !== member.id
    )
    .map(e => members.find(m => m.id === e.toId))
    .filter(Boolean);

  const handleUpdateMember = () => {
    // Implement update logic here
    // This would typically call an update function from your store
    setIsEditing(false);
  };

  const handleViewMember = (id: string) => {
    if (searchParams?.get('ownerId')) {
      router.push(`/dashboard/ancestry?view=member&memberId=${id}&ownerId=${searchParams.get('ownerId')}`);
    } else {
      router.push(`/dashboard/family-tree?view=member&memberId=${id}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">
              {member.fullName}
            </CardTitle>
            <div className="flex items-center mt-2 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                {member.birthDate ? format(new Date(member.birthDate), 'PPP') : 'Birth date not specified'}
                {member.deathDate && ` - ${format(new Date(member.deathDate), 'PPP')}`}
              </span>
            </div>
            {member.location && (
              <div className="flex items-center mt-1 text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{member.location}</span>
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
  );
}
