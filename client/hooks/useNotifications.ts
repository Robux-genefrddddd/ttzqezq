import { useEffect, useState } from "react";
import { Notification } from "@shared/api";
import * as notificationService from "@/lib/notificationService";

/**
 * Hook to get user notifications with real-time updates
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = notificationService.subscribeToUserNotifications(
      userId,
      (notifications) => {
        setNotifications(notifications);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  return { notifications, loading, error };
}

/**
 * Hook to get unread notification count with real-time updates
 */
export function useUnreadNotificationCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = notificationService.subscribeToUnreadCount(
      userId,
      (count) => {
        setCount(count);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  return { count, loading };
}

/**
 * Hook to mark notifications as read
 */
export function useMarkNotificationAsRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error marking as read";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { markAsRead, loading, error };
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting notification";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteNotification, loading, error };
}
