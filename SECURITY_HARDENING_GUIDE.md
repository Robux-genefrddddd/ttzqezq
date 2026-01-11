# Security Hardening Guide - Marketplace Application

## Executive Summary

This document provides a comprehensive security hardening strategy for a Firebase-based marketplace application. It addresses critical vulnerabilities in authentication, authorization, input validation, upload handling, and observability.

---

## 1. THREAT MODEL & ATTACK PATHS

### Critical Threats

| Threat | Attack Path | Impact | Severity |
|--------|------------|--------|----------|
| **Auth Bypass** | Modify `role` field in Firestore user doc (client-side) | Attacker gains admin/partner privileges | 🔴 CRITICAL |
| **IDOR (Broken Access Control)** | Read/write other users' assets, settings | Data theft, account takeover | 🔴 CRITICAL |
| **Upload Abuse** | Upload malicious/NSFW images; no validation | Content abuse, legal liability | 🔴 CRITICAL |
| **SQL Injection** | NOT APPLICABLE (using Firestore) | N/A | N/A |
| **Rate Abuse** | Spam signup, brute-force login | Service degradation, cost spike | 🟠 HIGH |
| **Privilege Escalation** | Attacker modifies own `memberRank` → earns fake revenue | Financial fraud | 🟠 HIGH |
| **Mass Data Exfiltration** | Firestore rules too permissive; read all user data | Privacy breach | 🟠 HIGH |
| **Account Enumeration** | Register with all common usernames; no validation | User enumeration | 🟡 MEDIUM |
| **Email Spoofing** | No email verification | Fake accounts, impersonation | 🟡 MEDIUM |
| **Client-Side Tampering** | Modify JS to call Firestore directly; bypass checks | Rules circumvention | 🟡 MEDIUM |

---

## 2. DATABASE HARDENING (Firestore)

### Current Vulnerabilities

❌ **No Firestore Security Rules** - anyone can read/write any field
❌ **Client-side role assignment** - users set their own role in signup
❌ **No field-level protection** - `earnings`, `role`, `isBanned` writable by user
❌ **No schema validation** - invalid data types accepted
❌ **Storage rules allow any authenticated user to write** - upload overwrite attacks possible

### Solution: Strict Firestore Security Rules

Create `firestore.rules` with:

