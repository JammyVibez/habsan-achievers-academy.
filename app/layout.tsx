import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { NetworkStatusProvider } from "@/components/offline/network-status-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "HABSAN ACHIEVERS ACADEMY - Quality Education for All",
  description:
    "HABSAN ACHIEVERS ACADEMY (H.A.A) - A leading Nigerian educational institution offering quality education from Pre-Nursery to Secondary School (SS3)",
  keywords: "Nigerian school, private school, quality education, Abuja school, primary school, secondary school",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/school-icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/school-icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HAA School',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B4D2C',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${poppins.variable} antialiased`}>
        <NetworkStatusProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </NetworkStatusProvider>
        <Analytics />
      </body>
    </html>
  )
}
