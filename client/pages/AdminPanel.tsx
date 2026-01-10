import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  LogOut,
  Ban,
  RotateCcw,
  Eye,
  AlertCircle,
  Clock,
  Search,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logoutUser, updateUserProfile } from "@/lib/auth";
import { logAction, getAuditLogs } from "@/lib/auditService";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  isBanned: boolean;
  banReason?: string;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  action: string;
  performedByName: string;
  targetUserName?: string;
  reason?: string;
  timestamp: Date;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Check authorization
  useEffect(() => {
    if (!user || !userProfile) {
      navigate("/login");
      return;
    }

    if (userProfile.role !== "founder" && userProfile.role !== "admin") {
      navigate("/");
      return;
    }

    loadData();
  }, [user, userProfile, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const allUsers: User[] = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        username: doc.data().username,
        displayName: doc.data().displayName,
        email: doc.data().email,
        role: doc.data().role,
        isBanned: doc.data().isBanned || false,
        banReason: doc.data().banReason,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setUsers(allUsers);

      // Fetch audit logs
      const logs = await getAuditLogs();
      setAuditLogs(logs as AuditLog[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (targetUser: User) => {
    if (!banReason.trim()) {
      toast.error("Please provide a ban reason");
      return;
    }

    try {
      await updateUserProfile(targetUser.uid, {
        isBanned: true,
        banReason,
        banDate: new Date(),
      });

      await logAction(
        "user_banned",
        user!.uid,
        userProfile!.displayName,
        targetUser.uid,
        targetUser.displayName,
        banReason,
      );

      toast.success(`${targetUser.displayName} has been banned`);
      setBanReason("");
      setSelectedUser(null);
      await loadData();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    }
  };

  const handleUnbanUser = async (targetUser: User) => {
    try {
      await updateUserProfile(targetUser.uid, {
        isBanned: false,
        banReason: undefined,
        banDate: undefined,
      });

      await logAction(
        "user_unbanned",
        user!.uid,
        userProfile!.displayName,
        targetUser.uid,
        targetUser.displayName,
      );

      toast.success(`${targetUser.displayName} has been unbanned`);
      setSelectedUser(null);
      await loadData();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter((u) =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userProfile || (userProfile.role !== "founder" && userProfile.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <Shield size={32} className="text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users and view audit logs
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border/20">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "logs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={18} className="inline mr-2" />
            Audit Logs
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : activeTab === "users" ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Grid */}
            <div className="grid gap-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="p-4 bg-secondary/15 border border-border/30 rounded-lg hover:border-border/60 transition-all cursor-pointer"
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {u.displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{u.username} • {u.email}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded capitalize font-medium">
                            {u.role}
                          </span>
                          {u.isBanned && (
                            <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded font-medium">
                              BANNED
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* User Details Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-card border border-border/30 rounded-lg max-w-md w-full p-6 space-y-4">
                  <h2 className="text-xl font-bold">User Details</h2>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">{selectedUser.displayName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Username</p>
                      <p className="font-medium text-foreground">@{selectedUser.username}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Role</p>
                      <p className="font-medium text-foreground capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium text-foreground">
                        {selectedUser.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedUser.isBanned && (
                    <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg">
                      <p className="text-xs font-semibold text-destructive mb-1">
                        BAN REASON
                      </p>
                      <p className="text-xs text-destructive">
                        {selectedUser.banReason || "No reason provided"}
                      </p>
                    </div>
                  )}

                  {!selectedUser.isBanned ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ban Reason</label>
                        <Textarea
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Enter ban reason..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBanUser(selectedUser)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          <Ban size={16} className="mr-2" />
                          Ban User
                        </Button>
                        <Button
                          onClick={() => setSelectedUser(null)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUnbanUser(selectedUser)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <RotateCcw size={16} className="mr-2" />
                        Unban User
                      </Button>
                      <Button
                        onClick={() => setSelectedUser(null)}
                        variant="outline"
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs yet
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-secondary/15 border border-border/30 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {log.action.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        By {log.performedByName}
                        {log.targetUserName && ` → ${log.targetUserName}`}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {log.reason}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {log.timestamp.toLocaleDateString()}{" "}
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
