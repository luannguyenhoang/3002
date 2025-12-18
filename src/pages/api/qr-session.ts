import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for QR login sessions
// In production, use Redis or a database
declare global {
  var qrLoginSessions: Map<string, {
    sessionId: string;
    accessToken: string | null;
    createdAt: number;
    expiresAt: number;
  }> | undefined;
}

globalThis.qrLoginSessions = globalThis.qrLoginSessions || new Map();

const SESSION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired sessions
function cleanupExpiredSessions() {
  const now = Date.now();
  if (globalThis.qrLoginSessions) {
    for (const [sessionId, session] of globalThis.qrLoginSessions.entries()) {
      if (now > session.expiresAt) {
        globalThis.qrLoginSessions.delete(sessionId);
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers to allow cross-origin requests from daihan app
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  cleanupExpiredSessions();

  // POST: Create new QR login session
  if (req.method === "POST") {
    console.log("🆕 [QR SESSION] Creating new QR login session");
    const sessionId = uuidv4();
    const now = Date.now();

    globalThis.qrLoginSessions!.set(sessionId, {
      sessionId,
      accessToken: null,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_MS,
    });

    // Use production URL instead of localhost
    const confirmUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://san-gamma.vercel.app";
    const fullConfirmUrl = `${confirmUrl}/api/qr-session`;

    // QR code data contains the session ID and API endpoint for confirmation
    const qrData = JSON.stringify({
      type: "qr_login",
      sessionId,
      confirmUrl: fullConfirmUrl,
    });

    console.log("✅ [QR SESSION] Session created:", { sessionId, confirmUrl: fullConfirmUrl, expiresIn: SESSION_EXPIRY_MS / 1000 });

    return res.status(200).json({
      status: true,
      sessionId,
      qrData,
      expiresIn: SESSION_EXPIRY_MS / 1000,
    });
  }

  // GET: Check session status (polling)
  if (req.method === "GET") {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ status: false, error: "Session ID required" });
    }

    const session = globalThis.qrLoginSessions!.get(sessionId);

    if (!session) {
      return res.status(404).json({ status: false, error: "Session not found or expired" });
    }

    if (Date.now() > session.expiresAt) {
      globalThis.qrLoginSessions!.delete(sessionId);
      return res.status(410).json({ status: false, error: "Session expired" });
    }

    if (session.accessToken) {
      // Clean up session after successful login
      globalThis.qrLoginSessions!.delete(sessionId);
      return res.status(200).json({
        status: true,
        loggedIn: true,
        accessToken: session.accessToken,
      });
    }

    return res.status(200).json({
      status: true,
      loggedIn: false,
      remainingTime: Math.floor((session.expiresAt - Date.now()) / 1000),
    });
  }

  // PUT: Receive access_token from daihan app (confirm login)
  if (req.method === "PUT") {
    console.log("🔔 [QR SESSION] PUT request received");
    const { sessionId, accessToken } = req.body;
    console.log("📋 [QR SESSION] Session ID:", sessionId);
    console.log("🔑 [QR SESSION] Access token length:", accessToken?.length || 0);

    if (!sessionId || !accessToken) {
      console.error("❌ [QR SESSION] Missing required fields");
      return res.status(400).json({ status: false, error: "Session ID and access token required" });
    }

    const session = globalThis.qrLoginSessions!.get(sessionId);

    if (!session) {
      console.error("❌ [QR SESSION] Session not found:", sessionId);
      console.log("📊 [QR SESSION] Active sessions:", Array.from(globalThis.qrLoginSessions!.keys()));
      return res.status(404).json({ status: false, error: "Session not found or expired" });
    }

    if (Date.now() > session.expiresAt) {
      console.error("❌ [QR SESSION] Session expired:", sessionId);
      globalThis.qrLoginSessions!.delete(sessionId);
      return res.status(410).json({ status: false, error: "Session expired" });
    }

    // Update session with access token
    session.accessToken = accessToken;
    globalThis.qrLoginSessions!.set(sessionId, session);
    console.log("✅ [QR SESSION] Session updated with access token");

    return res.status(200).json({
      status: true,
      message: "Login confirmed successfully",
    });
  }

  return res.status(405).json({ status: false, error: "Method not allowed" });
}
