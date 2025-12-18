import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [qr, setQr] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Trạng thái đăng nhập

  const genQR = async () => {
    // Tạo URL đăng nhập OAuth2 của Keycloak
    const keycloakLoginUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}&` +
      `response_type=code&` +
      `scope=openid&` +
      `redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/callback`;

    // Tạo mã QR
    const qr = await axios.post("/api/gen-qr", { verifyUrl: keycloakLoginUrl });

    setQr(qr.data.qr);
    setChallenge(qr.data.challenge);
    setIsLoggedIn(false); // Đặt trạng thái là chưa đăng nhập
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>🔐 QR Login Demo</h1>
      {!isLoggedIn ? (
        <>
          <button
            onClick={genQR}
            style={{
              margin: "1rem",
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Sinh mã QR
          </button>

          {qr && (
            <>
              <img src={qr} alt="QR Code" style={{ margin: "20px auto" }} />
              <p>Challenge: <code>{challenge}</code></p>
            </>
          )}
        </>
      ) : (
        <div>
          <h3>Đăng nhập thành công!</h3>
          {/* Có thể hiển thị Access Token nếu cần */}
        </div>
      )}
    </div>
  );
}
