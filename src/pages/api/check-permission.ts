// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ status: false, reason: "method_not_allowed" });
//   }

//   try {
//     const { token, domain } = req.body;
// console.log(token)
//     if (!token || !domain) {
//       return res.status(400).json({
//         status: false,
//         reason: "missing_fields",
//         message: "token và domain là bắt buộc",
//       });
//     }

//     const response = await fetch(
//       "http://it-datnt.aum.local.net:8049/keycloak/keycloak/check-permission",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, domain }),
//       }
//     );

//     const data = await response.json();
//     console.log("🟥 Raw Odoo:", data);

//     return res.status(response.status).json(data);

//   } catch (err: any) {
//     return res.status(500).json({
//       status: false,
//       reason: "server_error",
//       message: err.message,
//     });
//   }
// }
// import type { NextApiRequest, NextApiResponse } from "next";
// import axios from "axios";
// import jwt_decode from "jwt-decode";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { token, domain } = req.body;

//   if (!token) return res.status(400).json({ status: false, message: "Missing token" });

//   const keycloakUrl = "https://keycloak.devlab.info.vn";
//   const realm = "master";
//   const roleName = "OME";

//   try {
//     // 1️⃣ Decode token của USER
//     const decoded: any = jwt_decode(token);
//     const userGroups = decoded?.groups || decoded?.group || [];

//     console.log("👤 USER GROUPS:", userGroups);

//     // 2️⃣ Lấy access_token của admin để gọi API
//     const adminTokenRes = await axios.post(
//       `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
//       new URLSearchParams({
//         grant_type: "password",
//         client_id: "admin-cli",
//         username: "admin",
//         password: "admin",
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const adminToken = adminTokenRes.data.access_token;

//     // 3️⃣ Lấy thông tin ROLE từ Keycloak
//     const roleRes = await axios.get(
//       `${keycloakUrl}/admin/realms/${realm}/roles/${roleName}`,
//       {
//         headers: { Authorization: `Bearer ${adminToken}` },
//       }
//     );

//     const role = roleRes.data;
//     console.log(role)
//     const roleGroups = role?.attributes?.groups || [];

//     console.log("🔵 ROLE GROUPS:", roleGroups);

//     // 4️⃣ Compare
//     const match = userGroups.some((g: string) => roleGroups.includes(g));

//     if (!match) {
//       return res.status(200).json({
//         status: false,
//         message: "User does not match role groups",
//       });
//     }

//     // (Optional) check domain
//     const roleDomains = role?.attributes?.domain || role?.attributes["domain "] || [];
//     const domainMatch = roleDomains.includes(domain);

//     if (!domainMatch) {
//       return res.status(200).json({
//         status: false,
//         message: "Domain not allowed",
//       });
//     }

//     // 5️⃣ OK
//     return res.status(200).json({
//       status: true,
//       message: "Permission granted",
//     });

//   } catch (err: any) {
//     console.error("❌ ERROR:", err.response?.data || err);
//     return res.status(500).json({ status: false, message: "Internal error" });
//   }
// }
// import type { NextApiRequest, NextApiResponse } from "next";
// import axios from "axios";
// import jwt_decode from "jwt-decode";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { token, domain } = req.body;

//   if (!token) {
//     return res.status(400).json({ status: false, message: "Missing token" });
//   }
//  console.log(token)
//   const keycloakUrl = "https://keycloak.devlab.info.vn";
//   const realm = "master";
//   const roleName = "OMEDH";

//   try {
//     /** 1️⃣ Decode token người dùng */
//     const decoded: any = jwt_decode(token);

//     let userGroups: string[] = [];

//     if (Array.isArray(decoded.groups)) {
//       userGroups = decoded.groups.map((g: string) => g.replace("/", ""));
//     }

//     console.log("👤 USER GROUPS:", userGroups);

//     /** 2️⃣ Admin token */
//     const adminTokenRes = await axios.post(
//       `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
//       new URLSearchParams({
//         grant_type: "password",
//         client_id: "admin-cli",
//         username: "admin",
//         password: "admin",
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const adminToken = adminTokenRes.data.access_token;

//     /** 3️⃣ Lấy role */
//     const roleRes = await axios.get(
//       `${keycloakUrl}/admin/realms/${realm}/roles/${roleName}`,
//       {
//         headers: { Authorization: `Bearer ${adminToken}` },
//       }
//     );

