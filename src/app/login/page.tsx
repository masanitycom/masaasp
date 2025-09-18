'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { LogIn } from 'lucide-react'

type LoginFormData = {
  userId: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setLoading(true)

    try {
      // Simple test credentials check for TEST001
      if (data.userId === 'TEST001' && data.password === 'password123') {
        // Direct auth with known email
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'admin@masaasp.com',
          password: 'password123',
        })

        if (authError) {
          setError('認証エラー: ' + authError.message)
        } else {
          router.push('/dashboard')
        }
        setLoading(false)
        return
      }

      // For other users, check the database first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('mail_address, system_access_flg')
        .eq('user_id', data.userId)
        .single()

      if (userError || !userData) {
        setError('ユーザーIDまたはパスワードが正しくありません')
        setLoading(false)
        return
      }

      if (!userData.system_access_flg) {
        setError('このアカウントはシステムへのアクセスが許可されていません')
        setLoading(false)
        return
      }

      // Sign in with Supabase Auth using email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.mail_address,
        password: data.password,
      })

      if (authError) {
        setError('ユーザーIDまたはパスワードが正しくありません')
      } else {
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
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              MASAASP
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              不動産クラウドファンディング アフィリエイト管理システム
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                ユーザーID
              </label>
              <div className="mt-1">
                <input
                  {...register('userId', {
                    required: 'ユーザーIDを入力してください'
                  })}
                  type="text"
                  autoComplete="username"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
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