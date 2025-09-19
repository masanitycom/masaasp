'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Users, Database, AlertCircle, LogOut, Shield, Home } from 'lucide-react'

interface CSVUploadResult {
  success: boolean
  message: string
  details?: any
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('upload')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/MASAASPLOGO.svg"
                alt="MasaASP"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">データ管理</h1>
                <p className="text-xs text-gray-500">CSV アップロード & システム管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/admin-dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <Home className="h-5 w-5 mr-1" />
                ダッシュボード
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              CSVアップロード
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="h-4 w-4 inline mr-2" />
              システム管理
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && <CSVUploadSection />}
        {activeTab === 'system' && <SystemManagementSection />}
      </main>
    </div>
  )
}

function CSVUploadSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CSVデータアップロード</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CSVUploader
            title="ユーザーデータ"
            description="ユーザー基本情報の一括登録"
            tableName="users"
            icon={<Users className="h-6 w-6 text-blue-600" />}
          />
          <CSVUploader
            title="組織階層データ"
            description="紹介関係・組織構造の登録"
            tableName="camel_levels"
            icon={<FileText className="h-6 w-6 text-green-600" />}
          />
          <CSVUploader
            title="投資履歴データ"
            description="ファンド投資実績の登録"
            tableName="investment_history"
            icon={<Database className="h-6 w-6 text-yellow-600" />}
          />
          <CSVUploader
            title="報酬データ"
            description="計算済み報酬情報の登録"
            tableName="calculated_rewards"
            icon={<AlertCircle className="h-6 w-6 text-purple-600" />}
          />
        </div>
      </div>
    </div>
  )
}

function SystemManagementSection() {
  const [authSetupResult, setAuthSetupResult] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  const handleAuthSetup = async () => {
    setSetupLoading(true)
    setAuthSetupResult('')

    try {
      setAuthSetupResult('🔧 認証システム初期化中...')

      const response = await fetch('/api/manual-auth-setup', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setAuthSetupResult(`✅ 認証システム初期化完了

🔑 管理者アカウント:
・メール: admin@masaasp.com
・パスワード: admin123

🔑 テストアカウント:
・メール: test@masaasp.com
・パスワード: test123

これらのアカウントでログインできます。`)
      } else {
        setAuthSetupResult(`❌ エラー: ${result.error}`)
      }
    } catch (error) {
      setAuthSetupResult(`❌ システムエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">システム管理</h2>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">認証システム初期化</h3>
            <p className="text-sm text-gray-600 mb-4">
              ログインに問題がある場合、認証システムを初期化してテストアカウントを作成します。
            </p>
            <button
              onClick={handleAuthSetup}
              disabled={setupLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {setupLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              認証システム初期化
            </button>

            {authSetupResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{authSetupResult}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CSVUploader({ title, description, tableName, icon }: {
  title: string
  description: string
  tableName: string
  icon: React.ReactNode
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState('')

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult('')

    try {
      setResult(`📤 アップロード中: ${file.name}`)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('tableName', tableName)

      const response = await fetch('/api/csv-stream', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setResult(`✅ アップロード完了
・処理件数: ${data.processed}件
・エラー: ${data.errors}件`)
      } else {
        setResult(`❌ エラー: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ アップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-lg font-medium text-gray-900 ml-2">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="space-y-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>

        {result && (
          <div className="p-3 bg-gray-50 rounded-md">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}