//     const role = roleRes.data;
// console.log(role)
//     /** -------------------------------------- **/
//     /** 🔥🔥 FIX QUAN TRỌNG NHẤT — TÁCH STRING GROUPS **/
//     /** -------------------------------------- **/

//     let roleGroups: string[] = [];
//     if (Array.isArray(role.attributes?.groups)) {
//       roleGroups = role.attributes.groups[0]
//         .split(",")               // tách theo dấu phẩy
//         .map((g: string) => g.replace("/", "").trim()); // bỏ / và khoảng trắng
//     }

//     console.log("🔵 ROLE GROUPS:", roleGroups);

//     /** 4️⃣ Check group chỉ cần trùng 1 */
//     const matchGroup = userGroups.some((g) => roleGroups.includes(g));

//     if (!matchGroup) {
//       return res.status(200).json({
//         status: false,
//         message: "Group mismatch → Permission denied",
//       });
//     }

//     /** -------------------------------------- **/
//     /** 🔥 FIX DOMAIN — TÁCH STRING DOMAIN **/
//     /** -------------------------------------- **/

//     let roleDomains: string[] = [];
//     let rawDomains = role.attributes?.domain || role.attributes?.["domain "] || [];

//     if (Array.isArray(rawDomains) && rawDomains.length > 0) {
//       roleDomains = rawDomains[0]
//         .split(",")
//         .map((d: string) => d.trim());
//     }

//     console.log("🌐 ROLE DOMAINS:", roleDomains);

//     const matchDomain = roleDomains.includes(domain);

//     if (!matchDomain) {
//       return res.status(200).json({
//         status: false,
//         message: "Domain not allowed",
//       });
//     }

//     /** 5️⃣ OK */
//     return res.status(200).json({
//       status: true,
//       message: "Permission granted",
//     });

//   } catch (err: any) {
//     console.error("❌ ERROR:", err.response?.data || err);
//     return res.status(500).json({
//       status: false,
//       message: "Internal error",
//     });
//   }
// }
// import type { NextApiRequest, NextApiResponse } from "next";
// import axios from "axios";
// import jwt_decode from "jwt-decode";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { token, domain } = req.body;

//   if (!token) {
//     return res.status(400).json({ status: false, message: "Missing token" });
//   }

//   const keycloakUrl = "https://keycloak.devlab.info.vn";
//   const realm = "master";
//   const roleName = "OMEDH";

//   try {
//     /** 1️⃣ Decode Access Token */
//     const decoded: any = jwt_decode(token);

//     /** Lấy roles từ access token */
//     const userRoles: string[] = decoded?.realm_access?.roles || [];
//     console.log("👤 USER ROLES:", userRoles);

//     /** Check role OMEDH trong Access Token */
//     if (!userRoles.includes(roleName)) {
//       return res.status(200).json({
//         status: false,
//         message: "Role missing in access token",
//       });
//     }

//     /** 2️⃣ Lấy Admin Token */
//     const adminTokenRes = await axios.post(
//       `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
//       new URLSearchParams({
//         grant_type: "password",
//         client_id: "admin-cli",
//         username: "admin",
//         password: "admin",
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const adminToken = adminTokenRes.data.access_token;

//     /** 3️⃣ Lấy Role Attribute từ Keycloak */
//     const roleRes = await axios.get(
//       `${keycloakUrl}/admin/realms/${realm}/roles/${roleName}`,
//       { headers: { Authorization: `Bearer ${adminToken}` } }
//     );

//     const role = roleRes.data;
//     console.log("🔵 ROLE OBJECT:", role);

//     /** Roles trong Role Attribute */
//     const roleAttrRoles: string[] = role.attributes?.roles || [];
//     console.log("🔵 ROLE ATTR ROLES:", roleAttrRoles);

//     /** Check OMEDH có trong Role Attribute không */
//     if (!roleAttrRoles.includes(roleName)) {
//       return res.status(200).json({
//         status: false,
//         message: "Role missing in Keycloak role attributes",
//       });
//     }

//     /** 4️⃣ Xử lý Domain trong Role Attribute */
//     let roleDomains: string[] = [];
//     const rawDomains = role.attributes?.domain || [];

