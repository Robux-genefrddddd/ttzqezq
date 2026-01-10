import { useState } from "react";
import { X, Ban, AlertCircle, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  createWarning,
  getUserWarnings,
  deleteWarning,
} from "@/lib/warningService";
import { updateUserProfile } from "@/lib/auth";
import { Warning } from "@/lib/warningService";

interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  profileImage?: string;
  isBanned: boolean;
  createdAt: Date;
  memberRank?: string;
}

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  onAction?: () => void;
  currentUserRole?: string;
}

export function UserDetailModal({
  user,
  onClose,
  onAction,
  currentUserRole = "member",
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "actions" | "history">(
    "info",
  );
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"warning" | "ban" | "suspension">(
    "warning",
  );
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState("7");

  if (!user) return null;

  const handleLoadWarnings = async () => {
    try {
      const userWarnings = await getUserWarnings(user.uid);
      setWarnings(userWarnings);
    } catch (error) {
      console.error("Error loading warnings:", error);
    }
  };

  const handleCreateWarning = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setLoading(true);
    try {
      const duration = actionType === "ban" ? undefined : parseInt(durationDays);
      await createWarning(
        user.uid,
        "admin-id", // This should come from current user
        "Admin", // This should come from current user
        actionType,
        reason,
        `Issued by ${currentUserRole}`,
        duration,
      );

      toast.success(`${actionType} created successfully`);
      setReason("");
      setDurationDays("7");

      // Reload warnings
      const userWarnings = await getUserWarnings(user.uid);
      setWarnings(userWarnings);

      if (onAction) onAction();
    } catch (error) {
      console.error("Error creating warning:", error);
      toast.error("Failed to create warning");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarning = async (warningId: string) => {
    if (currentUserRole !== "founder") {
      toast.error("Only founders can delete warnings");
      return;
    }

    setLoading(true);
    try {
      await deleteWarning(warningId);
      toast.success("Warning deleted");

      // Reload warnings
      const userWarnings = await getUserWarnings(user.uid);
      setWarnings(userWarnings);
    } catch (error) {
      console.error("Error deleting warning:", error);
      toast.error("Failed to delete warning");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (user.role === "founder" || user.role === "admin") {
      toast.error("Cannot ban admin or founder accounts");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, { isBanned: true });
      toast.success("User banned successfully");
      if (onAction) onAction();
      onClose();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.displayName}'s account? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // Mark account as deleted (soft delete)
      await updateUserProfile(user.uid, {
        isBanned: true,
        banReason: "Account deleted by admin",
      });

      toast.success("Account deleted successfully");
      if (onAction) onAction();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20">
          <h2 className="text-xl font-bold">User Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Profile Section */}
          <div className="p-6 border-b border-border/20">
            <div className="flex gap-6">
              {/* Avatar */}
              <img
                src={
                  user.profileImage ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.displayName}
                className="w-24 h-24 rounded-xl object-cover"
              />

              {/* Info */}
              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{user.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="capitalize font-medium">{user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rank:</span>
                    <span className="capitalize">{user.memberRank || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={
                        user.isBanned ? "text-red-400" : "text-green-400"
                      }
                    >
                      {user.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/20">
            {["info", "actions", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "info" && "Information"}
                {tab === "actions" && "Actions"}
                {tab === "history" && "History"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "info" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Account Created
                  </p>
                  <p className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Action Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["warning", "ban", "suspension"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setActionType(type)}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm capitalize ${
                          actionType === type
                            ? "border-accent bg-accent/20 text-accent"
                            : "border-border/30 text-muted-foreground hover:border-border/60"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {actionType !== "ban" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      placeholder="7"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain the reason for this action..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleCreateWarning}
                  disabled={loading}
                  className="w-full"
                >
                  <AlertCircle size={16} className="mr-2" />
                  Issue {actionType}
                </Button>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <Button
                  onClick={handleLoadWarnings}
                  variant="outline"
                  className="w-full mb-4"
                  disabled={loading}
                >
                  Reload Warnings
                </Button>

                {warnings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No warnings or bans
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {warnings.map((warning) => (
                      <div
                        key={warning.id}
                        className="p-4 bg-secondary/20 border border-border/30 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                warning.type === "ban"
                                  ? "bg-red-500/20 text-red-400"
                                  : warning.type === "suspension"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {warning.type}
                            </span>
                            {warning.expiresAt && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} />
                                Expires{" "}
                                {new Date(warning.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {currentUserRole === "founder" && (
                            <button
                              onClick={() => handleDeleteWarning(warning.id)}
                              disabled={loading}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-1">
                          {warning.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {warning.adminName} •{" "}
                          {new Date(warning.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/20 p-6 bg-secondary/10 space-y-3">
          {!user.isBanned && user.role !== "founder" && user.role !== "admin" && (
            <Button
              onClick={handleBanUser}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <Ban size={16} className="mr-2" />
              Ban User
            </Button>
          )}

          {user.role !== "founder" && user.role !== "admin" && (
            <Button
              onClick={handleDeleteAccount}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </Button>
          )}

          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
