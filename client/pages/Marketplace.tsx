import { useState, useMemo } from "react";
import { AssetCard } from "@/components/AssetCard";
import { Asset, AssetFilter, AssetType } from "@/lib/types";
import { Search, X } from "lucide-react";

// Mock assets data
const allAssets: Asset[] = [
  {
    id: "1",
    name: "Modern UI Kit",
    description: "A comprehensive UI kit for modern applications",
    type: "asset",
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/1",
    price: null,
    category: "UI Design",
    authorId: "author1",
    authorName: "Design Pro",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    downloads: 2340,
    rating: 4.8,
    reviews: 127,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "3D Model Pack",
    description: "High-quality 3D models for your projects",
    type: "model",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324ef6cb?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/2",
    price: 29.99,
    category: "3D Models",
    authorId: "author2",
    authorName: "3D Master",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    downloads: 1560,
    rating: 4.9,
    reviews: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "JavaScript Utilities",
    description: "Essential JavaScript utilities and helpers",
    type: "script",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/3",
    price: null,
    category: "Code",
    authorId: "author3",
    authorName: "Dev Scripts",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    downloads: 3120,
    rating: 4.7,
    reviews: 156,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Animation Pack",
    description: "Smooth and professional animations",
    type: "asset",
    imageUrl: "https://images.unsplash.com/photo-1626921235308-f88c12b71d93?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/4",
    price: 19.99,
    category: "Animations",
    authorId: "author4",
    authorName: "Motion Design",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    downloads: 890,
    rating: 4.6,
    reviews: 72,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "React Components Library",
    description: "Reusable React components for rapid development",
    type: "script",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/5",
    price: 49.99,
    category: "Code",
    authorId: "author5",
    authorName: "React Dev",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    downloads: 1200,
    rating: 4.9,
    reviews: 98,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    name: "Game Assets Bundle",
    description: "Complete game assets for indie developers",
    type: "asset",
    imageUrl: "https://images.unsplash.com/photo-1518611505868-48510c2e85ea?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/6",
    price: null,
    category: "Game Development",
    authorId: "author6",
    authorName: "Game Studio",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    downloads: 4560,
    rating: 4.7,
    reviews: 234,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "7",
    name: "Character Rigging Service",
    description: "Professional character rigging for animation",
    type: "model",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324ef6cb?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/7",
    price: 79.99,
    category: "3D Models",
    authorId: "author7",
    authorName: "Animation Pro",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    downloads: 340,
    rating: 5.0,
    reviews: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "8",
    name: "Icon Set - 500 Icons",
    description: "Comprehensive icon set for web and mobile",
    type: "asset",
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    productLink: "https://create.roblox.com/store/asset/8",
    price: null,
    category: "UI Design",
    authorId: "author8",
    authorName: "Icon Master",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    downloads: 5670,
    rating: 4.8,
    reviews: 312,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const assetTypes: AssetType[] = ["model", "script", "asset", "resource", "product"];
const categories = ["UI Design", "3D Models", "Code", "Animations", "Game Development"];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AssetFilter>({
    type: undefined,
    category: undefined,
    priceRange: "all",
    sortBy: "newest",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    let result = allAssets;

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      result = result.filter((asset) => asset.type === filters.type);
    }

    // Category filter
    if (filters.category) {
      result = result.filter((asset) => asset.category === filters.category);
    }

    // Price range filter
    if (filters.priceRange === "free") {
      result = result.filter((asset) => asset.price === null || asset.price === 0);
    } else if (filters.priceRange === "paid") {
      result = result.filter((asset) => asset.price !== null && asset.price > 0);
    }

    // Sort
    if (filters.sortBy === "popular") {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (filters.sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return result;
  }, [searchQuery, filters]);

  const handleFilterChange = (key: keyof AssetFilter, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      type: undefined,
      category: undefined,
      priceRange: "all",
      sortBy: "newest",
    });
  };

  const hasActiveFilters =
    searchQuery ||
    filters.type ||
    filters.category ||
    filters.priceRange !== "all" ||
    filters.sortBy !== "newest";

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="border-b border-border/50 py-10 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Marketplace</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Browse thousands of assets created by our community. Filter by type, category, or price.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center justify-between">
                Filters
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </h3>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-sm bg-secondary border border-border/50 focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-2 uppercase tracking-wide text-muted-foreground">Type</label>
                <select
                  value={filters.type || ""}
                  onChange={(e) => handleFilterChange("type", e.target.value || undefined)}
                  className="w-full px-3 py-1.5 rounded-sm bg-secondary border border-border/50 focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                >
                  <option value="">All Types</option>
                  {assetTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-2 uppercase tracking-wide text-muted-foreground">Category</label>
                <select
                  value={filters.category || ""}
                  onChange={(e) => handleFilterChange("category", e.target.value || undefined)}
                  className="w-full px-3 py-1.5 rounded-sm bg-secondary border border-border/50 focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-2 uppercase tracking-wide text-muted-foreground">Price</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange("priceRange", e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-sm bg-secondary border border-border/50 focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="text-xs font-medium block mb-2 uppercase tracking-wide text-muted-foreground">Sort</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-sm bg-secondary border border-border/50 focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border font-medium hover:bg-muted transition-colors"
            >
              {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
            </button>

            {mobileFiltersOpen && (
              <div className="mt-4 space-y-6 p-4 rounded-lg border border-border bg-card">
                <div>
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <label className="text-sm font-medium block mb-3">Asset Type</label>
                  <select
                    value={filters.type || ""}
                    onChange={(e) => handleFilterChange("type", e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm mb-4"
                  >
                    <option value="">All Types</option>
                    {assetTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>

                  <label className="text-sm font-medium block mb-3">Category</label>
                  <select
                    value={filters.category || ""}
                    onChange={(e) => handleFilterChange("category", e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm mb-4"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <label className="text-sm font-medium block mb-3">Price</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange("priceRange", e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm mb-4"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free Only</option>
                    <option value="paid">Paid Only</option>
                  </select>

                  <label className="text-sm font-medium block mb-3">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors font-medium text-sm"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Assets Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-8">
              <h2 className="font-semibold text-lg">
                {filteredAssets.length} Asset{filteredAssets.length !== 1 ? "s" : ""} Found
              </h2>
            </div>

            {/* Assets Grid */}
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-border rounded-lg bg-card/50">
                <h3 className="font-semibold text-lg mb-2">No assets found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors font-medium inline-flex items-center gap-2"
                >
                  <X size={18} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
