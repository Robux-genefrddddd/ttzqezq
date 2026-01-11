/**
 * Cloud Functions for asset upload handling
 * - NSFW detection with OpenRouter API (image analysis)
 * - NSFW text detection with JigsawStack API (content analysis)
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
const JIGSAWSTACK_API_KEY = process.env.JIGSAWSTACK_API_KEY;

/**
 * Triggered when an asset is uploaded with status 'uploading'
 * Runs NSFW scan and updates asset status
 */
export const onAssetUploaded = functions.firestore
  .document('assets/{assetId}')
  .onCreate(async (snap, context) => {
    const asset = snap.data() as any;
    const assetId = context.params.assetId;

    // Only process uploaded assets with status 'uploading'
    if (asset.status !== 'uploading') {
      console.log(`⏭️  Skipping asset ${assetId}: status is ${asset.status}, not 'uploading'`);
      return;
    }

    try {
      console.log(`\n🔍 === NSFW SCAN STARTED for Asset: ${assetId} ===`);
      console.log(`   Author: ${asset.authorId}`);
      console.log(`   Name: ${asset.name}`);
      console.log(`   Image URL: ${asset.imageUrl ? asset.imageUrl.substring(0, 50) + '...' : 'MISSING'}`);

      // Check if asset has an image URL
      if (!asset.imageUrl) {
        console.error(`❌ Asset ${assetId} has no imageUrl - rejecting`);
        await snap.ref.update({
          status: 'rejected',
          rejectionReason: 'No image provided for verification',
          rejectionDate: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // Validate image URL format
      try {
        new URL(asset.imageUrl);
      } catch (e) {
        console.error(`❌ Invalid image URL: ${asset.imageUrl}`);
        await snap.ref.update({
          status: 'rejected',
          rejectionReason: 'Invalid image URL',
          rejectionDate: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // Call NSFW detection API
      console.log(`📤 Calling OpenRouter API for NSFW detection...`);
      const nsfwResult = await checkImageForNSFW(asset.imageUrl);

      console.log(`📊 NSFW Detection Result:`);
      console.log(`   Is NSFW: ${nsfwResult.isNSFW}`);
      console.log(`   Confidence: ${(nsfwResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Reason: ${nsfwResult.reason}`);

      if (nsfwResult.isNSFW) {
        // ⛔ REJECT - Inappropriate content detected
        console.warn(
          `⛔⛔⛔ NSFW CONTENT DETECTED - Asset ${assetId} REJECTED ⛔⛔⛔`
        );

        await snap.ref.update({
          status: 'rejected',
          rejectionReason: `Content violates community guidelines (inappropriate content detected - ${nsfwResult.reason})`,
          rejectionDate: admin.firestore.FieldValue.serverTimestamp(),
          nsfwConfidence: nsfwResult.confidence,
          nsfwReason: nsfwResult.reason,
        });

        // Create warning on user account
        try {
          await createWarning(
            asset.authorId,
            'upload_abuse',
            `Your upload "${asset.name}" was rejected for containing inappropriate content. Confidence: ${(nsfwResult.confidence * 100).toFixed(1)}%. Reason: ${nsfwResult.reason}`,
            asset.imageUrl
          );
        } catch (warningError) {
          console.error(`Failed to create warning for user ${asset.authorId}:`, warningError);
        }

        // Log audit action
        try {
          await logAuditAction(
            asset.authorId,
            'UPLOAD_REJECTED_NSFW',
            assetId,
            true,
            {
              assetName: asset.name,
              confidence: nsfwResult.confidence,
              reason: nsfwResult.reason,
              detectionTime: new Date().toISOString(),
            }
          );
        } catch (auditError) {
          console.error(`Failed to log audit action:`, auditError);
        }

        return;
      }

      // ✅ SAFE - Publish the asset
      console.log(`✅✅✅ ASSET PASSED NSFW CHECK - Asset ${assetId} PUBLISHED ✅✅✅\n`);

      await snap.ref.update({
        status: 'published',
        publishedDate: admin.firestore.FieldValue.serverTimestamp(),
        nsfwChecked: true,
        nsfwConfidence: nsfwResult.confidence,
      });

      // Log successful upload
      try {
        await logAuditAction(
          asset.authorId,
          'ASSET_PUBLISHED',
          assetId,
          false,
          {
            assetName: asset.name,
            nsfwConfidence: nsfwResult.confidence,
          }
        );
      } catch (auditError) {
        console.error(`Failed to log successful upload:`, auditError);
      }

    } catch (error) {
      console.error(`\n❌❌❌ ERROR processing asset ${assetId}:`, error);
      console.error(`Error details: ${error instanceof Error ? error.message : String(error)}\n`);

      // FAIL SAFE: Reject the upload if verification fails
      try {
        await snap.ref.update({
          status: 'rejected',
          rejectionReason: `Upload verification failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try uploading again.`,
          rejectionDate: admin.firestore.FieldValue.serverTimestamp(),
          verificationError: error instanceof Error ? error.message : String(error),
        });
      } catch (updateError) {
        console.error(`Failed to update asset status after error:`, updateError);
      }
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
  // Use environment variable or fallback to provided key
  const apiKey = OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ OPENROUTER_API_KEY not configured - FAILING SAFE (rejecting uploads)');
    throw new Error('NSFW detection service unavailable - uploads temporarily disabled');
  }

  try {
    console.log(`🔍 Scanning image for NSFW content: ${imageUrl.substring(0, 50)}...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://marketplace.example.com',
        'X-Title': 'Marketplace NSFW Detection System',
      },
      body: JSON.stringify({
        model: 'xiaomi/mimo-v2-flash:free', // Free vision model with fast inference
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
                text: `You are a strict content moderation AI for a digital asset marketplace.

ANALYZE THIS IMAGE CAREFULLY and respond ONLY with valid JSON (no markdown, no code blocks, no explanations):

{
  "is_nsfw": boolean,
  "confidence": number between 0 and 1,
  "category": string (one of: safe, adult, violence, illegal),
  "reason": string (brief reason)
}

STRICTLY FLAG AS NSFW (adult/illegal/violence):
- ANY nudity (full or partial: breasts, genitals, buttocks, nipples)
- ANY explicit sexual content or sexually suggestive poses
- Actual extreme violence, gore, or graphic injuries (blood/mutilation)
- Weapons being used to harm people
- Drug paraphernalia in use
- Hate speech symbols
- Any suggestive or erotic positioning/intent

DO NOT flag as NSFW:
- Clothed people in normal poses
- Anatomical diagrams with clear educational intent
- Non-sexual art/photography
- Cartoon characters (unless explicit)
- Abstract/creative content without harmful intent

IMPORTANT: When in doubt, set is_nsfw=true and high confidence.
This is for public marketplace - err on side of caution.
Even if artistic, flag nudity as NSFW.
Be STRICT. This is a marketplace for family-friendly content.`,
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorData);
      throw new Error(`OpenRouter API error ${response.status}: ${errorData}`);
    }

    const data = (await response.json()) as any;

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter response:', data);
      throw new Error('Invalid response format from OpenRouter API');
    }

    const content = data.choices[0].message.content;
    console.log(`📝 OpenRouter response: ${content.substring(0, 100)}...`);

    // Parse JSON from response (might be wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`Failed to parse JSON from response: ${content}`);
      throw new Error(`Failed to parse NSFW detection response`);
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0]);
      throw new Error('Invalid JSON in NSFW detection response');
    }

    const isNSFW = result.is_nsfw === true || result.confidence > 0.65;
    const confidence = Number(result.confidence) || 0;
    const reason = String(result.reason || 'No reason provided');

    console.log(`✅ NSFW Check result - Is NSFW: ${isNSFW}, Confidence: ${confidence}, Category: ${result.category}`);

    return {
      isNSFW,
      confidence,
      reason: `[${result.category || 'unknown'}] ${reason}`,
    };
  } catch (error) {
    console.error('❌ NSFW check error:', error);
    // FAIL SAFE: Reject the upload if we can't verify
    throw new Error(`NSFW detection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check text content for NSFW/inappropriate material using JigsawStack Sentiment API
 * Analyzes: asset name, description, and tags
 *
 * Returns true if content is inappropriate
 */
async function checkTextForNSFW(
  text: string,
  fieldName: string
): Promise<{
  isNSFW: boolean;
  reason: string;
  emotion: string;
  sentiment: string;
}> {
  if (!JIGSAWSTACK_API_KEY) {
    console.warn('⚠️ JIGSAWSTACK_API_KEY not configured - skipping text NSFW check');
    return { isNSFW: false, reason: 'Text check skipped', emotion: '', sentiment: '' };
  }

  if (!text || text.trim().length === 0) {
    return { isNSFW: false, reason: 'Empty text', emotion: '', sentiment: '' };
  }

  try {
    console.log(`📝 Checking "${fieldName}": "${text.substring(0, 50)}..."`);

    const response = await fetch('https://api.jigsawstack.com/v1/ai/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': JIGSAWSTACK_API_KEY,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`JigsawStack API error (${response.status}):`, errorData);
      // Non-critical: continue with image check if text check fails
      return { isNSFW: false, reason: 'Text check API error', emotion: '', sentiment: '' };
    }

    const data = (await response.json()) as any;

    if (!data.sentiment) {
      console.warn('No sentiment data in JigsawStack response');
      return { isNSFW: false, reason: 'No sentiment data', emotion: '', sentiment: '' };
    }

    const emotion = data.sentiment.emotion || '';
    const sentiment = data.sentiment.sentiment || '';
    const score = data.sentiment.score || 0;

    console.log(`   Emotion: ${emotion}, Sentiment: ${sentiment}, Score: ${score}`);

    // Detect inappropriate content based on emotion/sentiment
    const nsfwEmotions = [
      'anger',
      'hatred',
      'disgust',
      'obscenity',
      'explicit',
      'sexual',
      'profanity',
      'slur',
      'abuse',
      'harassment',
    ];

    const isEmotionNSFW = nsfwEmotions.some(
      (e) =>
        emotion.toLowerCase().includes(e) ||
        emotion.toLowerCase() === e
    );

    // Also check for text patterns that often indicate NSFW
    const nsfwPatterns = /sex|porn|xxx|nude|dick|pussy|cock|ass|shit|fuck|damn|cunt|whore|slut|rape|incest/gi;
    const textHasNSFWPattern = nsfwPatterns.test(text);

    const finalIsNSFW = isEmotionNSFW || textHasNSFWPattern;

    if (finalIsNSFW) {
      console.warn(`   ⛔ NSFW TEXT DETECTED in ${fieldName}`);
    }

    return {
      isNSFW: finalIsNSFW,
      reason: finalIsNSFW ? `${fieldName}: Inappropriate content` : `${fieldName}: Safe`,
      emotion,
      sentiment,
    };
  } catch (error) {
    console.error(`Text NSFW check error for "${fieldName}":`, error);
    // Non-critical: continue if text check fails
    return { isNSFW: false, reason: 'Text check failed', emotion: '', sentiment: '' };
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
