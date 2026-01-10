import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSET_CATEGORIES = [
  "3D Models",
  "UI Design",
  "Scripts",
  "Animations",
  "Plugins",
  "Sounds",
  "Images",
  "Other",
];

interface UploadStep2Props {
  name: string;
  description: string;
  category: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function UploadStep2({
  name,
  description,
  category,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
}: UploadStep2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Asset details
        </h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your asset
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Asset Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Modern UI Components"
          className="w-full px-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
          required
        />
        <p className="text-xs text-muted-foreground">
          Clear and descriptive name (max 100 characters)
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your asset in detail..."
          rows={4}
          className="w-full px-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm resize-none"
          required
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 characters
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Category <span className="text-destructive">*</span>
        </label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="bg-[#1e1e1e] border-white/8 hover:border-white/15">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the category that best describes your asset
        </p>
      </div>
    </div>
  );
}
