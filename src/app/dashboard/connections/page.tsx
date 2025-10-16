"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, Loader2 } from "lucide-react";

type Connection = {
  userId: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  connectionDate: string;
};

export default function ConnectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const loadConnections = async () => {
      try {
        console.log('[Connections] Loading connections for user:', user.uid);
        
        // Query connections collection for this user
        const connectionsRef = collection(db, "connections");
        const q = query(
          connectionsRef,
          where("participants", "array-contains", user.uid),
          where("status", "in", ["connected", "accepted"])
        );

        const snapshot = await getDocs(q);
        console.log('[Connections] Found', snapshot.size, 'connections');

        // Get all connected user IDs
        const connectedUserIds = new Set<string>();
        const connectionDates = new Map<string, string>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const participants = data.participants || [];
          const otherUserId = participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            connectedUserIds.add(otherUserId);
            connectionDates.set(otherUserId, data.createdAt || data.timestamp || new Date().toISOString());
          }
        });

        // Fetch user profiles for all connected users
        const userProfiles: Connection[] = [];
        
        for (const userId of connectedUserIds) {
          try {
            const userDoc = await getDocs(
              query(collection(db, "users"), where("__name__", "==", userId))
            );
            
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              const displayName = 
                userData.fullName ||
                userData.preferredName ||
                [userData.firstName, userData.middleName, userData.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                userData.name ||
                userData.displayName ||
                "Unknown User";

              userProfiles.push({
                userId,
                displayName,
                photoURL: userData.profilePicture || userData.photoURL,
                email: userData.email,
                connectionDate: connectionDates.get(userId) || new Date().toISOString(),
              });
            }
          } catch (err) {
            console.error('[Connections] Error loading user profile:', userId, err);
          }
        }

        // Sort by connection date (newest first)
        userProfiles.sort((a, b) => 
          new Date(b.connectionDate).getTime() - new Date(a.connectionDate).getTime()
        );

        console.log('[Connections] Loaded', userProfiles.length, 'user profiles');
        setConnections(userProfiles);
      } catch (error) {
        console.error('[Connections] Error loading connections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [user?.uid]);

  const handleMessage = (userId: string) => {
    router.push(`/dashboard/messages?peer=${encodeURIComponent(userId)}`);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/dashboard/profile/${encodeURIComponent(userId)}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to view connections</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
            <Users className="h-6 w-6" />
            My Connections
          </CardTitle>
          <p className="text-muted-foreground">
            People you're connected with
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-muted-foreground mb-4">
                Start connecting with people to build your network
              </p>
              <Button onClick={() => router.push("/dashboard/search")}>
                Find People
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.userId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={connection.photoURL || `https://picsum.photos/seed/${connection.userId}/128`}
                        alt={connection.displayName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(connection.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-semibold">{connection.displayName}</h4>
                      {connection.email && (
                        <p className="text-sm text-muted-foreground">
                          {connection.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(connection.connectionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(connection.userId)}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMessage(connection.userId)}
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
