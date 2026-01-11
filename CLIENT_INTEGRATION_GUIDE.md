# Client Integration Guide - Secure Cloud Functions

This guide shows how to update client components to use the new secure Cloud Functions for authentication and operations.

## Overview

The client-side auth logic is simplified:

1. Client collects user input
2. Client does minimal validation for UX (optional)
3. Client calls Cloud Function (not direct Firestore writes)
4. Cloud Function validates, checks authorization, executes operation
5. Cloud Function returns result or error

**Key Rule: Never trust the client. All authorization happens on the server.**

---

## User Registration

### OLD WAY (UNSAFE)

```typescript
// ❌ DON'T DO THIS
export async function registerUser(email, password, username, displayName) {
  // Client directly creates auth user - NO VALIDATION
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  // Client directly writes to Firestore - NO AUTHORIZATION CHECK
  // Could set any role they want!
  await setDoc(doc(db, "users", user.uid), {
    username,
    role: "admin", // ⚠️ CAN BE SET BY CLIENT!
    memberRank: "studio", // ⚠️ CAN BE SET BY CLIENT!
    earnings: 99999, // ⚠️ CAN BE MANIPULATED!
  });
}
```

### NEW WAY (SECURE)

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  validateUsername,
  validateEmail,
  validatePassword,
} from "@shared/validation";

const functions = getFunctions();

// ✅ DO THIS INSTEAD
export async function registerUser(
  email: string,
  password: string,
  username: string,
  displayName: string,
) {
  try {
    // 1. CLIENT-SIDE VALIDATION (for UX only, not security)
    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      throw new Error(emailVal.errors[0]);
    }

    const usernameVal = validateUsername(username);
    if (!usernameVal.valid) {
      throw new Error(usernameVal.errors[0]);
    }

    const passwordVal = validatePassword(password);
    if (!passwordVal.valid) {
      throw new Error(passwordVal.errors[0]);
    }

    // 2. CALL CLOUD FUNCTION (server-side validation + execution)
    const registerUserFn = httpsCallable(functions, "registerUser");

    const result = await registerUserFn({
      email,
      password,
      username,
      displayName,
      // NOTE: Don't send role or memberRank - server sets defaults only
    });

    return result.data;
  } catch (error: any) {
    throw new Error(error.message || "Registration failed");
  }
}
```

---

## User Login

```typescript
export async function loginUser(email: string, password: string) {
  try {
    // Email validation for UX
    if (!email.includes("@")) {
      throw new Error("Invalid email format");
    }

    // Create auth user with Firebase (no validation issues here)
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

    return userCredential.user;
  } catch (error: any) {
    if (error.code === "auth/invalid-credential") {
      throw new Error("Invalid email or password");
    }
    throw error;
  }
}
```

---

## Profile Updates

### OLD WAY (UNSAFE)

```typescript
// ❌ WRONG - Client modifies sensitive fields
export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, "users", uid), {
    ...updates,
    role: "admin", // CLIENT CAN SET THIS!
    earnings: 50000, // CLIENT CAN INCREASE!
  });
}
```

### NEW WAY (SECURE)

```typescript
// ✅ CORRECT - Only update safe fields
export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    bio?: string;
    profileImage?: string;
    // Don't include: role, earnings, memberRank, isBanned, etc.
  },
) {
  try {
    // Validate input before sending to server
    if (updates.displayName && updates.displayName.length < 2) {
      throw new Error("Display name too short");
    }

    // Call Cloud Function for sensitive operations
    // For simple updates, Firestore Rules will enforce field-level protection
    // updateDoc will fail silently for forbidden fields due to Firestore Rules

    await updateDoc(doc(db, "users", uid), updates);
  } catch (error: any) {
    throw new Error("Failed to update profile");
  }
}
```

---

## Admin Operations (Admin Panel)

All admin operations should go through Cloud Functions with server-side authorization checks.

### Change User Role (Admin Only)

```typescript
export async function changeUserRole(
  userId: string,
  newRole: "member" | "partner" | "admin" | "support",
) {
  try {
    const functions = getFunctions();
    const updateUserRoleFn = httpsCallable(functions, "updateUserRole");

    const result = await updateUserRoleFn({
      userId,
      newRole,
    });

    return result.data;
  } catch (error: any) {
    // Server-side authorization check failed
    if (error.code === "permission-denied") {
      throw new Error("Only admins can change roles");
    }
    throw new Error(error.message || "Failed to change role");
  }
}
```

### Ban User (Admin Only)

```typescript
export async function banUserAccount(
  userId: string,
  reason: string,
  durationDays?: number,
) {
  try {
    const functions = getFunctions();
    const banUserFn = httpsCallable(functions, "banUser");

    const result = await banUserFn({
      userId,
      reason,
      durationDays, // Optional: for temporary bans
    });

    return result.data;
  } catch (error: any) {
    throw new Error(error.message || "Failed to ban user");
  }
}
```

---

## Asset Operations

### Create Asset (Upload)

```typescript
import {
  validateAssetName,
  validateAssetDescription,
  validateCategory,
} from "@shared/validation";