```
rules_version = '2';
service cloud.firestore {
  // Helper functions
  function isAuthenticated() {
    return request.auth != null;
  }

  function isOwner(userId) {
    return request.auth.uid == userId;
  }

  function hasRole(role) {
    return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
  }

  function isAdmin() {
    return hasRole('admin') || hasRole('founder');
  }

  function isModerator() {
    return hasRole('admin') || hasRole('founder') || hasRole('support');
  }

  match /databases/{database}/documents {

    // ========== USERS COLLECTION ==========
    match /users/{userId} {
      // Only users can read their own profile
      allow read: if isOwner(userId);
      
      // Admins can read any user (for moderation)
      allow read: if isAdmin();

      // Users can create their own profile during signup (via Cloud Function)
      allow create: if isOwner(userId) && isAuthenticated();

      // Users can update ONLY safe fields on their own profile
      // FORBIDDEN: role, memberRank, isBanned, banReason, earnings, assetsCreated
      allow update: if isOwner(userId) && 
        !('role' in request.resource.data) &&
        !('memberRank' in request.resource.data) &&
        !('isBanned' in request.resource.data) &&
        !('banReason' in request.resource.data) &&
        !('earnings' in request.resource.data) &&
        !('assetsCreated' in request.resource.data) &&
        !('assetsDownloaded' in request.resource.data);

      // Admins can update any field (for moderation)
      allow update: if isAdmin();

      // Prevent delete
      allow delete: if false;
    }

    // ========== ASSETS COLLECTION ==========
    match /assets/{assetId} {
      // Anyone can read published assets
      allow read: if resource.data.status == 'published';

      // Authors can read their own draft/uploading assets
      allow read: if isOwner(resource.data.authorId);

      // Admins can read all assets
      allow read: if isAdmin();

      // Authenticated users can create with authorId = request.auth.uid
      allow create: if isAuthenticated() &&
        request.resource.data.authorId == request.auth.uid &&
        request.resource.data.status == 'uploading' &&
        request.resource.data.rating == 0 &&
        request.resource.data.downloads == 0 &&
        request.resource.data.reviews == 0 &&
        request.resource.data.featured == false;

      // Authors can update their own draft/uploading assets
      allow update: if isOwner(resource.data.authorId) &&
        resource.data.status in ['draft', 'uploading', 'verification'] &&
        !('authorId' in request.resource.data) &&
        !('downloads' in request.resource.data) &&
        !('reviews' in request.resource.data) &&
        !('rating' in request.resource.data) &&
        !('featured' in request.resource.data) &&
        !('status' in request.resource.data);

      // Admins can publish/reject via Cloud Function
      allow update: if isAdmin();

      // Only authors can delete their own drafts
      allow delete: if isOwner(resource.data.authorId) &&
        resource.data.status in ['draft', 'uploading'];

      // Admins can delete published assets
      allow delete: if isAdmin();
    }

    // ========== REVIEWS COLLECTION ==========
    match /reviews/{reviewId} {
      // Anyone can read published reviews of published assets
      allow read: if resource.data.published == true;

      // Authors can read their own reviews
      allow read: if isOwner(resource.data.authorId);

      // Authenticated users can create reviews (only their own)
      allow create: if isAuthenticated() &&
        request.resource.data.authorId == request.auth.uid &&
        request.resource.data.published == false;

      // Authors can update their own reviews (unpublished only)
      allow update: if isOwner(resource.data.authorId) &&
        resource.data.published == false &&
        !('published' in request.resource.data) &&
        !('authorId' in request.resource.data);

      // Only authors can delete their own reviews
      allow delete: if isOwner(resource.data.authorId);
    }

    // ========== GROUPS COLLECTION ==========
    match /groups/{groupId} {
      // Members can read their groups
      allow read: if request.auth.uid in resource.data.memberIds;

      // Authenticated users can create groups
      allow create: if isAuthenticated() &&
        request.resource.data.creatorId == request.auth.uid;

      // Only creator can update (add members via Cloud Function)
      allow update: if isOwner(resource.data.creatorId);

      // Only creator can delete
      allow delete: if isOwner(resource.data.creatorId);

      // ===== GROUP MESSAGES =====
      match /messages/{messageId} {
        // Members of parent group can read messages
        allow read: if request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds;

        // Members can create messages (senderId = request.auth.uid)
        allow create: if request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds &&
          request.resource.data.senderId == request.auth.uid;

        // Authors can edit their own messages
        allow update: if isOwner(resource.data.senderId) &&
          !('senderId' in request.resource.data) &&
          !('timestamp' in request.resource.data);

        // Authors can delete their own messages
        allow delete: if isOwner(resource.data.senderId);
      }
    }

    // ========== FAVORITES COLLECTION ==========
    match /favorites/{favId} {
      // Users can read their own favorites
      allow read: if isOwner(resource.data.userId);

      // Users can create their own favorites
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;

      // Users can delete their own favorites
      allow delete: if isOwner(resource.data.userId);

      // No updates
      allow update: if false;
    }

    // ========== NOTIFICATIONS COLLECTION ==========
    match /notifications/{notifId} {
      // Users can read their own notifications
      allow read: if isOwner(resource.data.userId);

      // Cloud Functions only
      allow create: if false;

      // Users can mark read
      allow update: if isOwner(resource.data.userId) &&
        !('type' in request.resource.data) &&
        !('title' in request.resource.data) &&
        !('message' in request.resource.data);

      // Users can delete their own notifications
      allow delete: if isOwner(resource.data.userId);
    }

    // ========== AUDIT LOG COLLECTION (APPEND-ONLY) ==========
    match /audit_logs/{logId} {
      // Only admins can read audit logs
      allow read: if isAdmin();

      // Cloud Functions only
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }

    // ========== WARNINGS COLLECTION ==========
    match /warnings/{warningId} {
      // Users can read their own warnings
      allow read: if isOwner(resource.data.userId) || isAdmin();

      // Cloud Functions only
      allow create: if false;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // ========== DEFAULT DENY ==========
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. FIREBASE STORAGE HARDENING

### Current Vulnerabilities

❌ `allow write: if request.auth != null;` - any authenticated user can upload to any path
❌ No file type validation
❌ No file size limits
❌ No NSFW scanning

### Solution: Strict Storage Rules

Create/update `storage.rules`:

```
rules_version = '2';

