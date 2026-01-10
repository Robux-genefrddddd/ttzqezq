import { Link } from "react-router-dom";
import { Asset } from "@/lib/types";
import { Star, Download, Lock } from "lucide-react";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const isFree = asset.price === null || asset.price === 0;

  return (
    <Link to={`/asset/${asset.id}`}>
      <div className="group h-full">
        <div className="overflow-hidden bg-card border border-border/30 rounded-2xl flex flex-col h-full card-hover">
          {/* Image Section */}
          <div className="relative h-44 overflow-hidden bg-muted/30">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
            />

            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm ${
                  isFree
                    ? "bg-foreground/15 text-foreground/90"
                    : "bg-accent/25 text-accent"
                }`}
              >
                {isFree ? "Free" : `$${asset.price}`}
              </span>
            </div>

            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-background/60 backdrop-blur-sm text-foreground/90 capitalize">
                {asset.type}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-3 flex flex-col flex-1">
            {/* Name */}
            <div className="flex-1 mb-3">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-accent transition-colors">
                {asset.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {asset.category}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2 mb-2">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-accent text-accent" />
                <span className="font-medium text-foreground text-xs">
                  {asset.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">({asset.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download size={12} />
                <span className="text-xs">{asset.downloads}</span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 border-t border-border/40 pt-2 mb-3">
              {asset.authorAvatar && (
                <img
                  src={asset.authorAvatar}
                  alt={asset.authorName}
                  className="w-5 h-5 rounded-sm object-cover flex-shrink-0"
                />
              )}
              <p className="text-xs text-muted-foreground truncate">
                {asset.authorName}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-sm font-medium transition-all text-xs ${
                isFree
                  ? "bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary"
                  : "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15"
              }`}
            >
              {isFree ? (
                <>
                  <Download size={13} />
                  Download
                </>
              ) : (
                <>
                  <Lock size={13} />
                  Get Access
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
