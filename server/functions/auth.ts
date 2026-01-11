/**
 * Cloud Functions for secure authentication and user management
 * These functions enforce server-side authorization and validation
 *
 * Deploy with: firebase deploy --only functions:registerUser,functions:updateUserRole
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  validateUsername,
  validateEmail,
  validateDisplayName,
  validatePassword,
} from "../validation/inputValidation";
import { logAuditAction } from "./audit";

const db = admin.firestore();
const auth = admin.auth();

/**
 * Register a new user with validation
 * - Validate username, email, password, display name
 * - Check username uniqueness
 * - Create Firebase Auth user
 * - Create Firestore user document with safe defaults
 *
 * Call from: client during signup
 */
export const registerUser = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { email, password, username, displayName } = data;

    // ===== INPUT VALIDATION =====
    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        emailVal.errors.join("; "),
      );
    }

    const passwordVal = validatePassword(password);
    if (!passwordVal.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        passwordVal.errors.join("; "),
      );
    }

    const usernameVal = validateUsername(username);
    if (!usernameVal.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        usernameVal.errors.join("; "),
      );
    }

    const displayNameVal = validateDisplayName(displayName);
    if (!displayNameVal.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        displayNameVal.errors.join("; "),
      );
    }

    // ===== CHECK USERNAME UNIQUENESS =====
    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await db
      .collection("users")
      .where("usernameLower", "==", normalizedUsername)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Username already taken",
      );
    }

    // ===== CHECK EMAIL UNIQUENESS =====
    try {
      await auth.getUserByEmail(email);
      throw new functions.https.HttpsError(
        "already-exists",
        "Email already registered",
      );
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // ===== CREATE AUTH USER =====
    let authUser;
    try {
      authUser = await auth.createUser({
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      });
    } catch (error: any) {
      throw new functions.https.HttpsError(
        "internal",
        `Failed to create user: ${error.message}`,
      );
    }

    // ===== CREATE FIRESTORE USER DOCUMENT =====
    try {
      await db.collection("users").doc(authUser.uid).set({
        uid: authUser.uid,
        email: email.trim().toLowerCase(),
        username: username.trim(),
        usernameLower: normalizedUsername,
        displayName: displayName.trim(),
        profileImage:
          "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberRank: "starter", // Default, only changeable via admin
        role: "member", // Default, only changeable via admin
        assetsCreated: 0,
        assetsDownloaded: 0,
        earnings: 0,
        isBanned: false,
        emailVerified: false,
      });

      // ===== SEND VERIFICATION EMAIL =====
      await auth.generateEmailVerificationLink(email);

      // ===== LOG AUDIT ACTION =====
      await logAuditAction(
        authUser.uid,
        "USER_REGISTERED",
        authUser.uid,
        false,
        { email: email.trim().toLowerCase(), username },
      );

      return {
        success: true,
        userId: authUser.uid,
        message: "User created successfully. Please verify your email.",
      };
    } catch (error: any) {
      // Cleanup: delete auth user if Firestore write fails
      try {
        await auth.deleteUser(authUser.uid);
      } catch (deleteError) {
        console.error("Failed to cleanup auth user:", deleteError);
      }
      throw new functions.https.HttpsError(
        "internal",
        `Failed to complete registration: ${error.message}`,
      );
    }
  },
);

/**
 * Update user role (ADMIN ONLY)
 * Server-side enforcement of role changes
 *
 * Call from: admin panel only
 */
