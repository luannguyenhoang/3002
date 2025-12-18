export default function Profile({ keycloak }: any) {
  if (!keycloak?.authenticated) return <p>Please login first</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Profile</h1>
      <p>Username: {keycloak.tokenParsed?.preferred_username}</p>
      <p>Email: {keycloak.tokenParsed?.email}</p>
    </div>
  );
}
