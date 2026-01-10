import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupInvites } from "@/hooks/useGroups";
import GroupInviteMessage from "@/components/groups/GroupInviteMessage";
import { Loader, Mail } from "lucide-react";

export default function Messages() {
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const { invites, loading } = useGroupInvites(userProfile?.uid);
  const [displayedInvites, setDisplayedInvites] = useState(invites);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate("/login");
    }
  }, [authLoading, userProfile, navigate]);

  useEffect(() => {
    setDisplayedInvites(invites);
  }, [invites]);

  const handleInviteAccepted = () => {
    setDisplayedInvites(
      displayedInvites.filter((inv) => inv.status === "pending"),
    );
  };

  const handleInviteDeclined = () => {
    setDisplayedInvites(
      displayedInvites.filter((inv) => inv.status === "pending"),
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Fixed at top */}
      <div className="border-b border-border/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <Mail size={32} className="text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Group invitations and notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {displayedInvites.length === 0 ? (
            <div className="text-center py-12">
              <Mail
                size={48}
                className="text-muted-foreground mx-auto mb-4 opacity-50"
              />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No messages yet
              </h2>
              <p className="text-muted-foreground">
                You haven't received any group invitations yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedInvites.map((invite) => (
                <GroupInviteMessage
                  key={invite.id}
                  invite={invite}
                  onAccepted={handleInviteAccepted}
                  onDeclined={handleInviteDeclined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
