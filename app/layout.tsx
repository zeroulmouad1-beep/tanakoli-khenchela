import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { TrackingProvider } from '@/lib/tracking-context'
import { ThemeProvider } from '@/lib/theme-context'
import { BusSimulationProvider } from '@/lib/bus-simulation'
import { DriverModeProvider } from '@/lib/driver-mode-context'
import { AuthProvider } from '@/lib/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import './globals.css'

const notoArabic = Noto_Sans_Arabic({ 
  subsets: ["arabic"],
  variable: '--font-arabic',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'تنقلي خنشلة | Tanakoli Khenchela',
  description: 'تطبيق النقل الحضري - تتبع الحافلات والمحطات',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#00A651',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${notoArabic.variable} font-sans antialiased theme-transition`}>
        <AuthProvider>
          <ThemeProvider>
            <DriverModeProvider>
              <BusSimulationProvider>
                <TrackingProvider>
                  <AuthGuard>
                    {children}
                  </AuthGuard>
                </TrackingProvider>
              </BusSimulationProvider>
            </DriverModeProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
