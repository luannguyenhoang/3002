'use client'

import { useState, ChangeEvent } from "react"
import * as XLSX from "xlsx"
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [logs, setLogs] = useState<string[]>([])  // To store logs from the API

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)
    setMessage("")
    setIsSuccess(false)
    setLogs([]) // Clear logs before starting new process

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      const res = await fetch("/api/sync-keycloak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: rows }),
      })

      const data = await res.json()

      // If there are logs from the API, append them here
      if (data.logs) {
        setLogs(data.logs)
      }

      setMessage(data.message || "Đã sync thành công")
      setIsSuccess(res.ok)
    } catch (error) {
      setMessage("Có lỗi xảy ra khi xử lý file")
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sync Người Dùng
          </h1>
          <p className="text-muted-foreground">
            Tải lên file Excel hoặc CSV để đồng bộ danh sách người dùng đến Keycloak
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border/50 p-8 space-y-6">
          {/* File Upload Area */}
          <div>
            <label htmlFor="file-upload" className="block">
              <div className="relative">
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  disabled={loading}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={loading}
                  className="w-full py-4 px-6 border-2 border-dashed border-primary/30 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    {loading ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {fileName ? `File: ${fileName}` : "Nhấp hoặc kéo file vào đây"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ: Excel (.xlsx, .xls) hoặc CSV (.csv)
                    </p>
                  </div>
                </button>
              </div>
            </label>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-4 bg-primary/5 rounded-lg">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">
                Đang xử lý dữ liệu...
              </span>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${isSuccess
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${isSuccess
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                  }`}
              >
                {message}
              </p>
            </div>
          )}

          {/* Logs Display */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Logs:</h2>
              <ul className="list-disc pl-6 text-sm text-muted-foreground">
                {logs.map((log, index) => (
                  <li key={index} className="text-sm">
                    {log}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">📋 Yêu cầu:</span> File của bạn phải chứa các cột: username, email và các thông tin người dùng khác.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Dữ liệu của bạn sẽ được xử lý một cách an toàn và bảo mật
          </p>
        </div>
      </div>
    </div>
  )
}
