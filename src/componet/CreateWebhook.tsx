import { useState, useContext } from "react";
import { AuthContext } from "../pages/_app"; // Import đúng đường dẫn context

const CreateWebhook = () => {
  const { token } = useContext(AuthContext); // Lấy token từ context
  const [url, setUrl] = useState("");
  const [name, setName] = useState("Test Webhook");
  const [eventsEnabled, setEventsEnabled] = useState(["LOGIN", "REGISTER"]); // Mặc định các sự kiện cần theo dõi
  const [message, setMessage] = useState("");

  console.log("Webhook token in CreateWebhook:", token); // Debug token

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage("Chưa có token đăng nhập.");
      return;
    }

    setMessage("Đang tạo webhook...");

    const response = await fetch("/api/create-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,  // Gửi token để xác thực API
        url: url,
        name: name,
        eventsEnabled: eventsEnabled,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(`Webhook đã tạo thành công: ${JSON.stringify(data.webhook)}`);
    } else {
      setMessage(`Lỗi: ${data.error || data.error_description}`);
    }
  };

  return (
    <div>
      <h2>Tạo Webhook</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Tên Webhook:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Sự kiện cần nhận:</label>
          <select
            multiple
            value={eventsEnabled}
            onChange={(e) =>
              setEventsEnabled(Array.from(e.target.selectedOptions, (option) => option.value))
            }
          >
            <option value="LOGIN">Login</option>
            <option value="REGISTER">Register</option>
            <option value="UPDATE_PROFILE">Update Profile</option>
          </select>
        </div>
        <button type="submit">Tạo Webhook</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default CreateWebhook;
