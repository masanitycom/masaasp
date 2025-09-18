import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get all users from the database who don't have auth accounts yet
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('user_id, mail_address, kanji_last_name, kanji_first_name, password')
      .not('mail_address', 'is', null)

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch users: ${fetchError.message}`
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users found in database'
      }, { status: 404 })
    }

    let createdCount = 0
    let errors: string[] = []

    // Create auth users in batches to avoid rate limits
    for (const user of users) {
      try {
        // Check if auth user already exists
        const { data: existingAuthUser } = await supabase.auth.admin.getUserByEmail(user.mail_address)

        if (existingAuthUser.user) {
          // Auth user already exists, skip
          continue
        }

        // Create new auth user with password from CSV
        // If no password in CSV, use user_id as default password
        const userPassword = user.password || user.user_id

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.mail_address,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            user_id: user.user_id,
            display_name: `${user.kanji_last_name} ${user.kanji_first_name}`
          }
        })

        if (authError) {
          errors.push(`${user.user_id}: ${authError.message}`)
        } else {
          // Update users table with auth UUID
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: authUser.user?.id })
            .eq('user_id', user.user_id)

          if (updateError) {
            errors.push(`${user.user_id}: Failed to update UUID - ${updateError.message}`)
          } else {
            createdCount++
          }
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (userError) {
        errors.push(`${user.user_id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} auth users out of ${users.length} total users`,
      createdCount,
      totalUsers: users.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit error list
    })

  } catch (error) {
    console.error('Create auth users error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}