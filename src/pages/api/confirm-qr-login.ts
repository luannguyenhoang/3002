import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ status: false, error: "Method not allowed" });
    }

    const { sessionId, accessToken, confirmUrl } = req.body;

    console.log("🔔 [API] confirm-qr-login called");
    console.log("📋 [API] Session ID:", sessionId);
    console.log("🌐 [API] Confirm URL:", confirmUrl);
    console.log("🔑 [API] Access token length:", accessToken?.length || 0);

    if (!sessionId || !accessToken || !confirmUrl) {
        console.error("❌ [API] Missing required fields");
        return res.status(400).json({
            status: false,
            error: "Session ID, access token, and confirm URL are required",
        });
    }

    try {
        // Forward the access token to target app's API
        console.log("📡 [API] Sending PUT request to:", confirmUrl);

        const response = await fetch(confirmUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sessionId,
                accessToken,
            }),
        });

        console.log("📥 [API] Response status:", response.status, response.statusText);

        const data = await response.json();
        console.log("📄 [API] Response data:", data);

        if (!response.ok || !data.status) {
            console.error("❌ [API] Request failed");
            return res.status(response.status).json({
                status: false,
                error: data.error || "Failed to confirm login",
            });
        }

        console.log("✅ [API] Login confirmed successfully");
        return res.status(200).json({
            status: true,
            message: "Login confirmed successfully",
        });
    } catch (err) {
        const error = err as Error;
        console.error("❌ [API] Exception occurred:", {
            message: error.message,
            name: error.name,
        });
        return res.status(500).json({
            status: false,
            error: "Failed to confirm login: " + error.message,
        });
    }
}
