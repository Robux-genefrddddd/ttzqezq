import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createTicket, TicketCategory } from "@/lib/ticketService";
import { toast } from "sonner";

const CATEGORIES: { id: TicketCategory; name: string }[] = [
  { id: "bug-report", name: "Bug Report" },
  { id: "account-issue", name: "Account Issue" },
  { id: "payment", name: "Payment Issue" },
  { id: "content-removal", name: "Content Removal" },
  { id: "abuse-report", name: "Abuse Report" },
  { id: "other", name: "Other" },
];

export default function SupportNewTicket() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [category, setCategory] = useState<TicketCategory>("bug-report");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user || !userProfile) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketId = await createTicket(
        user.uid,
        userProfile.displayName,
        userProfile.email,
        {
          category,
          subject,
          description,
        },
      );

      toast.success("Ticket created successfully!");
      setSuccess(true);

      setTimeout(() => {
        navigate(`/support/ticket/${ticketId}`);
      }, 1500);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-fade-in">
              <CheckCircle size={40} className="text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Ticket Created</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your support ticket has been created. Our team will review it shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/30">
          <button
            onClick={() => navigate("/support")}
            className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Create Support Ticket</h1>
            <p className="text-xs text-muted-foreground">
              Tell us what's happening
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-semibold uppercase text-muted-foreground">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as TicketCategory)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-sm">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-xs font-semibold uppercase text-muted-foreground">
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Brief description"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What's happening? Include as much detail as possible."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-sm resize-none"
              required
            />
          </div>

          {/* Progressive Fields - Bug Report */}
          {category === "bug-report" && (
            <>
              <div className="space-y-2 pt-2 border-t border-border/20">
                <Label htmlFor="steps" className="text-xs font-semibold uppercase text-muted-foreground">
                  Steps to Reproduce
                </Label>
                <Textarea
                  id="steps"
                  placeholder="1. First step&#10;2. Second step&#10;3. What happens"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error" className="text-xs font-semibold uppercase text-muted-foreground">
                  Error Message
                </Label>
                <Input
                  id="error"
                  placeholder="Copy any error messages here"
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  className="h-9 text-sm font-mono text-xs"
                />
              </div>
            </>
          )}

          {/* Progressive Fields - Payment */}
          {category === "payment" && (
            <div className="space-y-2 pt-2 border-t border-border/20">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Include your transaction ID or order number if available.
                </p>
              </div>
            </div>
          )}

          {/* Progressive Fields - Abuse Report */}
          {category === "abuse-report" && (
            <div className="space-y-2 pt-2 border-t border-border/20">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>Note:</strong> Please include specific details and links if possible.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="text-sm"
            >
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/support")}
              variant="outline"
              size="sm"
              className="text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Tips - Collapsible */}
        <div className="mt-6 pt-4 border-t border-border/20">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 rounded-lg transition-colors text-left"
          >
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              💡 Tips for faster resolution
            </span>
            <ChevronDown
              size={14}
              className={`text-muted-foreground transition-transform ${
                showTips ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTips && (
            <div className="px-3 pb-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                • Be specific about what you're experiencing
              </p>
              <p className="text-xs text-muted-foreground">
                • Include screenshots or error messages
              </p>
              <p className="text-xs text-muted-foreground">
                • Describe steps to reproduce the issue
              </p>
              <p className="text-xs text-muted-foreground">
                • Include any relevant IDs or transaction numbers
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
