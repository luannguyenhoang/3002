import type { NextApiRequest, NextApiResponse } from "next";

type UserRow = {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  phone2: string;
  groups?: string;       // "LMS;STUDENT"
  realmRoles?: string;   // "LMS_ACTIVE;CAN_LOGIN"
  clientRoles?: string;  // "react-app:USER;react-app:TEACHER"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const logs: string[] = [] // Mảng chứa các log của quy trình

  try {
    const { users } = req.body as { users: UserRow[] };

    const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL!;
    const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM!;
    const ADMIN_USER = process.env.KEYCLOAK_ADMIN!;
    const ADMIN_PASS = process.env.KEYCLOAK_PASSWORD!;

    // 1) Lấy admin token
    const tokenRes = await fetch(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
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

    const tokenJson = await tokenRes.json();
    console.log("Token response:", tokenJson); 
    const token = tokenJson.access_token;

    // Hàm tìm user theo username
    async function findUser(username: string) {
      const r = await fetch(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await r.json();
      console.log(`Found users for ${username}:`, data);  // Debug log
      return data.length ? data[0] : null;
    }

    // Tạo mới user
    async function createUser(u: UserRow) {
      logs.push(`🚀 Tạo user: ${u.username}`);
      await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: u.username,
          email: u.email,
          enabled: true,
          firstName: u.firstname,
          lastName: u.lastname,
          attributes: { phone2: [u.phone2] },
        }),
      });
      return await findUser(u.username);
    }
    // Gán groupa
    async function assignGroups(userId: string, groupsStr?: string) {
      if (!groupsStr) return;
      const groups = groupsStr.split(";").map((g) => g.trim());

      for (const groupName of groups) {
        const gRes = await fetch(
          `${KEYCLOAK_URL}/admin/realms/${REALM}/groups`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const gList = await gRes.json();
        const group = gList.find((g: any) => g.name === groupName);

        if (group) {
          await fetch(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/groups/${group.id}`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          logs.push(`📌 Gán group ${groupName} → OK`);
        }
      }
    }

    // Gán realm role
    async function assignRealmRoles(userId: string, rolesStr?: string) {
      if (!rolesStr) return;
      const roles = rolesStr.split(";").map((r) => r.trim());

      for (const roleName of roles) {
        const rRes = await fetch(
          `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${roleName}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const roleJson = await rRes.json();

        if (roleJson?.id) {
          await fetch(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([{ id: roleJson.id, name: roleJson.name }]),
            }
          );
          logs.push(`🔑 RealmRole ${roleName} → OK`);
        }
      }
    }

    // Gán client role
    async function assignClientRoles(userId: string, clientRolesStr?: string) {
      if (!clientRolesStr) return;

      const pairs = clientRolesStr.split(";").map((p) => p.trim());
      for (const pair of pairs) {
        const [clientId, roleName] = pair.split(":");

        const cRes = await fetch(
          `${KEYCLOAK_URL}/admin/realms/${REALM}/clients`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const clients = await cRes.json();
        const client = clients.find((c: any) => c.clientId === clientId);
        if (!client) continue;

        // Lấy role ID
        const rRes = await fetch(
          `${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${client.id}/roles`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const roleList = await rRes.json();
        const role = roleList.find((r: any) => r.name === roleName);

        if (role) {
          await fetch(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/clients/${client.id}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([{ id: role.id, name: role.name }]),
            }
          );
          logs.push(`🟦 ClientRole ${clientId}:${roleName} → OK`);
        }
      }
    }

    // MAIN LOOP
    for (const u of users) {
      logs.push(`🚀 Xử lý user: ${u.username}`);

      let user = await findUser(u.username);

      if (!user) {
        logs.push("🆕 User chưa tồn tại → tạo mới");
        try {
          user = await createUser(u);  // Tạo mới user nếu không tồn tại
        } catch (error) {
          logs.push(`🚨 Lỗi khi tạo user: ${u.username} }`);
          continue;  // Tiếp tục với user tiếp theo nếu không thể tạo user
        }
      } else {
        logs.push("♻️ User tồn tại → update basic info");
        await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: u.email,
            firstName: u.firstname,
            lastName: u.lastname,
            attributes: { phone2: [u.phone2] },
          }),
        });
      }

      // Gán group và role
      if (user) {
        await assignGroups(user.id, u.groups);
        await assignRealmRoles(user.id, u.realmRoles);
        await assignClientRoles(user.id, u.clientRoles);
      } else {
        logs.push(`🚨 Lỗi: User không tồn tại, không thể gán group/role`);
      }
    }

    return res
      .status(200)
      .json({ message: `Đã đồng bộ xong ${users.length} user`, logs });
  } catch (err) {
    console.error("❌ Lỗi lớn:", err);
    return res.status(500).json({ error: String(err) });
  }
}
