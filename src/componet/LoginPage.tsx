import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"custom" | "keycloak" | null>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Đang đăng nhập...");
    try {
      const res = await fetch(
        "https://keycloak.devlab.info.vn/realms/master/protocol/openid-connect/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: "react-app",
            username,
            password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage("🎉 Đăng nhập thành công");
        localStorage.setItem("access_token", data.access_token);
      } else {
        setMessage("❌ " + (data.error_description || JSON.stringify(data)));
      }
    } catch (err: any) {
      setMessage("Lỗi hệ thống: " + err.message);
    }
  };

  const handleKeycloakLogin = () => {
    const redirectUri = "http://localhost:3000/login"; // phải trùng cấu hình trong Keycloak client
    const keycloakUrl =
      "https://keycloak.devlab.info.vn/realms/master/protocol/openid-connect/auth?" +
      new URLSearchParams({
        client_id: "react-app",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
      }).toString();

    console.log("🔗 Redirecting to:", keycloakUrl);
    window.location.href = keycloakUrl;
  };

  if (!mode) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
        <h2>Chọn phương thức đăng nhập</h2>
        <button
          onClick={() => setMode("custom")}
          style={{ padding: 10, margin: 10 }}
        >
          🧩 Đăng nhập bằng tài khoản hệ thống
        </button>
        <button
          onClick={() => setMode("keycloak")}
          style={{ padding: 10, margin: 10 }}
        >
          🔐 Đăng nhập bằng Keycloak UI
        </button>
      </div>
    );
  }

  if (mode === "keycloak") {
    handleKeycloakLogin();
    return <p>Đang chuyển hướng đến Keycloak...</p>;
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2>Đăng nhập Custom</h2>
      <form onSubmit={handleCustomLogin}>
        <div style={{ marginBottom: 10 }}>
          <label>Tài khoản</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <button type="submit" style={{ padding: "8px 16px" }}>
          Đăng nhập
        </button>
      </form>

      <pre
        style={{
          marginTop: 20,
          background: "#f4f4f4",
          padding: 10,
          fontSize: 12,
        }}
      >
        {message}
      </pre>

      <button
        onClick={() => setMode(null)}
        style={{
          marginTop: 20,
          background: "transparent",
          border: "none",
          color: "#0070f3",
          cursor: "pointer",
        }}
      >
        ← Quay lại chọn phương thức
      </button>
    </div>
  );
}
