import { useState, useEffect } from "react";
import { AssetCard } from "@/components/AssetCard";
import { Search, X, Cube, Palette, Code, Zap, Music, Image as ImageIcon, MoreHorizontal, LayoutGrid } from "lucide-react";
import { getPublishedAssets, type Asset } from "@/lib/assetService";

const CATEGORIES = [
  { name: "3D Models", icon: Cube },
  { name: "UI Design", icon: Palette },
  { name: "Scripts", icon: Code },
  { name: "Animations", icon: Zap },
  { name: "Plugins", icon: LayoutGrid },
  { name: "Sounds", icon: Music },
  { name: "Images", icon: ImageIcon },
  { name: "Other", icon: MoreHorizontal },
];

export default function Marketplace() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch assets from Firebase
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assets = await getPublishedAssets(selectedCategory, 100);
        setAllAssets(assets);
      } catch (error) {
        console.error("Error fetching assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [selectedCategory]);

  // Filter and sort assets
  const filteredAssets = allAssets
    .filter((asset) => {
      if (!searchQuery) return true;
      return (
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        default: // newest
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Marketplace</h1>
          <p className="text-lg text-muted-foreground">
            Discover and download high-quality digital assets for your projects
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${
              mobileFiltersOpen ? "block" : "hidden"
            } md:block w-full md:w-48 flex-shrink-0`}
          >
            <div className="bg-secondary/30 border border-border rounded-lg p-6 space-y-6 sticky top-24">
              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Category</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                      !selectedCategory
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Close Mobile Filters */}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="md:hidden w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          </aside>

          {/* Assets Grid */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden mb-6 px-4 py-2 bg-secondary/50 border border-border rounded-lg font-medium w-full"
            >
              Filters & Sort
            </button>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Loading assets...</p>
                </div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="bg-secondary/30 border border-border rounded-lg p-12 text-center space-y-4">
                <p className="text-lg text-muted-foreground">No assets found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredAssets.length}{" "}
                    {filteredAssets.length === 1 ? "asset" : "assets"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
