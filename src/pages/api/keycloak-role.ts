import type { NextApiRequest, NextApiResponse } from "next";

import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const keycloakUrl = 'https://keycloak.devlab.info.vn'; // Thay bằng URL Keycloak của bạn
  const realm = 'master'; // Thay bằng realm bạn muốn lấy
  const roleName = 'WEB'; // Tên role bạn muốn lấy thông tin

  const clientId = 'admin-cli'; // Client ID, thường là 'admin-cli' trong trường hợp này
  const username = 'admin'; // Tên tài khoản admin thật
  const password = 'admin'; // Mật khẩu tài khoản admin thật
  const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  try {
    // Lấy access_token từ Keycloak bằng Password Grant Flow
    const tokenResponse = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'password', // Dùng Password Grant Flow
        client_id: clientId,
        username: username,  // Tài khoản admin thật
        password: password,  // Mật khẩu admin thật
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Dùng access_token để lấy thông tin role
    const roleResponse = await axios.get(
      `${keycloakUrl}/admin/realms/${realm}/roles/${roleName}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.status(200).json(roleResponse.data); // Trả về thông tin role
  } catch (error) {
    console.error('Error fetching Keycloak role:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
