import { useEffect, useState } from 'react';

export default function Home() {
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleInfo = async () => {
      try {
        const res = await fetch('/api/keycloak-role');
        const data = await res.json();
        setRoleInfo(data);
      } catch (error) {
        console.error('Error fetching role info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleInfo();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!roleInfo) {
    return <div>Error loading role info</div>;
  }

  return (
    <div>
      <h1>Role Information</h1>
      <pre>{JSON.stringify(roleInfo, null, 2)}</pre>
    </div>
  );
}
