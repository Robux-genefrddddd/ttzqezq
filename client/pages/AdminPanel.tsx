import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  LogOut,
  Search,
  Shield,
  Clock,
  AlertCircle,
  AlertTriangle,
  X,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logoutUser } from "@/lib/auth";
import { logAction, getAuditLogs } from "@/lib/auditService";
import {
  getMaintenanceStatus,
  setMaintenanceMode,
  subscribeToMaintenanceStatus,
  MaintenanceStatus,
} from "@/lib/maintenanceService";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { UserDetailModal } from "@/components/UserDetailModal";
import { BroadcastMessageModal } from "@/components/BroadcastMessageModal";
import { getAllBroadcastMessages, deleteBroadcastMessage } from "@/lib/broadcastService";

interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  profileImage?: string;
  isBanned: boolean;
  banReason?: string;
  createdAt: Date;
  memberRank?: string;
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
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "maintenance" | "messages">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [maintenanceStatus, setMaintenanceStatus] =
    useState<MaintenanceStatus | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessages, setBroadcastMessages] = useState<any[]>([]);

  // Check authorization and load maintenance status
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

    // Subscribe to maintenance status (real-time updates)
    const unsubscribe = subscribeToMaintenanceStatus((status) => {
      setMaintenanceStatus(status);
      setMaintenanceMessage(status.message || "");
    });

    return unsubscribe;
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
        profileImage: doc.data().profileImage,
        isBanned: doc.data().isBanned || false,
        banReason: doc.data().banReason,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        memberRank: doc.data().memberRank,
      }));

      setUsers(allUsers);

      // Fetch audit logs
      const logs = await getAuditLogs();
      setAuditLogs(logs as AuditLog[]);

      // Fetch broadcast messages (founder only)
      if (userProfile?.role === "founder") {
        const messages = await getAllBroadcastMessages();
        setBroadcastMessages(messages);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
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

  const handleUserAction = async () => {
    // Reload data after user action
    await loadData();
  };

  const handleMaintenanceModeChange = async () => {
    if (userProfile?.role !== "founder") {
      toast.error("Only founders can change maintenance mode");
      return;
    }

    setUpdatingMaintenance(true);
    try {
      const newStatus = !maintenanceStatus?.enabled;
      await setMaintenanceMode(
        newStatus,
        maintenanceMessage,
        userProfile.displayName,
      );
      toast.success(
        `Maintenance mode ${newStatus ? "enabled" : "disabled"}`,
      );
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      toast.error("Failed to update maintenance mode");
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (
    !userProfile ||
    (userProfile.role !== "founder" && userProfile.role !== "admin")
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this panel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground mt-2">
                Manage users, issue warnings, and monitor activities
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Maintenance Mode Alert */}
          {maintenanceStatus?.enabled && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-600">
                    Maintenance Mode Active
                  </h3>
                  {maintenanceStatus.message && (
                    <p className="text-sm text-yellow-600/80 mt-1">
                      {maintenanceStatus.message}
                    </p>
                  )}
                </div>
              </div>
              {userProfile?.role === "founder" && (
                <Button
                  onClick={() => setShowMaintenanceModal(true)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Manage
                </Button>
              )}
            </div>
          )}

          {/* Founder-Only Maintenance Button */}
          {userProfile?.role === "founder" && !maintenanceStatus?.enabled && (
            <div className="flex items-center justify-between p-4 bg-card border border-border/30 rounded-xl">
              <div>
                <h3 className="font-semibold">Maintenance Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Put the site in maintenance mode
                </p>
              </div>
              <Button
                onClick={() => setShowMaintenanceModal(true)}
                variant="outline"
                size="sm"
              >
                Enable
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-card border border-border/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="p-4 bg-card border border-border/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Banned Users</p>
            <p className="text-3xl font-bold text-destructive">
              {users.filter((u) => u.isBanned).length}
            </p>
          </div>
          <div className="p-4 bg-card border border-border/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Actions Logged</p>
            <p className="text-3xl font-bold">{auditLogs.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={18} />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "logs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={18} />
            Audit Logs ({auditLogs.length})
          </button>
          {userProfile?.role === "founder" && (
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "maintenance"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle size={18} />
              Settings
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-muted-foreground">Loading admin data...</p>
            </div>
          </div>
        ) : activeTab === "users" ? (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle
                    size={40}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="p-4 bg-card border border-border/30 rounded-xl hover:border-border/60 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <img
                        src={
                          u.profileImage ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                        }
                        alt={u.displayName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {u.displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          @{u.username} • {u.email}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded font-medium capitalize">
                            {u.role}
                          </span>
                          {u.memberRank && (
                            <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground text-xs rounded font-medium capitalize">
                              {u.memberRank}
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded font-medium">
                              BANNED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                        }}
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-primary/20"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === "maintenance" && userProfile?.role === "founder" ? (
          <div className="space-y-6">
            <div className="p-6 bg-card border border-border/30 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">
                Maintenance Mode Settings
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-secondary/20 border border-border/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {maintenanceStatus?.enabled
                          ? "Site is in maintenance mode"
                          : "Site is operating normally"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        maintenanceStatus?.enabled
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-green-500/20 text-green-600"
                      }`}
                    >
                      {maintenanceStatus?.enabled ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {maintenanceStatus?.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {maintenanceStatus.updatedAt.toLocaleDateString()} at{" "}
                      {maintenanceStatus.updatedAt.toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => setShowMaintenanceModal(true)}
                  className="w-full"
                >
                  {maintenanceStatus?.enabled ? "Disable" : "Enable"} Maintenance
                  Mode
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-600/90">
                When maintenance mode is enabled, visitors will see a maintenance
                notice. Use this when performing critical updates or
                maintenance.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock
                  size={40}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <p className="text-muted-foreground">No audit logs yet</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-card border border-border/30 rounded-xl hover:border-border/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground capitalize">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        By{" "}
                        <span className="font-medium">
                          {log.performedByName}
                        </span>
                        {log.targetUserName && (
                          <>
                            {" "}
                            →{" "}
                            <span className="font-medium">
                              {log.targetUserName}
                            </span>
                          </>
                        )}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Reason:</span>{" "}
                          {log.reason}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      <div>{log.timestamp.toLocaleDateString()}</div>
                      <div>{log.timestamp.toLocaleTimeString()}</div>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Maintenance Mode Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/40 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/20">
              <h2 className="text-xl font-bold">
                {maintenanceStatus?.enabled
                  ? "Disable Maintenance Mode"
                  : "Enable Maintenance Mode"}
              </h2>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="p-1 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!maintenanceStatus?.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Maintenance Message (Optional)
                    </label>
                    <Textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="We're currently performing maintenance. We'll be back soon!"
                      rows={4}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      This message will be shown to visitors while maintenance
                      mode is active.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-600/90">
                      When enabled, the site will display a maintenance page to
                      all visitors.
                    </p>
                  </div>
                </>
              )}

              {maintenanceStatus?.enabled && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600/90">
                    Are you sure you want to disable maintenance mode? The site
                    will immediately become accessible to all users.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/20 p-6 bg-card space-y-3">
              <Button
                onClick={handleMaintenanceModeChange}
                disabled={updatingMaintenance}
                className="w-full"
                variant={maintenanceStatus?.enabled ? "destructive" : "default"}
              >
                {maintenanceStatus?.enabled
                  ? "Disable Maintenance"
                  : "Enable Maintenance"}
              </Button>
              <Button
                onClick={() => setShowMaintenanceModal(false)}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onAction={handleUserAction}
        currentUserRole={userProfile?.role}
      />
    </div>
  );
}
