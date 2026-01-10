import { useEffect, useState } from "react";
import { Group, GroupInvite, Message } from "@shared/api";
import * as groupService from "@/lib/groupService";

/**
 * Hook to get user's groups with real-time updates
 */
export function useUserGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = groupService.subscribeToUserGroups(userId, (groups) => {
      setGroups(groups);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { groups, loading, error };
}

/**
 * Hook to get a single group with real-time updates
 */
export function useGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = groupService.subscribeToGroup(groupId, (group) => {
      setGroup(group);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  return { group, loading, error };
}

/**
 * Hook to get group messages with real-time updates
 */
export function useGroupMessages(groupId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = groupService.subscribeToGroupMessages(
      groupId,
      (messages) => {
        setMessages(messages);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [groupId]);

  return { messages, loading, error };
}

/**
 * Hook to get user's group invites
 */
export function useGroupInvites(userId: string | undefined) {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setInvites([]);
      setLoading(false);
      return;
    }

    const fetchInvites = async () => {
      try {
        setLoading(true);
        const data = await groupService.getUserGroupInvites(userId);
        setInvites(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching invites");
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, [userId]);

  return { invites, loading, error };
}

/**
 * Hook to send a group message
 */
export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    groupId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string | undefined,
    content: string,
    imageUrl?: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const messageId = await groupService.sendGroupMessage(
        groupId,
        senderId,
        senderName,
        senderAvatar,
        content,
        imageUrl,
      );
      return messageId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error sending message";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}

/**
 * Hook to create a group
 */
export function useCreateGroup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (
    creatorId: string,
    creatorName: string,
    creatorAvatar: string | undefined,
    name: string,
    description: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const groupId = await groupService.createGroup(
        creatorId,
        creatorName,
        creatorAvatar,
        { name, description } as any,
      );
      return groupId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error creating group";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createGroup, loading, error };
}

/**
 * Hook to accept a group invite
 */
export function useAcceptGroupInvite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = async (
    inviteId: string,
    groupId: string,
    userId: string,
    username: string,
    avatar: string | undefined,
  ) => {
    try {
      setLoading(true);
      setError(null);
      await groupService.acceptGroupInvite(
        inviteId,
        groupId,
        userId,
        username,
        avatar,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error accepting invite";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { acceptInvite, loading, error };
}

/**
 * Hook to send a group invite
 */
export function useSendGroupInvite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async (
    groupId: string,
    groupName: string,
    inviterId: string,
    inviterName: string,
    inviterAvatar: string | undefined,
    inviteeId: string,
    message?: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const inviteId = await groupService.sendGroupInvite(
        groupId,
        groupName,
        inviterId,
        inviterName,
        inviterAvatar,
        inviteeId,
        message,
      );
      return inviteId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error sending invite";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendInvite, loading, error };
}
