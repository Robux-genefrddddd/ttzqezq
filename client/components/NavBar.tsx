import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  Users,
  Mail,
  Shield,
  Search,
  Info as InfoIcon,
  FileUp,
  BarChart3,
  MessageSquare,
  Lock,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/auth";
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
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-1 hover:scale-110 transition-transform cursor-help">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F6efe5c975de742218614020f75c6e644%2Fb430cdb925bf47f09a9d7c95a02f3bd0?format=webp&width=800"
              alt="Founder"
              className="w-4 h-4"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Founder
        </TooltipContent>
      </Tooltip>
    );
  }

  if (role === "admin") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-1 hover:scale-110 transition-transform cursor-help">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F6efe5c975de742218614020f75c6e644%2Fb5f004c16bc84ddd977be6eea56f8f20?format=webp&width=800"
              alt="Admin"
              className="w-4 h-4"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Admin
        </TooltipContent>
      </Tooltip>
    );
  }

  if (role === "partner") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <img
            src="https://cdn3.emoji.gg/emojis/42747-roblox-verified.png"
            alt="Partner"
            className="w-4 h-4 hover:scale-110 transition-transform cursor-help"
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

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, userProfile, loading, unreadCount } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/20">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={toggleMenu}
              className="p-2 hover:bg-secondary/40 rounded-lg transition-all duration-200 flex-shrink-0 group"
            >
              {menuOpen ? (
                <X
                  size={20}
                  className="text-foreground group-hover:text-primary transition-colors"
                />
              ) : (
                <Menu
                  size={20}
                  className="text-foreground group-hover:text-primary transition-colors"
                />
              )}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
                alt="Roblox"
                className="h-5 object-contain"
              />
              <span className="font-bold text-xs tracking-tight text-foreground">
                RbxAssets
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated && userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1.5 bg-secondary/40 border border-border/40 rounded-lg hover:bg-secondary/60 transition-all cursor-pointer group text-xs">
                    <img
                      src={
                        userProfile.profileImage ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                          userProfile.username
                      }
                      alt={userProfile.username}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors hidden sm:inline">
                      {userProfile.username}
                    </span>
                    <RoleBadge role={userProfile.role} />
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
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="text-xs">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-[9998]"
                onClick={closeMenu}
              />
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border/30 overflow-y-auto z-[9999] shadow-lg"
              >
                <div className="flex flex-col h-full">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="px-6 py-6 border-b border-border/20 bg-background/50"
                  >
                    <h2 className="text-lg font-bold text-foreground">
                      Navigation
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Browse & manage
                    </p>
                  </motion.div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-6">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="mb-4"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                          Explore
                        </p>
                      </motion.div>
                      <div className="space-y-1">
                        <motion.div
                          custom={0}
                          initial="hidden"
                          animate="visible"
                          variants={menuItemVariants}
                        >
                          <Link
                            to="/marketplace"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group"
                            onClick={closeMenu}
                          >
                            <Search
                              size={18}
                              className="text-muted-foreground group-hover:text-primary"
                            />
                            <span className="text-sm font-medium">
                              Marketplace
                            </span>
                          </Link>
                        </motion.div>
                        <motion.div
                          custom={1}
                          initial="hidden"
                          animate="visible"
                          variants={menuItemVariants}
                        >
                          <Link
                            to="/support"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group"
                            onClick={closeMenu}
                          >
                            <Mail
                              size={18}
                              className="text-muted-foreground group-hover:text-primary"
                            />
                            <span className="text-sm font-medium">Support</span>
                          </Link>
                        </motion.div>
                        <motion.div
                          custom={2}
                          initial="hidden"
                          animate="visible"
                          variants={menuItemVariants}
                        >
                          <Link
                            to="/about"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group"
                            onClick={closeMenu}
                          >
                            <InfoIcon
                              size={18}
                              className="text-muted-foreground group-hover:text-primary"
                            />
                            <span className="text-sm font-medium">About</span>
                          </Link>
                        </motion.div>
                      </div>
                    </div>

                    {isAuthenticated && userProfile ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 }}
                          className="px-4 py-6 border-t border-border/20"
                        >
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                            Account
                          </p>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="bg-secondary/30 rounded-lg p-4 mb-4 border border-border/20"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  userProfile.profileImage ||
                                  "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                                    userProfile.username
                                }
                                alt={userProfile.username}
                                className="w-10 h-10 rounded-md object-cover border border-border/30"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {userProfile.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {userProfile.email}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                          <div className="space-y-1">
                            <motion.div
                              custom={3}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group"
                                onClick={closeMenu}
                              >
                                <BarChart3
                                  size={18}
                                  className="text-muted-foreground group-hover:text-primary"
                                />
                                <span className="text-sm font-medium">
                                  Dashboard
                                </span>
                              </Link>
                            </motion.div>
                            <motion.div
                              custom={4}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/upload"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors duration-150 text-primary group border border-primary/20"
                                onClick={closeMenu}
                              >
                                <FileUp size={18} className="text-primary" />
                                <span className="text-sm font-semibold">
                                  Upload Asset
                                </span>
                              </Link>
                            </motion.div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="px-4 py-6 border-t border-border/20"
                        >
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                            Tools
                          </p>
                          <div className="space-y-1">
                            <motion.div
                              custom={5}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/groups"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group"
                                onClick={closeMenu}
                              >
                                <Users
                                  size={18}
                                  className="text-muted-foreground group-hover:text-primary"
                                />
                                <span className="text-sm font-medium">
                                  Groups
                                </span>
                              </Link>
                            </motion.div>
                            <motion.div
                              custom={6}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/messages"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group relative"
                                onClick={closeMenu}
                              >
                                <MessageSquare
                                  size={18}
                                  className="text-muted-foreground group-hover:text-primary"
                                />
                                <span className="text-sm font-medium flex-1">
                                  Messages
                                </span>
                                {unreadCount > 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-center"
                                  >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </motion.span>
                                )}
                              </Link>
                            </motion.div>
                          </div>
                        </motion.div>

                        {(userProfile.role === "founder" ||
                          userProfile.role === "admin") && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="px-4 py-6 border-t border-border/20"
                          >
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                              Admin
                            </p>
                            <motion.div
                              custom={7}
                              initial="hidden"
                              animate="visible"
                              variants={menuItemVariants}
                            >
                              <Link
                                to="/admin"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors duration-150 text-accent border border-accent/20 group"
                                onClick={closeMenu}
                              >
                                <Shield size={18} className="text-accent" />
                                <span className="text-sm font-semibold">
                                  Admin Panel
                                </span>
                              </Link>
                            </motion.div>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="px-4 py-6 border-t border-border/20"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                          Account
                        </p>
                        <div className="space-y-1">
                          <motion.div
                            custom={3}
                            initial="hidden"
                            animate="visible"
                            variants={menuItemVariants}
                          >
                            <Link
                              to="/login"
                              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors duration-150 text-foreground hover:text-primary group"
                              onClick={closeMenu}
                            >
                              <Lock
                                size={18}
                                className="text-muted-foreground group-hover:text-primary"
                              />
                              <span className="text-sm font-medium">
                                Sign In
                              </span>
                            </Link>
                          </motion.div>
                          <motion.div
                            custom={4}
                            initial="hidden"
                            animate="visible"
                            variants={menuItemVariants}
                          >
                            <Link
                              to="/register"
                              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors duration-150 text-primary group border border-primary/20"
                              onClick={closeMenu}
                            >
                              <Plus size={18} className="text-primary" />
                              <span className="text-sm font-semibold">
                                Create Account
                              </span>
                            </Link>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {isAuthenticated && userProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="border-t border-border/20 px-4 py-4"
                    >
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMenu();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-destructive/20 transition-colors duration-150 text-destructive group"
                      >
                        <LogOut size={18} className="text-destructive" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="border-t border-border/20 px-4 py-4 flex justify-center"
                  >
                    <a
                      href="https://roblox.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
                        alt="Roblox"
                        className="h-4 object-contain"
                      />
                    </a>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
