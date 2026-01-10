import { Link } from "react-router-dom";
import { AssetCard } from "@/components/AssetCard";
import { Search, ArrowRight } from "lucide-react";
import { Asset } from "@/lib/types";

// Mock featured assets for the homepage
const featuredAssets: Asset[] = [
  {
    id: "1",
    name: "UI Component Library",
    description: "Comprehensive UI components for modern applications",
    type: "asset",
    imageUrl:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/1",
    price: null,
    category: "UI Design",
    authorId: "author1",
    authorName: "Design Studio",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    downloads: 2340,
    rating: 4.8,
    reviews: 127,
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true,
  },
  {
    id: "2",
    name: "3D Model Collection",
    description: "High-quality 3D models for rendering and animation",
    type: "model",
    imageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324ef6cb?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/2",
    price: 29.99,
    category: "3D Models",
    authorId: "author2",
    authorName: "Model Works",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    downloads: 1560,
    rating: 4.9,
    reviews: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true,
  },
  {
    id: "3",
    name: "JavaScript Utilities",
    description: "Essential utilities and helpers for JavaScript development",
    type: "script",
    imageUrl:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/3",
    price: null,
    category: "Code",
    authorId: "author3",
    authorName: "Dev Scripts",
    authorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    downloads: 3120,
    rating: 4.7,
    reviews: 156,
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true,
  },
  {
    id: "4",
    name: "Motion Graphics Pack",
    description: "Professional animation and motion design assets",
    type: "asset",
    imageUrl:
      "https://images.unsplash.com/photo-1626921235308-f88c12b71d93?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/4",
    price: 19.99,
    category: "Animations",
    authorId: "author4",
    authorName: "Motion Studio",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    downloads: 890,
    rating: 4.6,
    reviews: 72,
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: true,
  },
];

export default function Index() {
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
                <p className="text-2xl font-bold">10K+</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Quality Assets
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/20">
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-xs text-muted-foreground mt-1">Creators</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/20">
                <p className="text-2xl font-bold">$2M+</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
