import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";

interface NavBarProps {
  isAuthenticated?: boolean;
  user?: { displayName: string; email: string } | null;
  onLogout?: () => void;
}

export function NavBar({
  isAuthenticated = false,
  user,
  onLogout,
}: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
                alt="Roblox"
                className="h-7 object-contain"
              />
              <span className="font-bold text-sm hidden sm:inline tracking-tight text-foreground">
                AssetHub
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/marketplace"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Marketplace
            </Link>
            <Link
              to="/about"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              About
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-3">
                <button className="p-2 text-foreground/70 hover:text-foreground transition-colors hover:bg-secondary/50 rounded-lg">
                  <User size={18} />
                </button>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-foreground/80 hover:text-foreground transition-colors font-medium text-sm rounded-xl hover:bg-secondary/50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-4 py-2 text-foreground/80 hover:text-foreground bg-secondary/40 hover:bg-secondary border border-border/40 rounded-xl transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-foreground/70 hover:text-foreground font-medium text-sm rounded-xl hover:bg-secondary/40 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:opacity-90 transition-all shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/20 py-3 space-y-1 bg-secondary/20">
            <Link
              to="/marketplace"
              className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
            >
              Marketplace
            </Link>
            <Link
              to="/about"
              className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
            >
              About
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-secondary/40 transition-colors font-medium text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:opacity-90 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
