import { Upload as UploadIcon, X, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface FilePreview {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface UploadStep1Props {
  bannerUrl: string;
  files: FilePreview[];
  onBannerChange: (url: string) => void;
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (id: string) => void;
}

export function UploadStep1({
  bannerUrl,
  files,
  onBannerChange,
  onFilesAdd,
  onFileRemove,
}: UploadStep1Props) {
  const [dragActive, setDragActive] = useState(false);
  const [bannerDragActive, setBannerDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      onFilesAdd(Array.from(e.dataTransfer.files));
    }
  };

  const handleBannerDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBannerDragActive(true);
    } else if (e.type === "dragleave") {
      setBannerDragActive(false);
    }
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onBannerChange(event.target?.result as string);
      };
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onBannerChange(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-0.5">
          Add banner & files
        </h2>
        <p className="text-xs text-muted-foreground/70">
          Upload a banner image and your asset files
        </p>
      </div>

      {/* Banner Upload */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-foreground">
          Banner Image <span className="text-destructive">*</span>
        </label>
        <div
          onDragEnter={handleBannerDrag}
          onDragLeave={handleBannerDrag}
          onDragOver={handleBannerDrag}
          onDrop={handleBannerDrop}
          className={`relative border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer ${
            bannerDragActive
              ? "border-primary/40 bg-primary/5"
              : "border-border/30 hover:border-border/40 hover:bg-secondary/10"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {bannerUrl ? (
            <div className="space-y-2">
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <p className="text-xs text-muted-foreground/60">
                Click to change
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
                  <ImageIcon size={20} className="text-muted-foreground/50" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Drag and drop your banner
                </p>
                <p className="text-xs text-muted-foreground/60">
                  or click to select (PNG, JPG, WebP)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Files Upload */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-foreground">
          Asset Files <span className="text-destructive">*</span>
        </label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-primary/40 bg-primary/5"
              : "border-border/30 hover:border-border/40 hover:bg-secondary/10"
          }`}
        >
          <input
            type="file"
            multiple
            accept=".zip,.rar,.7z,.fbx,.obj,.gltf,.glb,.unity,.unitypackage,.rbxm,.rbxl,.lua,.ts,.js,.json,.png,.jpg,.jpeg,.wav,.mp3,.ogg"
            onChange={(e) => {
              if (e.target.files) {
                onFilesAdd(Array.from(e.target.files));
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
                <UploadIcon size={20} className="text-muted-foreground/50" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                Drag and drop your files here
              </p>
              <p className="text-xs text-muted-foreground/60">
                or click to select (ZIP, 3D Models, Scripts, Images, Audio,
                etc.)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            Uploaded Files ({files.length})
          </label>
          <div className="space-y-1.5">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 bg-secondary/10 border border-border/20 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onFileRemove(file.id)}
                  className="ml-2 p-1.5 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X size={14} className="text-muted-foreground/60" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
