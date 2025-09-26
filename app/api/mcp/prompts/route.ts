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

    const prompts = await mcpClientManager.getServerPrompts(serverId)
    
    return NextResponse.json({
      success: true,
      prompts
    })
  } catch (error) {
    console.error('Error getting MCP prompts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { serverId, promptName, arguments: args } = await req.json()
    
    if (!serverId || !promptName) {
      return NextResponse.json({
        success: false,
        error: 'Server ID and prompt name are required'
      }, { status: 400 })
    }

    const result = await mcpClientManager.getPrompt(serverId, promptName, args || {})
    
    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Error getting MCP prompt:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
