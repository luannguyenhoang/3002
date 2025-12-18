"use client"

import { createContext, type ReactNode, useState, useEffect } from "react"

interface AuthContextType {
    token: string | null
    setToken: (token: string) => void
    userInfo: any
    decodeUser: (tk: string) => void
    logout: () => void
    loadingUser: boolean
}

export const AuthContext = createContext<AuthContextType>({
    token: null,
    setToken: () => { },
    userInfo: null,
    decodeUser: () => { },
    logout: () => { },
    loadingUser: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [userInfo, setUserInfo] = useState<any>(null)
    const [loadingUser, setLoadingUser] = useState(true)
    const fixUtf8 = (s?: string) =>
        s ? decodeURIComponent(escape(s)) : s

    useEffect(() => {
        const saved = localStorage.getItem("access_token")

        if (!saved) {
            setLoadingUser(false)
            return
        }

        setToken(saved)
        decodeUser(saved)
        setLoadingUser(false) // ⭐ KẾT THÚC LOADING Ở ĐÂY
    }, [])


    const decodeUser = (token: string) => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]))

            if (payload.exp * 1000 < Date.now()) {
                throw new Error("Token expired")
            }
            payload.name = fixUtf8(payload.name)
            payload.preferred_username = fixUtf8(payload.preferred_username)
            setUserInfo(payload)
        } catch {
            localStorage.removeItem("access_token")
            setUserInfo(null)
        }
    }



    const logout = () => {
        localStorage.removeItem("access_token")
        setToken(null)
        setUserInfo(null)
        window.location.href = "/login"
    }

    return (
        <AuthContext.Provider value={{ token, setToken, userInfo, decodeUser, logout, loadingUser }}>
            {children}
        </AuthContext.Provider>
    )
}
