import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/lib/providers/QueryProvider"
import { WebSocketProvider } from "@/lib/providers/WebSocketProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CapiBobbaBot Dashboard",
  description: "Panel de control moderno para CapiBobbaBot con actualizaciones en tiempo real",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <QueryProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
