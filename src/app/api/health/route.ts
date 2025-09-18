import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'POST request received successfully',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}