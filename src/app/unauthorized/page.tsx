'use client'

import { Shield, LogOut, Home, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserX className="mx-auto h-16 w-16 text-orange-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            管理者権限が必要です
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            この機能にアクセスするには管理者権限が必要です
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <UserX className="h-5 w-5 text-orange-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    管理者権限が不足しています
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      アクセスしようとした機能は管理者のみが利用できます。
                      管理者権限が必要な場合は、システム管理者にお問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    管理者機能について
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>CSVデータのアップロード</li>
                      <li>ファンド設定の管理</li>
                      <li>ユーザー権限の管理</li>
                      <li>システム設定の変更</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleGoHome}
                className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードへ
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            管理者権限に関するお問い合わせ:
            <a href="mailto:admin@masaasp.com" className="text-indigo-600 hover:text-indigo-500">
              admin@masaasp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}