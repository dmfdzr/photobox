import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { PhotoboxProvider } from "@/components/photobox/PhotoboxProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "SnapBox",
  description: "Create stylish photobox strips from camera or uploaded photos in minutes.",
  icons: {
    icon: "/assets/snapp.png",
    shortcut: "/assets/snapp.png",
    apple: "/assets/snapp.png",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased", fontMono.variable, jakarta.variable)}>
      <body>
        <ThemeProvider>
          <PhotoboxProvider>{children}</PhotoboxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
