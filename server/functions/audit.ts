/**
 * Audit logging system
 * Logs all sensitive actions for compliance and security monitoring
 * 
 * Append-only collection: audit_logs
 * Accessible only to admins
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface AuditLog {
  id: string;
  timestamp: Date;
  actorId: string; // Who did it
  action: string; // What (e.g., ROLE_CHANGED, ASSET_PUBLISHED, USER_BANNED)
  targetId: string; // What entity (user ID, asset ID, etc.)
  details?: Record<string, any>; // Additional context
  status: 'success' | 'failed';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit action
 * Should be called for all sensitive operations
 * 
 * Usage:
 * await logAuditAction(userId, 'USER_BANNED', targetUserId, true, details);
 */
export async function logAuditAction(
  actorId: string,
  action: string,
  targetId: string,
  isSensitive: boolean = false,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  try {
    const auditLog: Omit<AuditLog, 'id'> = {
      timestamp: new Date(),
      actorId,
      action,
      targetId,
      details: details || {},
      status: 'success',
      ipAddress: isSensitive ? ipAddress : undefined,
      userAgent: isSensitive ? userAgent : undefined,
    };

    const docRef = await db.collection('audit_logs').add(auditLog);

    // Alert on critical actions
    const criticalActions = [
      'USER_BANNED',
      'USER_UNBANNED',
      'ROLE_CHANGED',
      'MASS_DELETE',
      'UPLOAD_REJECTED_NSFW',
      'WARNING_CREATED',
    ];

    if (criticalActions.includes(action)) {
      console.warn(
        `🚨 CRITICAL AUDIT: ${action} - Actor: ${actorId}, Target: ${targetId}`
      );

      // In production: send to monitoring service (Sentry, DataDog, etc.)
      // Example: sendToSentry({ action, actor: actorId, target: targetId, details });
    }

    return docRef.id;
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - failing to log shouldn't block the operation
    return 'audit_failed';
  }
}

/**
 * Get audit logs (ADMIN ONLY)
 * Returns logs filtered by actor, action, target, or date range
 */
export async function getAuditLogs(
  userId: string,
  filters?: {
    action?: string;
    actorId?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<AuditLog[]> {
  try {
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userRole = userDoc.data()?.role;

    if (!['admin', 'founder'].includes(userRole)) {
      throw new Error('Unauthorized: Only admins can view audit logs');
    }

    let query: FirebaseFirestore.Query = db.collection('audit_logs');

    // Apply filters
    if (filters?.action) {
      query = query.where('action', '==', filters.action);
    }
    if (filters?.actorId) {
      query = query.where('actorId', '==', filters.actorId);
    }
    if (filters?.targetId) {
      query = query.where('targetId', '==', filters.targetId);
    }
    if (filters?.startDate) {
      query = query.where('timestamp', '>=', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.where('timestamp', '<=', filters.endDate);
    }

    // Sort by timestamp descending
    query = query.orderBy('timestamp', 'desc');

    // Limit results
    const limit = filters?.limit || 100;
    query = query.limit(limit);

    const snapshot = await query.get();
    const logs: AuditLog[] = [];

    snapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      } as AuditLog);
    });

    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

/**
 * Check for suspicious activity patterns
 * Called after operations to detect abuse
 */
export async function checkSuspiciousActivity(userId: string): Promise<{
  suspicious: boolean;
  alerts: string[];
}> {
  const alerts: string[] = [];
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Check for multiple failed write attempts
    const failedWrites = await db
      .collection('audit_logs')
      .where('actorId', '==', userId)
      .where('status', '==', 'failed')
      .where('timestamp', '>=', last24h)
      .get();

    if (failedWrites.size > 20) {
      alerts.push(
        `User had ${failedWrites.size} failed write attempts in 24 hours`
      );
    }

    // Check for rapid uploads
    const recentUploads = await db
      .collection('audit_logs')
      .where('actorId', '==', userId)
      .where('action', '==', 'ASSET_CREATED')
      .where('timestamp', '>=', new Date(now.getTime() - 60 * 60 * 1000)) // Last hour
      .get();

    if (recentUploads.size > 20) {
      alerts.push(`User uploaded ${recentUploads.size} assets in 1 hour`);
    }

    // Check for multiple NSFW rejections
    const nsfwRejections = await db
      .collection('audit_logs')
      .where('actorId', '==', userId)
      .where('action', '==', 'UPLOAD_REJECTED_NSFW')
      .where('timestamp', '>=', last24h)
      .get();

    if (nsfwRejections.size >= 3) {
      alerts.push(`User had ${nsfwRejections.size} NSFW rejections in 24 hours`);
    }

    return {
      suspicious: alerts.length > 0,
      alerts,
    };
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return { suspicious: false, alerts: [] };
  }
}

/**
 * Export audit logs for compliance (e.g., monthly reports)
 * ADMIN ONLY
 */
export async function exportAuditLogs(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<AuditLog[]> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userRole = userDoc.data()?.role;

  if (!['admin', 'founder'].includes(userRole)) {
    throw new Error('Unauthorized');
  }

  const snapshot = await db
    .collection('audit_logs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .orderBy('timestamp', 'desc')
    .get();

  const logs: AuditLog[] = [];
  snapshot.forEach((doc) => {
    logs.push({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    } as AuditLog);
  });

  return logs;
}
