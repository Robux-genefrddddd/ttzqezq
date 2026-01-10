import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
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

const CATEGORIES: { id: TicketCategory; name: string; icon: string }[] = [
  { id: "bug-report", name: "Bug Report", icon: "🐛" },
  { id: "account-issue", name: "Account Issue", icon: "👤" },
  { id: "payment", name: "Payment Issue", icon: "💳" },
  { id: "content-removal", name: "Content Removal", icon: "🚫" },
  { id: "abuse-report", name: "Abuse Report", icon: "⚠️" },
  { id: "other", name: "Other", icon: "❓" },
];

export default function SupportNewTicket() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [category, setCategory] = useState<TicketCategory>("bug-report");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-fade-in">
                <CheckCircle size={48} className="text-green-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">
                Ticket Created! ✓
              </h1>
              <p className="text-lg text-muted-foreground">
                Your support ticket has been created successfully.
              </p>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Our support team will review your ticket and respond as soon as
                possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
            <button
              onClick={() => navigate("/support")}
              className="p-2 hover:bg-secondary/40 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Create Support Ticket</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your issue and our team will help you
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold">
                Category *
              </Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as TicketCategory)}
              >
                <SelectTrigger className="bg-[#1e1e1e] border-white/8 hover:border-white/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-base font-semibold">
                Subject *
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating ticket..." : "Create Ticket"}
              </Button>
              <button
                type="button"
                onClick={() => navigate("/support")}
                className="px-6 py-2 rounded-md border border-border text-foreground font-semibold hover:bg-secondary transition-all"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-secondary/30 border border-border rounded-lg space-y-2">
            <p className="text-sm font-semibold text-foreground">
              💡 Tips for faster resolution:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Be as specific as possible about your issue</li>
              <li>• Include screenshots if applicable</li>
              <li>• Provide steps to reproduce the problem</li>
              <li>• Include any error messages you received</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
