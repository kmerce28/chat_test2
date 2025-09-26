import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sseEncode(data: unknown): Uint8Array {
    const encoder = new TextEncoder()
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const prompt = url.searchParams.get('q')?.trim()
    // const history = url.searchParams.get('history') // 대화 히스토리 추가 (향후 사용 예정)
    const model = process.env.LLM_MODEL || 'gemini-2.0-flash-001'
    const apiKey = process.env.GEMINI_API_KEY
    
    console.log('🔑 API 키 확인:', apiKey ? '설정됨' : '없음')
    console.log('🤖 모델:', model)

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                console.log('🔍 API 요청 시작 - API 키 확인:', apiKey ? '설정됨' : '없음')
                console.log('🔍 프롬프트:', prompt)
                
                if (!apiKey) {
                    controller.enqueue(
                        sseEncode({
                            type: 'error',
                            code: 'NO_API_KEY',
                            message: '서버에 GEMINI_API_KEY가 설정되지 않았습니다.'
                        })
                    )
                    controller.enqueue(sseEncode({ type: 'done' }))
                    controller.close()
                    return
                }

                if (!prompt) {
                    controller.enqueue(
                        sseEncode({
                            type: 'error',
                            code: 'NO_PROMPT',
                            message: '질문(q) 파라미터가 필요합니다.'
                        })
                    )
                    controller.enqueue(sseEncode({ type: 'done' }))
                    controller.close()
                    return
                }

                console.log('🔧 Gemini API 초기화 시작')
                const genAI = new GoogleGenerativeAI(apiKey)
                console.log('🔧 Gemini API 인스턴스 생성 완료')
                
                const model_instance = genAI.getGenerativeModel({ model })
                console.log('🔧 모델 인스턴스 생성 완료:', model)

                // 일단 히스토리 없이 단순하게 시작

                console.log('🚀 Gemini API 호출 시작:', prompt)
                const result = await model_instance.generateContentStream(prompt)
                console.log('📡 Gemini API 응답 받음:', result)

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text()
                    console.log('🔵 Gemini API 청크 수신:', chunkText)
                    if (chunkText) {
                        console.log('✅ 청크 텍스트 전송:', chunkText)
                        // Context7 표준에 맞는 스트리밍 응답 형식
                        controller.enqueue(
                            sseEncode({ 
                                type: 'text', 
                                delta: chunkText,
                                timestamp: Date.now(),
                                source: 'gemini'
                            })
                        )
                    } else {
                        console.log('⚠️ 빈 청크 텍스트')
                    }
                }

                controller.enqueue(sseEncode({ 
                    type: 'done',
                    timestamp: Date.now(),
                    source: 'gemini'
                }))
                controller.close()
            } catch (err: unknown) {
                console.error('❌ API 오류 발생:', err)
                console.error('❌ 오류 타입:', typeof err)
                console.error('❌ 오류 객체:', err)
                
                const status =
                    typeof err === 'object' && err && 'status' in err
                        ? (err as { status?: number }).status ?? 500
                        : 500
                let code = 'INTERNAL_ERROR'
                if (status === 401 || status === 403) code = 'UNAUTHORIZED'
                else if (status === 429) code = 'RATE_LIMIT'
                else if (status >= 500) code = 'UPSTREAM_ERROR'
                
                console.error('❌ 오류 상태:', status)
                console.error('❌ 오류 코드:', code)

                controller.enqueue(
                    sseEncode({
                        type: 'error',
                        code,
                        message:
                            typeof err === 'object' && err && 'message' in err
                                ? String((err as { message?: unknown }).message)
                                : '알 수 없는 오류가 발생했습니다.',
                        timestamp: Date.now(),
                        source: 'gemini'
                    })
                )
                controller.enqueue(sseEncode({ type: 'done' }))
                controller.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    })
}
