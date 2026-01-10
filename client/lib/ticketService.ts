import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";

export type TicketCategory =
  | "bug-report"
  | "account-issue"
  | "payment"
  | "content-removal"
  | "abuse-report"
  | "other";

export type TicketPriority = "low" | "normal" | "high" | "critical";
export type TicketStatus = "open" | "in-progress" | "waiting" | "resolved" | "closed";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "support";
  message: string;
  timestamp: Date;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  messages: TicketMessage[];
  assignedTo?: string; // Support staff ID
  assignedToName?: string;
}

const TICKETS_COLLECTION = "support_tickets";

export async function createTicket(
  userId: string,
  userName: string,
  userEmail: string,
  ticketData: {
    category: TicketCategory;
    subject: string;
    description: string;
  },
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), {
      userId,
      userName,
      userEmail,
      category: ticketData.category,
      subject: ticketData.subject,
      description: ticketData.description,
      status: "open" as TicketStatus,
      priority: "normal" as TicketPriority,
      messages: [
        {
          id: Math.random().toString(36),
          senderId: userId,
          senderName: userName,
          senderRole: "user",
          message: ticketData.description,
          timestamp: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}

export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where("userId", "==", userId),
    );

    const querySnapshot = await getDocs(q);

    const tickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      messages: (doc.data().messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate?.() || new Date(),
      })),
    })) as Ticket[];

    // Sort by updatedAt descending on the client side
    return tickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }
}

export async function getAllTickets(): Promise<Ticket[]> {
  try {
    const q = query(collection(db, TICKETS_COLLECTION));

    const querySnapshot = await getDocs(q);

    const tickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      messages: (doc.data().messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate?.() || new Date(),
      })),
    })) as Ticket[];

    // Sort by updatedAt descending on the client side
    return tickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        messages: (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate?.() || new Date(),
        })),
      } as Ticket;
    }

    return null;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

export async function addMessageToTicket(
  ticketId: string,
  senderId: string,
  senderName: string,
  senderRole: "user" | "support",
  message: string,
): Promise<void> {
  try {
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    const ticketDoc = await getDoc(ticketRef);

    if (ticketDoc.exists()) {
      const currentMessages = ticketDoc.data().messages || [];
      const newMessage: TicketMessage = {
        id: Math.random().toString(36),
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: new Date(),
      };

      await updateDoc(ticketRef, {
        messages: [...currentMessages, newMessage],
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error adding message to ticket:", error);
    throw error;
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  try {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    throw error;
  }
}

export async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority,
): Promise<void> {
  try {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
      priority,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating ticket priority:", error);
    throw error;
  }
}

export async function assignTicket(
  ticketId: string,
  staffId: string,
  staffName: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
      assignedTo: staffId,
      assignedToName: staffName,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    throw error;
  }
}
