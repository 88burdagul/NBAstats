import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import EmailGate from '@/components/EmailGate'

export const metadata: Metadata = {
  title: 'HoopMarket — NBA Player Intelligence',
  description: 'Player ratings, trends, and analysis powered by real NBA performance data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <EmailGate>
            {children}
          </EmailGate>
        </AuthProvider>
      </body>
    </html>
  )
}

