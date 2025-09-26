import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'highlight.js/styles/github.css'
import { MCPProvider } from '@/lib/contexts/MCPContext'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
})

export const metadata: Metadata = {
    title: 'AI 채팅 - Gemini & Context7',
    description: 'Gemini API와 Context7 MCP를 활용한 AI 채팅 애플리케이션'
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <MCPProvider>
                    {children}
                </MCPProvider>
            </body>
        </html>
    )
}
