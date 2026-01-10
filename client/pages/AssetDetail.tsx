import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Download, Heart, ArrowRight, Loader, Trash2 } from "lucide-react";
import { getAsset } from "@/lib/assetService";
import { getUserProfile } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAssetReviews,
  hasUserReviewedAsset,
  getUserReviewForAsset,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from "@/lib/reviewService";
import { toast } from "sonner";
import type { Asset } from "@/lib/assetService";

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!id) return;

      try {
        // Fetch asset
        const assetData = await getAsset(id);
        if (!assetData) {
          setError("Asset not found");
          setLoading(false);
          return;
        }

        setAsset(assetData);

        // Fetch author profile
        const author = await getUserProfile(assetData.authorId);
        setAuthorProfile(author);
      } catch (err) {
        console.error("Error loading asset:", err);
        setError("Failed to load asset details");
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">
            Asset Not Found
          </h1>
          <p className="text-muted-foreground">
            {error || "This asset doesn't exist"}
          </p>
          <Link to="/marketplace">
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2">
              Back to Marketplace
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const priceLabel =
    asset.price && asset.price > 0 ? `$${asset.price.toFixed(2)}` : "Free";

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Banner Image */}
          <div className="md:col-span-2 flex justify-center">
            <div className="rounded-lg overflow-hidden bg-muted w-full max-w-2xl h-80 border border-border/30">
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Price Badge */}
            <div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  asset.price && asset.price > 0
                    ? "bg-green-500/15 text-green-400"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {priceLabel}
              </span>
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{asset.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-accent text-accent" />
                  <span className="font-medium">{asset.rating.toFixed(1)}</span>
                </div>
                <span>({asset.reviews} reviews)</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <p className="text-sm font-medium text-foreground">
                {asset.category}
              </p>
            </div>

            {/* Stats */}
            <div className="border-t border-b border-border/20 py-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloads</span>
                <div className="flex items-center gap-1.5">
                  <Download size={14} />
                  <span className="font-medium">{asset.downloads}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all">
                Download Asset
              </button>
              <button className="w-full py-2.5 rounded-lg bg-secondary border border-border/30 font-medium text-sm hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
                <Heart size={14} />
                Save Asset
              </button>
            </div>
          </div>
        </div>

        {/* Description & Creator */}
        <div className="bg-secondary/15 border border-border/15 rounded-lg p-6 space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-lg font-bold mb-3">About This Asset</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {asset.description}
            </p>
          </div>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator Section */}
          <div className="pt-4 border-t border-border/20">
            <h3 className="font-semibold mb-4 text-sm">Creator</h3>
            {authorProfile ? (
              <div className="flex items-center justify-between p-4 bg-background/50 border border-border/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      authorProfile.profileImage ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile.username}`
                    }
                    alt={authorProfile.username}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {authorProfile.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{authorProfile.username}
                    </p>
                    {authorProfile.role && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded capitalize">
                        {authorProfile.role}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/creator/${authorProfile.uid}`}
                  className="text-accent hover:text-accent/80 text-sm font-medium"
                >
                  View Profile
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-background/50 border border-border/30 rounded-lg text-muted-foreground text-sm">
                Creator information unavailable
              </div>
            )}
          </div>
        </div>

        {/* Back to Marketplace */}
        <div className="mt-8">
          <Link to="/marketplace">
            <button className="px-6 py-2.5 bg-secondary border border-border/30 rounded-lg hover:bg-secondary/80 transition-all font-medium text-sm inline-flex items-center gap-2">
              ← Back to Marketplace
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
