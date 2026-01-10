import { useState } from "react";
import { Group, GroupMember } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendGroupInvite } from "@/hooks/useGroups";
import { Plus, Loader, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GroupMembersProps {
  group: Group;
  isAdmin?: boolean;
}

export default function GroupMembers({
  group,
  isAdmin = false,
}: GroupMembersProps) {
  const { userProfile } = useAuth();
  const { sendInvite, loading: sendingInvite } = useSendGroupInvite();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile || !inviteeEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }

    // Note: In a real app, you'd need to:
    // 1. Look up user by email
    // 2. Check if already a member
    // 3. Check if already invited

    try {
      // This is a placeholder - you'd need to implement user lookup by email
      toast.info("User lookup not yet implemented - use user ID instead");
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Members</h3>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Someone to the Group</DialogTitle>
                <DialogDescription>
                  Invite a member by their email or username
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Email or Username
                  </label>
                  <Input
                    placeholder="example@email.com"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    disabled={sendingInvite}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    placeholder="Add a personal message..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    disabled={sendingInvite}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                    disabled={sendingInvite}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingInvite || !inviteeEmail.trim()}
                  >
                    {sendingInvite && (
                      <Loader size={16} className="mr-2 animate-spin" />
                    )}
                    Send Invite
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-2">
        {group.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet</p>
        ) : (
          group.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={
                    member.avatar ||
                    "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter"
                  }
                  alt={member.username}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {member.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.role === "admin" ? "Admin" : "Member"}
                  </p>
                </div>
              </div>

              {isAdmin && member.userId !== userProfile?.uid && (
                <button className="text-destructive hover:text-destructive/80 transition-colors p-1">
                  <X size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
