'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
import { 
  Server, 
  Play, 
  Square, 
  Settings, 
  TestTube, 
  Download, 
  // Upload,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react'
import type { MCPServer } from '@/lib/types/mcp'

interface MCPServerCardProps {
  server: MCPServer
  onConnect: (serverId: string) => void
  onDisconnect: (serverId: string) => void
  onEdit: (serverId: string) => void
  onDelete: (serverId: string) => void
  onTest: (serverId: string) => void
  onExport: (serverId: string) => void
  onTestConnection?: (serverId: string) => void
}

export function MCPServerCard({ 
  server, 
  onConnect, 
  onDisconnect, 
  onEdit, 
  onDelete, 
  onTest, 
  onExport,
  onTestConnection
}: MCPServerCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'disconnected': return 'bg-gray-400'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected': return '연결됨'
      case 'disconnected': return '연결 안됨'
      case 'error': return '오류'
      default: return '알 수 없음'
    }
  }

  const getTransportIcon = (transport: MCPServer['transport']) => {
    switch (transport) {
      case 'stdio': return '📟'
      case 'http': return '🌐'
      case 'sse': return '📡'
      default: return '❓'
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{server.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{getTransportIcon(server.transport)}</span>
                <span className="capitalize">{server.transport}</span>
                {server.description && (
                  <span className="text-slate-500">• {server.description}</span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
              <span className="text-sm text-slate-600">{getStatusText(server.status)}</span>
            </div>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-10 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEdit(server.id)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                      편집
                    </button>
                    <button
                      onClick={() => {
                        onTest(server.id)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <TestTube className="h-4 w-4" />
                      테스트
                    </button>
                    {onTestConnection && server.status === 'connected' && (
                      <button
                        onClick={() => {
                          onTestConnection(server.id)
                          setIsMenuOpen(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Server className="h-4 w-4" />
                        연결 테스트
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onExport(server.id)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Download className="h-4 w-4" />
                      내보내기
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        onDelete(server.id)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {server.status === 'connected' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(server.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Square className="h-4 w-4 mr-1" />
                연결 해제
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConnect(server.id)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Play className="h-4 w-4 mr-1" />
                연결
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(server.id)}
            >
              <Settings className="h-4 w-4 mr-1" />
              설정
            </Button>
          </div>
          
          <div className="text-xs text-slate-500">
            {server.lastConnected && (
              <span>마지막 연결: {server.lastConnected.toLocaleString()}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
