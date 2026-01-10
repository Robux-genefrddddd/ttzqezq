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
  onSnapshot,
  Unsubscribe,
  orderBy,
} from "firebase/firestore";
import { Notification } from "@shared/api";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  data?: Record<string, any>,
): Promise<string> {
  try {
    const notificationData: any = {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
    };

    // Only add data if it's provided
    if (data) {
      notificationData.data = data;
    }

    const docRef = await addDoc(
      collection(db, NOTIFICATIONS_COLLECTION),
      notificationData,
    );

    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);

    let notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as Notification[];

    // Filter unread on client side to avoid needing composite index
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    const batch = querySnapshot.docs
      .filter((doc) => !doc.data().read) // Only update unread notifications
      .map((doc) => updateDoc(doc.ref, { read: true }));

    await Promise.all(batch);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

/**
 * Subscribe to user notifications (real-time)
 */
export function subscribeToUserNotifications(
  userId: string,
  onNotificationsUpdate: (notifications: Notification[]) => void,
): Unsubscribe {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }))
        .sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        ) as Notification[];

      onNotificationsUpdate(notifications);
    });
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    return () => {};
  }
}

/**
 * Subscribe to unread notification count
 */
export function subscribeToUnreadCount(
  userId: string,
  onCountUpdate: (count: number) => void,
): Unsubscribe {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
    );

    return onSnapshot(q, (snapshot) => {
      // Filter unread on client side to avoid composite index
      const unreadCount = snapshot.docs.filter(
        (doc) => !doc.data().read,
      ).length;
      onCountUpdate(unreadCount);
    });
  } catch (error) {
    console.error("Error subscribing to unread count:", error);
    return () => {};
  }
}

/**
 * Create system notification for role change
 */
export async function notifyRoleChange(
  userId: string,
  newRole: string,
): Promise<void> {
  try {
    await createNotification(
      userId,
      "role_change",
      "Role Updated",
      `Your role has been changed to ${newRole}`,
      { newRole },
    );
  } catch (error) {
    console.error("Error notifying role change:", error);
  }
}

/**
 * Create system notification for ban
 */
export async function notifyBan(userId: string, reason: string): Promise<void> {
  try {
    await createNotification(
      userId,
      "ban",
      "Account Banned",
      `Your account has been banned. Reason: ${reason}`,
      { reason },
    );
  } catch (error) {
    console.error("Error notifying ban:", error);
  }
}

/**
 * Create notification for group invite
 */
export async function notifyGroupInvite(
  userId: string,
  groupId: string,
  groupName: string,
  inviterName: string,
): Promise<void> {
  try {
    await createNotification(
      userId,
      "group_invite",
      `Invited to ${groupName}`,
      `${inviterName} invited you to join the group "${groupName}"`,
      { groupId, groupName, inviterName },
    );
  } catch (error) {
    console.error("Error notifying group invite:", error);
  }
}

/**
 * Create notification for group join
 */
export async function notifyGroupJoined(
  userId: string,
  groupId: string,
  groupName: string,
): Promise<void> {
  try {
    await createNotification(
      userId,
      "group_joined",
      "Group Joined",
      `You have successfully joined the group "${groupName}"`,
      { groupId, groupName },
    );
  } catch (error) {
    console.error("Error notifying group join:", error);
  }
}
