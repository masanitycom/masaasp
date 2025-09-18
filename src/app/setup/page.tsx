'use client'

import { useState } from 'react'
import { Database, Play, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  const runSetup = async () => {
    setSetupStatus('running')
    setResults([])
    setError('')

    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results || [])
        setSetupStatus('completed')
      } else {
        setError(data.error || 'Unknown error occurred')
        setSetupStatus('error')
      }
    } catch (err) {
      setError(`Setup failed: ${err}`)
      setSetupStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Database className="mx-auto h-16 w-16 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            MASAASP データベースセットアップ
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            データベーステーブルとテストユーザーを自動作成します
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <div className="space-y-6">
            {setupStatus === 'idle' && (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  以下の内容を自動で作成します：
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-8">
                  <li>✓ usersテーブル（ユーザー管理）</li>
                  <li>✓ camel_levelsテーブル（組織構造）</li>
                  <li>✓ investment_historyテーブル（投資履歴）</li>
                  <li>✓ fund_settingsテーブル（ファンド設定）</li>
                  <li>✓ reward_rulesテーブル（報酬ルール）</li>
                  <li>✓ calculated_rewardsテーブル（報酬計算）</li>
                  <li>✓ テストユーザー（TEST001 / password123）</li>
                </ul>
                <button
                  onClick={runSetup}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Play className="mr-2 h-5 w-5" />
                  データベースセットアップを開始
                </button>
              </div>
            )}

            {setupStatus === 'running' && (
              <div className="text-center">
                <Loader className="mx-auto h-8 w-8 text-indigo-600 animate-spin" />
                <p className="mt-4 text-gray-600">セットアップ実行中...</p>
              </div>
            )}

            {setupStatus === 'completed' && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-medium text-green-900 mt-2">
                    セットアップ完了！
                  </h3>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="font-medium text-green-900 mb-2">✅ 作成完了</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                          {result.step}: {result.success ? '成功' : result.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">🔑 ログイン情報</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>ユーザーID:</strong> TEST001</p>
                    <p><strong>パスワード:</strong> password123</p>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href="/login"
                    className="inline-flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    ログイン画面へ
                  </a>
                </div>
              </div>
            )}

            {setupStatus === 'error' && (
              <div className="text-center">
                <XCircle className="mx-auto h-8 w-8 text-red-600" />
                <h3 className="text-lg font-medium text-red-900 mt-2">
                  セットアップエラー
                </h3>
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={runSetup}
                  className="mt-4 inline-flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  再試行
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>問題が発生した場合は、Supabaseダッシュボードで手動セットアップを行ってください。</p>
        </div>
      </div>
    </div>
  )
}