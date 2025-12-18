"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, CheckCircle, AlertCircle } from "lucide-react";

interface QRScannerProps {
    onScanSuccess: (data: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(true);
    const [success, setSuccess] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        if (isMounted) {
                            setSuccess(true);
                            setScanning(false);
                            html5QrCode.stop().then(() => {
                                setTimeout(() => {
                                    if (isMounted) {
                                        onScanSuccess(decodedText);
                                    }
                                }, 300);
                            }).catch((err) => {
                                console.error("Scanner stop error:", err);
                                setTimeout(() => {
                                    if (isMounted) {
                                        onScanSuccess(decodedText);
                                    }
                                }, 300);
                            });
                        }
                    },
                    () => {
                        // QR code not found - ignore
                    }
                );
            } catch (err) {
                if (isMounted) {
                    const error = err as Error;
                    setError(
                        error.message || "Không thể truy cập camera. Vui lòng cấp quyền camera."
                    );
                    setScanning(false);
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch((err) => {
                        console.log("Scanner stop error (ignorable):", err);
                    });
                } catch (err) {
                    console.log("Scanner cleanup error (ignorable):", err);
                }
            }
        };
    }, [onScanSuccess]);

    const handleClose = () => {
        if (scannerRef.current) {
            try {
                scannerRef.current.stop().catch((err) => {
                    console.log("Scanner close error (ignorable):", err);
                });
            } catch (err) {
                console.log("Scanner stop error (ignorable):", err);
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header - Purple theme for san app */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Quét mã QR</h2>
                            <p className="text-purple-100 text-sm">Đưa mã QR vào khung hình</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Scanner area */}
                <div className="p-6">
                    {error ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-red-600 font-medium mb-2">Lỗi camera</p>
                            <p className="text-slate-500 text-sm mb-4">{error}</p>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    ) : success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-green-600 font-bold text-lg mb-2">
                                Quét thành công!
                            </p>
                            <p className="text-slate-500 text-sm">Đang xử lý đăng nhập...</p>
                        </div>
                    ) : (
                        <>
                            <div
                                id="qr-reader"
                                ref={containerRef}
                                className="rounded-xl overflow-hidden bg-slate-100"
                                style={{ width: "100%", minHeight: "300px" }}
                            />
                            {scanning && (
                                <p className="text-center text-slate-500 text-sm mt-4">
                                    Đang chờ quét mã QR...
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
