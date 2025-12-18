"use client"

import type React from "react"

import { useContext, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Lock, LogIn, Shield, QrCode, Loader } from "lucide-react"
import { AuthContext } from "@/componet/auth-context"
import { QRCodeSVG } from "qrcode.react"

export default function Page() {
  const { setToken, decodeUser } = useContext(AuthContext)
  const router = useRouter()
  const [mode, setMode] = useState<"choose" | "api" | "keycloak" | "qr">("choose")
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrExpiresIn, setQrExpiresIn] = useState<number>(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const FE_DOMAIN = typeof window !== "undefined" ? window.location.host : ""

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")

    if (code) {
      exchangeCodeForToken(code)
    }
  }, [])

  const exchangeCodeForToken = async (code: string) => {
    try {
      setLoading(true)
      const res = await fetch("https://keycloak.devlab.info.vn/realms/master/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "ome_san",
          code,
          redirect_uri: "https://san-gamma.vercel.app",
        }),
      })

      const data = await res.json()

      if (!data.access_token) {
        setMessage("❌ Không thể đổi code sang token")
        setLoading(false)
        return
      }

      checkPermission(data.access_token)
    } catch (err: any) {
      setMessage("❌ Lỗi khi đổi code → token: " + err.message)
      setLoading(false)
    }
  }

  const checkPermission = async (accessToken: string) => {
    try {
      const res = await fetch("/api/check-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: accessToken,
          domain: FE_DOMAIN,
        }),
      })

      const data = await res.json()
      console.log("🟦 Permission result:", data)

      if (!data.status) {
        setMessage("❌ Không đủ quyền truy cập website này!")
        return
      }

      localStorage.setItem("access_token", accessToken)
      setToken(accessToken)
      decodeUser(accessToken)
      router.push("/")
    } catch (err: any) {
      setMessage("❌ Lỗi check-permission: " + err.message)
    }
  }

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("https://keycloak.devlab.info.vn/realms/master/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "ome_san",
        username,
        password,
      }),
    })

    const data = await res.json()

    if (data.access_token) {
      checkPermission(data.access_token)
    } else {
      setMessage("❌ Sai tài khoản hoặc mật khẩu")
      setLoading(false)
    }
  }

  // QR Login functions
  const generateQRSession = async () => {
    try {
      setLoading(true)
      setMessage("")
      const res = await fetch("/api/qr-session", { method: "POST" })
      const data = await res.json()

      if (!data.status) {
        setMessage("❌ Không thể tạo mã QR")
        setLoading(false)
        return
      }

      setQrSessionId(data.sessionId)
      setQrData(data.qrData)
      setQrExpiresIn(data.expiresIn)
      setLoading(false)

      // Start polling for login confirmation
      startPolling(data.sessionId)
    } catch (err: any) {
      setMessage("❌ Lỗi khi tạo mã QR: " + err.message)
      setLoading(false)
    }
  }

  const startPolling = (sessionId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/qr-session?sessionId=${sessionId}`)
        const data = await res.json()

        if (data.loggedIn && data.accessToken) {
          // Clear polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          // Complete login
          checkPermission(data.accessToken)
        } else if (!data.status) {
          // Session expired or error
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          setMessage("❌ Phiên đăng nhập đã hết hạn")
          setQrSessionId(null)
          setQrData(null)
        } else {
          // Update remaining time
          setQrExpiresIn(data.remainingTime || 0)
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 2000) // Poll every 2 seconds
  }

  // Cleanup polling on unmount or mode change
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Handle mode change to QR
  useEffect(() => {
    if (mode === "qr" && !qrSessionId) {
      generateQRSession()
    } else if (mode !== "qr") {
      // Clear polling when leaving QR mode
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      setQrSessionId(null)
      setQrData(null)
    }
  }, [mode])

  if (mode === "choose")
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-300">
                Website sàn Ome
              </h1>
            </div>
            <p className="text-indigo-200 text-lg font-medium">Chọn phương thức đăng nhập của bạn</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* API Custom Login Card */}
            <button
              onClick={() => setMode("api")}
              className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl hover:from-slate-700/80 hover:to-slate-800/80 border border-purple-500/20 hover:border-purple-400/50 rounded-2xl p-8 transition-all duration-300 text-left shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
            >
              <div className="flex flex-col items-start h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Đăng nhập cơ bản</h3>
                <p className="text-indigo-200/80 text-sm flex-grow leading-relaxed">
                  Sử dụng tài khoản username và mật khẩu của bạn
                </p>
                <div className="text-purple-300 text-sm font-semibold mt-6 group-hover:translate-x-2 transition-transform flex items-center gap-2">
                  Tiếp tục
                  <span className="text-lg">→</span>
                </div>
              </div>
            </button>

            {/* QR Login Card */}
            <button
              onClick={() => setMode("qr")}
              className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl hover:from-slate-700/80 hover:to-slate-800/80 border border-emerald-500/20 hover:border-emerald-400/50 rounded-2xl p-8 transition-all duration-300 text-left shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1"
            >
              <div className="flex flex-col items-start h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/50">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Đăng nhập bằng mã QR</h3>
                <p className="text-indigo-200/80 text-sm flex-grow leading-relaxed">
                  Quét mã QR từ ứng dụng đã đăng nhập
                </p>
                <div className="text-emerald-300 text-sm font-semibold mt-6 group-hover:translate-x-2 transition-transform flex items-center gap-2">
                  Tiếp tục
                  <span className="text-lg">→</span>
                </div>
              </div>
            </button>

            {/* Register Card */}
            <button
              onClick={() => router.push("/register")}
              className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl hover:from-slate-700/80 hover:to-slate-800/80 border border-indigo-500/20 hover:border-indigo-400/50 rounded-2xl p-8 transition-all duration-300 text-left shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1"
            >
              <div className="flex flex-col items-start h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/50">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Chưa có tài khoản</h3>
                <p className="text-indigo-200/80 text-sm flex-grow leading-relaxed">Ấn đăng ký để tạo tài khoản mới</p>
                <div className="text-indigo-300 text-sm font-semibold mt-6 group-hover:translate-x-2 transition-transform flex items-center gap-2">
                  Tiếp tục
                  <span className="text-lg">→</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )

  if (mode === "qr")
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/50">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mb-2">
                Đăng nhập bằng mã QR
              </h2>
              <p className="text-indigo-200/80 text-sm">Quét mã QR từ ứng dụng đã đăng nhập</p>
            </div>

            {/* QR Code Display */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                <p className="text-indigo-200 text-sm">Đang tạo mã QR...</p>
              </div>
            ) : qrData ? (
              <div className="mb-6">
                {/* QR Code */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-4 flex items-center justify-center">
                  <QRCodeSVG value={qrData} size={220} level="H" />
                </div>

                {/* Timer */}
                <div className="text-center mb-4">
                  <p className="text-emerald-300 font-semibold text-sm mb-2">
                    Mã QR hết hạn sau
                  </p>
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-bold text-lg">
                      {Math.floor(qrExpiresIn / 60)}:{String(qrExpiresIn % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <p className="text-indigo-200 text-sm text-center leading-relaxed">
                    Mở ứng dụng <span className="font-bold">đại hàn</span> đã đăng nhập,
                    nhấn <span className="font-bold">"Quét mã QR"</span> và quét mã QR này
                  </p>
                </div>
              </div>
            ) : null}

            {/* Message */}
            {message && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur">
                <p className="text-sm text-red-200 text-center font-medium">{message}</p>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setMode("choose")}
              disabled={loading}
              className="w-full text-indigo-300 hover:text-indigo-200 text-sm font-semibold py-2 transition-colors flex items-center justify-center gap-2"
            >
              <span>←</span> Quay lại
            </button>
          </div>

          {/* Footer Info */}
          <p className="text-center text-indigo-300/60 text-sm mt-6 font-medium">
            Quét mã QR để đăng nhập nhanh chóng
          </p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/50">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-2">
              Đăng nhập
            </h2>
            <p className="text-indigo-200/80 text-sm">Nhập thông tin tài khoản của bạn</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="space-y-5 mb-6">
            <div>
              <label className="block text-sm font-semibold text-indigo-200 mb-2">Tài khoản</label>
              <input
                placeholder="Nhập username của bạn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-indigo-200 mb-2">Mật khẩu</label>
              <input
                placeholder="Nhập mật khẩu của bạn"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur">
              <p className="text-sm text-red-200 text-center font-medium">{message}</p>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => setMode("choose")}
            disabled={loading}
            className="w-full text-indigo-300 hover:text-indigo-200 text-sm font-semibold py-2 transition-colors flex items-center justify-center gap-2"
          >
            <span>←</span> Quay lại
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-center text-indigo-300/60 text-sm mt-6 font-medium">
          Đăng nhập tài khoản của bạn để truy cập hệ thống
        </p>
      </div>
    </div>
  )
}
