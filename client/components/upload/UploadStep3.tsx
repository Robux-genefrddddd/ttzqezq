import { DollarSign } from "lucide-react";

interface UploadStep3Props {
  price: string;
  tags: string;
  onPriceChange: (value: string) => void;
  onTagsChange: (value: string) => void;
}

export function UploadStep3({
  price,
  tags,
  onPriceChange,
  onTagsChange,
}: UploadStep3Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Pricing & tags
        </h2>
        <p className="text-sm text-muted-foreground">
          Set your price and add relevant tags
        </p>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Price (USD) <span className="text-muted-foreground">(Optional)</span>
        </label>
        <div className="relative">
          <DollarSign
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full pl-8 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave blank or enter 0 for free asset
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Tags <span className="text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="Enter tags separated by commas (e.g., design, ui, modern, responsive)"
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Help users find your asset with relevant tags
        </p>
      </div>

      {/* Summary */}
      <div className="p-4 bg-secondary/20 border border-border/30 rounded-lg space-y-2">
        <p className="text-sm font-medium text-foreground">Asset Summary</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Price: <span className="text-foreground">${price || "0.00"}</span>
          </p>
          <p>
            Tags:{" "}
            <span className="text-foreground">
              {tags.split(",").filter((t) => t.trim()).length || "None"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
