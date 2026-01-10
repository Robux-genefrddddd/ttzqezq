import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AssetCard } from "@/components/AssetCard";
import { Search, ArrowRight } from "lucide-react";
import { Asset } from "@/lib/types";
import { getFeaturedAssets, getSiteStats, SiteStats } from "@/lib/assetService";

export default function Index() {
  const [featuredAssets, setFeaturedAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<SiteStats>({
    totalAssets: 0,
    totalCreators: 0,
    totalDistributed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assets, siteStats] = await Promise.all([
          getFeaturedAssets(4),
          getSiteStats(),
        ]);
        setFeaturedAssets(assets);
        setStats(siteStats);
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Format large numbers with K, M suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  // Format currency
  const formatCurrency = (num: number): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section - Content-Focused */}
      <section className="border-b border-border/20 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl space-y-8">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-accent/40" />
                <span className="text-xs font-medium text-accent uppercase tracking-wider">
                  Creator Marketplace
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                Assets for Creators
              </h1>

              <p className="text-base text-muted-foreground max-w-2xl">
                Professional marketplace for 3D models, scripts, UI components,
                animations, and resources. Find what studios and developers use
                daily.
              </p>
            </div>

            {/* Search + Quick Links */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/marketplace"
                className="flex-1 flex items-center gap-2 px-4 py-3 bg-secondary/40 border border-border/30 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all text-sm"
              >
                <Search size={16} />
                <span>Browse all assets</span>
              </Link>
              <Link
                to="/marketplace"
                className="flex items-center gap-2 px-6 py-3 bg-accent text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Explore Now
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/20">
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatNumber(stats.totalAssets) + "+"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Quality Assets
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/20">
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatNumber(stats.totalCreators) + "+"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Creators</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/20">
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(stats.totalDistributed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Distributed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="border-b border-border/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-lg font-bold">Browse by Category</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              "3D Models",
              "Scripts",
              "UI Design",
              "Animations",
              "Resources",
            ].map((cat) => (
              <Link
                key={cat}
                to="/marketplace"
                className="p-4 bg-secondary/30 border border-border/30 rounded-2xl hover:border-border/50 hover:bg-secondary/50 transition-all text-sm font-medium text-center"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Assets Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold">Featured & Trending</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Hand-picked assets from quality creators
              </p>
            </div>
            <Link
              to="/marketplace"
              className="text-xs font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-secondary/20 border border-border/20 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : featuredAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No featured assets available yet
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
