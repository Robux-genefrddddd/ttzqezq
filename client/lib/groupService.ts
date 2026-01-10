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
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from "firebase/firestore";
import { Group, GroupMember, GroupInvite, Message } from "@shared/api";

const GROUPS_COLLECTION = "groups";
const GROUP_MEMBERS_COLLECTION = "groupMembers";
const GROUP_MESSAGES_COLLECTION = "groupMessages";
const GROUP_INVITES_COLLECTION = "groupInvites";

/**
 * Create a new group (Partner feature)
 */
export async function createGroup(
  creatorId: string,
  creatorName: string,
  creatorAvatar: string | undefined,
  groupData: Omit<
    Group,
    "id" | "createdAt" | "updatedAt" | "members" | "memberCount" | "isActive"
  >,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
      ...groupData,
      creatorId,
      creatorName,
      creatorAvatar,
      members: [
        {
          userId: creatorId,
          username: creatorName,
          avatar: creatorAvatar,
          role: "admin",
          joinedAt: Timestamp.now(),
          isActive: true,
        },
      ],
      memberCount: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
}

/**
 * Get group by ID
 */
export async function getGroup(groupId: string): Promise<Group | null> {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        members:
          docSnap.data().members?.map((m: any) => ({
            ...m,
            joinedAt: m.joinedAt?.toDate?.() || new Date(),
          })) || [],
      } as Group;
    }
    return null;
  } catch (error) {
    console.error("Error fetching group:", error);
    return null;
  }
}

/**
 * Get user's groups (groups where user is a member)
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    const q = query(
      collection(db, GROUPS_COLLECTION),
      where("members", "array-contains", {
        userId,
        isActive: true,
      }),
    );
    const querySnapshot = await getDocs(q);

    const groups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      members:
        doc.data().members?.map((m: any) => ({
          ...m,
          joinedAt: m.joinedAt?.toDate?.() || new Date(),
        })) || [],
    })) as Group[];

    return groups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return [];
  }
}

/**
 * Get groups created by a user
 */
export async function getUserCreatedGroups(userId: string): Promise<Group[]> {
  try {
    const q = query(
      collection(db, GROUPS_COLLECTION),
      where("creatorId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    const groups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      members:
        doc.data().members?.map((m: any) => ({
          ...m,
          joinedAt: m.joinedAt?.toDate?.() || new Date(),
        })) || [],
    })) as Group[];

    return groups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error("Error fetching user created groups:", error);
    return [];
  }
}

/**
 * Update group
 */
export async function updateGroup(
  groupId: string,
  updates: Partial<Omit<Group, "id" | "createdAt" | "members">>,
): Promise<void> {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating group:", error);
    throw error;
  }
}

/**
 * Delete group (only creator)
 */
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
}

/**
 * Add member to group (by invite)
 */
export async function addMemberToGroup(
  groupId: string,
  member: GroupMember,
): Promise<void> {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const group = await getGroup(groupId);

    if (group) {
      const updatedMembers = [...group.members, member];
      await updateDoc(docRef, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error adding member to group:", error);
    throw error;
  }
}

/**
 * Remove member from group
 */
export async function removeMemberFromGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const group = await getGroup(groupId);

    if (group) {
      const updatedMembers = group.members.filter((m) => m.userId !== userId);
      await updateDoc(docRef, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error removing member from group:", error);
    throw error;
  }
}

/**
 * Send group message
 */
export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  content: string,
  imageUrl?: string,
): Promise<string> {
  try {
    const messagesRef = collection(db, GROUPS_COLLECTION, groupId, "messages");
    const docRef = await addDoc(messagesRef, {
      groupId,
      senderId,
      senderName,
      senderAvatar,
      content,
      imageUrl,
      timestamp: Timestamp.now(),
      isEdited: false,
    });

    // Update group's updatedAt
    await updateGroup(groupId, { updatedAt: new Date() });

    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get messages for a group (with real-time listener)
 */
export function subscribeToGroupMessages(
  groupId: string,
  onMessagesUpdate: (messages: Message[]) => void,
): Unsubscribe {
  try {
    const messagesRef = collection(db, GROUPS_COLLECTION, groupId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        editedAt: doc.data().editedAt?.toDate?.() || undefined,
      })) as Message[];

      onMessagesUpdate(messages);
    });
  } catch (error) {
    console.error("Error subscribing to messages:", error);
    return () => {};
  }
}

