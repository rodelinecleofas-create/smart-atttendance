import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { validateEnvironment } from '../lib/envValidator'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Attendance',
  description: 'Attendance System',
}

// Validate environment variables on app startup
try {
  validateEnvironment();
} catch (error) {
  console.error('Failed to start application:', error.message);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Navbar />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}