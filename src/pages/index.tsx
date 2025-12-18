"use client"

import { useContext, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { LogOut, User, Shield, Mail, Award as IdCard, Hash, Sparkles, QrCode } from "lucide-react"
import { AuthContext } from "@/componet/auth-context"
import dynamic from "next/dynamic"

const QRScanner = dynamic(() => import("@/componet/QRScanner"), { ssr: false })

export default function Home() {
  const { userInfo, logout, loadingUser } = useContext(AuthContext)
  const router = useRouter()
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!loadingUser && !userInfo) {
      router.push("/login")
    }
  }, [loadingUser, userInfo, router])

  // Auto-dismiss scan message after 5 seconds
  useEffect(() => {
    if (scanMessage) {
      const timer = setTimeout(() => {
        setScanMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [scanMessage])

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-200 font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!userInfo) return null

  const handleBuyCourse = async () => {
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) {
      alert("Chưa đăng nhập")
      return
    }

    const res = await fetch("/api/add-lms-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })

    const data = await res.json()

    if (!res.ok || !data.status) {
      alert("❌ Mua khóa học thất bại")
      return
    }

    alert("✅ Đã mua khóa học. Vui lòng đăng nhập LMS để học.")
  }

  const handleQRScan = async (scannedData: string) => {
    try {
      console.log("🔍 [QR SCAN] Raw scanned data:", scannedData);

      const qrPayload = JSON.parse(scannedData)
      console.log("📦 [QR SCAN] Parsed payload:", qrPayload);

      if (qrPayload.type !== "qr_login" || !qrPayload.sessionId || !qrPayload.confirmUrl) {
        console.error("❌ [QR SCAN] Invalid QR payload");
        setScanMessage({ type: 'error', text: 'Mã QR không hợp lệ' });
        setShowQRScanner(false)
        return
      }

      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        console.error("❌ [QR SCAN] No access token found");
        setScanMessage({ type: 'error', text: 'Không tìm thấy token đăng nhập' });
        setShowQRScanner(false)
        return
      }

      console.log("🔑 [QR SCAN] Access token found (length):", accessToken.length);
      console.log("🌐 [QR SCAN] Confirm URL:", qrPayload.confirmUrl);

      // Confirm login by sending access token to target app
      console.log("📡 [QR SCAN] Sending confirmation request...");
      const res = await fetch("/api/confirm-qr-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: qrPayload.sessionId,
          accessToken,
          confirmUrl: qrPayload.confirmUrl,
        }),
      })

      console.log("📥 [QR SCAN] API response status:", res.status);

      const data = await res.json()
      console.log("📄 [QR SCAN] API response data:", data);

      if (!res.ok || !data.status) {
        console.error("❌ [QR SCAN] Login confirmation failed");
        setScanMessage({ type: 'error', text: `Xác nhận đăng nhập thất bại: ${data.error || "Unknown error"}` });
        setShowQRScanner(false)
        return
      }

      console.log("✅ [QR SCAN] Login confirmed successfully!");
      setScanMessage({ type: 'success', text: 'Xác nhận đăng nhập thành công!' });
      setShowQRScanner(false)
    } catch (err) {
      const error = err as Error;
      console.error("❌ [QR SCAN] Exception:", error);
      setScanMessage({ type: 'error', text: `Lỗi: ${error.message}` });
      setShowQRScanner(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-xs text-purple-300">Quản lý tài khoản</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Đăng xuất</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white">
                Xin chào,{" "}
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {userInfo.name || userInfo.preferred_username}
                </span>
              </h2>
            </div>
            <p className="text-purple-200/70 text-lg ml-[52px]">Chào mừng bạn trở lại với hệ thống</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {userInfo.email && (
              <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-purple-300/60 font-semibold">Email</p>
                </div>
                <p className="text-white font-medium text-sm break-all">{userInfo.email}</p>
              </div>
            )}
            {userInfo.name && (
              <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-indigo-300/60 font-semibold">Tên đầy đủ</p>
                </div>
                <p className="text-white font-medium text-sm">{userInfo.name}</p>
              </div>
            )}
            {userInfo.preferred_username && (
              <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <IdCard className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-purple-300/60 font-semibold">Tên đăng nhập</p>
                </div>
                <p className="text-white font-medium text-sm">{userInfo.preferred_username}</p>
              </div>
            )}
            {userInfo.sub && (
              <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-105">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Hash className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-indigo-300/60 font-semibold">User ID</p>
                </div>
                <p className="text-white/80 font-mono text-xs break-all">{userInfo.sub}</p>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Thông tin chi tiết</h3>
            </div>
            <div className="bg-black/20 rounded-xl p-6 overflow-auto max-h-96 border border-white/5">
              <pre className="text-purple-100/80 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Mua khóa học ngay</h3>
                <p className="text-emerald-200/60 text-sm">Truy cập vào hệ thống LMS và bắt đầu học tập</p>
              </div>
              <button
                onClick={handleBuyCourse}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Mua khóa học
              </button>
            </div>
          </div>

          {/* QR Scan Section */}
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Quét mã QR để đăng nhập</h3>
                <p className="text-purple-200/60 text-sm">Quét mã QR từ thiết bị khác để xác nhận đăng nhập</p>
              </div>
              <button
                onClick={() => setShowQRScanner(true)}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Quét mã QR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Scan Message Toast */}
      {scanMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className={`rounded-lg shadow-lg p-4 flex items-center justify-between ${scanMessage.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            }`}>
            <span className="font-medium">{scanMessage.text}</span>
            <button
              onClick={() => setScanMessage(null)}
              className="ml-4 text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
