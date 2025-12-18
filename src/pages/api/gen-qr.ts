import { NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";
import { v4 as uuidv4 } from 'uuid';

// Khai báo lưu trữ challenge
declare global {
  var challengeStore: Record<string, boolean> | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { verifyUrl } = req.body; // URL từ frontend
  const qr = await QRCode.toDataURL(verifyUrl); // Tạo mã QR từ URL đăng nhập Keycloak

  // Tạo challenge ngẫu nhiên và lưu vào bộ nhớ
  const challenge = uuidv4();
  globalThis.challengeStore = globalThis.challengeStore || {};
  globalThis.challengeStore[challenge] = false;

  res.status(200).json({ challenge, qr });
}
