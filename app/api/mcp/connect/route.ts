import { NextRequest, NextResponse } from 'next/server'
import { mcpClientManager } from '@/lib/mcp/client'
import type { MCPServer } from '@/lib/types/mcp'

export async function POST(req: NextRequest) {
  try {
    const server: MCPServer = await req.json()
    console.log('MCP 서버 연결 요청:', {
      id: server.id,
      name: server.name,
      transport: server.transport,
      config: server.config
    })
    
    const connection = await mcpClientManager.connectServer(server)
    console.log('MCP 서버 연결 성공:', {
      id: connection.id,
      status: connection.status
    })
    
    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        status: connection.status,
        lastConnected: connection.lastConnected
      }
    })
  } catch (error) {
    console.error('MCP connection error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
