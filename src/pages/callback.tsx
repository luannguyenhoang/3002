import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const Callback = () => {
    const router = useRouter();
    const { query } = router;

    // State để lưu Access Token và trạng thái đăng nhập
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Trạng thái đăng nhập

    useEffect(() => {
        if (query.code) {
            console.log("Received Authorization Code:", query.code); // Log Authorization Code để kiểm tra
            const getAccessToken = async () => {
                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`,
                        new URLSearchParams({
                            client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
                            client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET!,
                            code: query.code as string, // Authorization code từ query params
                            redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback`,
                            grant_type: "authorization_code",
                        })
                    );

                    console.log("Access Token Response:", response.data); // Log thông tin phản hồi từ Keycloak

                    const { access_token, refresh_token } = response.data;
                    setAccessToken(access_token);
                    setIsLoggedIn(true); // Đánh dấu người dùng đã đăng nhập thành công

                } catch (error) {
                    console.error("Error getting access token:", error);
                    setError("Error while fetching Access Token.");
                }
            };

            getAccessToken();
        }
    }, [query.code]);

    return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
            <h1>Đang xử lý đăng nhập...</h1>

            {/* Hiển thị thông báo khi đăng nhập thành công */}
            {isLoggedIn ? (
                <div>
                    <h3>Đăng nhập thành công!</h3>
                    <p>Access Token:</p>
                    <pre>{accessToken}</pre> {/* Hiển thị Access Token nếu cần */}
                </div>
            ) : error ? (
                <div style={{ color: "red" }}>{error}</div>
            ) : (
                <div>Đang lấy Access Token...</div>
            )}
        </div>
    );
};

export default Callback;
