'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Users, TrendingUp, Settings, LogOut, Home } from 'lucide-react'
import Papa from 'papaparse'

interface CSVUploadProps {
  title: string
  description: string
  tableName: string
  icon: React.ReactNode
}

function CSVUpload({ title, description, tableName, icon }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult('')

    try {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

      // Here you would process the CSV data and insert into Supabase
      // For now, just show the parsed data
      setResult(`解析完了: ${parsed.data.length}行のデータを検出しました`)

      console.log(`${tableName} data:`, parsed.data)
    } catch (error) {
      setResult(`エラー: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900 ml-2">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>

      <div className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>

        {result && (
          <div className={`p-3 rounded-md ${result.includes('エラー') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const csvConfigs = [
    {
      title: 'ユーザーデータ',
      description: 'tb_user作成_暗号化処理済み_1.csv (20,111行)',
      tableName: 'users',
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: '組織レベルデータ',
      description: 'tb_camel_level_2.csv (20,111行)',
      tableName: 'camel_levels',
      icon: <TrendingUp className="h-6 w-6 text-green-600" />
    },
    {
      title: 'マッチングデータ',
      description: 'Matched_Data_2.csv (21,207行)',
      tableName: 'matched_data',
      icon: <FileText className="h-6 w-6 text-purple-600" />
    },
    {
      title: '投資履歴データ',
      description: 'CAMEL入金履歴編集_ID入力済み_1.csv (12,707行)',
      tableName: 'investment_history',
      icon: <TrendingUp className="h-6 w-6 text-yellow-600" />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/MASAASPLOGO.svg"
                alt="MASAASP"
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-bold text-gray-900">管理画面</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-12 items-center">
            <a href="/dashboard" className="text-indigo-100 hover:text-white flex items-center">
              <Home className="h-4 w-4 mr-1" />
              ダッシュボード
            </a>
            <a href="/organization" className="text-indigo-100 hover:text-white">
              組織図
            </a>
            <a href="/rewards" className="text-indigo-100 hover:text-white">
              報酬
            </a>
            <a href="/admin" className="text-white font-medium flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              管理
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">CSVデータアップロード</h2>
          <p className="text-gray-600">
            以下のCSVファイルをアップロードしてデータベースを更新してください。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {csvConfigs.map((config, index) => (
            <CSVUpload
              key={index}
              title={config.title}
              description={config.description}
              tableName={config.tableName}
              icon={config.icon}
            />
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Settings className="h-5 w-5 inline mr-2" />
            ファンド設定管理
          </h3>
          <p className="text-gray-600 mb-4">
            物件別の報酬設定を管理します。
          </p>
          <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
            ファンド設定を開く
          </button>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 アップロード手順</h4>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>まず「ユーザーデータ」をアップロード</li>
            <li>次に「組織レベルデータ」をアップロード</li>
            <li>「マッチングデータ」をアップロード</li>
            <li>最後に「投資履歴データ」をアップロード</li>
          </ol>
        </div>
      </main>
    </div>
  )
}