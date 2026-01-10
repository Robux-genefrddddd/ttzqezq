import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Star, Loader, ArrowLeft } from "lucide-react";
import { getUserProfile, type UserProfile } from "@/lib/auth";
import { getUserAssets, type Asset } from "@/lib/assetService";
import { AssetCard } from "@/components/AssetCard";

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!id) {
        setError("Creator not found");
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(id);
        if (!profile) {
          setError("Creator not found");
          setLoading(false);
          return;
        }

        setCreator(profile);

        // Fetch creator's public assets (published only)
        const allAssets = await getUserAssets(id);
        const publishedAssets = allAssets.filter(
          (asset) => asset.status === "published"
        );
        setAssets(publishedAssets);
      } catch (err) {
        console.error("Error loading creator profile:", err);
        setError("Failed to load creator profile");
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Creator Not Found</h1>
          <p className="text-muted-foreground">
            {error || "This creator doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/marketplace")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={14} />
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Calculate creator stats
  const stats = {
    totalAssets: assets.length,
    totalDownloads: assets.reduce((sum, asset) => sum + asset.downloads, 0),
    avgRating:
      assets.length > 0
        ? (assets.reduce((sum, asset) => sum + asset.rating, 0) / assets.length).toFixed(1)
        : 0,
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/marketplace")}
          className="mb-6 px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Creator Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            {/* Avatar */}
            <img
              src={
                creator.profileImage ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`
              }
              alt={creator.displayName}
              className="w-24 h-24 rounded-xl object-cover border border-border/20"
            />

            {/* Creator Info */}
            <div className="flex-1">
              <div className="mb-2">
                <h1 className="text-3xl font-bold mb-1">{creator.displayName}</h1>
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
              </div>

              {/* Role Badge */}
              {creator.role && creator.role !== "member" && (
                <div className="flex gap-2 mb-4">
                  <span className="inline-block px-2.5 py-1 bg-primary/15 text-primary text-xs font-semibold rounded-md capitalize">
                    {creator.role}
                  </span>
                  {creator.memberRank && creator.memberRank !== "starter" && (
                    <span className="inline-block px-2.5 py-1 bg-accent/15 text-accent text-xs font-semibold rounded-md capitalize">
                      {creator.memberRank}
                    </span>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">Assets</span>
                  <span className="text-lg font-bold">{stats.totalAssets}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">
                    Downloads
                  </span>
                  <div className="flex items-center gap-1">
                    <Download size={14} />
                    <span className="text-lg font-bold">{stats.totalDownloads}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">
                    Avg Rating
                  </span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-accent text-accent" />
                    <span className="text-lg font-bold">{stats.avgRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">
            {assets.length === 0 ? "No Assets" : `Assets (${assets.length})`}
          </h2>

          {assets.length === 0 ? (
            <div className="text-center py-12 border border-border/20 rounded-lg">
              <p className="text-muted-foreground">
                This creator hasn't published any assets yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
