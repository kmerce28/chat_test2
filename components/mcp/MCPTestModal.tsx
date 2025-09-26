'use client'

import { useState } from 'react'
import { useMCP } from '@/lib/contexts/MCPContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  X, 
  Play, 
  // Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  TestTube,
  Wrench,
  MessageSquare,
  FileText
} from 'lucide-react'
import type { MCPTool, MCPPrompt, MCPResource } from '@/lib/types/mcp'

interface MCPTestModalProps {
  isOpen: boolean
  onClose: () => void
  serverId: string
  serverName: string
}

export function MCPTestModal({ isOpen, onClose, serverId, serverName }: MCPTestModalProps) {
  const { getServerTools, getServerPrompts, getServerResources, connections } = useMCP()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<{
    tools: MCPTool[]
    prompts: MCPPrompt[]
    resources: MCPResource[]
    connectionStatus: 'connected' | 'disconnected' | 'error'
    error?: string
  } | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      // 연결 상태 확인
      const connection = connections.find(conn => conn.id === serverId)
      if (!connection || connection.status !== 'connected') {
        throw new Error('서버가 연결되지 않았습니다. 먼저 서버에 연결해주세요.')
      }

      // 병렬로 모든 정보 조회
      const [tools, prompts, resources] = await Promise.all([
        getServerTools(serverId),
        getServerPrompts(serverId),
        getServerResources(serverId)
      ])

      setTestResults({
        tools: tools.map((tool: unknown) => {
          const t = tool as Record<string, unknown>
          return {
            name: t.name as string,
            description: (t.description as string) || '',
            inputSchema: (t.inputSchema as Record<string, unknown>) || {},
            serverId
          }
        }),
        prompts: prompts.map((prompt: unknown) => {
          const p = prompt as Record<string, unknown>
          return {
            name: p.name as string,
            description: (p.description as string) || '',
            arguments: (p.arguments as Array<{name: string, description: string, required: boolean}>) || [],
            serverId
          }
        }),
        resources: resources.map((resource: unknown) => {
          const r = resource as Record<string, unknown>
          return {
            uri: r.uri as string,
            name: (r.name as string) || (r.uri as string).split('/').pop() || 'Unknown',
            description: r.description as string,
            mimeType: r.mimeType as string,
            serverId
          }
        }),
        connectionStatus: 'connected'
      })
    } catch (error) {
      setTestResults({
        tools: [],
        prompts: [],
        resources: [],
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected': return <XCircle className="h-4 w-4 text-gray-400" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '연결됨'
      case 'disconnected': return '연결 안됨'
      case 'error': return '오류'
      default: return '테스트 중'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              MCP 서버 테스트
            </CardTitle>
            <CardDescription>{serverName}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 테스트 실행 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h3 className="font-medium">연결 및 기능 테스트</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                MCP 서버의 연결 상태와 사용 가능한 도구들을 확인합니다
              </p>
            </div>
            <Button 
              onClick={runTest} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  테스트 중...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  테스트 실행
                </>
              )}
            </Button>
          </div>

          {/* 테스트 결과 */}
          {testResults && (
            <div className="space-y-6">
              {/* 연결 상태 */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {getStatusIcon(testResults.connectionStatus)}
                <div>
                  <div className="font-medium">
                    연결 상태: {getStatusText(testResults.connectionStatus)}
                  </div>
                  {testResults.error && (
                    <div className="text-sm text-red-600 mt-1">{testResults.error}</div>
                  )}
                </div>
              </div>

              {/* Tools */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Tools ({testResults.tools.length})</h3>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {testResults.tools.map((tool, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {tool.description}
                            </div>
                          </div>
                          <Badge variant="outline">Tool</Badge>
                        </div>
                      </div>
                    ))}
                    {testResults.tools.length === 0 && (
                      <div className="text-center py-4 text-slate-500">
                        사용 가능한 도구가 없습니다
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Prompts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Prompts ({testResults.prompts.length})</h3>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {testResults.prompts.map((prompt, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{prompt.name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {prompt.description}
                            </div>
                            {prompt.arguments && prompt.arguments.length > 0 && (
                              <div className="text-xs text-slate-500 mt-1">
                                인수: {prompt.arguments.map(arg => arg.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">Prompt</Badge>
                        </div>
                      </div>
                    ))}
                    {testResults.prompts.length === 0 && (
                      <div className="text-center py-4 text-slate-500">
                        사용 가능한 프롬프트가 없습니다
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Resources */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Resources ({testResults.resources.length})</h3>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {testResults.resources.map((resource, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {resource.uri}
                            </div>
                            {resource.description && (
                              <div className="text-xs text-slate-500 mt-1">
                                {resource.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">Resource</Badge>
                        </div>
                      </div>
                    ))}
                    {testResults.resources.length === 0 && (
                      <div className="text-center py-4 text-slate-500">
                        사용 가능한 리소스가 없습니다
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
