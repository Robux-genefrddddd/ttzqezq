import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { loginUser } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Failed to sign in. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="w-full max-w-sm">
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
            Asset marketplace for creators
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-secondary/15 border border-border/15 rounded-lg p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-muted-foreground"
                  size={16}
                />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-background border border-border/30 rounded cursor-pointer"
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a
                href="#"
                className="text-accent/80 hover:text-accent transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/20" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-secondary/15 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Sign In */}
          <button className="w-full py-2.5 bg-background border border-border/30 rounded-lg hover:bg-secondary/30 transition-all text-sm font-medium text-foreground">
            Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
