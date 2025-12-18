import Keycloak, { KeycloakInstance } from "keycloak-js";

let keycloak: KeycloakInstance | null = null;

export function getKeycloak() {
  if (!keycloak) {
    // Kiểm tra và gán giá trị mặc định nếu URL không có giá trị
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://10.10.92.36:8180";

    keycloak = new Keycloak({
      url: keycloakUrl,
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM!,
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
    });
  }
  return keycloak;
}
