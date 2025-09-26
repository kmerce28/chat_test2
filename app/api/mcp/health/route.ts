import { NextResponse } from 'next/server'
import { mcpClientManager } from '@/lib/mcp/client'

export async function GET() {
  try {
    const connections = mcpClientManager.getAllConnections()
    
    const healthChecks = await Promise.all(
      connections.map(async (conn) => {
        if (conn.status !== 'connected' || !conn.client) {
          return {
            id: conn.id,
            status: conn.status,
            error: conn.error,
            healthy: false
          }
        }

        try {
          // 서버 정보 확인
          const serverInfo = await conn.client.getServerInfo()
          
          // 도구 목록 확인
          const tools = await conn.client.listTools()
          
          // 프롬프트 목록 확인
          const prompts = await conn.client.listPrompts()
          
          // 리소스 목록 확인
          const resources = await conn.client.listResources()

          return {
            id: conn.id,
            status: 'connected',
            healthy: true,
            serverInfo: {
              name: serverInfo.name,
              version: serverInfo.version
            },
            capabilities: {
              tools: tools.tools?.length || 0,
              prompts: prompts.prompts?.length || 0,
              resources: resources.resources?.length || 0
            },
            lastConnected: conn.lastConnected
          }
        } catch (error) {
          return {
            id: conn.id,
            status: 'error',
            healthy: false,
            error: error instanceof Error ? error.message : 'Health check failed'
          }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      healthChecks,
      summary: {
        total: connections.length,
        healthy: healthChecks.filter(h => h.healthy).length,
        unhealthy: healthChecks.filter(h => !h.healthy).length
      }
    })
  } catch (error) {
    console.error('Error checking MCP health:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
