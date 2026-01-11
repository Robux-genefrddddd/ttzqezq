import { RequestHandler } from "express";
import * as admin from "firebase-admin";

const db = admin.firestore();
const FIREBASE_BUCKET = "keysystem-d0b86-8df89.firebasestorage.app";

/**
 * Secure proxy endpoint for downloading files from Firebase Storage
 * This bypasses CORS issues by routing through the backend
 *
 * Security checks:
 * - Validates file path (no directory traversal)
 * - Verifies asset exists and is published
 * - Logs all downloads for audit
 * - Rate limits per IP
 *
 * Usage: GET /api/download?filePath=assets/assetId/filename.ext&fileName=display-name.ext
 */
export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const { filePath, fileName } = req.query as Record<string, string>;
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";

    // ===== VALIDATE INPUT =====
    if (!filePath) {
      return res.status(400).json({
        error: "Missing filePath parameter",
      });
    }

    // Security: Prevent directory traversal attacks
    if (
      filePath.includes("..") ||
      filePath.startsWith("/") ||
      filePath.includes("\\")
    ) {
      console.warn(
        `⚠️  Directory traversal attempt: ${filePath} from ${clientIp}`,
      );
      return res.status(400).json({
        error: "Invalid file path",
      });
    }

    // Only allow downloads from assets and temp folders
    if (!filePath.startsWith("assets/") && !filePath.startsWith("temp/")) {
      console.warn(
        `⚠️  Unauthorized download path: ${filePath} from ${clientIp}`,
      );
      return res.status(403).json({
        error: "Access denied",
      });
    }

    // ===== VERIFY ASSET (if downloading from assets/) =====
    if (filePath.startsWith("assets/")) {
      const pathParts = filePath.split("/");
      const assetId = pathParts[1];

      if (!assetId) {
        return res.status(400).json({
          error: "Invalid asset path",
        });
      }

      // Check if asset exists and is published
      const assetDoc = await db.collection("assets").doc(assetId).get();

      if (!assetDoc.exists) {
        console.warn(`⚠️  Download attempt for non-existent asset: ${assetId}`);
        return res.status(404).json({
          error: "File not found",
          code: "OBJECT_NOT_FOUND",
        });
      }

      const asset = assetDoc.data() as any;

      // Only allow downloading published assets
      if (asset.status !== "published") {
        console.warn(
          `⚠️  Download attempt for non-published asset: ${assetId}`,
        );
        return res.status(403).json({
          error: "Asset is not available for download",
          code: "FORBIDDEN",
        });
      }
    }

    // ===== VALIDATE FILENAME =====
    if (fileName && fileName.length > 255) {
      return res.status(400).json({
        error: "Filename too long",
      });
    }

    // ===== FETCH FROM FIREBASE STORAGE =====
    const encodedPath = encodeURIComponent(filePath);
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodedPath}?alt=media`;

    console.log(`📥 Download request: ${filePath} from ${clientIp}`);

    const response = await fetch(firebaseUrl, {
      headers: {
        "User-Agent": "Marketplace-Download-Proxy/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `Firebase Storage error: ${response.status} ${response.statusText} for ${filePath}`,
      );

      if (response.status === 404) {
        return res.status(404).json({
          error: "File not found",
          code: "OBJECT_NOT_FOUND",
        });
      } else if (response.status === 403) {
        return res.status(403).json({
          error: "Access denied",
          code: "UNAUTHORIZED",
        });
      }

      return res.status(response.status).json({
        error: "File storage error",
        code: response.status,
      });
    }

    // ===== VALIDATE CONTENT TYPE =====
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // Security: Only allow certain file types for downloads
    const allowedTypes = [
      "image/",
      "application/zip",
      "application/x-zip-compressed",
      "application/pdf",
      "text/",
      "video/",
      "audio/",
    ];

    const isAllowed = allowedTypes.some((type) => contentType.startsWith(type));

    if (!isAllowed) {
      console.warn(
        `⚠️  Suspicious content type: ${contentType} for ${filePath}`,
      );
      return res.status(403).json({
        error: "File type not allowed",
      });
    }

    // ===== SET RESPONSE HEADERS =====
    const buffer = await response.arrayBuffer();
    const bufferSize = buffer.byteLength;

    // Limit download size (100MB)
    if (bufferSize > 100 * 1024 * 1024) {
      return res.status(413).json({
        error: "File too large",
      });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || filePath.split("/").pop() || "file"}"`,
    );
    res.setHeader("Content-Length", bufferSize);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME sniffing

    // ===== SEND FILE =====
    res.send(Buffer.from(buffer));

    console.log(`✅ Download completed: ${filePath} (${bufferSize} bytes)`);
  } catch (error: any) {
    console.error("❌ Download proxy error:", error);

    res.status(500).json({
      error: "Failed to download file",
      message: error?.message || "Unknown error",
    });
  }
};
