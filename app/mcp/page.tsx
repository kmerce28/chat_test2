'use client'

import { useState, useEffect } from 'react'
import { useMCP } from '@/lib/contexts/MCPContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { MCPServerCard } from '@/components/mcp/MCPServerCard'
import { MCPServerModal } from '@/components/mcp/MCPServerModal'
import { MCPTestModal } from '@/components/mcp/MCPTestModal'
import { 
  Plus, 
  Search, 
  Download, 
  Upload,
  Server
} from 'lucide-react'
import type { MCPServer } from '@/lib/types/mcp'

export default function MCPPage() {
  const { 
    servers, 
    connections, 
    connectServer, 
    disconnectServer, 
    refreshConnections 
  } = useMCP()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'connected' | 'disconnected' | 'error'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<MCPServer | undefined>()
  const [testingServer, setTestingServer] = useState<{ id: string; name: string } | undefined>()
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // 연결 상태 새로고침
  useEffect(() => {
    refreshConnections()
  }, [refreshConnections])

  // 서버 추가/수정
  const handleSaveServer = (serverData: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date()
    
    if (editingServer) {
      // 수정
      const updatedServers = servers.map(server => 
        server.id === editingServer.id 
          ? { ...server, ...serverData, updatedAt: now }
          : server
      )
      try {
        localStorage.setItem('mcp-servers', JSON.stringify(updatedServers))
        window.location.reload() // Context 새로고침을 위해
      } catch (error) {
        console.error('서버 목록 저장 실패:', error)
      }
    } else {
      // 추가
      const newServer: MCPServer = {
        ...serverData,
        id: `mcp-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      }
      try {
        localStorage.setItem('mcp-servers', JSON.stringify([...servers, newServer]))
        window.location.reload() // Context 새로고침을 위해
      } catch (error) {
        console.error('서버 목록 저장 실패:', error)
      }
    }
    
    setIsModalOpen(false)
    setEditingServer(undefined)
  }

  // 서버 삭제
  const handleDeleteServer = (serverId: string) => {
    if (confirm('정말로 이 서버를 삭제하시겠습니까?')) {
      const updatedServers = servers.filter(server => server.id !== serverId)
      try {
        localStorage.setItem('mcp-servers', JSON.stringify(updatedServers))
        window.location.reload() // Context 새로고침을 위해
      } catch (error) {
        console.error('서버 목록 저장 실패:', error)
      }
    }
  }

  // 서버 연결
  const handleConnectServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (server) {
      try {
        await connectServer(server)
      } catch (error) {
        console.error('서버 연결 실패:', error)
        alert('서버 연결에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
      }
    }
  }

  // 서버 연결 해제
  const handleDisconnectServer = async (serverId: string) => {
    try {
      await disconnectServer(serverId)
    } catch (error) {
      console.error('서버 연결 해제 실패:', error)
      alert('서버 연결 해제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    }
  }

  // 서버 편집
  const handleEditServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (server) {
      setEditingServer(server)
      setIsModalOpen(true)
    }
  }

  // 서버 테스트
  const handleTestServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (server) {
      setTestingServer({ id: serverId, name: server.name })
      setIsTestModalOpen(true)
    }
  }

  // 연결 테스트
  const handleTestConnection = async (serverId: string) => {
    setIsTestingConnection(true)
    try {
      const response = await fetch('/api/mcp/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId }),
      })

      const result = await response.json()
      
      if (result.success) {
        if (result.healthy) {
          alert(`✅ 연결 테스트 성공!\n\n서버 정보: ${result.testResults.serverInfo?.name || 'N/A'}\n도구: ${result.summary.tools ? '✅' : '❌'}\n프롬프트: ${result.summary.prompts ? '✅' : '❌'}\n리소스: ${result.summary.resources ? '✅' : '❌'}`)
        } else {
          alert(`❌ 연결 테스트 실패!\n\n오류:\n${result.testResults.errors.join('\n')}`)
        }
      } else {
        alert(`❌ 연결 테스트 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('연결 테스트 실패:', error)
      alert('연결 테스트 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    } finally {
      setIsTestingConnection(false)
    }
  }

  // 서버 내보내기
  const handleExportServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (server) {
      const dataStr = JSON.stringify(server, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${server.name}-config.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  // 전체 서버 내보내기
  const handleExportAll = () => {
    const dataStr = JSON.stringify(servers, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mcp-servers-config.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  // 전체 서버 가져오기
  const handleImportAll = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string)
            const importedServers = Array.isArray(imported) ? imported : [imported]
            const newServers = importedServers.map((server: unknown) => {
              const s = server as Record<string, unknown>
              return {
                ...s,
                id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'disconnected' as const
              } as MCPServer
            })
            localStorage.setItem('mcp-servers', JSON.stringify([...servers, ...newServers]))
          } catch {
            alert('파일을 읽는 중 오류가 발생했습니다.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 필터링된 서버 목록
  const filteredServers = servers.filter(server => {
    const connection = connections.find(conn => conn.id === server.id)
    const actualStatus = connection?.status || 'disconnected'
    
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || actualStatus === filterStatus
    return matchesSearch && matchesFilter
  })

  // 통계
  const stats = {
    total: servers.length,
    connected: connections.filter(conn => conn.status === 'connected').length,
    disconnected: connections.filter(conn => conn.status === 'disconnected').length,
    error: connections.filter(conn => conn.status === 'error').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Server className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  MCP 서버 관리
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Model Context Protocol 서버를 관리하고 연결하세요
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportAll}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                가져오기
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                내보내기
              </Button>
              <Button
                onClick={() => {
                  setEditingServer(undefined)
                  setIsModalOpen(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                서버 추가
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">전체</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Server className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">연결됨</p>
                  <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">연결 안됨</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.disconnected}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">오류</p>
                  <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="서버 이름이나 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: 'connected', label: '연결됨' },
              { value: 'disconnected', label: '연결 안됨' },
              { value: 'error', label: '오류' }
            ].map(({ value, label }) => (
              <Button
                key={value}
                variant={filterStatus === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(value as 'all' | 'connected' | 'disconnected' | 'error')}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* 서버 목록 */}
        {filteredServers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Server className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold mb-2">서버가 없습니다</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? '검색 조건에 맞는 서버가 없습니다.'
                  : '새로운 MCP 서버를 추가해보세요.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={() => {
                    setEditingServer(undefined)
                    setIsModalOpen(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  첫 번째 서버 추가
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServers.map((server) => {
              const connection = connections.find(conn => conn.id === server.id)
              const serverWithStatus = {
                ...server,
                status: connection?.status || 'disconnected',
                lastConnected: connection?.lastConnected
              }
              
              return (
                <MCPServerCard
                  key={server.id}
                  server={serverWithStatus}
                  onConnect={handleConnectServer}
                  onDisconnect={handleDisconnectServer}
                  onEdit={handleEditServer}
                  onDelete={handleDeleteServer}
                  onTest={handleTestServer}
                  onExport={handleExportServer}
                  onTestConnection={handleTestConnection}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* 모달들 */}
      <MCPServerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingServer(undefined)
        }}
        onSave={handleSaveServer}
        server={editingServer}
      />

      <MCPTestModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false)
          setTestingServer(undefined)
        }}
        serverId={testingServer?.id || ''}
        serverName={testingServer?.name || ''}
      />
    </div>
  )
}
