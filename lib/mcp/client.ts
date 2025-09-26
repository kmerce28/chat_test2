import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { MCPServer } from '@/lib/types/mcp'

export interface MCPConnection {
  id: string
  client: Client
  transport: StdioClientTransport | SSEClientTransport
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  error?: string
}

class MCPClientManager {
  private connections: Map<string, MCPConnection> = new Map()
  private static instance: MCPClientManager

  private constructor() {}

  static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager()
    }
    return MCPClientManager.instance
  }

  async connectServer(server: MCPServer): Promise<MCPConnection> {
    const connectionId = server.id
    console.log('MCP 서버 연결 시작:', {
      id: connectionId,
      name: server.name,
      transport: server.transport,
      config: server.config
    })
    
    // 이미 연결된 경우 기존 연결 반환
    if (this.connections.has(connectionId)) {
      const existing = this.connections.get(connectionId)!
      if (existing.status === 'connected') {
        console.log('이미 연결된 서버 반환:', connectionId)
        return existing
      }
    }

    try {
      let transport: StdioClientTransport | SSEClientTransport

      switch (server.transport) {
        case 'stdio':
          // Windows에서 npx 명령어 실행을 위한 처리
          const isWindows = process.platform === 'win32'
          let command: string
          let args: string[]
          
          if (isWindows && server.config.command === 'npx') {
            // PowerShell을 사용하여 더 안정적인 실행
            command = 'powershell.exe'
            const allArgs = ['npx', ...(server.config.args || [])]
            args = ['-Command', allArgs.join(' ')]
          } else if (isWindows && server.config.command?.startsWith('npx')) {
            // npx가 명령어에 포함된 경우
            command = 'powershell.exe'
            const allArgs = [server.config.command, ...(server.config.args || [])]
            args = ['-Command', allArgs.join(' ')]
          } else {
            command = server.config.command!
            args = server.config.args || []
          }
          
          console.log('STDIO Transport 설정:', { command, args, cwd: server.config.cwd })
          
          transport = new StdioClientTransport({
            command,
            args,
            cwd: server.config.cwd,
            env: server.config.env
          })
          break

        case 'sse':
          console.log('SSE Transport 설정:', { url: server.config.url })
          transport = new SSEClientTransport(new URL(server.config.url!))
          break

        case 'http':
          // StreamableHTTP Transport - HTTP POST 요청 사용
          console.log('StreamableHTTP Transport 설정:', { url: server.config.url })
          // StreamableHTTP Transport는 HTTP POST 요청을 사용하는 커스텀 Transport
          transport = this.createStreamableHTTPTransport(server.config.url!, server.config.headers)
          break

        default:
          throw new Error(`Unsupported transport: ${server.transport}`)
      }

      const client = new Client(
        {
          name: 'ai-chat-mcp-client',
          version: '1.0.0'
        },
        {
          capabilities: {
            roots: {
              listChanged: true
            },
            sampling: {}
          }
        }
      )

      console.log('MCP Client 연결 시작...')
      
      // 연결 타임아웃 설정 (30초)
      const connectPromise = client.connect(transport)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      )
      
      try {
        await Promise.race([connectPromise, timeoutPromise])
        console.log('MCP Client 연결 성공')
      } catch (connectError) {
        console.error('MCP Client 연결 실패:', connectError)
        
        // 연결 실패 시 transport 정리
        try {
          if (transport && typeof transport.close === 'function') {
            await transport.close()
          }
        } catch (closeError) {
          console.warn('Transport close error:', closeError)
        }
        
        throw connectError
      }

      // MCP 서버와의 핸드셰이크 및 초기화 확인
      try {
        console.log('MCP 서버 초기화 확인 중...')
        
        // 서버 정보 요청으로 연결 상태 확인 (타임아웃 5초)
        const serverInfoPromise = client.getServerInfo()
        const serverInfoTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server info timeout')), 5000)
        )
        const serverInfo = await Promise.race([serverInfoPromise, serverInfoTimeout])
        console.log('MCP 서버 정보:', serverInfo)
        
        // 사용 가능한 도구 목록 요청 (타임아웃 5초)
        const toolsPromise = client.listTools()
        const toolsTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tools list timeout')), 5000)
        )
        const tools = await Promise.race([toolsPromise, toolsTimeout])
        console.log('사용 가능한 도구 수:', tools.tools?.length || 0)
        
        console.log('MCP 서버 초기화 완료')
      } catch (initError) {
        console.warn('MCP 서버 초기화 중 오류 (연결은 유지):', initError)
        
        // 초기화 실패 시 연결 상태를 error로 변경
        const connection: MCPConnection = {
          id: connectionId,
          client,
          transport,
          status: 'error',
          error: initError instanceof Error ? initError.message : 'Initialization failed'
        }
        this.connections.set(connectionId, connection)
        throw initError
      }

      const connection: MCPConnection = {
        id: connectionId,
        client,
        transport,
        status: 'connected',
        lastConnected: new Date()
      }

      this.connections.set(connectionId, connection)
      
      // 연결 상태 모니터링 시작
      this.startConnectionMonitoring(connectionId)
      
      return connection

    } catch (error) {
      console.error('MCP 서버 연결 실패:', {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      const connection: MCPConnection = {
        id: connectionId,
        client: null as unknown as Client,
        transport: null as unknown as StdioClientTransport | SSEClientTransport,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      
      this.connections.set(connectionId, connection)
      throw error
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId)
    if (connection) {
      try {
        if (connection.client) {
          await connection.client.close()
        }
        if (connection.transport) {
          await connection.transport.close()
        }
      } catch (error) {
        console.error('Error disconnecting MCP server:', error)
      }
      
      connection.status = 'disconnected'
      this.connections.delete(serverId)
    }
  }

  getConnection(serverId: string): MCPConnection | undefined {
    return this.connections.get(serverId)
  }

  getAllConnections(): MCPConnection[] {
    return Array.from(this.connections.values())
  }

  async getServerTools(serverId: string): Promise<unknown[]> {
    const connection = this.connections.get(serverId)
    if (!connection || connection.status !== 'connected') {
      throw new Error('Server not connected')
    }

    try {
      const result = await connection.client.listTools()
      return result.tools || []
    } catch (error) {
      console.error('Error getting server tools:', error)
      throw error
    }
  }

  async getServerPrompts(serverId: string): Promise<unknown[]> {
    const connection = this.connections.get(serverId)
    if (!connection || connection.status !== 'connected') {
      throw new Error('Server not connected')
    }

    try {
      const result = await connection.client.listPrompts()
      return result.prompts || []
    } catch (error) {
      console.error('Error getting server prompts:', error)
      throw error
    }
  }

  async getServerResources(serverId: string): Promise<unknown[]> {
    const connection = this.connections.get(serverId)
    if (!connection || connection.status !== 'connected') {
      throw new Error('Server not connected')
    }

    try {
      const result = await connection.client.listResources()
      return result.resources || []
    } catch (error) {
      console.error('Error getting server resources:', error)
      throw error
    }
  }

  async executeTool(serverId: string, toolName: string, arguments_: Record<string, string>): Promise<unknown> {
    const connection = this.connections.get(serverId)
    if (!connection || connection.status !== 'connected') {
      throw new Error('Server not connected')
    }

    try {
      const result = await connection.client.callTool({
        name: toolName,
        arguments: arguments_
      })
      return result
    } catch (error) {
      console.error('Error executing tool:', error)
      throw error
    }
  }

  async getPrompt(serverId: string, promptName: string, arguments_: Record<string, string>): Promise<unknown> {
    const connection = this.connections.get(serverId)
    if (!connection || connection.status !== 'connected') {
      throw new Error('Server not connected')
    }

    try {
      const result = await connection.client.getPrompt({
        name: promptName,
        arguments: arguments_
      })
      return result
    } catch (error) {
      console.error('Error getting prompt:', error)
      throw error
    }
  }

  async readResource(serverId: string, uri: string): Promise<unknown> {
    const connection = this.connections.get(serverId)
    if (!connection || connection.status !== 'connected') {
      throw new Error('Server not connected')
    }

    try {
      const result = await connection.client.readResource({
        uri
      })
      return result
    } catch (error) {
      console.error('Error reading resource:', error)
      throw error
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(serverId => 
      this.disconnectServer(serverId)
    )
    await Promise.all(disconnectPromises)
  }

  private createStreamableHTTPTransport(url: string, headers?: Record<string, string>): Record<string, unknown> {
    // StreamableHTTP Transport 구현 - MCP SDK Transport 인터페이스 준수
    console.log('StreamableHTTP Transport 생성:', { url, headers })
    
    return {
      url,
      headers: headers || {},
      
      // MCP SDK Transport 인터페이스 구현
      connect: async () => {
        console.log('StreamableHTTP Transport 연결 시작:', url)
        return Promise.resolve()
      },
      
      close: async () => {
        console.log('StreamableHTTP Transport 연결 종료')
        return Promise.resolve()
      },
      
      // MCP 프로토콜 메시지 전송
      send: async (message: Record<string, unknown>) => {
        console.log('StreamableHTTP Transport 메시지 전송:', message)
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...headers
            },
            body: JSON.stringify(message)
          })
          
          if (!response.ok) {
            throw new Error(`StreamableHTTP ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()
          console.log('StreamableHTTP Transport 응답:', data)
          return data
        } catch (error) {
          console.error('StreamableHTTP Transport 전송 실패:', error)
          throw error
        }
      },
      
      // 이벤트 리스너 (MCP SDK 호환)
      on: (event: string, _callback: (data: unknown) => void) => {
        console.log('StreamableHTTP Transport 이벤트 리스너 등록:', event)
        // HTTP Transport는 폴링 방식으로 구현
        return this
      },
      
      off: (event: string, _callback: (data: unknown) => void) => {
        console.log('StreamableHTTP Transport 이벤트 리스너 제거:', event)
        return this
      }
    }
  }

  private startConnectionMonitoring(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // 30초마다 연결 상태 확인
    const monitorInterval = setInterval(async () => {
      const currentConnection = this.connections.get(connectionId)
      if (!currentConnection || currentConnection.status !== 'connected') {
        clearInterval(monitorInterval)
        return
      }

      try {
        // 간단한 핑 테스트
        await currentConnection.client.getServerInfo()
        console.log(`MCP 서버 ${connectionId} 연결 상태 정상`)
      } catch (error) {
        console.error(`MCP 서버 ${connectionId} 연결 상태 확인 실패:`, error)
        
        // 연결 상태를 error로 변경
        currentConnection.status = 'error'
        currentConnection.error = error instanceof Error ? error.message : 'Connection lost'
        
        clearInterval(monitorInterval)
      }
    }, 30000)

    // 5분 후 모니터링 중지
    setTimeout(() => {
      clearInterval(monitorInterval)
    }, 300000)
  }
}

export const mcpClientManager = MCPClientManager.getInstance()
