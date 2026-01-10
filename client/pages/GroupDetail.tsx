import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroups";
import GroupChat from "@/components/groups/GroupChat";
import GroupMembers from "@/components/groups/GroupMembers";
import { Loader, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const { group, loading } = useGroup(id);
  const [activeTab, setActiveTab] = useState<"chat" | "members">("chat");

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate("/login");
    }
  }, [authLoading, userProfile, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <Button onClick={() => navigate("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  const isMember = group.members.some((m) => m.userId === userProfile?.uid);
  const isAdmin = group.members.some(
    (m) => m.userId === userProfile?.uid && m.role === "admin",
  );

  if (!isMember) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          You are not a member of this group
        </p>
        <Button onClick={() => navigate("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/groups")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted-foreground mt-2">{group.description}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 border-b border-border/20 mt-6 mb-6">
          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "chat"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "members"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Members
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === "chat" && (
            <div className="h-[600px]">
              <GroupChat groupId={group.id} />
            </div>
          )}

          {activeTab === "members" && (
            <GroupMembers group={group} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}
