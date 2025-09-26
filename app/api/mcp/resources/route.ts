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

    const resources = await mcpClientManager.getServerResources(serverId)
    
    return NextResponse.json({
      success: true,
      resources
    })
  } catch (error) {
    console.error('Error getting MCP resources:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { serverId, uri } = await req.json()
    
    if (!serverId || !uri) {
      return NextResponse.json({
        success: false,
        error: 'Server ID and URI are required'
      }, { status: 400 })
    }

    const result = await mcpClientManager.readResource(serverId, uri)
    
    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Error reading MCP resource:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
