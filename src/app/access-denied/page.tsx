'use client'

import { Shield, LogOut, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccessDeniedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleGoHome = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            アクセスが拒否されました
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            このアカウントはシステムへのアクセスが許可されていません
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    システムアクセス権限がありません
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      あなたのアカウントは現在、システムへのアクセスが制限されています。
                      アクセス権限が必要な場合は、管理者にお問い合わせください。
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
                    アクセス権限について
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>システムアクセスには事前承認が必要です</li>
                      <li>管理者によりアカウントが有効化されている必要があります</li>
                      <li>不動産投資に関する適格性の確認が必要な場合があります</li>
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
                ログイン画面へ
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            システム管理者へのお問い合わせ:
            <a href="mailto:admin@masaasp.com" className="text-indigo-600 hover:text-indigo-500">
              admin@masaasp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}