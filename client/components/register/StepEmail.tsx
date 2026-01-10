import { Mail, AlertCircle } from "lucide-react";

interface StepEmailProps {
  email: string;
  onEmailChange: (value: string) => void;
  error?: string;
}

export function StepEmail({
  email,
  onEmailChange,
  error,
}: StepEmailProps) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Enter your email
        </h2>
        <p className="text-sm text-muted-foreground">
          We'll use this to verify your account
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-destructive/15 border border-destructive/30 rounded-lg">
          <AlertCircle
            size={16}
            className="text-destructive flex-shrink-0"
          />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email Address <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          You'll need to verify this email before you can use your account
        </p>
      </div>
    </div>
  );
}
