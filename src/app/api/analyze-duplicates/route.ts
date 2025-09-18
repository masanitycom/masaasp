import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'ファイルが選択されていません'
      }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    // Find email and user_id column indices
    const emailIndex = headers.findIndex(h =>
      h === 'mail_address' || h === 'メールアドレス' || h === 'MAIL_ADDRESS'
    )
    const userIdIndex = headers.findIndex(h =>
      h === 'user_id' || h === 'ユーザーID' || h === 'USER_ID'
    )

    // Analyze duplicates
    const emailMap = new Map<string, string[]>()
    const userIdMap = new Map<string, number>()
    const emptyEmails: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const email = values[emailIndex] || ''
      const userId = values[userIdIndex] || ''

      if (!email || email === 'null') {
        emptyEmails.push(userId)
      } else {
        if (!emailMap.has(email)) {
          emailMap.set(email, [])
        }
        emailMap.get(email)!.push(userId)
      }

      userIdMap.set(userId, (userIdMap.get(userId) || 0) + 1)
    }

    // Find duplicates
    const duplicateEmails = Array.from(emailMap.entries())
      .filter(([email, users]) => users.length > 1)
      .map(([email, users]) => ({
        email,
        count: users.length,
        user_ids: users.slice(0, 5) // Show first 5 user IDs
      }))

    const duplicateUserIds = Array.from(userIdMap.entries())
      .filter(([userId, count]) => count > 1)
      .map(([userId, count]) => ({ userId, count }))

    // Check existing database
    const supabase = createClient()
    const { data: existingUsers, error: dbError } = await supabase
      .from('users')
      .select('user_id, mail_address')
      .limit(1000)

    const existingEmails = new Set(existingUsers?.map(u => u.mail_address) || [])
    const existingUserIds = new Set(existingUsers?.map(u => u.user_id) || [])

    // Count conflicts
    let emailConflicts = 0
    let userIdConflicts = 0

    for (let i = 1; i < Math.min(lines.length, 100); i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const email = values[emailIndex] || ''
      const userId = values[userIdIndex] || ''

      if (existingEmails.has(email)) emailConflicts++
      if (existingUserIds.has(userId)) userIdConflicts++
    }

    return NextResponse.json({
      success: true,
      analysis: {
        total_rows: lines.length - 1,
        unique_emails: emailMap.size,
        duplicate_emails: duplicateEmails.length,
        empty_emails: emptyEmails.length,
        duplicate_email_records: duplicateEmails.reduce((sum, d) => sum + d.count - 1, 0),
        sample_duplicates: duplicateEmails.slice(0, 10),
        duplicate_user_ids: duplicateUserIds.length,
        existing_conflicts: {
          email_conflicts: emailConflicts,
          user_id_conflicts: userIdConflicts,
          sample_size: Math.min(100, lines.length - 1)
        },
        empty_email_user_ids: emptyEmails.slice(0, 10),
        database_status: {
          existing_users: existingUsers?.length || 0,
          db_error: dbError?.message || null
        }
      }
    })

  } catch (error) {
    console.error('Duplicate analysis error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}