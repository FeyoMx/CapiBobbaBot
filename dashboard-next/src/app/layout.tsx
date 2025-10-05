import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/lib/providers/QueryProvider"
import { WebSocketProvider } from "@/lib/providers/WebSocketProvider"
import { ThemeProvider } from "@/lib/providers/ThemeProvider"

const inter = Inter({ subsets: ["latin"], display: 'swap' })

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
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