//     if (rawDomains.length > 0) {
//       roleDomains = rawDomains[0].split(",").map((d: string) => d.trim());
//     }

//     console.log("🌐 ROLE DOMAINS:", roleDomains);

//     /** Check domain người dùng gửi lên */
//     if (!roleDomains.includes(domain)) {
//       return res.status(200).json({
//         status: false,
//         message: "Domain not allowed",
//       });
//     }

//     /** 5️⃣ ALL PASS */
//     return res.status(200).json({
//       status: true,
//       message: "Permission granted",
//     });

//   } catch (err: any) {
//     console.error("❌ ERROR:", err.response?.data || err);
//     return res.status(500).json({
//       status: false,
//       message: "Internal error",
//     });
//   }
// }
// import type { NextApiRequest, NextApiResponse } from "next";
// import axios from "axios";
// import jwt_decode from "jwt-decode";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST")
//     return res.status(405).json({ message: "Method Not Allowed" });

//   const { token, domain } = req.body;
//   if (!token)
//     return res.status(400).json({ status: false, message: "Missing token" });

//   const keycloakUrl = "https://keycloak.devlab.info.vn";
//   const realm = "master";
//   const roleName = "site_a_ecm";

//   try {
//     /** 1️⃣ Decode token & lấy roles của user */
//     const decoded: any = jwt_decode(token);
//     const userRoles: string[] = decoded?.realm_access?.roles || [];

//     /** 2️⃣ Lấy admin token */
//     const adminTokenRes = await axios.post(
//       `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
//       new URLSearchParams({
//         grant_type: "password",
//         client_id: "admin-cli",
//         username: "admin",
//         password: "admin",
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const adminToken = adminTokenRes.data.access_token;

//     /** 3️⃣ Lấy role object từ Keycloak */
//     const roleRes = await axios.get(
//       `${keycloakUrl}/admin/realms/${realm}/roles/${roleName}`,
//       { headers: { Authorization: `Bearer ${adminToken}` } }
//     );

//     const role = roleRes.data;

//     /** 4️⃣ Tách ROLE ATTR ROLES thành array */
//     const rawRoleAttr = role.attributes?.roles || [];
//     const roleAttrRoles: string[] =
//       rawRoleAttr[0]?.split(",").map((x: string) => x.trim()) || [];

//     /** Check giao nhau giữa roles của user & roles trong attribute */
//     const isValidRole = userRoles.some((r) => roleAttrRoles.includes(r));

//     if (!isValidRole) {
//       return res.status(200).json({
//         status: false,
//         message: "User does not have required role in attributes",
//       });
//     }

//     /** 5️⃣ Tách domain từ attribute */
//     const rawDomains = role.attributes?.domain || [];
//     const roleDomains: string[] =
//       rawDomains[0]?.split(",").map((d: string) => d.trim()) || [];

//     /** Check domain */
//     if (!roleDomains.includes(domain)) {
//       return res.status(200).json({
//         status: false,
//         message: "Domain not allowed",
//       });
//     }

//     /** 6️⃣ Tất cả hợp lệ */
//     return res.status(200).json({
//       status: true,
//       message: "Permission granted",
//     });

//   } catch (err: any) {
//     console.error("❌ ERROR:", err.response?.data || err);
//     return res.status(500).json({
//       status: false,
//       message: "Internal error",
//     });
//   }
// }
import type { NextApiRequest, NextApiResponse } from "next";
import jwt_decode from "jwt-decode";


export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { token } = req.body;
  if (!token)
    return res.status(400).json({ status: false, message: "Missing token" });

  try {
    /** 1️⃣ Decode token */
    const decoded: any = jwt_decode(token);
    const userRoles: string[] = decoded?.realm_access?.roles || [];

    /** 2️⃣ ENV roles */
    const allowedRoles =
      process.env.ECM_ALLOWED_ROLES?.split(",").map(r => r.trim()) || [];

    /** 3️⃣ Check role */
    const hasPermission = userRoles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasPermission) {
      return res.status(200).json({
        status: false,
        message: "User does not have permission",
      });
    }

    /** 4️⃣ OK */
    return res.status(200).json({
      status: true,
      message: "Login allowed",
      roles: userRoles,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({
      status: false,
      message: "Invalid token",
    });
  }
}