/**
 * Delete message
 */
export async function deleteMessage(
  groupId: string,
  messageId: string,
): Promise<void> {
  try {
    const messageRef = doc(
      db,
      GROUPS_COLLECTION,
      groupId,
      "messages",
      messageId,
    );
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

/**
 * Edit message
 */
export async function editMessage(
  groupId: string,
  messageId: string,
  newContent: string,
): Promise<void> {
  try {
    const messageRef = doc(
      db,
      GROUPS_COLLECTION,
      groupId,
      "messages",
      messageId,
    );
    await updateDoc(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
}

/**
 * Send group invite
 */
export async function sendGroupInvite(
  groupId: string,
  groupName: string,
  inviterId: string,
  inviterName: string,
  inviterAvatar: string | undefined,
  inviteeId: string,
  message?: string,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, GROUP_INVITES_COLLECTION), {
      groupId,
      groupName,
      inviterId,
      inviterName,
      inviterAvatar,
      inviteeId,
      invitationDate: Timestamp.now(),
      status: "pending",
      message,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error sending group invite:", error);
    throw error;
  }
}

/**
 * Get pending invites for user
 */
export async function getUserGroupInvites(
  userId: string,
): Promise<GroupInvite[]> {
  try {
    const q = query(
      collection(db, GROUP_INVITES_COLLECTION),
      where("inviteeId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    const invites = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        invitationDate: doc.data().invitationDate?.toDate?.() || new Date(),
      }))
      .filter((invite) => invite.status === "pending") // Filter on client side
      .sort(
        (a, b) => b.invitationDate.getTime() - a.invitationDate.getTime(),
      ) as GroupInvite[];

    return invites;
  } catch (error) {
    console.error("Error fetching user group invites:", error);
    return [];
  }
}

/**
 * Accept group invite
 */
export async function acceptGroupInvite(
  inviteId: string,
  groupId: string,
  userId: string,
  username: string,
  avatar: string | undefined,
): Promise<void> {
  try {
    // Update invite status
    const inviteRef = doc(db, GROUP_INVITES_COLLECTION, inviteId);
    await updateDoc(inviteRef, { status: "accepted" });

    // Add user to group
    const newMember: GroupMember = {
      userId,
      username,
      avatar,
      role: "member",
      joinedAt: new Date(),
      isActive: true,
    };

    await addMemberToGroup(groupId, newMember);
  } catch (error) {
    console.error("Error accepting group invite:", error);
    throw error;
  }
}

/**
 * Decline group invite
 */
export async function declineGroupInvite(inviteId: string): Promise<void> {
  try {
    const inviteRef = doc(db, GROUP_INVITES_COLLECTION, inviteId);
    await updateDoc(inviteRef, { status: "declined" });
  } catch (error) {
    console.error("Error declining group invite:", error);
    throw error;
  }
}

/**
 * Subscribe to group updates (real-time)
 */
export function subscribeToGroup(
  groupId: string,
  onGroupUpdate: (group: Group | null) => void,
): Unsubscribe {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);

    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const group = {
          id: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate?.() || new Date(),
          members:
            snapshot.data().members?.map((m: any) => ({
              ...m,
              joinedAt: m.joinedAt?.toDate?.() || new Date(),
            })) || [],
        } as Group;

        onGroupUpdate(group);
      } else {
        onGroupUpdate(null);
      }
    });
  } catch (error) {
    console.error("Error subscribing to group:", error);
    return () => {};
  }
}

/**
 * Subscribe to user's groups (real-time)
 */
export function subscribeToUserGroups(
  userId: string,
  onGroupsUpdate: (groups: Group[]) => void,
): Unsubscribe {
  try {
    const q = query(collection(db, GROUPS_COLLECTION));

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          members:
            doc.data().members?.map((m: any) => ({
              ...m,
              joinedAt: m.joinedAt?.toDate?.() || new Date(),
            })) || [],
        }))
        .filter((g) =>
          g.members.some((m) => m.userId === userId && m.isActive),
        ) as Group[];

      onGroupsUpdate(groups);
    });
  } catch (error) {
    console.error("Error subscribing to user groups:", error);
    return () => {};
  }
}
