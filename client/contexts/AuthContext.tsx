import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthChange, DEFAULT_PROFILE_IMAGE } from "@/lib/auth";

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  profileImage?: string;
  createdAt: Date;
  memberRank?: "starter" | "creator" | "pro" | "studio";
  role?: "member" | "partner" | "admin" | "founder";
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Fetch user profile from Firestore
        try {
          // In a real implementation, fetch from Firestore
          setUserProfile({
            uid: authUser.uid,
            username: authUser.displayName?.split(" ")[0] || "Creator",
            email: authUser.email || "",
            displayName: authUser.displayName || "User",
            profileImage: authUser.photoURL || DEFAULT_PROFILE_IMAGE,
            createdAt: new Date(),
            memberRank: "starter",
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
