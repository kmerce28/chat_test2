import { NextResponse } from 'next/server'
import { mcpClientManager } from '@/lib/mcp/client'

export async function GET() {
  try {
    const connections = mcpClientManager.getAllConnections()
    
    const status = connections.map(conn => ({
      id: conn.id,
      status: conn.status,
      lastConnected: conn.lastConnected,
      error: conn.error
    }))
    
    return NextResponse.json({
      success: true,
      connections: status
    })
  } catch (error) {
    console.error('Error getting MCP status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
