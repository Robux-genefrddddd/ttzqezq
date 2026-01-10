import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createAsset } from "@/lib/assetService";
import { uploadAssetFile } from "@/lib/fileService";
import { toast } from "sonner";
import { UploadStep1 } from "@/components/upload/UploadStep1";
import { UploadStep2 } from "@/components/upload/UploadStep2";
import { UploadStep3 } from "@/components/upload/UploadStep3";

interface FilePreview {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Store actual file for upload
}

const STEPS = [
  { id: "files", label: "Files & Banner" },
  { id: "details", label: "Details" },
  { id: "pricing", label: "Pricing" },
  { id: "review", label: "Review" },
];

export default function Upload() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [bannerUrl, setBannerUrl] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    tags: "",
  });

  // Handlers for Step 1
  const handleAddFiles = (newFiles: File[]) => {
    const newPreviews: FilePreview[] = newFiles.map((file) => ({
      id: Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Store the actual file for upload
    }));
    setFiles((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Validation functions
  const validateStep = (stepIndex: number): boolean => {
    setError(null);

    if (stepIndex === 0) {
      if (!bannerUrl) {
        setError("Please upload a banner image");
        return false;
      }
      if (files.length === 0) {
        setError("Please upload at least one file");
        return false;
      }
    } else if (stepIndex === 1) {
      if (!formData.name.trim()) {
        setError("Asset name is required");
        return false;
      }
      if (!formData.description.trim()) {
        setError("Description is required");
        return false;
      }
      if (!formData.category) {
        setError("Please select a category");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Check authentication
      if (!user || !userProfile) {
        toast.error("You must be logged in to upload assets");
        navigate("/login");
        return;
      }

      // Create asset first
      const assetId = await createAsset(user.uid, userProfile.displayName, {
        name: formData.name,
        description: formData.description,
        category: (formData.category as any) || "Other",
        price: parseFloat(formData.price) || 0,
        imageUrl: bannerUrl,
        authorId: user.uid,
        authorName: userProfile.displayName,
        rating: 0,
        status: "published" as const,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        filePaths: [],
      });

      // Upload files to Firebase Storage
      const filePaths: string[] = [];
      for (const filePreview of files) {
        if (filePreview.file) {
          try {
            const filePath = await uploadAssetFile(assetId, filePreview.file);
            filePaths.push(filePath);
          } catch (uploadError) {
            console.error(
              `Error uploading file ${filePreview.name}:`,
              uploadError,
            );
            toast.error(`Failed to upload file: ${filePreview.name}`);
          }
        }
      }

      // Update asset with file paths
      if (filePaths.length > 0) {
        const { updateAsset } = await import("@/lib/assetService");
        await updateAsset(assetId, { filePaths });
      }

      toast.success("Asset uploaded successfully!");
      setUploadSuccess(true);

      // Reset and redirect
      setTimeout(() => {
        setFormData({
          name: "",
          description: "",
          category: "",
          price: "",
          tags: "",
        });
        setFiles([]);
        setBannerUrl("");
        setUploadSuccess(false);
        navigate("/marketplace");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload asset. Please try again.");
      toast.error("Failed to upload asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center animate-fade-in">
              <CheckCircle size={32} className="text-green-500/60" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Upload Successful
            </h1>
            <p className="text-sm text-muted-foreground/70">
              Your asset has been published and is now visible in the
              marketplace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Upload Asset
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Share your creation with the RbxAssets community
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${
                    index <= currentStep
                      ? "bg-primary/20 text-primary/70"
                      : "bg-border/20 text-muted-foreground/50"
                  }`}
                >
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${
                      index < currentStep ? "bg-primary/30" : "bg-border/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-xs">
            <p className="text-muted-foreground/50">
              Step {currentStep + 1} of {STEPS.length}
            </p>
            <p className="font-medium text-foreground/80">
              {STEPS[currentStep].label}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-secondary/8 border border-border/15 rounded-lg p-5 md:p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle
                size={16}
                className="text-destructive/70 flex-shrink-0 mt-0"
              />
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Files & Banner */}
            {currentStep === 0 && (
              <UploadStep1
                bannerUrl={bannerUrl}
                files={files}
                onBannerChange={setBannerUrl}
                onFilesAdd={handleAddFiles}
                onFileRemove={handleRemoveFile}
              />
            )}

            {/* Step 2: Details */}
            {currentStep === 1 && (
              <UploadStep2
                name={formData.name}
                description={formData.description}
                category={formData.category}
                onNameChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                onDescriptionChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
                onCategoryChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              />
            )}

            {/* Step 3: Pricing */}
            {currentStep === 2 && (
              <UploadStep3
                price={formData.price}
                tags={formData.tags}
                onPriceChange={(value) =>
                  setFormData((prev) => ({ ...prev, price: value }))
                }
                onTagsChange={(value) =>
                  setFormData((prev) => ({ ...prev, tags: value }))
                }
              />
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-0.5">
                    Review your asset
                  </h2>
                  <p className="text-xs text-muted-foreground/70">
                    Make sure everything looks good before publishing
                  </p>
                </div>

                {/* Banner Preview */}
                {bannerUrl && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">
                      Banner
                    </p>
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-2.5">
                  <div className="p-3.5 bg-secondary/10 border border-border/20 rounded-lg space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground/70">Name</p>
                      <p className="text-xs font-medium text-foreground">
                        {formData.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground/70">
                        Description
                      </p>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                        {formData.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground/70">
                          Category
                        </p>
                        <p className="text-xs font-medium text-foreground">
                          {formData.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground/70">
                          Price
                        </p>
                        <p className="text-xs font-medium text-foreground">
                          ${formData.price || "0.00"}
                        </p>
                      </div>
                    </div>
                    {formData.tags && (
                      <div>
                        <p className="text-xs text-muted-foreground/70">Tags</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {formData.tags
                            .split(",")
                            .filter((t) => t.trim())
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-primary/15 text-primary/70 text-xs rounded-md"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground/70">Files</p>
                      <p className="text-xs font-medium text-foreground">
                        {files.length} file(s) uploaded
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 bg-background border border-border/30 rounded cursor-pointer mt-0.5 flex-shrink-0"
                    required
                  />
                  <span className="text-xs text-muted-foreground/70 leading-snug">
                    I confirm that this asset is original, doesn't violate any
                    copyright, and meets our quality standards.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2.5 pt-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 py-2 bg-secondary/20 text-secondary-foreground font-medium rounded-lg hover:bg-secondary/30 flex items-center justify-center gap-1.5 text-xs border border-border/20"
                >
                  <ArrowLeft size={12} />
                  Back
                </button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2 bg-primary/30 text-primary/80 font-medium rounded-lg hover:bg-primary/40 flex items-center justify-center gap-1.5 text-xs border border-primary/20"
                >
                  Next
                  <ArrowRight size={12} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs"
                >
                  {isSubmitting ? "Publishing..." : "Publish Asset"}
                  {!isSubmitting && <ArrowRight size={12} />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