export async function createAsset(assetData: {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  tags: string[];
}) {
  try {
    // CLIENT-SIDE VALIDATION (for UX)
    const nameVal = validateAssetName(assetData.name);
    if (!nameVal.valid) {
      throw new Error(nameVal.errors[0]);
    }

    const descVal = validateAssetDescription(assetData.description);
    if (!descVal.valid) {
      throw new Error(descVal.errors[0]);
    }

    const catVal = validateCategory(assetData.category);
    if (!catVal.valid) {
      throw new Error(catVal.errors[0]);
    }

    // CREATE IN FIRESTORE with status='uploading'
    // The onAssetUploaded Cloud Function will scan for NSFW
    const assetId = await addDoc(collection(db, "assets"), {
      ...assetData,
      authorId: auth.currentUser!.uid, // USER CAN'T MODIFY
      authorName: auth.currentUser!.displayName || "Unknown",
      status: "uploading", // SERVER WILL PROCESS
      downloads: 0, // SERVER ONLY
      rating: 0, // SERVER ONLY
      reviews: 0, // SERVER ONLY
      featured: false, // SERVER ONLY
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return assetId;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create asset");
  }
}
```

### Download Asset

```typescript
export async function downloadAsset(assetId: string, fileName: string) {
  try {
    // Call Cloud Function to track download
    const functions = getFunctions();
    const recordDownloadFn = httpsCallable(functions, "recordAssetDownload");

    await recordDownloadFn({ assetId });

    // Then download the file via secure endpoint
    const response = await fetch(
      `/api/download?filePath=assets/${assetId}/${fileName}`,
    );

    if (!response.ok) {
      throw new Error("Download failed");
    }

    return response.blob();
  } catch (error: any) {
    throw new Error(error.message || "Failed to download asset");
  }
}
```

---

## Error Handling

When Cloud Functions reject operations, provide clear feedback to users:

```typescript
function getErrorMessage(error: any): string {
  if (error.code === "unauthenticated") {
    return "Please log in to perform this action";
  }

  if (error.code === "permission-denied") {
    return "You don't have permission to do that";
  }

  if (error.code === "invalid-argument") {
    // Server validation failed - show the specific error
    return error.message || "Invalid input provided";
  }

  if (error.code === "already-exists") {
    return error.message || "This item already exists";
  }

  if (error.code === "internal") {
    return "An error occurred. Please try again.";
  }

  return error.message || "An unknown error occurred";
}

// Usage in components
try {
  await registerUser(email, password, username, displayName);
} catch (error) {
  const message = getErrorMessage(error);
  showError(message);
}
```

---

## Validation Shared Between Client & Server

Create shared validation functions:

```typescript
// shared/validation.ts (used by both client and server)
export function validateUsername(username: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters");
  }
  // ... more validation

  return { valid: errors.length === 0, errors };
}

// Client usage:
import { validateUsername } from "@shared/validation";

const validation = validateUsername(inputValue);
if (!validation.valid) {
  showErrors(validation.errors);
}

// Server usage (Cloud Function):
import { validateUsername } from "@shared/validation";

const validation = validateUsername(data.username);
if (!validation.valid) {
  throw new functions.https.HttpsError(
    "invalid-argument",
    validation.errors.join("; "),
  );
}
```

---

## Upload with Progress Tracking

```typescript
import { ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadAssetImage(
  assetId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    // VALIDATE FILE (client-side, for UX)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File must be smaller than 5MB");
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error("Only PNG, JPEG, and WebP are allowed");
    }

    // UPLOAD TO TEMP FOLDER (while processing)
    const userId = auth.currentUser!.uid;
    const tempRef = ref(storage, `temp/${userId}/${Date.now()}-${file.name}`);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(tempRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          // Upload complete
          // Now create asset with status='uploading'
          // Cloud Function will process and scan for NSFW
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          const assetId = await createAsset({
            name: file.name,
            imageUrl: url,
            description: "",
            category: "Images",
            price: 0,
            tags: [],
          });

          resolve(assetId);
        },
      );
    });
  } catch (error: any) {
    throw new Error(error.message || "Upload failed");
  }
}
```

---

## Real-Time Subscriptions

Keep subscriptions safe by using Firestore Rules:

```typescript
// Users can only subscribe to data they can read
// Firestore Rules will prevent unauthorized reads

export function subscribeToMyAssets(
  userId: string,
  onUpdate: (assets: Asset[]) => void,
) {
  // Firestore Rules ensure user can only see their own assets
  // Query will return empty if user tries to access other user's assets
  const q = query(collection(db, "assets"), where("authorId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const assets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];

    onUpdate(assets);
  });
}

export function subscribeToMyProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void,
) {
  // Firestore Rules ensure user can only read their own profile
  return onSnapshot(doc(db, "users", userId), (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data() as UserProfile);
    }
  });
}
```

---

## Summary: Client Security Rules

1. ✅ **Call Cloud Functions for:**
   - User registration (validation + auth creation)
   - Role/rank changes
   - Bans/unbans
   - Manual NSFW scans
   - Download tracking

2. ✅ **Use Firestore for:**
   - Read operations (Firestore Rules protect access)
   - Create own documents (with safe defaults)
   - Update safe fields only

3. ✅ **Always:**
   - Validate input on client (for UX)
   - Never send sensitive data in queries
   - Catch and handle Cloud Function errors
   - Let Firestore Rules enforce authorization

4. ❌ **Never:**
   - Set role, earnings, memberRank on client
   - Bypass Cloud Functions for admin operations
   - Trust user ID from anywhere except auth.currentUser
   - Modify `isBanned`, `assetsCreated`, download counts directly

---

## Testing Cloud Functions Locally

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulator
firebase emulators:start

# In another terminal, run tests
npm test
```

## Deploying Cloud Functions

```bash
# Deploy specific function
firebase deploy --only functions:registerUser

# Deploy all functions
firebase deploy --only functions

# View function logs
firebase functions:log
```
