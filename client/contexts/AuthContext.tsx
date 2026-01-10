import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
  onAuthChange,
  DEFAULT_PROFILE_IMAGE,
  getUserProfile,
} from "@/lib/auth";
import * as notificationService from "@/lib/notificationService";
import { Notification } from "@shared/api";

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  profileImage?: string;
  createdAt: Date;
  memberRank?: "starter" | "creator" | "pro" | "studio";
  role: "member" | "partner" | "admin" | "founder" | "support";
  isBanned?: boolean;
  banReason?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  notifications: Notification[];
  unreadCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Fetch user profile from Firestore
        try {
          const profile = await getUserProfile(authUser.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            // Fallback if profile doesn't exist yet
            setUserProfile({
              uid: authUser.uid,
              username: authUser.displayName?.split(" ")[0] || "Creator",
              email: authUser.email || "",
              displayName: authUser.displayName || "User",
              profileImage: authUser.photoURL || DEFAULT_PROFILE_IMAGE,
              createdAt: new Date(),
              memberRank: "starter",
              role: "member",
            });
          }

          // Subscribe to real-time notifications
          const notificationsUnsub =
            notificationService.subscribeToUserNotifications(
              authUser.uid,
              (notifs) => {
                setNotifications(notifs);
              },
            );

          const unreadUnsub = notificationService.subscribeToUnreadCount(
            authUser.uid,
            (count) => {
              setUnreadCount(count);
            },
          );

          return () => {
            notificationsUnsub();
            unreadUnsub();
          };
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
        setNotifications([]);
        setUnreadCount(0);
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
    notifications,
    unreadCount,
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
