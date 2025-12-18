import { useState, ChangeEvent } from "react";
import * as XLSX from "xlsx";

export default function UploadPage() {
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet); // [{username, email, ...}]

    const res = await fetch("/api/sync-keycloak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: rows }),
    });

    const data = await res.json();
    alert(data.message || "Đã sync");

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Users → Sync Keycloak</h2>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      {loading && <p>Đang xử lý…</p>}
    </div>
  );
}
