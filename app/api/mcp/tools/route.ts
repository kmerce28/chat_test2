import { NextRequest, NextResponse } from 'next/server'
import { mcpClientManager } from '@/lib/mcp/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const serverId = searchParams.get('serverId')
    
    if (!serverId) {
      return NextResponse.json({
        success: false,
        error: 'Server ID is required'
      }, { status: 400 })
    }

    const tools = await mcpClientManager.getServerTools(serverId)
    
    return NextResponse.json({
      success: true,
      tools
    })
  } catch (error) {
    console.error('Error getting MCP tools:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { serverId, toolName, arguments: args } = await req.json()
    
    if (!serverId || !toolName) {
      return NextResponse.json({
        success: false,
        error: 'Server ID and tool name are required'
      }, { status: 400 })
    }

    const result = await mcpClientManager.executeTool(serverId, toolName, args || {})
    
    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Error executing MCP tool:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
