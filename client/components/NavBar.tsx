import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut, Crown, Shield, Users, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser, DEFAULT_PROFILE_IMAGE } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function RoleBadge({ role }: { role?: string }) {
  if (!role || role === "member") return null;

  if (role === "founder") {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-lg">
        <Crown size={14} className="text-yellow-400" />
        <span className="text-xs font-semibold text-yellow-400">Founder</span>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-lg">
        <Shield size={14} className="text-red-400" />
        <span className="text-xs font-semibold text-red-400">Admin</span>
      </div>
    );
  }

  if (role === "partner") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <img
            src="https://cdn3.emoji.gg/emojis/42747-roblox-verified.png"
            alt="Partner"
            className="w-3.5 h-3.5 hover:scale-110 transition-transform cursor-help"
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Partner
        </TooltipContent>
      </Tooltip>
    );
  }

  return null;
}

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, userProfile, loading, unreadCount } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
                className="h-6 object-contain"
              />
              <span className="font-bold text-sm hidden sm:inline tracking-tight text-foreground">
                RbxAssets
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
              to="/support"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Support
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
            {isAuthenticated && userProfile ? (
              <div className="hidden sm:flex items-center gap-3">
                {/* User Profile Badge */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border/40 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer group">
                      <img
                        src={
                          userProfile.profileImage ||
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                            userProfile.username
                        }
                        alt={userProfile.username}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {userProfile.username}
                        </span>
                        <RoleBadge role={userProfile.role} />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-4 py-2 border-b border-border/20">
                      <p className="text-sm font-semibold text-foreground">
                        {userProfile.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userProfile.email}
                      </p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/upload" className="cursor-pointer">
                        Upload Asset
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/groups" className="cursor-pointer">
                        <Users size={16} className="mr-2" />
                        Groups
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/messages"
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Mail size={16} className="mr-2" />
                          Messages
                        </div>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    {(userProfile.role === "founder" ||
                      userProfile.role === "admin") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin"
                            className="cursor-pointer text-amber-400"
                          >
                            <Shield size={16} className="mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-400 focus:bg-red-500/20"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
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
              to="/support"
              className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
            >
              Support
            </Link>
            <Link
              to="/about"
              className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
            >
              About
            </Link>

            {isAuthenticated && userProfile ? (
              <>
                <div className="px-4 py-3 border-t border-border/20 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={
                        userProfile.profileImage ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                          userProfile.username
                      }
                      alt={userProfile.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">
                          {userProfile.username}
                        </p>
                        <RoleBadge role={userProfile.role} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {userProfile.email}
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm"
                >
                  Upload Asset
                </Link>
                {(userProfile.role === "founder" ||
                  userProfile.role === "admin") && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 hover:bg-secondary/40 transition-colors font-medium text-sm text-amber-400"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 transition-colors font-medium text-sm mt-2 border-t border-border/20"
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
