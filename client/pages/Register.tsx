import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { registerUser } from "@/lib/auth";
import { StepUserInfo } from "@/components/register/StepUserInfo";
import { StepEmail } from "@/components/register/StepEmail";
import { StepPassword } from "@/components/register/StepPassword";
import { StepRole } from "@/components/register/StepRole";

const ROLES = [
  {
    id: "member",
    name: "Creator",
    description: "Create and sell assets",
    icon: "🎨",
  },
  {
    id: "partner",
    name: "Partner",
    description: "Collaborate with team",
    icon: "🤝",
  },
  {
    id: "support",
    name: "Support Staff",
    description: "Help our community",
    icon: "💬",
  },
];

const STEPS = [
  { id: "user-info", label: "Profile" },
  { id: "email", label: "Email" },
  { id: "password", label: "Password" },
  { id: "role", label: "Role" },
];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);

    // Validation for each step
    if (currentStep === 0) {
      if (username.length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }
    } else if (currentStep === 1) {
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }
    } else if (currentStep === 2) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
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

    // Final validation
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(
        email,
        password,
        username,
        displayName || username,
        selectedRole as "member" | "partner" | "admin" | "founder" | "support",
      );
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const canProceed =
    currentStep === 0
      ? username.length >= 3
      : currentStep === 1
        ? email && email.includes("@")
        : currentStep === 2
          ? password.length >= 8 && confirmPassword && password === confirmPassword
          : true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
              alt="Roblox"
              className="h-8 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold mb-1">RbxAssets</h1>
          <p className="text-sm text-muted-foreground">
            Create your creator account
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-border/30 text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      index < currentStep ? "bg-primary" : "bg-border/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </p>
            <p className="text-xs font-medium text-foreground">
              {STEPS[currentStep].label}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-secondary/15 border border-border/15 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: User Info */}
            {currentStep === 0 && (
              <StepUserInfo
                username={username}
                displayName={displayName}
                onUsernameChange={setUsername}
                onDisplayNameChange={setDisplayName}
                error={error}
              />
            )}

            {/* Step 2: Email */}
            {currentStep === 1 && (
              <StepEmail
                email={email}
                onEmailChange={setEmail}
                error={error}
              />
            )}

            {/* Step 3: Password */}
            {currentStep === 2 && (
              <StepPassword
                password={password}
                confirmPassword={confirmPassword}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                error={error}
              />
            )}

            {/* Step 4: Role Selection */}
            {currentStep === 3 && (
              <StepRole
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                roles={ROLES}
              />
            )}

            {/* Global Error Display */}
            {error && currentStep === 3 && (
              <div className="flex items-center gap-2.5 p-3 bg-destructive/15 border border-destructive/30 rounded-lg">
                <AlertCircle
                  size={16}
                  className="text-destructive flex-shrink-0"
                />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {/* Terms - Show on final step */}
            {currentStep === 3 && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-background border border-border/30 rounded cursor-pointer mt-0.5"
                  required
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              )}

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`flex-1 py-2.5 font-semibold rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                    canProceed
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              )}
            </div>
          </form>

          {/* Divider */}
          {currentStep === 3 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-secondary/15 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* Social Sign Up */}
              <button
                type="button"
                className="w-full py-2.5 bg-background border border-border/30 rounded-lg hover:bg-secondary/30 transition-all text-sm font-medium text-foreground"
              >
                Google
              </button>
            </>
          )}
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
