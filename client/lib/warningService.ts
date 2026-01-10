import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";

export interface Warning {
  id: string;
  userId: string;
  adminId: string;
  adminName: string;
  type: "warning" | "ban" | "suspension";
  reason: string;
  expiresAt?: Date;
  createdAt: Date;
  isActive: boolean;
  details?: string;
}

const WARNINGS_COLLECTION = "user_warnings";

// Get all warnings for a user
export async function getUserWarnings(userId: string): Promise<Warning[]> {
  try {
    const q = query(
      collection(db, WARNINGS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const warnings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || undefined,
    })) as Warning[];

    return warnings;
  } catch (error) {
    console.error("Error fetching user warnings:", error);
    return [];
  }
}

// Get active warnings for a user
export async function getUserActiveWarnings(userId: string): Promise<Warning[]> {
  try {
    const q = query(
      collection(db, WARNINGS_COLLECTION),
      where("userId", "==", userId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const warnings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || undefined,
    })) as Warning[];

    return warnings;
  } catch (error) {
    console.error("Error fetching active warnings:", error);
    return [];
  }
}

// Create a new warning
export async function createWarning(
  userId: string,
  adminId: string,
  adminName: string,
  type: "warning" | "ban" | "suspension",
  reason: string,
  details?: string,
  durationDays?: number,
): Promise<string> {
  try {
    const warningData: Omit<Warning, "id"> = {
      userId,
      adminId,
      adminName,
      type,
      reason,
      createdAt: new Date(),
      isActive: true,
      details,
    };

    // Add expiration for temporary warnings/suspensions
    if (durationDays && type !== "ban") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      warningData.expiresAt = expiresAt;
    }

    const docRef = await addDoc(collection(db, WARNINGS_COLLECTION), {
      ...warningData,
      createdAt: Timestamp.now(),
      expiresAt: warningData.expiresAt
        ? Timestamp.fromDate(warningData.expiresAt)
        : undefined,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating warning:", error);
    throw error;
  }
}

// Update warning status
export async function updateWarningStatus(
  warningId: string,
  isActive: boolean,
): Promise<void> {
  try {
    const docRef = doc(db, WARNINGS_COLLECTION, warningId);
    await updateDoc(docRef, {
      isActive,
    });
  } catch (error) {
    console.error("Error updating warning:", error);
    throw error;
  }
}

// Delete warning (only for founders)
export async function deleteWarning(warningId: string): Promise<void> {
  try {
    const docRef = doc(db, WARNINGS_COLLECTION, warningId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting warning:", error);
    throw error;
  }
}

// Subscribe to user warnings in real-time
export function subscribeToUserWarnings(
  userId: string,
  callback: (warnings: Warning[]) => void,
): () => void {
  const q = query(
    collection(db, WARNINGS_COLLECTION),
    where("userId", "==", userId),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const warnings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || undefined,
    })) as Warning[];

    callback(warnings);
  });

  return unsubscribe;
}

// Check if user is banned
export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, WARNINGS_COLLECTION),
      where("userId", "==", userId),
      where("type", "==", "ban"),
      where("isActive", "==", true),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length > 0;
  } catch (error) {
    console.error("Error checking ban status:", error);
    return false;
  }
}

// Check if user has active suspension
export async function isUserSuspended(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, WARNINGS_COLLECTION),
      where("userId", "==", userId),
      where("type", "==", "suspension"),
      where("isActive", "==", true),
    );
    const querySnapshot = await getDocs(q);

    const warnings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || undefined,
    })) as Warning[];

    // Check if any suspension is still active (not expired)
    const now = new Date();
    return warnings.some((w) => !w.expiresAt || w.expiresAt > now);
  } catch (error) {
    console.error("Error checking suspension status:", error);
    return false;
  }
}
