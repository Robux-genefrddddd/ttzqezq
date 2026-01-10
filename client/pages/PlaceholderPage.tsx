import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  backTo?: string;
}

export function PlaceholderPage({ title, description, backTo = "/" }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              to={backTo}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </Link>
            <Link
              to="/marketplace"
              className="px-8 py-3 rounded-lg bg-secondary border border-border text-foreground font-semibold hover:bg-muted transition-all inline-flex items-center justify-center gap-2"
            >
              Browse Marketplace
            </Link>
          </div>

          <div className="pt-12 border-t border-border">
            <p className="text-sm text-muted-foreground">
              This page is coming soon. Let us know if you'd like us to prioritize it!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
