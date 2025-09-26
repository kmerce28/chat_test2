export type MCPServerTransport = 'stdio' | 'http' | 'sse'

export interface MCPServer {
  id: string
  name: string
  description?: string
  transport: MCPServerTransport
  config: MCPServerConfig
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  createdAt: Date
  updatedAt: Date
}

export interface MCPServerConfig {
  // STDIO 설정
  command?: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  
  // HTTP/SSE 설정
  url?: string
  headers?: Record<string, string>
  
  // 공통 설정
  timeout?: number
  retries?: number
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  serverId: string
}

export interface MCPPrompt {
  name: string
  description: string
  arguments?: Array<{
    name: string
    description: string
    required: boolean
  }>
  serverId: string
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
  serverId: string
}

export interface MCPConnectionStatus {
  serverId: string
  connected: boolean
  error?: string
  lastPing?: Date
}
