import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  Download,
  DollarSign,
  Star,
  MoreVertical,
  LogOut,
  AlertTriangle,
  Trash2,
  Eye,
  Edit3,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserAssets,
  Asset,
  deleteAsset,
  updateAsset,
} from "@/lib/assetService";
import { logoutUser } from "@/lib/auth";
import { WarningsSection } from "@/components/WarningsSection";
import { EditAssetDialog } from "@/components/EditAssetDialog";
import { UpdateFileDialog } from "@/components/UpdateFileDialog";
import { toast } from "sonner";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "assets" | "warnings"
  >("overview");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchAssets = async () => {
      if (user?.uid) {
        const userAssets = await getUserAssets(user.uid);
        setAssets(userAssets);
      }
      setLoading(false);
    };

    fetchAssets();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!user?.uid) return;
    try {
      await deleteAsset(assetId, user.uid);
      setAssets(assets.filter((a) => a.id !== assetId));
      setDeleteConfirm(null);
      toast.success("Asset deleted");
    } catch (error) {
      toast.error("Failed to delete asset");
      console.error(error);
    }
  };

  const handleTogglePublish = async (asset: Asset) => {
    try {
      const newStatus =
        asset.status === "published" ? "draft" : "published";
      await updateAsset(asset.id, { status: newStatus });

      setAssets(
        assets.map((a) =>
          a.id === asset.id ? { ...a, status: newStatus } : a,
        ),
      );
      toast.success(
        newStatus === "published" ? "Asset published" : "Asset unpublished",
      );
    } catch (error) {
      toast.error("Failed to update asset");
      console.error(error);
    }
  };

  const stats = {
    totalEarnings: assets.reduce(
      (sum, asset) => sum + (asset.price || 0) * asset.downloads,
      0,
    ),
    totalDownloads: assets.reduce((sum, asset) => sum + asset.downloads, 0),
    publishedCount: assets.filter((a) => a.status === "published").length,
    draftCount: assets.filter((a) => a.status === "draft").length,
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {userProfile?.displayName || "Creator"}
            </p>
          </div>
          <Link to="/upload">
            <Button size="sm" className="gap-2">
              <UploadIcon size={16} />
              Upload
            </Button>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 mb-8 border-b border-border/50 -mx-4 px-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "assets", label: "My Assets" },
            { id: "warnings", label: "Warnings & Bans", icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 text-sm font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon && <tab.icon size={16} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-border/60 rounded-lg p-3 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Earnings
                </p>
                <p className="text-lg font-semibold">
                  ${stats.totalEarnings.toFixed(0)}
                </p>
              </div>
              <div className="border border-border/60 rounded-lg p-3 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Downloads
                </p>
                <p className="text-lg font-semibold">
                  {stats.totalDownloads.toLocaleString()}
                </p>
              </div>
              <div className="border border-border/60 rounded-lg p-3 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Published Assets
                </p>
                <p className="text-lg font-semibold">{stats.publishedCount}</p>
              </div>
              <div className="border border-border/60 rounded-lg p-3 bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Draft Assets
                </p>
                <p className="text-lg font-semibold">{stats.draftCount}</p>
              </div>
            </div>

            {/* Recent Assets */}
            {assets.length > 0 && (
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-card/50">
                  <h3 className="text-sm font-semibold">Recent Assets</h3>
                </div>
                <div className="divide-y divide-border/50">
                  {assets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.id}
                      className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-card/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {asset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right text-sm">
                        <div>
                          <p className="font-medium">{asset.downloads}</p>
                          <p className="text-xs text-muted-foreground">
                            downloads
                          </p>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              asset.status === "published"
                                ? "bg-green-500/20 text-green-400"
                                : asset.status === "draft"
                                  ? "bg-gray-500/20 text-gray-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {asset.status === "published"
                              ? "Published"
                              : asset.status === "draft"
                                ? "Draft"
                                : "Verifying"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assets.length === 0 && (
              <div className="border border-border/50 rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No assets uploaded yet
                </p>
                <Link to="/upload">
                  <Button size="sm" variant="outline">
                    <UploadIcon size={16} className="mr-2" />
                    Upload First Asset
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* My Assets Tab */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {assets.length} {assets.length === 1 ? "asset" : "assets"}
              </p>
              <Link to="/upload">
                <Button size="sm" className="gap-2">
                  <UploadIcon size={14} />
                  New Asset
                </Button>
              </Link>
            </div>

            {assets.length === 0 ? (
              <div className="border border-border/50 rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No assets uploaded yet
                </p>
                <Link to="/upload">
                  <Button size="sm" variant="outline">
                    <UploadIcon size={16} className="mr-2" />
                    Upload Asset
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-card/50">
                        <th className="px-4 py-3 text-left font-semibold text-xs">
                          Asset
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-xs">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-xs">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-xs">
                          Downloads
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-xs">
                          Earnings
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-xs w-12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="border-b border-border/50 hover:bg-card/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={asset.imageUrl}
                                alt={asset.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {asset.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {asset.downloads} {asset.downloads === 1 ? "download" : "downloads"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {asset.category}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                asset.status === "published"
                                  ? "bg-green-500/20 text-green-400"
                                  : asset.status === "draft"
                                    ? "bg-gray-500/20 text-gray-400"
                                    : asset.status === "verification"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {asset.status === "published"
                                ? "Published"
                                : asset.status === "draft"
                                  ? "Draft"
                                  : asset.status === "verification"
                                    ? "Verifying"
                                    : "Uploading"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {asset.downloads}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ${((asset.price || 0) * asset.downloads).toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-card rounded transition-colors inline-flex">
                                  <MoreVertical size={16} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                  <Link to={`/asset/${asset.id}`}>
                                    <Eye size={14} className="mr-2" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                  <Edit3 size={14} className="mr-2" />
                                  Edit (Coming Soon)
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                  <Copy size={14} className="mr-2" />
                                  Update File (Coming Soon)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleTogglePublish(asset)}
                                >
                                  {asset.status === "published" ? (
                                    <>Unpublish</>
                                  ) : (
                                    <>Publish</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteConfirm(asset.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warnings Tab */}
        {activeTab === "warnings" && (
          <div>
            {user && <WarningsSection userId={user.uid} canDelete={false} />}
          </div>
        )}

        {/* Sign Out */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 rounded transition-colors font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The asset will be permanently deleted.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirm && handleDeleteAsset(deleteConfirm)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
