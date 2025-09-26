'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Plus, 
  Trash2, 
  // Server, 
  Globe, 
  Radio,
  Code
  // Settings
} from 'lucide-react'
import type { MCPServer, MCPServerConfig, MCPServerTransport } from '@/lib/types/mcp'

interface MCPServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'>) => void
  server?: MCPServer
}

export function MCPServerModal({ isOpen, onClose, onSave, server }: MCPServerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transport: 'stdio' as MCPServerTransport,
    config: {
      command: '',
      args: [] as string[],
      cwd: '',
      env: {} as Record<string, string>,
      url: '',
      headers: {} as Record<string, string>,
      timeout: 30000,
      retries: 3
    } as MCPServerConfig
  })

  const [newArg, setNewArg] = useState('')
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderValue, setNewHeaderValue] = useState('')

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        description: server.description || '',
        transport: server.transport,
        config: {
          command: server.config.command || '',
          args: server.config.args || [],
          cwd: server.config.cwd || '',
          env: server.config.env || {},
          url: server.config.url || '',
          headers: server.config.headers || {},
          timeout: server.config.timeout || 30000,
          retries: server.config.retries || 3
        }
      })
    } else {
      setFormData({
        name: '',
        description: '',
        transport: 'stdio',
        config: {
          command: '',
          args: [],
          cwd: '',
          env: {},
          url: '',
          headers: {},
          timeout: 30000,
          retries: 3
        }
      })
    }
  }, [server, isOpen])

  const handleSave = () => {
    if (!formData.name.trim()) return

    const serverData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      transport: formData.transport,
      config: formData.config,
      status: 'disconnected' as const
    }

    onSave(serverData)
    onClose()
  }

  const addArg = () => {
    if (newArg.trim()) {
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          args: [...(prev.config.args || []), newArg.trim()]
        }
      }))
      setNewArg('')
    }
  }

  const removeArg = (index: number) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        args: (prev.config.args || []).filter((_, i) => i !== index)
      }
    }))
  }

  const addEnv = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          env: {
            ...(prev.config.env || {}),
            [newEnvKey.trim()]: newEnvValue.trim()
          }
        }
      }))
      setNewEnvKey('')
      setNewEnvValue('')
    }
  }

  const removeEnv = (key: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        env: Object.fromEntries(
          Object.entries(prev.config.env || {}).filter(([k]) => k !== key)
        )
      }
    }))
  }

  const addHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          headers: {
            ...(prev.config.headers || {}),
            [newHeaderKey.trim()]: newHeaderValue.trim()
          }
        }
      }))
      setNewHeaderKey('')
      setNewHeaderValue('')
    }
  }

  const removeHeader = (key: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        headers: Object.fromEntries(
          Object.entries(prev.config.headers || {}).filter(([k]) => k !== key)
        )
      }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{server ? 'MCP 서버 편집' : '새 MCP 서버 추가'}</CardTitle>
            <CardDescription>
              MCP 서버 설정을 구성하고 연결을 관리하세요
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">서버 이름 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="서버 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">설명</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="서버 설명을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* Transport 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transport 방식</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'stdio', label: 'STDIO', icon: Code, desc: '표준 입출력' },
                { value: 'http', label: 'HTTP', icon: Globe, desc: 'HTTP 요청' },
                { value: 'sse', label: 'SSE', icon: Radio, desc: 'Server-Sent Events' }
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setFormData(prev => ({ ...prev, transport: value as MCPServerTransport }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.transport === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-slate-500">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* STDIO 설정 */}
          {formData.transport === 'stdio' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">STDIO 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">명령어 *</label>
                  <Input
                    value={formData.config.command}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      config: { ...prev.config, command: e.target.value }
                    }))}
                    placeholder="python main.py"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">작업 디렉토리</label>
                  <Input
                    value={formData.config.cwd}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      config: { ...prev.config, cwd: e.target.value }
                    }))}
                    placeholder="/path/to/project"
                  />
                </div>
              </div>

              {/* 인수 */}
              <div>
                <label className="text-sm font-medium mb-2 block">인수</label>
                <div className="space-y-2">
                  {(formData.config.args || []).map((arg, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{arg}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArg(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newArg}
                      onChange={(e) => setNewArg(e.target.value)}
                      placeholder="새 인수 추가"
                      onKeyPress={(e) => e.key === 'Enter' && addArg()}
                    />
                    <Button onClick={addArg} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 환경 변수 */}
              <div>
                <label className="text-sm font-medium mb-2 block">환경 변수</label>
                <div className="space-y-2">
                  {Object.entries(formData.config.env || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline">{key}={value}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEnv(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={newEnvKey}
                      onChange={(e) => setNewEnvKey(e.target.value)}
                      placeholder="키"
                    />
                    <Input
                      value={newEnvValue}
                      onChange={(e) => setNewEnvValue(e.target.value)}
                      placeholder="값"
                    />
                    <Button onClick={addEnv} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HTTP/SSE 설정 */}
          {(formData.transport === 'http' || formData.transport === 'sse') && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{formData.transport.toUpperCase()} 설정</h3>
              <div>
                <label className="text-sm font-medium mb-2 block">URL *</label>
                <Input
                  value={formData.config.url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, url: e.target.value }
                  }))}
                  placeholder="http://localhost:3000/mcp"
                />
              </div>

              {/* 헤더 */}
              <div>
                <label className="text-sm font-medium mb-2 block">헤더</label>
                <div className="space-y-2">
                  {Object.entries(formData.config.headers || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline">{key}: {value}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeader(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                      placeholder="헤더명"
                    />
                    <Input
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                      placeholder="헤더값"
                    />
                    <Button onClick={addHeader} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 공통 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">공통 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">타임아웃 (ms)</label>
                <Input
                  type="number"
                  value={formData.config.timeout}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, timeout: parseInt(e.target.value) || 30000 }
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">재시도 횟수</label>
                <Input
                  type="number"
                  value={formData.config.retries}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, retries: parseInt(e.target.value) || 3 }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {server ? '수정' : '추가'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
