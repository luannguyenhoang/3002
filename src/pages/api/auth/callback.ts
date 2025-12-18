import { useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const Callback = () => {
  const router = useRouter();
  const { query } = router;

  useEffect(() => {
    if (query.code) {
      const getAccessToken = async () => {
        try {
          const response = await axios.post(`${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
            client_id: process.env.KEYCLOAK_CLIENT_ID,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
            code: query.code,  // Authorization code từ query params
            redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback`, // Redirect URI
            grant_type: "authorization_code",
          });

          const { access_token, refresh_token } = response.data;
          console.log("Access Token:", access_token);
          console.log("Refresh Token:", refresh_token);

          // Lưu access token vào session hoặc cookie nếu cần
        } catch (error) {
          console.error("Error getting access token:", error);
        }
      };

      getAccessToken();
    }
  }, [query.code]);

  return 
};

export default Callback;
