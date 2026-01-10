import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Download,
  Heart,
  ArrowRight,
  Loader,
  Trash2,
  FileDown,
} from "lucide-react";
import {
  getAsset,
  incrementAssetDownloads,
  deleteAsset,
} from "@/lib/assetService";
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
import { downloadAssetFile, forceDownloadFile } from "@/lib/fileService";
import {
  isFavorited,
  addFavorite,
  removeFavorite,
} from "@/lib/favoritesService";
import { toast } from "sonner";
import type { Asset } from "@/lib/assetService";

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(false);

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

        // Fetch reviews
        const assetReviews = await getAssetReviews(id);
        setReviews(assetReviews);

        // Fetch user's review if authenticated
        if (user) {
          const existing = await getUserReviewForAsset(id, user.uid);
          setUserReview(existing);

          // Check if favorited
          const fav = await isFavorited(user.uid, id);
          setIsFav(fav);
        }
      } catch (err) {
        console.error("Error loading asset:", err);
        setError("Failed to load asset details");
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [id, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (!reviewMessage.trim()) {
      toast.error("Please write a review message");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    if (!id) return;

    setSubmittingReview(true);

    try {
      if (userReview) {
        // Update existing review
        await updateReview(userReview.id, rating, reviewMessage);
        toast.success("Review updated successfully");
        setUserReview({
          ...userReview,
          rating,
          message: reviewMessage,
          createdAt: new Date(),
        });
      } else {
        // Create new review
        await createReview(
          id,
          user.uid,
          userProfile.displayName,
          rating,
          reviewMessage,
        );
        toast.success("Review posted successfully");

        // Reload reviews
        const updatedReviews = await getAssetReviews(id);
        setReviews(updatedReviews);

        const newUserReview = await getUserReviewForAsset(id, user.uid);
        setUserReview(newUserReview);
      }

      setReviewMessage("");
      setRating(5);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      await deleteReview(userReview.id);
      toast.success("Review deleted");
      setUserReview(null);
      setReviewMessage("");
      setRating(5);

      if (id) {
        const updatedReviews = await getAssetReviews(id);
        setReviews(updatedReviews);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !asset) {
      toast.error("Please sign in to save assets");
      return;
    }

    try {
      if (isFav) {
        await removeFavorite(user.uid, asset.id);
        setIsFav(false);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(user.uid, asset.id, asset.name, asset.imageUrl);
        setIsFav(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to save asset");
    }
  };

  const handleDeleteAsset = async () => {
    if (!user || !asset) return;

    if (user.uid !== asset.authorId) {
      toast.error("You can only delete your own assets");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this asset? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingAsset(true);

    try {
      await deleteAsset(asset.id, user.uid);
      toast.success("Asset deleted successfully");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete asset",
      );
    } finally {
      setDeletingAsset(false);
    }
  };

  const handleDownloadAsset = async () => {
    if (!asset || !asset.filePaths || asset.filePaths.length === 0) {
      toast.error("No files available for download");
      return;
    }

    setDownloading(true);

    try {
      // Download each file
      for (const filePath of asset.filePaths) {
        try {
          const fileName = filePath.split("/").pop() || "asset";
          const blob = await downloadAssetFile(filePath);
          forceDownloadFile(blob, fileName);

          // Small delay between downloads to allow browser to process
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Error downloading file ${filePath}:`, err);
          toast.error(`Failed to download file: ${filePath}`);
        }
      }

      // Increment download count once
      if (id) {
        await incrementAssetDownloads(id);
        setAsset((prev) =>
          prev ? { ...prev, downloads: prev.downloads + 1 } : null,
        );
      }

      toast.success(`${asset.filePaths.length} file(s) download started`);
    } catch (error) {
      console.error("Error downloading asset:", error);
      toast.error("Failed to download asset");
    } finally {
      setDownloading(false);
    }
  };

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
              <button
                onClick={handleDownloadAsset}
                disabled={downloading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <FileDown size={14} />
                {downloading ? "Downloading..." : "Download Asset"}
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isFav
                    ? "bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30"
                    : "bg-secondary border border-border/30 text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                {isFav ? "Saved" : "Save Asset"}
              </button>

              {/* Delete Button (only for asset author) */}
              {user && user.uid === asset.authorId && (
                <button
                  onClick={handleDeleteAsset}
                  disabled={deletingAsset}
                  className="w-full py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  {deletingAsset ? "Deleting..." : "Delete Asset"}
                </button>
              )}
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

        {/* Reviews Section */}
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-4">Reviews & Ratings</h2>

            {/* Review Form */}
            {user ? (
              <form
                onSubmit={handleSubmitReview}
                className="bg-secondary/15 border border-border/15 rounded-lg p-6 mb-6"
              >
                <h3 className="font-semibold mb-4">
                  {userReview ? "Edit Your Review" : "Leave a Review"}
                </h3>

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Share your thoughts about this asset..."
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium text-sm disabled:opacity-50"
                  >
                    {submittingReview
                      ? "Posting..."
                      : userReview
                        ? "Update Review"
                        : "Post Review"}
                  </button>

                  {userReview && (
                    <button
                      type="button"
                      onClick={handleDeleteReview}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all font-medium text-sm flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Review
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="bg-secondary/15 border border-border/15 rounded-lg p-6 mb-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Sign in to leave a review
                </p>
                <Link to="/login">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium text-sm">
                    Sign In
                  </button>
                </Link>
              </div>
            )}

            {/* Existing Reviews */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm mb-4">
                {reviews.length === 0
                  ? "No reviews yet"
                  : `${reviews.length} Review${reviews.length !== 1 ? "s" : ""}`}
              </h3>

              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-secondary/15 border border-border/15 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= review.rating
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/30"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {review.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {review.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {review.message}
                  </p>
                </div>
              ))}
            </div>
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