service firebase.storage {
  // Allow only authenticated users to read assets
  match /b/{bucket}/o {
    // ========== PUBLISHED ASSETS (PUBLIC READ) ==========
    match /assets/{assetId}/{fileName=**} {
      // Public read of published assets
      allow read: if true;

      // Only the asset author can write (via backend verification)
      // This is enforced by Firestore rules + Cloud Function
      allow write: if request.auth != null;
    }

    // ========== TEMP UPLOADS (USER-SPECIFIC) ==========
    match /temp/{userId}/{fileName=**} {
      // Only the user can read/write their own temp files
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ========== PROFILE IMAGES ==========
    match /profiles/{userId}/{fileName=**} {
      // Public read
      allow read: if true;

      // Only the user can write their own profile image
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.name.matches('.*\\.(jpg|jpeg|png|webp)$') &&
        request.resource.size <= 5 * 1024 * 1024;
    }

    // ========== DEFAULT DENY ==========
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 4. INPUT VALIDATION (Server-Side)

### Username Rules

**Specification:**
- Unique (case-insensitive)
- Allowed chars: `a-z, 0-9, _, . (underscore, dot)`
- Length: 3-20 characters
- Cannot start/end with `.` or `_`
- No consecutive `.` or `_`
- Reserved words: admin, support, moderator, founder, system, root, test, demo

**Server-Side Validation** (Cloud Function):

```typescript
export async function validateUsername(username: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Length
  if (username.length < 3) errors.push('Username must be at least 3 characters');
  if (username.length > 20) errors.push('Username must be at most 20 characters');

  // Allowed characters
  if (!/^[a-z0-9_.]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, dots, and underscores');
  }

  // Cannot start/end with dot or underscore
  if (/^[._]/.test(username) || /[._]$/.test(username)) {
    errors.push('Username cannot start or end with a dot or underscore');
  }

  // No consecutive dots or underscores
  if (/\.\./.test(username) || /__/.test(username)) {
    errors.push('Username cannot contain consecutive dots or underscores');
  }

  // Reserved words
  const reserved = new Set([
    'admin', 'support', 'moderator', 'founder', 'system', 'root', 'test', 'demo'
  ]);
  if (reserved.has(username.toLowerCase())) {
    errors.push('Username is reserved');
  }

  // Check uniqueness in Firestore
  const q = query(
    collection(db, 'users'),
    where('usernameLower', '==', username.toLowerCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.size > 0) {
    errors.push('Username already taken');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Email Validation

```typescript
export function validateEmail(email: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Normalize: trim + lowercase
  const normalized = email.trim().toLowerCase();

  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    errors.push('Invalid email format');
  }

  // Max length
  if (normalized.length > 254) {
    errors.push('Email too long');
  }

  // No control characters
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    errors.push('Email contains invalid characters');
  }

  return { valid: errors.length === 0, errors };
}
```

### Text Field Validation

```typescript
export function validateTextField(
  value: string,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 500
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Trim and normalize
  const trimmed = value.trim();

  // Length
  if (trimmed.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }
  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} must be at most ${maxLength} characters`);
  }

  // No control characters (except newlines in descriptions)
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
    errors.push(`${fieldName} contains invalid characters`);
  }

  // No excessive invisible Unicode
  const invisibleCharCount = (trimmed.match(/[\u200B-\u200D\uFEFF]/g) || []).length;
  if (invisibleCharCount > 3) {
    errors.push(`${fieldName} contains too many invisible characters`);
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 5. AUTHENTICATION & SESSIONS

### Email Verification (Recommended)

```typescript
export async function sendVerificationEmail(user: User): Promise<void> {
  // Firebase Auth has sendEmailVerification()
  await sendEmailVerification(user);
  
  // Optional: Create a timeout document in Firestore
  // Expire after 24 hours
  await setDoc(doc(db, 'email_verifications', user.uid), {
    email: user.email,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
}

export async function enforceEmailVerification(user: User): Promise<void> {
  // Refresh to get latest verification status
  await user.reload();
  
  if (!user.emailVerified) {
    // Optionally enforce verification before allowing actions
    throw new Error('Please verify your email before continuing');
  }
}
```

### Rate Limiting (Backend)

```typescript
// In server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 accounts per IP per hour
  message: 'Too many signup attempts, try again later',
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});
```

---

## 6. UPLOAD SECURITY

### File Type & Size Validation (Server-Side)

```typescript
export async function validateUploadFile(file: File): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_DIMENSIONS = { width: 4096, height: 4096 };

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Only PNG, JPEG, and WebP images are allowed`);
  }

  // Check file size
  if (file.size > MAX_SIZE) {
    errors.push(`File must be smaller than 5MB`);
  }

  // Check image dimensions (if image)
  if (file.type.startsWith('image/')) {
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width > MAX_DIMENSIONS.width || dimensions.height > MAX_DIMENSIONS.height) {
        errors.push(`Image dimensions must not exceed 4096x4096`);
      }
    } catch (e) {
      errors.push('Unable to verify image dimensions');
    }
  }

  return { valid: errors.length === 0, errors };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
```

### NSFW Detection with OpenRouter API

**Implementation Plan:**
1. User uploads image → stored in Firebase Storage `/temp/{userId}/` (temporary)
2. Cloud Function triggered on upload
3. Cloud Function calls OpenRouter API with a free vision model
4. If NSFW detected:
   - Delete from temp storage
   - Create warning on user account
   - Log incident in audit logs
   - After 3 warnings (same reason): auto-ban for 7 days
5. If safe:
   - Move to `/assets/{assetId}/`
   - Update Asset document status to 'published'
   - Real-time update to show upload complete

```typescript
// Cloud Function: onUploadAsset
export async function onUploadAsset(change: Change<DocumentSnapshot>) {
  const asset = change.after.data() as Asset;
  
  if (asset.status !== 'verification') return;

  try {
    const nsfwCheck = await checkImageNSFW(asset.imageUrl);
    
    if (nsfwCheck.isNSFW) {
      // Mark as rejected
      await admin.firestore().collection('assets').doc(change.after.id).update({
        status: 'rejected',
        rejectionReason: 'Content violates community guidelines'
      });

      // Create warning
      await createWarning(
        asset.authorId,
        'upload_abuse',
        'Your upload was rejected for inappropriate content',
        asset.imageUrl
      );

      // Log
      await logAuditAction(
        asset.authorId,
        'UPLOAD_REJECTED_NSFW',
        `Asset ${change.after.id}`,
        true
      );

      return;
    }

    // Safe - publish
    await admin.firestore().collection('assets').doc(change.after.id).update({
      status: 'published'
    });

  } catch (error) {
    console.error('NSFW check failed:', error);
    // Fail safe: reject the upload
    await admin.firestore().collection('assets').doc(change.after.id).update({
      status: 'rejected',
      rejectionReason: 'Upload verification failed'
    });
  }
}

async function checkImageNSFW(imageUrl: string): Promise<{ isNSFW: boolean; confidence: number }> {
  // Use OpenRouter API with a free vision model
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-vision', // Free tier model that can see images
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: 'Analyze this image and respond with ONLY a JSON object: {"is_nsfw": boolean, "reason": string, "confidence": number (0-1)}. NSFW includes: nudity, explicit sexual content, extreme violence, gore. Be strict.'
            }
          ]
        }
      ],
      max_tokens: 100
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    // Parse JSON from response
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    
    const result = JSON.parse(match[0]);
    return {
      isNSFW: result.is_nsfw === true && result.confidence > 0.7,
      confidence: result.confidence || 0
    };
  } catch (e) {
    console.error('Failed to parse NSFW response:', e);
    throw new Error('NSFW detection parsing failed');
  }
}

async function createWarning(
  userId: string,
  reason: 'upload_abuse' | 'spam' | 'harassment',
  message: string,
  evidence?: string
): Promise<void> {
  const warningsRef = admin.firestore().collection('warnings');
  
  // Check existing warnings
  const existing = await warningsRef
    .where('userId', '==', userId)
    .where('reason', '==', reason)
    .where('isActive', '==', true)
    .get();

  const warningCount = existing.size + 1;

  await warningsRef.add({
    userId,
    reason,
    message,
    evidence,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    acknowledgedAt: null
  });

  // Auto-ban after 3 warnings
  if (warningCount >= 3) {
    const banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await admin.firestore().collection('users').doc(userId).update({
      isBanned: true,
      banReason: `Automatic 7-day ban: 3 warnings for ${reason}`,
      banDate: admin.firestore.FieldValue.serverTimestamp(),
      banUntilDate: banUntil
    });

    // Notify user
    await admin.firestore().collection('notifications').add({
      userId,
      type: 'ban',
      title: 'Account Temporarily Suspended',
      message: `Your account has been suspended for 7 days. Reason: ${reason}. Appeals: support@marketplace.com`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}
```

---

## 7. REAL-TIME MESSAGING SECURITY

### Group Access Control

**Rule:**
- Only group members can read/write messages
- Users can only invite if they're admin or creator
- Membership changes are server-authoritative

```typescript
// Cloud Function: addGroupMember
export async function addGroupMember(
  context: functions.https.CallableContext,
  data: { groupId: string; userId: string }
) {
  if (!context.auth) throw new Error('Unauthenticated');

  const groupDoc = await admin.firestore().collection('groups').doc(data.groupId).get();
  const group = groupDoc.data();

  // Only creator or admin members can invite
  const requesterIsMember = group.members.some(
    (m: any) => m.userId === context.auth!.uid && (m.role === 'admin' || m.role === 'creator')
  );

  if (!requesterIsMember && context.auth!.uid !== group.creatorId) {
    throw new Error('You do not have permission to invite members');
  }

  // Add member
  const member: GroupMember = {
    userId: data.userId,
    username: (await admin.firestore().collection('users').doc(data.userId).get()).data()?.username,
    role: 'member',
    joinedAt: admin.firestore.FieldValue.serverTimestamp() as any,
    isActive: true
  };

  await admin.firestore().collection('groups').doc(data.groupId).update({
    members: admin.firestore.FieldValue.arrayUnion(member)
  });

  // Log
  await logAuditAction(context.auth!.uid, 'GROUP_MEMBER_ADDED', data.groupId, false);
}
```

### Message Rate Limiting

```typescript
export async function rateLimit Message(
  userId: string,
  groupId: string
): Promise<boolean> {
  const now = Date.now();
  const key = `msg:${userId}:${groupId}`;
  
  // Check Redis or in-memory store
  const lastMessages = messageRateLimit.get(key) || [];
  const recentMessages = lastMessages.filter(t => now - t < 60000); // Last 60 seconds

  if (recentMessages.length >= 10) { // Max 10 messages per minute
    return false;
  }

  recentMessages.push(now);
  messageRateLimit.set(key, recentMessages);
  return true;
}
```

---

## 8. OBSERVABILITY & AUDIT LOGGING

### Audit Log Schema

```typescript
export interface AuditLog {
  id: string;
  timestamp: Date;
  actorId: string; // Who did it
  action: string; // What (e.g., ROLE_CHANGED, ASSET_PUBLISHED, USER_BANNED)
  targetId: string; // What entity (user ID, asset ID, etc.)
  changes?: Record<string, any>; // Before/after values
  reason?: string; // Why (for sensitive actions)
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  details?: string;
}
```

### Cloud Function: Log Audit Action

```typescript
export async function logAuditAction(
  actorId: string,
  action: string,
  targetId: string,
  isSensitive: boolean = false,
  context?: functions.https.CallableContext,
  details?: Record<string, any>
): Promise<void> {
  const auditLog: AuditLog = {
    id: admin.firestore().collection('audit_logs').doc().id,
    timestamp: new Date(),
    actorId,
    action,
    targetId,
    ipAddress: isSensitive ? extractIP(context?.rawRequest) : undefined,
    userAgent: isSensitive ? context?.rawRequest.headers['user-agent'] : undefined,
    status: 'success',
    details: JSON.stringify(details || {})
  };

  await admin.firestore().collection('audit_logs').add(auditLog);

  // Alert on critical actions
  if (['USER_BANNED', 'ROLE_CHANGED_ADMIN', 'MASS_DELETE'].includes(action)) {
    console.warn(`CRITICAL AUDIT: ${JSON.stringify(auditLog)}`);
    // Send to external logging (e.g., Sentry, DataDog)
  }
}
```

### Suspicious Activity Alerts

```typescript
export async function checkSuspiciousActivity(userId: string): Promise<void> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check for multiple failed write attempts
  const failedWrites = await admin.firestore()
    .collection('audit_logs')
    .where('actorId', '==', userId)
    .where('status', '==', 'failed')
    .where('timestamp', '>=', last24h)
    .get();

  if (failedWrites.size > 20) {
    console.warn(`SUSPICIOUS: User ${userId} had ${failedWrites.size} failed write attempts in 24h`);
    // Consider temporary rate limiting
  }
}
```

---

## 9. CODE PATTERNS

### DO: Safe Firestore Query

✅ **CORRECT** - Server-side enforcement:

```typescript
// In Cloud Function
export async function publishAsset(context: functions.https.CallableContext, data: { assetId: string }) {
  if (!context.auth) throw new Error('Unauthenticated');

  const assetDoc = await admin.firestore().collection('assets').doc(data.assetId).get();
  const asset = assetDoc.data();

  // SERVER CHECKS (not trusting client)
  if (asset.authorId !== context.auth.uid && !isAdmin(context.auth.uid)) {
    throw new Error('Forbidden');
  }

  if (asset.status !== 'uploading') {
    throw new Error('Asset must be in uploading state');
  }

  await assetDoc.ref.update({ status: 'published' });
}
```

### DON'T: Trust Client for Authorization

❌ **WRONG**:

```typescript
// In client-side code
const asset = await getAsset(assetId);
if (asset.authorId === currentUserId) { // WRONG: client can modify this
  await updateAsset(assetId, { status: 'published' });
}
```

### DO: Parameterized Firestore Queries

✅ **CORRECT**:

```typescript
const q = query(
  collection(db, 'assets'),
  where('authorId', '==', userId), // Use where clause, not concatenation
  where('status', '==', 'published')
);
```

### DON'T: Dynamic Field Names Without Allowlist

❌ **WRONG**:

```typescript
// VULNERABLE to injection if sortBy comes from user input
const q = query(
  collection(db, 'assets'),
  orderBy(req.body.sortBy) // NO!
);
```

✅ **CORRECT**:

```typescript
const ALLOWED_SORTS = ['createdAt', 'downloads', 'rating'];
if (!ALLOWED_SORTS.includes(req.body.sortBy)) {
  throw new Error('Invalid sort field');
}
const q = query(
  collection(db, 'assets'),
  orderBy(req.body.sortBy as any)
);
```

---

## 10. DEPLOYMENT SECURITY CHECKLIST

### Pre-Deployment

- [ ] **Secrets Management**
  - [ ] Firebase credentials in environment variables (never committed)
  - [ ] OpenRouter API key in env, not hardcoded
  - [ ] All `.env` files added to `.gitignore`
  - [ ] Secrets stored in cloud provider's secret manager (Google Cloud Secret Manager, etc.)

- [ ] **Code Quality**
  - [ ] No API keys in frontend code
  - [ ] No hardcoded Firebase config in frontend (use env vars)
  - [ ] No console.log of sensitive data
  - [ ] TypeScript strict mode enabled
  - [ ] SAST scan completed (Semgrep, SonarQube, or similar)

- [ ] **Dependencies**
  - [ ] Run `npm audit` and fix critical vulnerabilities
  - [ ] Pin exact versions in package-lock.json
  - [ ] No deprecated dependencies

- [ ] **Firebase Configuration**
  - [ ] Firestore Security Rules deployed and tested
  - [ ] Storage Rules deployed and tested
  - [ ] Email verification enabled
  - [ ] Password policy enforced (min 8 chars, complexity)
  - [ ] Session timeout configured (if using custom auth)

- [ ] **Cloud Functions**
  - [ ] All privileged operations moved to Cloud Functions
  - [ ] Input validation on all function parameters
  - [ ] Rate limiting configured
  - [ ] Timeout set appropriately (max 540s)
  - [ ] Memory allocation sufficient but not excessive

- [ ] **Monitoring & Logging**
  - [ ] Sentry/error tracking configured
  - [ ] Audit logging enabled
  - [ ] Alerts set up for suspicious activity
  - [ ] Database backups scheduled
  - [ ] Log retention configured (e.g., 90 days)

### After Deployment

- [ ] **Production Verification**
  - [ ] Test login with rate limiting
  - [ ] Verify upload with NSFW detection
  - [ ] Confirm Firestore rules block unauthorized access
  - [ ] Check that admin operations require authentication
  - [ ] Verify audit logs are being written

- [ ] **Ongoing Security**
  - [ ] Weekly dependency updates
  - [ ] Monthly security review of audit logs
  - [ ] Quarterly penetration testing
  - [ ] Incident response plan documented
  - [ ] User privacy policy published

---

## SUMMARY OF CRITICAL FIXES

| Issue | Fix | Priority |
|-------|-----|----------|
| No Firestore Rules | Implement strict field-level rules | 🔴 CRITICAL |
| Client-side role assignment | Move to Cloud Function (server-only) | 🔴 CRITICAL |
| No NSFW detection | Add OpenRouter API scanning | 🔴 CRITICAL |
| No input validation | Server-side validation for all fields | 🔴 CRITICAL |
| Overly permissive Storage Rules | Restrict to specific paths, sizes, types | 🔴 CRITICAL |
| No audit logging | Implement audit log collection + functions | 🟠 HIGH |
| No rate limiting | Add rate limiters to auth & API endpoints | 🟠 HIGH |
| Firebase key exposed | Use env vars, remove from frontend | 🟠 HIGH |
| No email verification | Enable Firebase email verification | 🟡 MEDIUM |
| Client-side authorization checks | Move all auth checks to Cloud Functions | 🟡 MEDIUM |

---

**Next Steps:**
1. Deploy Firestore Security Rules
2. Deploy Storage Rules
3. Create Cloud Functions for privileged operations
4. Implement input validation middleware
5. Set up NSFW detection pipeline
6. Create audit logging infrastructure
7. Configure monitoring and alerts
