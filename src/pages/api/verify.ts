import { NextApiRequest, NextApiResponse } from "next";

// ✅ fix type lỗi globalThis
declare global {
  var challengeStore: Record<string, boolean> | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { challenge } = req.query as { challenge: string };

    // Kiểm tra challenge đã tồn tại chưa
    const store = globalThis.challengeStore || {};

    if (!store[challenge]) {
      return res.status(400).json({ error: "Challenge not found or expired" });
    }

    // Kiểm tra trạng thái challenge đã sử dụng chưa
    if (store[challenge]) {
      return res.status(400).json({ error: "Challenge already used" });
    }

    // Sau khi challenge hợp lệ, trả về thành công
    res.status(200).json({ success: true, challenge });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
