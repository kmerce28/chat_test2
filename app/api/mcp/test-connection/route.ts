import { NextRequest, NextResponse } from 'next/server'
import { mcpClientManager } from '@/lib/mcp/client'

export async function POST(request: NextRequest) {
  try {
    const { serverId } = await request.json()
    
    if (!serverId) {
      return NextResponse.json({
        success: false,
        error: 'Server ID is required'
      }, { status: 400 })
    }

    const connection = mcpClientManager.getConnection(serverId)
    
    if (!connection) {
      return NextResponse.json({
        success: false,
        error: 'Connection not found'
      }, { status: 404 })
    }

    if (connection.status !== 'connected' || !connection.client) {
      return NextResponse.json({
        success: false,
        error: 'Connection is not active',
        status: connection.status,
        error: connection.error
      }, { status: 400 })
    }

    // 연결 테스트 수행
    const testResults = {
      serverInfo: null as any,
      tools: null as any,
      prompts: null as any,
      resources: null as any,
      errors: [] as string[]
    }

    try {
      // 1. 서버 정보 테스트
      console.log(`Testing server info for ${serverId}...`)
      testResults.serverInfo = await connection.client.getServerInfo()
      console.log('Server info test passed')
    } catch (error) {
      const errorMsg = `Server info test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      testResults.errors.push(errorMsg)
      console.error(errorMsg)
    }

    try {
      // 2. 도구 목록 테스트
      console.log(`Testing tools list for ${serverId}...`)
      testResults.tools = await connection.client.listTools()
      console.log('Tools test passed')
    } catch (error) {
      const errorMsg = `Tools test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      testResults.errors.push(errorMsg)
      console.error(errorMsg)
    }

    try {
      // 3. 프롬프트 목록 테스트
      console.log(`Testing prompts list for ${serverId}...`)
      testResults.prompts = await connection.client.listPrompts()
      console.log('Prompts test passed')
    } catch (error) {
      const errorMsg = `Prompts test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      testResults.errors.push(errorMsg)
      console.error(errorMsg)
    }

    try {
      // 4. 리소스 목록 테스트
      console.log(`Testing resources list for ${serverId}...`)
      testResults.resources = await connection.client.listResources()
      console.log('Resources test passed')
    } catch (error) {
      const errorMsg = `Resources test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      testResults.errors.push(errorMsg)
      console.error(errorMsg)
    }

    const isHealthy = testResults.errors.length === 0

    return NextResponse.json({
      success: true,
      serverId,
      healthy: isHealthy,
      testResults,
      summary: {
        serverInfo: !!testResults.serverInfo,
        tools: !!testResults.tools,
        prompts: !!testResults.prompts,
        resources: !!testResults.resources,
        errorCount: testResults.errors.length
      }
    })

  } catch (error) {
    console.error('Error testing MCP connection:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
