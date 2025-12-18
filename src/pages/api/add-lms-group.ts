import type { NextApiRequest, NextApiResponse } from "next"
import jwt_decode from "jwt-decode"

const KEYCLOAK = "https://keycloak.devlab.info.vn"
const REALM = "master"

// UAT
const ADMIN_REALM = "master"
const ADMIN_USER = "admin"
const ADMIN_PASS = "admin"

const LMS_GROUP = "Grp_ome_lms_active"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" })

  const { accessToken } = req.body
  if (!accessToken)
    return res.status(400).json({ error: "Missing accessToken" })

  try {
    // 1️⃣ lấy userId từ token user
    const decoded: any = jwt_decode(accessToken)
    const userId = decoded.sub

    // 2️⃣ lấy admin token
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
    )

    const tokenData = await tokenRes.json()
    const adminToken = tokenData.access_token
    if (!adminToken) throw new Error("Cannot get admin token")

    // 3️⃣ lấy group LMS
    const groupRes = await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/groups?max=200`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    const groups = await groupRes.json()
    const group = groups.find((g: any) => g.name === LMS_GROUP)
    if (!group) throw new Error("Group LMS not found")

    // 4️⃣ add user vào group
    await fetch(
      `${KEYCLOAK}/admin/realms/${REALM}/users/${userId}/groups/${group.id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    )

    return res.status(200).json({
      status: true,
      message: "User added to LMS group",
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
