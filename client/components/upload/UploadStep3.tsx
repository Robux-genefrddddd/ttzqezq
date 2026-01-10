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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-0.5">
          Pricing & tags
        </h2>
        <p className="text-xs text-muted-foreground/70">
          Set your price and add relevant tags
        </p>
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-foreground">
          Price (USD){" "}
          <span className="text-muted-foreground/70 text-xs">(Optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 text-xs">
            $
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full pl-6 pr-2.5 py-1.5 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground/60">
          Leave blank or enter 0 for free asset
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-foreground">
          Tags{" "}
          <span className="text-muted-foreground/70 text-xs">(Optional)</span>
        </label>
        <textarea
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="Enter tags separated by commas (e.g., design, ui, modern, responsive)"
          rows={2}
          className="w-full px-2.5 py-1.5 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 text-xs resize-none"
        />
        <p className="text-xs text-muted-foreground/60">
          Help users find your asset with relevant tags
        </p>
      </div>

      {/* Summary */}
      <div className="p-3 bg-secondary/10 border border-border/20 rounded-lg space-y-1.5">
        <p className="text-xs font-medium text-foreground">Summary</p>
        <div className="text-xs text-muted-foreground/70 space-y-0.5">
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