export const updateUserRole = functions.https.onCall(
  async (
    data: {
      userId: string;
      newRole: "member" | "partner" | "admin" | "founder" | "support";
    },
    context: functions.https.CallableContext,
  ) => {
    // ===== AUTHORIZATION =====
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    // Get caller's role
    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    const callerRole = callerDoc.data()?.role;

    // Only founder or admin can change roles
    if (!["admin", "founder"].includes(callerRole)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can change user roles",
      );
    }

    // Founder can only be changed by founder
    if (data.newRole === "founder" && callerRole !== "founder") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only founder can create other founders",
      );
    }

    // ===== VALIDATION =====
    const validRoles = ["member", "partner", "admin", "founder", "support"];
    if (!validRoles.includes(data.newRole)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid role");
    }

    // ===== UPDATE =====
    try {
      const userDoc = await db.collection("users").doc(data.userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const oldRole = userDoc.data()?.role;

      await db.collection("users").doc(data.userId).update({
        role: data.newRole,
      });

      // Set custom claims for Firebase Auth
      await auth.setCustomUserClaims(data.userId, { role: data.newRole });

      // ===== LOG AUDIT ACTION =====
      await logAuditAction(
        context.auth.uid,
        "ROLE_CHANGED",
        data.userId,
        true,
        {
          oldRole,
          newRole: data.newRole,
          changedBy: context.auth.uid,
        },
      );

      // ===== NOTIFY USER =====
      await db.collection("notifications").add({
        userId: data.userId,
        type: "role_change",
        title: "Role Updated",
        message: `Your account role has been changed to ${data.newRole}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: `User role updated to ${data.newRole}`,
      };
    } catch (error: any) {
      console.error("Error updating role:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to update role: ${error.message}`,
      );
    }
  },
);

/**
 * Update user member rank (ADMIN ONLY)
 * Used for tier progression: starter -> creator -> pro -> studio
 *
 * Call from: admin panel only
 */
export const updateMemberRank = functions.https.onCall(
  async (
    data: { userId: string; newRank: "starter" | "creator" | "pro" | "studio" },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    // Only admins can change ranks
    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!["admin", "founder"].includes(callerDoc.data()?.role)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can change member ranks",
      );
    }

    const validRanks = ["starter", "creator", "pro", "studio"];
    if (!validRanks.includes(data.newRank)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid rank");
    }

    try {
      const userDoc = await db.collection("users").doc(data.userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const oldRank = userDoc.data()?.memberRank;

      await db.collection("users").doc(data.userId).update({
        memberRank: data.newRank,
      });

      // Log and notify
      await logAuditAction(
        context.auth.uid,
        "RANK_CHANGED",
        data.userId,
        false,
        { oldRank, newRank: data.newRank },
      );

      await db.collection("notifications").add({
        userId: data.userId,
        type: "rank_change",
        title: "Member Rank Updated",
        message: `Congratulations! Your member rank is now ${data.newRank}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

/**
 * Ban user (ADMIN ONLY)
 * Prevents user from accessing the platform
 *
 * Call from: admin panel only
 */
export const banUser = functions.https.onCall(
  async (
    data: {
      userId: string;
      reason: string;
      durationDays?: number;
    },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!["admin", "founder", "support"].includes(callerDoc.data()?.role)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins/support can ban users",
      );
    }

    if (!data.reason || data.reason.length < 5) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Reason is required (min 5 chars)",
      );
    }

    try {
      const banUntil = data.durationDays
        ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000)
        : null;

      await db
        .collection("users")
        .doc(data.userId)
        .update({
          isBanned: true,
          banReason: data.reason,
          banDate: admin.firestore.FieldValue.serverTimestamp(),
          banUntilDate: banUntil || null,
        });

      // Disable Firebase Auth user
      await auth.updateUser(data.userId, { disabled: true });

      // Log audit
      await logAuditAction(context.auth.uid, "USER_BANNED", data.userId, true, {
        reason: data.reason,
        durationDays: data.durationDays || "permanent",
      });

      // Notify user
      await db.collection("notifications").add({
        userId: data.userId,
        type: "ban",
        title: "Account Suspended",
        message: `Your account has been suspended. Reason: ${data.reason}. Contact: support@marketplace.com`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "User banned successfully" };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);

/**
 * Unban user (ADMIN ONLY)
 */
export const unbanUser = functions.https.onCall(
  async (
    data: { userId: string },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated",
      );
    }

    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!["admin", "founder"].includes(callerDoc.data()?.role)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can unban users",
      );
    }

    try {
      await db.collection("users").doc(data.userId).update({
        isBanned: false,
        banReason: null,
        banDate: null,
        banUntilDate: null,
      });

      await auth.updateUser(data.userId, { disabled: false });

      await logAuditAction(
        context.auth.uid,
        "USER_UNBANNED",
        data.userId,
        true,
      );

      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  },
);
