import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tournament Bracket Generator",
  description: "Create and manage single-elimination tournament brackets",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <h1 className="text-2xl font-bold">
                    <Link href="/" className="hover:text-primary transition-colors">
                      Tournament Bracket Generator
                    </Link>
                  </h1>
                  <nav className="hidden md:flex items-center gap-4">
                    <Link
                      href="/"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Create Tournament
                    </Link>
                    <Link
                      href="/tournaments"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View Tournaments
                    </Link>
                  </nav>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
