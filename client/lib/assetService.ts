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
  getDoc,
  Timestamp,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

export interface Asset {
  id: string;
  name: string;
  description: string;
  category:
    | "3D Models"
    | "UI Design"
    | "Scripts"
    | "Animations"
    | "Plugins"
    | "Sounds"
    | "Images"
    | "Other";
  price: number;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  downloads: number;
  rating: number;
  reviews: number;
  status:
    | "draft"
    | "uploading"
    | "verification"
    | "published"
    | "archived"
    | "rejected";
  tags: string[];
  filePaths?: string[]; // Firebase Storage paths for asset files
  createdAt: Date;
  updatedAt: Date;
  featured?: boolean;
}

const ASSETS_COLLECTION = "assets";

// Get all published assets (for marketplace)
export async function getPublishedAssets(
  categoryFilter?: string,
  limitCount: number = 50,
) {
  try {
    const constraints = [where("status", "==", "published")];

    if (categoryFilter) {
      constraints.push(where("category", "==", categoryFilter));
    }

    const q = query(collection(db, ASSETS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);

    const assets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Asset[];

    // Sort by updatedAt descending and limit results on the client side
    return assets
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching published assets:", error);
    return [];
  }
}

// Get user's assets (for dashboard)
export async function getUserAssets(userId: string) {
  try {
    const q = query(
      collection(db, ASSETS_COLLECTION),
      where("authorId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    const assets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Asset[];

    // Sort by updatedAt descending on the client side
    return assets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error("Error fetching user assets:", error);
    return [];
  }
}

// Get single asset
export async function getAsset(assetId: string) {
  try {
    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
      } as Asset;
    }
    return null;
  } catch (error) {
    console.error("Error fetching asset:", error);
    return null;
  }
}

// Create new asset
export async function createAsset(
  authorId: string,
  authorName: string,
  assetData: Omit<
    Asset,
    "id" | "createdAt" | "updatedAt" | "downloads" | "reviews"
  >,
) {
  try {
    const docRef = await addDoc(collection(db, ASSETS_COLLECTION), {
      ...assetData,
      authorId,
      authorName,
      downloads: 0,
      reviews: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating asset:", error);
    throw error;
  }
}

// Update asset
export async function updateAsset(
  assetId: string,
  updates: Partial<Omit<Asset, "id" | "createdAt">>,
) {
  try {
    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating asset:", error);
    throw error;
  }
}

// Delete asset (check ownership)
export async function deleteAsset(assetId: string, userId: string) {
  try {
    const asset = await getAsset(assetId);

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.authorId !== userId) {
      throw new Error("You can only delete your own assets");
    }

    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting asset:", error);
    throw error;
  }
}

// Increment download count
export async function incrementAssetDownloads(assetId: string) {
  try {
    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    const asset = await getAsset(assetId);
    if (asset) {
      await updateDoc(docRef, {
        downloads: asset.downloads + 1,
      });
    }
  } catch (error) {
    console.error("Error incrementing downloads:", error);
  }
}

// Get featured assets
export async function getFeaturedAssets(limitCount: number = 6) {
  try {
    const q = query(
      collection(db, ASSETS_COLLECTION),
      where("status", "==", "published"),
    );
    const querySnapshot = await getDocs(q);

    const assets = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }))
      .filter((a) => a.featured === true) // Filter on client side
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limitCount) as Asset[];

    return assets;
  } catch (error) {
    console.error("Error fetching featured assets:", error);
    return [];
  }
}

// Get site statistics
export interface SiteStats {
  totalAssets: number;
  totalCreators: number;
  totalDistributed: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  try {
    const q = query(
      collection(db, ASSETS_COLLECTION),
      where("status", "==", "published"),
    );
    const querySnapshot = await getDocs(q);

    const assets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Asset[];

    // Calculate stats
    const totalAssets = assets.length;
    const uniqueCreators = new Set(assets.map((asset) => asset.authorId));
    const totalCreators = uniqueCreators.size;

    // Calculate total distributed (sum of price * downloads)
    const totalDistributed = assets.reduce((sum, asset) => {
      const assetEarnings = (asset.price || 0) * asset.downloads;
      return sum + assetEarnings;
    }, 0);

    return {
      totalAssets,
      totalCreators,
      totalDistributed,
    };
  } catch (error) {
    console.error("Error fetching site stats:", error);
    return {
      totalAssets: 0,
      totalCreators: 0,
      totalDistributed: 0,
    };
  }
}

// Favorites/Saved Assets
const FAVORITES_COLLECTION = "favorites";

export interface Favorite {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  assetImage: string;
  authorId: string;
  authorName: string;
  savedAt: Date;
}

// Add asset to favorites
export async function addToFavorites(
  userId: string,
  assetId: string,
  assetName: string,
  assetImage: string,
  authorId: string,
  authorName: string,
): Promise<string> {
  try {
    // Check if already favorited
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      where("assetId", "==", assetId),
    );
    const existing = await getDocs(q);

    if (existing.size > 0) {
      throw new Error("Asset already in favorites");
    }

    const docRef = await addDoc(collection(db, FAVORITES_COLLECTION), {
      userId,
      assetId,
      assetName,
      assetImage,
      authorId,
      authorName,
      savedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
}

// Remove from favorites
export async function removeFromFavorites(
  userId: string,
  assetId: string,
): Promise<void> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      where("assetId", "==", assetId),
    );
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref);
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
}

// Get user's favorite assets
export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      orderBy("savedAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const favorites = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      savedAt: doc.data().savedAt?.toDate?.() || new Date(),
    })) as Favorite[];

    return favorites;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

// Check if asset is favorited
export async function isFavorited(
  userId: string,
  assetId: string,
): Promise<boolean> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      where("assetId", "==", assetId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
}

// Subscribe to user's favorites (real-time)
export function subscribeToUserFavorites(
  userId: string,
  onFavoritesUpdate: (favorites: Favorite[]) => void,
): Unsubscribe {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      orderBy("savedAt", "desc"),
    );

    return onSnapshot(q, (snapshot) => {
      const favorites = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        savedAt: doc.data().savedAt?.toDate?.() || new Date(),
      })) as Favorite[];

      onFavoritesUpdate(favorites);
    });
  } catch (error) {
    console.error("Error subscribing to favorites:", error);
    return () => {};
  }
}
