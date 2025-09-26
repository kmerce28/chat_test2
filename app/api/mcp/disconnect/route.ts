import { NextRequest, NextResponse } from 'next/server'
import { mcpClientManager } from '@/lib/mcp/client'

export async function POST(req: NextRequest) {
  try {
    const { serverId } = await req.json()
    
    await mcpClientManager.disconnectServer(serverId)
    
    return NextResponse.json({
      success: true,
      message: 'Server disconnected successfully'
    })
  } catch (error) {
    console.error('MCP disconnection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
