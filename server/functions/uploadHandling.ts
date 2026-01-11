/**
 * Cloud Functions for asset upload handling
 * - NSFW detection with OpenRouter API
 * - Automatic warning system with auto-ban after 3 warnings
 * - Audit logging for all uploads
 * 
 * Deploy with: firebase deploy --only functions:onAssetCreated,functions:scanImageForNSFW
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { logAuditAction } from './audit';

const db = admin.firestore();
const storage = admin.storage();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Triggered when an asset is uploaded with status 'uploading'
 * Runs NSFW scan and updates asset status
 */
export const onAssetUploaded = functions.firestore
  .document('assets/{assetId}')
  .onCreate(async (snap, context) => {
    const asset = snap.data() as any;

    // Only process uploaded assets
    if (asset.status !== 'uploading') return;

    try {
      console.log(`🔍 Scanning asset ${context.params.assetId} for NSFW content...`);

      // Check if asset has an image
      if (!asset.imageUrl) {
        console.warn(`Asset ${context.params.assetId} has no image URL`);
        return;
      }

      // Scan for NSFW
      const nsfwResult = await checkImageForNSFW(asset.imageUrl);

      if (nsfwResult.isNSFW) {
        // REJECT the upload
        console.warn(
          `⛔ Asset ${context.params.assetId} rejected: NSFW content detected`
        );

        await snap.ref.update({
          status: 'rejected',
          rejectionReason: 'Content violates community guidelines (adult content)',
          rejectionDate: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create warning on user account
        await createWarning(
          asset.authorId,
          'upload_abuse',
          `Your upload "${asset.name}" was rejected for containing inappropriate content`,
          asset.imageUrl
        );

        // Log
        await logAuditAction(
          asset.authorId,
          'UPLOAD_REJECTED_NSFW',
          context.params.assetId,
          true,
          {
            assetName: asset.name,
            confidence: nsfwResult.confidence,
            reason: nsfwResult.reason,
          }
        );

        return;
      }

      // SAFE - publish the asset
      console.log(`✅ Asset ${context.params.assetId} passed NSFW scan`);

      await snap.ref.update({
        status: 'published',
        publishedDate: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log successful upload
      await logAuditAction(
        asset.authorId,
        'ASSET_PUBLISHED',
        context.params.assetId,
        false,
        { assetName: asset.name }
      );
    } catch (error) {
      console.error(`❌ Error processing asset ${context.params.assetId}:`, error);

      // Fail safe: reject the upload
      await snap.ref.update({
        status: 'rejected',
        rejectionReason: 'Upload verification failed. Please try again.',
        rejectionDate: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * Check image for NSFW content using OpenRouter API
 * Uses a free vision model that can analyze images
 * 
 * Response format:
 * {
 *   "is_nsfw": boolean,
 *   "confidence": 0-1,
 *   "reason": string
 * }
 */
async function checkImageForNSFW(
  imageUrl: string
): Promise<{
  isNSFW: boolean;
  confidence: number;
  reason: string;
}> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://marketplace.com',
        'X-Title': 'Marketplace Asset Verification',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision', // Free tier model that can see images
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: `Analyze this image and respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "is_nsfw": boolean,
  "confidence": number between 0 and 1,
  "reason": string explaining your assessment
}

NSFW includes:
- Nudity or partial nudity (breasts, genitals, buttocks)
- Explicit sexual content or sexually suggestive poses
- Extreme violence, gore, or graphic injuries
- Drug use or paraphernalia
- Hate speech or offensive symbols

Be STRICT: When in doubt, flag as NSFW.
For art/models: Anatomical references without sexualization = OK
For photography: Even tasteful nudity = NSFW (flag it)`,
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.1, // Low temperature for consistency
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(error)}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content;

    // Parse JSON from response (might be wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse NSFW response: ${content}`);
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      isNSFW: result.is_nsfw === true && result.confidence > 0.7,
      confidence: result.confidence || 0,
      reason: result.reason || 'Unable to determine',
    };
  } catch (error) {
    console.error('NSFW check error:', error);
    // Fail safe: treat as NSFW if we can't verify
    throw new Error(`NSFW detection failed: ${error}`);
  }
}

/**
 * Create warning on user account
 * Auto-ban after 3 warnings for the same reason
 */
async function createWarning(
  userId: string,
  reason: 'upload_abuse' | 'spam' | 'harassment' | 'rule_violation',
  message: string,
  evidence?: string
): Promise<void> {
  try {
    // Count active warnings for this reason
    const existingWarnings = await db
      .collection('warnings')
      .where('userId', '==', userId)
      .where('reason', '==', reason)
      .where('isActive', '==', true)
      .get();

    const warningCount = existingWarnings.size + 1;

    // Create new warning
    await db.collection('warnings').add({
      userId,
      reason,
      message,
      evidence: evidence || null,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      acknowledgedAt: null,
    });

    console.log(`⚠️  Warning #${warningCount} created for user ${userId}: ${reason}`);

    // Auto-ban after 3 warnings
    if (warningCount >= 3) {
      const banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      console.warn(`🔒 Auto-banning user ${userId} after 3 warnings for ${reason}`);

      await db.collection('users').doc(userId).update({
        isBanned: true,
        banReason: `Automatic 7-day ban: 3 warnings for ${reason}`,
        banDate: admin.firestore.FieldValue.serverTimestamp(),
        banUntilDate: banUntil,
      });

      // Disable Firebase Auth user
      const auth = admin.auth();
      await auth.updateUser(userId, { disabled: true });

      // Notify user
      await db.collection('notifications').add({
        userId,
        type: 'ban',
        title: 'Account Temporarily Suspended',
        message: `Your account has been suspended for 7 days due to repeated policy violations (${reason}). You can appeal at: support@marketplace.com`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log ban
      await logAuditAction(
        'SYSTEM',
        'AUTO_BAN_TRIGGERED',
        userId,
        true,
        {
          reason,
          warningCount: 3,
          banDays: 7,
        }
      );
    } else {
      // Notify user of warning
      await db.collection('notifications').add({
        userId,
        type: 'warning',
        title: 'Account Warning',
        message: `You have received a warning for ${reason}. (${warningCount}/3) Repeated violations will result in suspension.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating warning:', error);
    throw error;
  }
}

/**
 * Scheduled function to check for temporary bans that should be lifted
 * Run daily via Cloud Scheduler
 */
export const checkExpiredBans = functions.pubsub
  .schedule('every day 00:00')
  .onRun(async () => {
    try {
      const now = new Date();
      const auth = admin.auth();

      // Get all banned users with expiration date
      const bannedUsers = await db
        .collection('users')
        .where('isBanned', '==', true)
        .where('banUntilDate', '<', now)
        .get();

      let unbannedCount = 0;

      for (const doc of bannedUsers.docs) {
        const userId = doc.id;

        // Unban
        await doc.ref.update({
          isBanned: false,
          banReason: null,
          banDate: null,
          banUntilDate: null,
        });

        // Re-enable Firebase Auth
        await auth.updateUser(userId, { disabled: false });

        // Notify user
        await db.collection('notifications').add({
          userId,
          type: 'unbanned',
          title: 'Account Restored',
          message: `Your account suspension has been lifted. Welcome back!`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Log
        await logAuditAction('SYSTEM', 'BAN_EXPIRED', userId, false, {
          autoRestored: true,
        });

        unbannedCount++;
      }

      console.log(`✅ Checked expired bans: ${unbannedCount} users restored`);
    } catch (error) {
      console.error('Error checking expired bans:', error);
    }
  });

/**
 * CALLABLE FUNCTION: Manually trigger NSFW scan
 * For admin use only - to re-scan assets
 */
export const manualNSFWScan = functions.https.onCall(
  async (data: { assetId: string }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Only admins
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!['admin', 'founder'].includes(userDoc.data()?.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }

    try {
      const assetDoc = await db.collection('assets').doc(data.assetId).get();
      if (!assetDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Asset not found');
      }

      const asset = assetDoc.data() as any;

      const nsfwResult = await checkImageForNSFW(asset.imageUrl);

      await logAuditAction(
        context.auth.uid,
        'MANUAL_NSFW_SCAN',
        data.assetId,
        false,
        nsfwResult
      );

      return {
        success: true,
        isNSFW: nsfwResult.isNSFW,
        confidence: nsfwResult.confidence,
        reason: nsfwResult.reason,
      };
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);

/**
 * Increment asset downloads (called when user downloads)
 * Server-side to prevent tampering
 */
export const recordAssetDownload = functions.https.onCall(
  async (data: { assetId: string }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    try {
      const assetDoc = await db.collection('assets').doc(data.assetId).get();
      if (!assetDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Asset not found');
      }

      const asset = assetDoc.data() as any;

      // Check if published
      if (asset.status !== 'published') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Asset is not available for download'
        );
      }

      // Increment download count
      await assetDoc.ref.update({
        downloads: admin.firestore.FieldValue.increment(1),
      });

      // Log
      await logAuditAction(
        context.auth.uid,
        'ASSET_DOWNLOADED',
        data.assetId,
        false,
        { assetAuthor: asset.authorId }
      );

      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
