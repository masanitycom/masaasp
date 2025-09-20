'use client'

import { useState } from 'react'
import { Settings, Users, LogIn, AlertTriangle } from 'lucide-react'

export default function AuthSetupPage() {
  const [setupResult, setSetupResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleAuthSetup = async () => {
    setLoading(true)
    setSetupResult('🔧 認証セットアップ中...')

    try {
      const response = await fetch('/api/manual-auth-setup', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setSetupResult(`✅ セットアップ完了！以下のアカウントでログインできます：

📧 利用可能なアカウント:
${result.working_credentials.map((cred: any) =>
  `━━━━━━━━━━━━━━━━━━━
  📌 メール: ${cred.email}
  🔑 パスワード: ${cred.password}
  👤 ユーザーID: ${cred.user_id}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━

✨ ログインページへ移動してテストしてください`)
      } else {
        setSetupResult(`❌ セットアップ失敗: ${result.error}`)
      }
    } catch (error) {
      setSetupResult(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!userId || !newPassword) {
      setSetupResult('❌ ユーザーIDとパスワードを入力してください')
      return
    }

    setResetLoading(true)
    setSetupResult('🔧 パスワードリセット中...')

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: newPassword
        })
      })

      const result = await response.json()

      if (result.success) {
        setSetupResult(`✅ パスワードリセット完了！

📧 ログイン情報:
━━━━━━━━━━━━━━━━━━━
👤 ユーザーID: ${result.credentials.user_id}
📌 メール: ${result.credentials.email}
🔑 新パスワード: ${result.credentials.password}
━━━━━━━━━━━━━━━━━━━

✨ ログインページへ移動してテストしてください`)
      } else {
        setSetupResult(`❌ リセット失敗: ${result.error}`)
      }
    } catch (error) {
      setSetupResult(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResetLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Header */}
        <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6" />
          <h1 className="text-xl font-bold">緊急認証セットアップ</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-xl rounded-b-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              MasaASP - ログインできない問題を解決
            </h2>
            <p className="text-gray-600">
              このページは認証なしでアクセス可能です。<br />
              個別パスワードリセットまたは新規アカウント作成ができます。<br />
              <strong>ログインできない場合は、ログインページのパスワードリセット機能をご利用ください。</strong>
            </p>
          </div>

          {/* Password Reset Section */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-3">既存ユーザーのパスワードリセット</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="ユーザーID（例：c44111031）"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-colors"
              >
                {resetLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    リセット中...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    パスワードをリセット
                  </>
                )}
              </button>
            </div>
          </div>

          {/* New Account Setup Button */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">新規テストアカウント作成</h3>
            <button
              onClick={handleAuthSetup}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                  セットアップ中...
                </>
              ) : (
                <>
                  <Settings className="h-6 w-6 mr-3" />
                  テストアカウントを作成
                </>
              )}
            </button>
          </div>

          {/* Result Display */}
          {setupResult && (
            <div className={`p-6 rounded-lg ${
              setupResult.includes('✅')
                ? 'bg-green-50 border-2 border-green-300'
                : setupResult.includes('❌')
                ? 'bg-red-50 border-2 border-red-300'
                : 'bg-blue-50 border-2 border-blue-300'
            }`}>
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {setupResult}
              </pre>
            </div>
          )}

          {/* Login Link */}
          {setupResult.includes('✅') && (
            <div className="mt-6">
              <a
                href="/login"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 flex items-center justify-center text-lg font-semibold transition-colors"
              >
                <LogIn className="h-5 w-5 mr-2" />
                ログインページへ移動
              </a>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📝 使用方法：</h3>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>「認証アカウントを作成する」ボタンをクリック</li>
              <li>表示されたログイン情報をメモ</li>
              <li>ログインページへ移動</li>
              <li>メールアドレスとパスワードでログイン</li>
            </ol>
          </div>

          {/* Direct Links */}
          <div className="mt-6 flex space-x-4">
            <a
              href="/"
              className="flex-1 text-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              ホームへ
            </a>
            <a
              href="/login"
              className="flex-1 text-center py-2 px-4 border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
            >
              ログインページ
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>このページのURL: <code className="bg-gray-200 px-2 py-1 rounded">https://masaasp.vercel.app/auth-setup</code></p>
        </div>
      </div>
    </div>
  )
}