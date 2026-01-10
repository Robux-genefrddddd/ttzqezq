/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Group Types
 */
export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  members: GroupMember[];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatar?: string;
  role: "member" | "admin";
  joinedAt: Date;
  isActive: boolean;
}

/**
 * Message Types
 */
export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  imageUrl?: string;
  timestamp: Date;
  isEdited: boolean;
  editedAt?: Date;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar?: string;
  inviteeId: string;
  invitationDate: Date;
  status: "pending" | "accepted" | "declined";
  message?: string;
}

/**
 * Notification Types
 */
export interface Notification {
  id: string;
  userId: string;
  type:
    | "role_change"
    | "ban"
    | "group_invite"
    | "group_joined"
    | "group_message"
    | "asset_deleted";
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

/**
 * Real-time Update Types
 */
export interface RealtimeUpdate {
  type:
    | "user_banned"
    | "role_changed"
    | "group_created"
    | "group_updated"
    | "message_sent"
    | "member_joined"
    | "notification";
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
}
