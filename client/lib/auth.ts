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

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Date;
  memberRank: "starter" | "creator" | "pro" | "studio";
  assetsCreated: number;
  assetsDownloaded: number;
  earnings: number;
  profileImage?: string;
}

export async function registerUser(
  email: string,
  password: string,
  username: string,
  displayName: string,
): Promise<UserProfile> {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Update auth profile
    await updateProfile(user, {
      displayName: displayName,
    });

    // Create Firestore profile
    const userProfile: UserProfile = {
      uid: user.uid,
      username,
      email,
      displayName,
      createdAt: new Date(),
      memberRank: "starter",
      assetsCreated: 0,
      assetsDownloaded: 0,
      earnings: 0,
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
  } catch (error) {
    console.error("Login error:", error);
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
