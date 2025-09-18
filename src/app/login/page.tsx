'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { LogIn } from 'lucide-react'

type LoginFormData = {
  loginId: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setLoading(true)
    setDebugInfo('')

    try {
      const loginId = data.loginId.trim()
      const password = data.password

      // Check if loginId is an email address
      const isEmail = loginId.includes('@')

      let userEmail = ''
      let userData = null

      if (isEmail) {
        // Login with email address
        userEmail = loginId

        // Check if user exists in our database with this email
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('user_id, mail_address, system_access_flg, admin_flg, kanji_last_name, kanji_first_name')
          .eq('mail_address', loginId)
          .single()

        if (userError || !userRecord) {
          setError('メールアドレスまたはパスワードが正しくありません')
          setDebugInfo(`デバッグ情報: メールアドレス "${loginId}" でユーザーを検索 - エラー: ${userError?.message || 'ユーザーが見つかりません'}`)
          setLoading(false)
          return
        }

        userData = userRecord
      } else {
        // Login with user_id
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('user_id, mail_address, system_access_flg, admin_flg, kanji_last_name, kanji_first_name')
          .eq('user_id', loginId)
          .single()

        if (userError || !userRecord) {
          setError('ユーザーIDまたはパスワードが正しくありません')
          setDebugInfo(`デバッグ情報: ユーザーID "${loginId}" でユーザーを検索 - エラー: ${userError?.message || 'ユーザーが見つかりません'}`)
          setLoading(false)
          return
        }

        userData = userRecord
        userEmail = userRecord.mail_address
      }

      // Check system access permission
      if (!userData.system_access_flg) {
        setError('このアカウントはシステムへのアクセスが許可されていません')
        setLoading(false)
        return
      }

      // Authenticate with Supabase Auth using email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('パスワードが正しくありません')
          setDebugInfo(`デバッグ情報: 認証失敗 - ユーザー: ${userData.user_id} (${userEmail}) - 認証エラー: ${authError.message}`)
        } else {
          setError('認証エラー: ' + authError.message)
          setDebugInfo(`デバッグ情報: 認証エラー詳細 - ${authError.message}`)
        }
      } else {
        // Login successful
        setDebugInfo(`デバッグ情報: ログイン成功 - ユーザー: ${userData.user_id} (${userEmail})`)
        router.push('/dashboard')
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました: ' + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-6">
              <img
                src="/MASAASPLOGO.svg"
                alt="MASAASP"
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-center text-2xl font-extrabold text-gray-900">
              ログイン
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              不動産クラウドファンディング アフィリエイト管理システム
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="loginId" className="block text-sm font-medium text-gray-700">
                メールアドレス または ユーザーID
              </label>
              <div className="mt-1">
                <input
                  {...register('loginId', {
                    required: 'メールアドレスまたはユーザーIDを入力してください'
                  })}
                  type="text"
                  autoComplete="username"
                  placeholder="admin@masaasp.com または TEST001"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.loginId && (
                  <p className="mt-1 text-sm text-red-600">{errors.loginId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  {...register('password', {
                    required: 'パスワードを入力してください'
                  })}
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {debugInfo && (
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-xs text-blue-800 font-mono whitespace-pre-wrap">{debugInfo}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    ログイン
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}