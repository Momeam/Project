import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// ⭐️ 1. Import Navbar เข้ามา
import Navbar from '@/components/Navbar' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HomeLink - หาบ้าน คอนโด ที่ดิน',
  description: 'เว็บไซต์รวมประกาศซื้อ-ขาย-เช่า อสังหาริมทรัพย์',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        
        {/* ⭐️ 2. ใส่ Navbar ไว้ตรงนี้ (เหนือ main) */}
        <Navbar />
        
        <main className="min-h-screen">
          {children} 
        </main>
        
      </body>
    </html>
  )
}