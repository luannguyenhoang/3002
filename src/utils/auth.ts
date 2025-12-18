// utils/auth.ts
export async function checkPermission(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://cms.aum.vn/auth/check-permission", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
      // nếu cần gửi cookie/credentials:
      // credentials: "include",
    });

    if (!res.ok) {
      console.error("Check permission failed", res.status);
      return false;
    }

    const data = await res.json();
    console.log("Permission result:", data);
    return data.allowed === true;
  } catch (err) {
    console.error("Error calling check-permission", err);
    return false;
  }
}
