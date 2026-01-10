import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Default profile image URL for all users
export const DEFAULT_PROFILE_IMAGE =
  "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter";

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Date;
  memberRank: "starter" | "creator" | "pro" | "studio";
  role: "member" | "partner" | "admin" | "founder" | "support";
  assetsCreated: number;
  assetsDownloaded: number;
  earnings: number;
  profileImage?: string;
  isBanned: boolean;
  banReason?: string;
  banDate?: Date;
}

export async function registerUser(
  email: string,
  password: string,
  username: string,
  displayName: string,
  role: "member" | "partner" | "admin" | "founder" | "support" = "member",
): Promise<UserProfile> {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Update auth profile with default image
    await updateProfile(user, {
      displayName: displayName,
      photoURL: DEFAULT_PROFILE_IMAGE,
    });

    // Create Firestore profile with default image
    const userProfile: UserProfile = {
      uid: user.uid,
      username,
      email,
      displayName,
      profileImage: DEFAULT_PROFILE_IMAGE,
      createdAt: new Date(),
      memberRank: "starter",
      role,
      assetsCreated: 0,
      assetsDownloaded: 0,
      earnings: 0,
      isBanned: false,
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return userProfile;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error: any) {
    console.error("Login error:", error);

    // Provide better error messages
    if (error.code === "auth/invalid-credential") {
      throw new Error("Invalid email or password. Please check your credentials and try again.");
    } else if (error.code === "auth/user-not-found") {
      throw new Error("No account found with this email. Please create an account first.");
    } else if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    } else if (error.code === "auth/too-many-requests") {
      throw new Error("Too many failed login attempts. Please try again later.");
    }

    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return {
        ...(docSnap.data() as UserProfile),
        createdAt: docSnap.data().createdAt.toDate?.() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), updates);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getMemberRankColor(rank: string): string {
  switch (rank) {
    case "starter":
      return "text-gray-400";
    case "creator":
      return "text-blue-400";
    case "pro":
      return "text-purple-400";
    case "studio":
      return "text-yellow-400";
    default:
      return "text-gray-400";
  }
}

export function getMemberRankLabel(rank: string): string {
  switch (rank) {
    case "starter":
      return "Starter";
    case "creator":
      return "Creator";
    case "pro":
      return "Pro";
    case "studio":
      return "Studio";
    default:
      return "Starter";
  }
}
