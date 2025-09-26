'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Square, Bot, User, Trash2, Server } from 'lucide-react'

type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
}

const STORAGE_KEY = 'chat:session:v1'

export default function Home() {
    const markdownComponents: Components = {
        code({ className, children, ...props }) {
            const codeText = String(children).replace(/\n$/, '')
            const isInline =
                !/(^|\s)language-[\w-]+/.test(className || '') &&
                !codeText.includes('\n')
            if (isInline) {
                return (
                    <code
                        className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 font-mono"
                        {...props}
                    >
                        {children}
                    </code>
                )
            }
            return (
                <div className="relative group">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(codeText)
                            } catch {}
                        }}
                        className="absolute top-2 right-2 rounded-md border px-2 py-1 text-xs bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-gray-700 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition"
                    >
                        복사
                    </button>
                    <pre className="overflow-x-auto rounded-md bg-gray-950 text-gray-100 p-3 text-[0.9em]">
                        <code className={className}>{codeText}</code>
                    </pre>
                </div>
            )
        },
        a({ href, children, ...props }) {
            return (
                <a
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors duration-200"
                    {...props}
                >
                    {children}
                </a>
            )
        },
        table({ children }) {
            return (
                <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full border-collapse text-sm text-slate-700 dark:text-slate-300">
                        {children}
                    </table>
                </div>
            )
        },
        p({ children, ...props }) {
            return (
                <p className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed" {...props}>
                    {children}
                </p>
            )
        },
        h1({ children, ...props }) {
            return (
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 mt-6" {...props}>
                    {children}
                </h1>
            )
        },
        h2({ children, ...props }) {
            return (
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-5" {...props}>
                    {children}
                </h2>
            )
        },
        h3({ children, ...props }) {
            return (
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 mt-4" {...props}>
                    {children}
                </h3>
            )
        },
        ul({ children, ...props }) {
            return (
                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 mb-3 space-y-1" {...props}>
                    {children}
                </ul>
            )
        },
        ol({ children, ...props }) {
            return (
                <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 mb-3 space-y-1" {...props}>
                    {children}
                </ol>
            )
        },
        li({ children, ...props }) {
            return (
                <li className="text-slate-700 dark:text-slate-300 leading-relaxed" {...props}>
                    {children}
                </li>
            )
        }
    }
    
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const abortRef = useRef<AbortController | null>(null)
    const endRef = useRef<HTMLDivElement | null>(null)
    const hasLoadedRef = useRef(false)

    // 세션 초기화 함수
    const clearSession = () => {
        setMessages([])
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
    }

    // Load persisted messages only on client after mount to avoid SSR mismatch
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) setMessages(JSON.parse(raw) as ChatMessage[])
        } catch {}
        hasLoadedRef.current = true
    }, [])

    // Persist messages after initial load is done
    useEffect(() => {
        if (!hasLoadedRef.current) return
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        } catch {}
    }, [messages])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const canSend = useMemo(
        () => input.trim().length > 0 && !loading,
        [input, loading]
    )

    async function handleSend(e?: React.FormEvent) {
        e?.preventDefault()
        const prompt = input.trim()
        if (!prompt || loading) return

        setInput('')
        setLoading(true)
        const controller = new AbortController()
        abortRef.current = controller

        const userMsg: ChatMessage = { role: 'user', content: prompt }
        const aiMsg: ChatMessage = { role: 'assistant', content: '' }
        setMessages(prev => [...prev, userMsg, aiMsg])

        try {
            // 대화 히스토리를 API에 전송 (현재 메시지 제외)
            const historyForAPI = messages.slice(0, -1) // 마지막 AI 메시지 제외
            
            console.log('🚀 API 호출 시작:', prompt)
            const res = await fetch(
                `/api/chat/stream?q=${encodeURIComponent(prompt)}&history=${encodeURIComponent(JSON.stringify(historyForAPI))}`,
                {
                    method: 'GET',
                    headers: { Accept: 'text/event-stream' },
                    signal: controller.signal
                }
            )
            console.log('📡 API 응답 상태:', res.status, res.ok)
            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let assistantBuffer = ''
            let sseBuffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    console.log('🏁 스트리밍 완료')
                    break
                }
                const chunk = decoder.decode(value, { stream: true })
                console.log('📦 수신 청크:', chunk)
                console.log('📦 청크 길이:', chunk.length)
                sseBuffer += chunk
                console.log('📦 누적 버퍼:', sseBuffer)
                const events = sseBuffer.split(/\n\n/)
                // 보류 중인 마지막 토막은 버퍼에 남겨 다음 루프에서 이어붙인다
                sseBuffer = events.pop() ?? ''
                console.log('📋 파싱된 이벤트 수:', events.length)
                console.log('📋 이벤트들:', events)
                for (const line of events) {
                    console.log('🔍 파싱할 라인:', line)
                    const m = line.match(/^data: (.*)$/m)
                    if (!m) {
                        console.log('⚠️ data: 패턴 매치 실패:', line)
                        continue
                    }
                    console.log('✅ data: 패턴 매치 성공:', m[1])
                    try {
                        const evt = JSON.parse(m[1])
                        console.log('📨 파싱된 이벤트:', evt)
                        if (
                            evt.type === 'text' &&
                            typeof evt.delta === 'string'
                        ) {
                            assistantBuffer += evt.delta
                            console.log('🔵 스트리밍 델타:', evt.delta)
                            console.log('🔵 누적 버퍼:', assistantBuffer)
                            console.log('🔵 소스:', evt.source || 'unknown')
                            console.log('🔵 타임스탬프:', evt.timestamp || 'unknown')
                            
                            setMessages(prev => {
                                const next = [...prev]
                                next[next.length - 1] = {
                                    role: 'assistant',
                                    content: assistantBuffer
                                }
                                console.log('🟢 메시지 업데이트됨:', next[next.length - 1])
                                return next
                            })
                        } else if (evt.type === 'error') {
                            console.log('❌ 에러 이벤트:', evt)
                            throw new Error(evt.message || '오류')
                        } else if (evt.type === 'done') {
                            console.log('✅ 스트리밍 완료:', evt)
                        }
                    } catch {}
                }
            }
        } catch (error) {
            setMessages(prev => {
                const next = [...prev]
                const last = next[next.length - 1]
                next[next.length - 1] = {
                    role: 'assistant',
                    content:
                        (last?.content || '') +
                        `\n\n[에러] ${
                            error instanceof Error
                                ? error.message
                                : '요청 중 오류가 발생했습니다.'
                        }`
                }
                return next
            })
        } finally {
            setLoading(false)
            abortRef.current = null
        }
    }

    function handleStop() {
        abortRef.current?.abort()
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* 헤더 */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    AI Assistant
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Powered by Gemini 2.0
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                ● Online
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = '/mcp'}
                                className="h-8 px-3 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            >
                                <Server className="h-4 w-4 mr-1.5" />
                                MCP 관리
                            </Button>
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSession}
                                    className="h-8 px-3 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 채팅 영역 */}
            <div className="flex-1 max-w-4xl mx-auto px-6 py-6">
                <div className="h-[calc(100vh-200px)] overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl">
                    <ScrollArea className="h-full p-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                                    <Bot className="h-10 w-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                        안녕하세요! 👋
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                        무엇이든 물어보세요. AI가 도와드리겠습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {['안녕하세요', '코딩 도움', '설명해주세요', '도와주세요'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setInput(suggestion)}
                                            className="px-4 py-2 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((m, i) => {
                                    const isLastAssistant =
                                        m.role === 'assistant' &&
                                        i === messages.length - 1 &&
                                        loading
                                    return (
                                        <div
                                            key={i}
                                            className={`flex gap-4 message-enter ${
                                                m.role === 'user'
                                                    ? 'justify-end'
                                                    : 'justify-start'
                                            }`}
                                        >
                                            {m.role === 'assistant' && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                        <Bot className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[75%] ${
                                                    m.role === 'user'
                                                        ? 'order-1'
                                                        : 'order-2'
                                                }`}
                                            >
                                                <div
                                                    className={`rounded-3xl px-6 py-4 shadow-lg ${
                                                        m.role === 'user'
                                                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                                                            : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50'
                                                    }`}
                                                >
                                                    {m.role === 'assistant' ? (
                                                        <div className="space-y-3">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                rehypePlugins={[
                                                                    rehypeHighlight
                                                                ]}
                                                                components={
                                                                    markdownComponents
                                                                }
                                                            >
                                                                {m.content}
                                                            </ReactMarkdown>
                                                            {isLastAssistant && loading && (
                                                                <div className="flex items-center gap-2 mt-3">
                                                                    <div className="flex space-x-1">
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                                    </div>
                                                                    <span className="text-sm text-slate-500 dark:text-slate-400">AI가 답변을 생성하고 있습니다...</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-white font-medium leading-relaxed">
                                                            {m.content}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {m.role === 'user' && (
                                                <div className="flex-shrink-0 order-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                <div ref={endRef} />
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* 입력창 */}
            <div className="sticky bottom-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-t border-white/20 dark:border-slate-700/50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <form onSubmit={handleSend} className="relative">
                        <div className="flex items-end gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="메시지를 입력하세요..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    disabled={loading}
                                    className="w-full h-12 px-6 pr-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-base"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    Enter
                                </div>
                            </div>
                            {loading ? (
                                <Button
                                    type="button"
                                    onClick={handleStop}
                                    className="h-12 w-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
                                >
                                    <Square className="h-5 w-5" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={!canSend}
                                    className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                            AI는 실수를 할 수 있습니다. 중요한 정보는 확인하세요.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}