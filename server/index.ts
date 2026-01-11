import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleDownload } from "./routes/download";
import {
  apiLimiter,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
} from "./middleware/rateLimit";

export function createServer() {
  const app = express();

  // ========== SECURITY HEADERS ==========
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Enable XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Disable iframe embedding
    res.setHeader("X-Frame-Options", "DENY");

    // Content Security Policy
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firebasestorage.googleapis.com https://openrouter.ai; frame-ancestors 'none';"
    );

    // Remove powered by header
    res.removeHeader("X-Powered-By");

    next();
  });

  // ========== CORS CONFIGURATION ==========
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // ========== BODY PARSING ==========
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ========== GENERAL API RATE LIMITING ==========
  app.use("/api/", apiLimiter);

  // ========== PUBLIC ROUTES ==========
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ========== DOWNLOAD ENDPOINT ==========
  // Proxy endpoint - bypasses CORS issues
  // Security: validates file path, checks asset exists, logs downloads
  // Usage: GET /api/download?filePath=assets/assetId/filename&fileName=display-name
  app.get("/api/download", handleDownload);

  // ========== PROTECTED ROUTES WOULD GO HERE ==========
  // Add auth middleware before routes that require authentication
  // Example:
  // app.post("/api/upload", authenticateUser, uploadLimiter, handleUpload);
  // app.post("/api/register", signupLimiter, handleRegister);
  // app.post("/api/login", loginLimiter, handleLogin);

  // ========== 404 HANDLER ==========
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Not found",
      message: "The requested resource does not exist",
    });
  });

  // ========== ERROR HANDLER ==========
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);

      // Don't expose internal errors to client
      const statusCode = err.statusCode || 500;
      const message =
        statusCode === 500
          ? "Internal server error"
          : err.message || "An error occurred";

      res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
      });
    }
  );

  return app;
}
