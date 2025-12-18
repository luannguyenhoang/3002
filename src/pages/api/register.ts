import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { username, email, password, firstName, lastName } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Missing username or password" });

  // ===== CONFIG =====
  const KEYCLOAK = "https://keycloak.devlab.info.vn";
  const REALM = "master";
  const ADMIN_REALM = "master";
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin";
  const GROUP_NAME = "Grp_ome_san_customer";

  try {
    // =========================================================
    // 1️⃣ GET ADMIN TOKEN
    // =========================================================
    const tokenRes = await fetch(
      `${KEYCLOAK}/realms/${ADMIN_REALM}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "password",
          client_id: "admin-cli",
          username: ADMIN_USER,
          password: ADMIN_PASS,
        }),
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token)
      return res.status(500).json({ error: "Cannot get admin token" });

    const adminToken = tokenData.access_token;

    // =========================================================
    // 2️⃣ CHECK USER EXIST
    // =========================================================
    const existRes = await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/users?username=${username}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const existList = await existRes.json();
    if (existList.length > 0)
      return res.status(400).json({ error: "User already exists" });

    // =========================================================
    // 3️⃣ CREATE USER
    // =========================================================
    const createRes = await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
          enabled: true,
          emailVerified: true,
          credentials: [
            { type: "password", value: password, temporary: false },
          ],
        }),
      }
    );

    if (createRes.status !== 201)
      return res.status(500).json({ error: "User creation failed" });

    // =========================================================
    // 4️⃣ GET USER ID
    // =========================================================
    const userRes = await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/users?username=${username}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const [user] = await userRes.json();
    const userId = user?.id;
    if (!userId)
      return res.status(500).json({ error: "Cannot get userId" });

    // =========================================================
    // 5️⃣ ADD USER TO GROUP (AUTO GET ROLE)
    // =========================================================
    const groupRes = await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/groups`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const groups = await groupRes.json();
    const group = groups.find((g: any) => g.name === GROUP_NAME);

    if (!group)
      return res.status(500).json({ error: "Group not found" });

    const addGroup = await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/users/${userId}/groups/${group.id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (addGroup.status !== 204)
      return res.status(500).json({ error: "Add group failed" });

    // =========================================================
    // 6️⃣ DONE
    // =========================================================
    return res.status(200).json({
      message: "User created & added to group successfully",
      userId,
      groupAssigned: GROUP_NAME,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
