'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { MCPServer } from '@/lib/types/mcp'

interface MCPConnectionStatus {
  id: string
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  error?: string
}

interface MCPContextType {
  connections: MCPConnectionStatus[]
  servers: MCPServer[]
  isLoading: boolean
  connectServer: (server: MCPServer) => Promise<void>
  disconnectServer: (serverId: string) => Promise<void>
  refreshConnections: () => Promise<void>
  getServerTools: (serverId: string) => Promise<unknown[]>
  getServerPrompts: (serverId: string) => Promise<unknown[]>
  getServerResources: (serverId: string) => Promise<unknown[]>
  executeTool: (serverId: string, toolName: string, args: Record<string, string>) => Promise<unknown>
  getPrompt: (serverId: string, promptName: string, args: Record<string, string>) => Promise<unknown>
  readResource: (serverId: string, uri: string) => Promise<unknown>
}

const MCPContext = createContext<MCPContextType | undefined>(undefined)

export function MCPProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<MCPConnectionStatus[]>([])
  const [servers, setServers] = useState<MCPServer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 서버 목록 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mcp-servers')
      if (stored) {
        const parsed = JSON.parse(stored)
        setServers(parsed.map((server: unknown) => {
          const s = server as Record<string, unknown>
          return {
            ...s,
            createdAt: new Date(s.createdAt as string),
            updatedAt: new Date(s.updatedAt as string),
            lastConnected: s.lastConnected ? new Date(s.lastConnected as string) : undefined
          } as MCPServer
        }))
      }
    } catch (error) {
      console.error('서버 목록 로드 실패:', error)
    }
  }, [])

  // 연결 상태 새로고침
  const refreshConnections = async () => {
    try {
      const response = await fetch('/api/mcp/status')
      const data = await response.json()
      
      if (data.success) {
        setConnections(data.connections)
      }
    } catch (error) {
      console.error('연결 상태 새로고침 실패:', error)
    }
  }

  // 서버 연결
  const connectServer = async (server: MCPServer) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await refreshConnections()
      } else {
        throw new Error(data.error || '연결 실패')
      }
    } catch (error) {
      console.error('서버 연결 실패:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 서버 연결 해제
  const disconnectServer = async (serverId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await refreshConnections()
      } else {
        throw new Error(data.error || '연결 해제 실패')
      }
    } catch (error) {
      console.error('서버 연결 해제 실패:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 서버 도구 조회
  const getServerTools = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mcp/tools?serverId=${serverId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.tools
      } else {
        throw new Error(data.error || '도구 조회 실패')
      }
    } catch (error) {
      console.error('도구 조회 실패:', error)
      throw error
    }
  }

  // 서버 프롬프트 조회
  const getServerPrompts = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mcp/prompts?serverId=${serverId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.prompts
      } else {
        throw new Error(data.error || '프롬프트 조회 실패')
      }
    } catch (error) {
      console.error('프롬프트 조회 실패:', error)
      throw error
    }
  }

  // 서버 리소스 조회
  const getServerResources = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mcp/resources?serverId=${serverId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.resources
      } else {
        throw new Error(data.error || '리소스 조회 실패')
      }
    } catch (error) {
      console.error('리소스 조회 실패:', error)
      throw error
    }
  }

  // 도구 실행
  const executeTool = async (serverId: string, toolName: string, args: Record<string, string>) => {
    try {
      const response = await fetch('/api/mcp/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, toolName, arguments: args })
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.result
      } else {
        throw new Error(data.error || '도구 실행 실패')
      }
    } catch (error) {
      console.error('도구 실행 실패:', error)
      throw error
    }
  }

  // 프롬프트 실행
  const getPrompt = async (serverId: string, promptName: string, args: Record<string, string>) => {
    try {
      const response = await fetch('/api/mcp/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, promptName, arguments: args })
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.result
      } else {
        throw new Error(data.error || '프롬프트 실행 실패')
      }
    } catch (error) {
      console.error('프롬프트 실행 실패:', error)
      throw error
    }
  }

  // 리소스 읽기
  const readResource = async (serverId: string, uri: string) => {
    try {
      const response = await fetch('/api/mcp/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, uri })
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.result
      } else {
        throw new Error(data.error || '리소스 읽기 실패')
      }
    } catch (error) {
      console.error('리소스 읽기 실패:', error)
      throw error
    }
  }

  // 주기적으로 연결 상태 확인
  useEffect(() => {
    const interval = setInterval(refreshConnections, 30000) // 30초마다
    return () => clearInterval(interval)
  }, [])

  const value: MCPContextType = {
    connections,
    servers,
    isLoading,
    connectServer,
    disconnectServer,
    refreshConnections,
    getServerTools,
    getServerPrompts,
    getServerResources,
    executeTool,
    getPrompt,
    readResource
  }

  return (
    <MCPContext.Provider value={value}>
      {children}
    </MCPContext.Provider>
  )
}

export function useMCP() {
  const context = useContext(MCPContext)
  if (context === undefined) {
    throw new Error('useMCP must be used within a MCPProvider')
  }
  return context
}
