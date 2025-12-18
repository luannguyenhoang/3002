"use client"

import type React from "react"

import { useState } from "react"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("🔄 Đang xử lý...")

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password,firstName, lastName }),
    })

    const data = await res.json()
    setIsLoading(false)

    if (res.ok) {
      setMessage("🎉 Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.")
      setUsername("")
      setEmail("")
      setPassword("")
    } else {
      setMessage(`❌ Lỗi: ${data.error}`)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          maxWidth: "450px",
          width: "100%",
          padding: "48px 40px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1a202c",
              margin: "0 0 8px 0",
            }}
          >
            Đăng ký tài khoản sàn OME
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#718096",
              margin: "0",
            }}
          >
            Tạo tài khoản mới để bắt đầu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Username Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              Tên đăng nhập
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={username}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ""); // chỉ giữ số
                setUsername(val);
              }}
              required
              placeholder="Nhập số"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          {/* Last Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#2d3748" }}>
              Họ
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Nhập họ"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea"
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          {/* First Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#2d3748" }}>
              Tên
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Nhập tên"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea"
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          {/* Email Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea"
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea"
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "12px 16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "8px",
              transition: "all 0.3s ease",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(102, 126, 234, 0.3)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }
            }}
          >
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              background: message.includes("🎉") ? "#f0fdf4" : "#fef2f2",
              border: `1.5px solid ${message.includes("🎉") ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "8px",
              fontSize: "14px",
              color: message.includes("🎉") ? "#166534" : "#991b1b",
              textAlign: "center",
              lineHeight: "1.5",
            }}
          >
            {message}
          </div>
        )}

        {/* Footer */}
        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#718096",
            textAlign: "center",
            margin: "24px 0 0 0",
          }}
        >
          Bạn đã có tài khoản?{" "}
          <a
            href="/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Đăng nhập ngay
          </a>
        </p>
      </div>
    </div>
  )
}
