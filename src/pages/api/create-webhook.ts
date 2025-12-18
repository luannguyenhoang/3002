// pages/api/create-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, url, name, eventsEnabled } = req.body;

  try {
    // Gửi request tạo webhook đến Keycloak API
    const response = await fetch('https://keycloak.devlab.info.vn/admin/realms/master/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // Dùng token để xác thực
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        url: url, // URL nhận sự kiện từ Keycloak
        enabled: true,
        eventsEnabled: eventsEnabled, // Các sự kiện muốn nhận (LOGIN, REGISTER, ...)
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, webhook: data });
    } else {
      const data = await response.json();
      return res.status(400).json({ error: data.error_description });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
