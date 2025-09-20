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

      setDebugInfo(`ログイン試行: ${loginId}`)

      // 緊急ログイン（開発・テスト用）
      if (password === 'emergency123') {
        setDebugInfo('緊急ログインを実行中...')

        // ユーザーを検索（メールまたはユーザーIDで）
        let userData = null

        if (loginId.includes('@')) {
          // メールアドレスで検索
          const { data: userRecords } = await supabase
            .from('users')
            .select('*')
            .eq('mail_address', loginId)
            .limit(1)

          userData = userRecords?.[0]
        } else {
          // ユーザーIDで検索
          const { data: userRecords } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', loginId)
            .limit(1)

          userData = userRecords?.[0]
        }

        if (userData) {
          setDebugInfo(`緊急ログイン成功: ${userData.user_id}`)

          // 手動でセッション作成
          localStorage.setItem('masaasp_user', JSON.stringify(userData))

          if (userData.admin_flg) {
            router.push('/admin-dashboard')
          } else {
            router.push('/dashboard')
          }
          return
        } else {
          setError('ユーザーが見つかりません')
          return
        }
      }

      // 通常のログイン処理
      const isEmail = loginId.includes('@')
      let userEmail = ''
      let userData = null

      if (!isEmail) {
        // ユーザーIDでログイン
        const { data: userRecords, error: userError } = await supabase
          .from('users')
          .select('user_id, mail_address, system_access_flg, admin_flg, kanji_last_name, kanji_first_name')
          .eq('user_id', loginId)

        userData = userRecords?.[0]

        if (!userData) {
          setError('ユーザーIDが見つかりません')
          setDebugInfo(`ユーザーID "${loginId}" が見つかりません`)
          setLoading(false)
          return
        }

        userEmail = userData.mail_address
      } else {
        // メールアドレスでログイン
        const { data: userRecords, error: userError } = await supabase
          .from('users')
          .select('user_id, mail_address, system_access_flg, admin_flg, kanji_last_name, kanji_first_name')
          .eq('mail_address', loginId)

        userData = userRecords?.[0]

        if (!userData) {
          setError('メールアドレスが見つかりません')
          setDebugInfo(`メールアドレス "${loginId}" が見つかりません`)
          setLoading(false)
          return
        }

        userEmail = userData.mail_address
      }

      setDebugInfo(`ユーザー見つかりました: ${userData.user_id} (${userEmail})`)

      // システムアクセス権限をチェック（緩和）
      if (userData.system_access_flg === false) {
        setError('アカウントが無効化されています')
        setLoading(false)
        return
      }

      // Supabase認証を試行
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      })

      if (authError) {
        setError('パスワードが正しくありません')
        setDebugInfo(`認証エラー: ${authError.message}`)
      } else {
        setDebugInfo(`ログイン成功: ${userData.user_id}`)

        // リダイレクト
        if (userData.admin_flg) {
          router.push('/admin-dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError(`ログインエラー: ${err}`)
      setDebugInfo(`エラー詳細: ${err}`)
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
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800 text-center">
                <strong>緊急アクセス:</strong><br />
                パスワードに「emergency123」を入力すると緊急ログインできます
              </p>
            </div>
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
                  placeholder=""
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