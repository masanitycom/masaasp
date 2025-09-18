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
  const [debugging, setDebugging] = useState(false)
  const [debugResult, setDebugResult] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string>('')

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult('')

    try {
      // Check file size first
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setResult(`❌ ファイルサイズが大きすぎます: ${(file.size / 1024 / 1024).toFixed(2)}MB\n最大サイズ: 10MB`)
        return
      }

      setResult(`📤 ファイルアップロード中...
・ファイル名: ${file.name}
・サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB
・テーブル: ${tableName}`)

      // Use FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tableName', tableName)

      const response = await fetch('/api/csv-stream', {
        method: 'POST',
        body: formData
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        setResult(`❌ サーバーエラー: ${response.status} ${response.statusText}

エラー詳細:
${textResponse.substring(0, 1000)}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        setResult(`✅ ${result.message}

詳細:
・処理済み: ${result.details?.totalProcessed || 0}件
・エラー: ${result.details?.totalErrors || 0}件
・総行数: ${result.details?.totalRows || 0}行

${result.details?.errors?.length > 0 ? `\n⚠️ エラー詳細:\n${result.details.errors.join('\n')}` : ''}`)
      } else {
        setResult(`❌ エラー: ${result.error}

詳細: ${result.details || ''}`)
      }

    } catch (error) {
      console.error('CSV Upload Error:', error)
      setResult(`❌ アップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}

デバッグ情報:
・ファイル名: ${file?.name}
・ファイルサイズ: ${(file?.size / 1024 / 1024).toFixed(2)}MB
・テーブル名: ${tableName}

対処法:
1. ファイルサイズを10MB以下に分割してください
2. CSVファイルが正しい形式か確認してください
3. ブラウザコンソールでエラー詳細を確認してください`)
    } finally {
      setUploading(false)
    }
  }

  const handleDebugCSV = async () => {
    if (!file) return

    setDebugging(true)
    setDebugResult('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tableName', tableName)

      setDebugResult(`🔍 CSVファイル解析中...
・ファイル名: ${file.name}
・サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

      const response = await fetch('/api/csv-debug', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        const debug = result.debug_analysis
        setDebugResult(`📊 CSV解析結果:

📁 ファイル情報:
・名前: ${debug.file_info.name}
・サイズ: ${(debug.file_info.size / 1024 / 1024).toFixed(2)}MB
・タイプ: ${debug.file_info.type}

📋 CSV構造:
・総行数: ${debug.csv_structure.total_lines}
・ヘッダー: ${debug.csv_structure.headers.join(', ')}
・サンプル数: ${debug.csv_structure.sample_count}

🧪 データベーステスト:
・接続: ${debug.database_tests.connection}
・挿入テスト: ${debug.database_tests.insertion}
・RLSチェック: ${debug.database_tests.rls_check}
${debug.database_tests.connection_error ? `・接続エラー: ${debug.database_tests.connection_error}` : ''}

🔧 環境設定:
・Supabase URL: ${debug.environment.supabase_url}
・匿名キー: ${debug.environment.anon_key}
・サービスキー: ${debug.environment.service_key}

📄 サンプルデータ (最初の3行):
${debug.sample_data.map((row: any, idx: number) =>
  `${idx + 1}. ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')}`
).join('\n')}

✅ 処理ステップ:
${debug.processing_steps.map((step: string) => `・${step}`).join('\n')}`)

      } else {
        setDebugResult(`❌ デバッグエラー: ${result.error}`)
      }

    } catch (error) {
      setDebugResult(`❌ デバッグ処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDebugging(false)
    }
  }

  const handleAnalyzeDuplicates = async () => {
    if (!file) return

    setAnalyzing(true)
    setAnalysisResult('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setAnalysisResult(`🔍 重複分析中...
・ファイル名: ${file.name}
・サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

      const response = await fetch('/api/analyze-duplicates', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        const analysis = result.analysis
        setAnalysisResult(`📊 重複分析結果:

📈 基本統計:
・総レコード数: ${analysis.total_rows.toLocaleString()}件
・ユニークメール数: ${analysis.unique_emails.toLocaleString()}件
・重複メール数: ${analysis.duplicate_emails.toLocaleString()}種類
・空のメール: ${analysis.empty_emails.toLocaleString()}件

🔴 重複による処理失敗予想:
・重複メールレコード: ${analysis.duplicate_email_records.toLocaleString()}件
・重複ユーザーID: ${analysis.duplicate_user_ids.toLocaleString()}件

💾 データベースとの衝突:
・既存メール衝突(サンプル100件中): ${analysis.existing_conflicts.email_conflicts}件
・既存ユーザーID衝突(サンプル100件中): ${analysis.existing_conflicts.user_id_conflicts}件
・現在のDB登録数: ${analysis.database_status.existing_users.toLocaleString()}件

🔍 重複メールの例 (最初の5種類):
${analysis.sample_duplicates.map((dup: any, idx: number) =>
  `${idx + 1}. ${dup.email} - ${dup.count}重複 (ユーザー: ${dup.user_ids.join(', ')})`
).join('\n')}

${analysis.empty_email_user_ids.length > 0 ? `
❗ 空メールのユーザーID例:
${analysis.empty_email_user_ids.slice(0, 5).join(', ')}
` : ''}

💡 対処法:
1. 重複メールは最初のレコードのみ処理される
2. 後続の重複は自動的にスキップされる
3. 空メールのレコードも処理対象外
4. ${17311 + analysis.duplicate_email_records}件の想定処理数と一致`)

      } else {
        setAnalysisResult(`❌ 分析エラー: ${result.error}`)
      }

    } catch (error) {
      setAnalysisResult(`❌ 分析処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setAnalyzing(false)
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>

          <button
            onClick={handleDebugCSV}
            disabled={!file || debugging}
            className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {debugging ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {debugging ? '解析中...' : 'CSVデバッグ'}
          </button>

          {tableName === 'users' && (
            <button
              onClick={handleAnalyzeDuplicates}
              disabled={!file || analyzing}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {analyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              {analyzing ? '分析中...' : '重複分析'}
            </button>
          )}
        </div>

        {result && (
          <div className={`p-3 rounded-md ${result.includes('エラー') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            <pre className="whitespace-pre-wrap text-xs">{result}</pre>
          </div>
        )}

        {debugResult && (
          <div className="p-3 rounded-md bg-blue-50 text-blue-800">
            <h4 className="font-semibold mb-2">🔍 CSV解析結果</h4>
            <pre className="whitespace-pre-wrap text-xs">{debugResult}</pre>
          </div>
        )}

        {analysisResult && (
          <div className="p-3 rounded-md bg-purple-50 text-purple-800">
            <h4 className="font-semibold mb-2">📊 重複分析結果</h4>
            <pre className="whitespace-pre-wrap text-xs">{analysisResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [creatingUsers, setCreatingUsers] = useState(false)
  const [authResult, setAuthResult] = useState<string>('')
  const [checkingData, setCheckingData] = useState(false)
  const [dataStatus, setDataStatus] = useState<string>('')
  const [fixingRLS, setFixingRLS] = useState(false)
  const [rlsResult, setRlsResult] = useState<string>('')
  const [testingInsert, setTestingInsert] = useState(false)
  const [insertResult, setInsertResult] = useState<string>('')
  const [debuggingDB, setDebuggingDB] = useState(false)
  const [debugDBResult, setDebugDBResult] = useState<string>('')
  const [creatingTestUser, setCreatingTestUser] = useState(false)
  const [testUserResult, setTestUserResult] = useState<string>('')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateAuthUsers = async () => {
    setCreatingUsers(true)
    setAuthResult('')

    try {
      const response = await fetch('/api/create-auth-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        setAuthResult(`❌ サーバーエラー: ${response.status} ${response.statusText}\n\n${textResponse.substring(0, 500)}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        setAuthResult(`✅ ${result.message}${result.errors ? `\n⚠️ エラー件数: ${result.errors.length}` : ''}`)
      } else {
        setAuthResult(`❌ エラー: ${result.error}`)
      }

    } catch (error) {
      setAuthResult(`❌ 認証ユーザー作成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingUsers(false)
    }
  }

  const handleCheckData = async () => {
    setCheckingData(true)
    setDataStatus('')

    try {
      const response = await fetch('/api/check-users', {
        method: 'GET'
      })

      const result = await response.json()

      if (result.success) {
        const data = result.data
        setDataStatus(`📊 データベース状況:
・データベースユーザー数: ${data.total_database_users}
・認証ユーザー数: ${data.total_auth_users}
・連携済みユーザー数: ${data.users_with_auth_id}

サンプルユーザー:
${data.database_users?.map((u: any) => `・${u.user_id} (${u.mail_address}) - 認証ID: ${u.id ? 'あり' : 'なし'}`).join('\n') || 'データなし'}`)
      } else {
        setDataStatus(`❌ エラー: ${result.error}`)
      }

    } catch (error) {
      setDataStatus(`❌ データ確認エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCheckingData(false)
    }
  }

  const handleFixRLS = async () => {
    setFixingRLS(true)
    setRlsResult('')

    try {
      const response = await fetch('/api/fix-rls', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setRlsResult(`✅ ${result.message}`)
      } else {
        setRlsResult(`❌ エラー: ${result.error}

📋 手動修正用SQL:
${result.manual_sql || ''}`)
      }

    } catch (error) {
      setRlsResult(`❌ RLS修正エラー: ${error instanceof Error ? error.message : 'Unknown error'}

Supabaseダッシュボードで手動でRLSポリシーを修正してください。`)
    } finally {
      setFixingRLS(false)
    }
  }

  const handleTestInsert = async () => {
    setTestingInsert(true)
    setInsertResult('')

    try {
      const response = await fetch('/api/test-insert', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setInsertResult(`✅ テスト挿入成功！
挿入されたユーザー: ${result.inserted_user?.[0]?.user_id}
現在のユーザー数: ${result.total_users}

現在のユーザー一覧:
${result.current_users?.map((u: any) => `・${u.user_id} (${u.kanji_last_name} ${u.kanji_first_name})`).join('\n') || 'なし'}`)
      } else {
        setInsertResult(`❌ テスト挿入失敗: ${result.error}`)
      }

    } catch (error) {
      setInsertResult(`❌ テスト挿入エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTestingInsert(false)
    }
  }

  const handleDebugDB = async () => {
    setDebuggingDB(true)
    setDebugDBResult('')

    try {
      const response = await fetch('/api/debug-db', {
        method: 'GET'
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        setDebugDBResult(`❌ サーバーエラー: ${response.status}\n\n${textResponse.substring(0, 1000)}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        const debug = result.debug_info
        setDebugDBResult(`🔍 データベースデバッグ結果:

📊 基本情報:
・接続テスト: ${debug.connection_test}
・総ユーザー数: ${debug.total_users}
・挿入テスト: ${debug.insert_test}

👥 ユーザーサンプル:
${debug.users_sample.map((u: any) => `・${u.user_id} (${u.mail_address}) - パスワード: ${u.has_password}`).join('\n') || '・データなし'}

⚙️ 設定状況:
・Supabase URL: ${debug.supabase_config.url}
・Anon Key: ${debug.supabase_config.has_anon_key ? 'あり' : 'なし'}
・Service Key: ${debug.supabase_config.has_service_key ? 'あり' : 'なし'}

${debug.errors.connection_error || debug.errors.users_error ? `\n❌ エラー:\n・${debug.errors.connection_error || ''}\n・${debug.errors.users_error || ''}` : ''}`)
      } else {
        setDebugDBResult(`❌ デバッグエラー: ${result.error}`)
      }

    } catch (error) {
      setDebugDBResult(`❌ デバッグ失敗: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDebuggingDB(false)
    }
  }

  const handleCreateTestUser = async () => {
    setCreatingTestUser(true)
    setTestUserResult('')

    try {
      const response = await fetch('/api/create-test-user', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setTestUserResult(`✅ テストユーザー作成成功！

📧 ログイン情報:
・メールアドレス: ${result.user.email}
・ユーザーID: ${result.user.user_id}
・パスワード: ${result.user.password}
・管理者権限: ${result.user.admin ? 'あり' : 'なし'}

🔧 作成結果:
・データベース: ${result.database_result ? '成功' : '失敗'}
・認証システム: ${result.auth_result}

📋 ログイン手順:
${result.login_instructions.map((step: string) => `${step}`).join('\n')}

今すぐログインテストができます！`)
      } else {
        setTestUserResult(`❌ テストユーザー作成失敗: ${result.error}`)
      }

    } catch (error) {
      setTestUserResult(`❌ テストユーザー作成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingTestUser(false)
    }
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
            <Users className="h-5 w-5 inline mr-2" />
            認証ユーザー作成
          </h3>
          <p className="text-gray-600 mb-4">
            CSVアップロード後、ユーザーがログインできるように認証アカウントを作成します。
            <br />
            <strong>注意:</strong> CSVのパスワードが使用されます。パスワードがない場合はユーザーIDがパスワードになります。
          </p>
          <button
            onClick={handleCreateAuthUsers}
            disabled={creatingUsers}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {creatingUsers ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            {creatingUsers ? '認証ユーザー作成中...' : '認証ユーザーを作成'}
          </button>
          {authResult && (
            <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-wrap ${authResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {authResult}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Users className="h-5 w-5 inline mr-2" />
            テストユーザー作成
          </h3>
          <p className="text-gray-600 mb-4">
            ログインテスト用のユーザー（TEST001）を作成します。データベースと認証システムの両方に登録されます。
          </p>
          <button
            onClick={handleCreateTestUser}
            disabled={creatingTestUser}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {creatingTestUser ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            {creatingTestUser ? 'テストユーザー作成中...' : 'テストユーザーを作成'}
          </button>
          {testUserResult && (
            <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-wrap font-mono ${testUserResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {testUserResult}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Settings className="h-5 w-5 inline mr-2" />
            RLSポリシー修正
          </h3>
          <p className="text-gray-600 mb-4">
            406エラーが発生している場合、Row Level Securityポリシーを修正します。
          </p>
          <button
            onClick={handleFixRLS}
            disabled={fixingRLS}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {fixingRLS ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            {fixingRLS ? 'RLS修正中...' : 'RLSポリシーを修正'}
          </button>
          {rlsResult && (
            <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-wrap font-mono ${rlsResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {rlsResult}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <FileText className="h-5 w-5 inline mr-2" />
            完全データベースデバッグ
          </h3>
          <p className="text-gray-600 mb-4">
            データベース接続、データ存在、設定状況を詳細に確認します。
          </p>
          <button
            onClick={handleDebugDB}
            disabled={debuggingDB}
            className="bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {debuggingDB ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {debuggingDB ? '詳細デバッグ中...' : '完全データベースデバッグ'}
          </button>
          {debugDBResult && (
            <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-wrap font-mono ${debugDBResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              {debugDBResult}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <TrendingUp className="h-5 w-5 inline mr-2" />
            データベース挿入テスト
          </h3>
          <p className="text-gray-600 mb-4">
            データベースに実際にデータが挿入できるかテストします。
          </p>
          <button
            onClick={handleTestInsert}
            disabled={testingInsert}
            className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {testingInsert ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            {testingInsert ? 'テスト中...' : 'データベース挿入テスト'}
          </button>
          {insertResult && (
            <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-wrap font-mono ${insertResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {insertResult}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <FileText className="h-5 w-5 inline mr-2" />
            データベース状況確認
          </h3>
          <p className="text-gray-600 mb-4">
            現在のデータベースとユーザー認証の状況を確認します。
          </p>
          <button
            onClick={handleCheckData}
            disabled={checkingData}
            className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {checkingData ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {checkingData ? 'データ確認中...' : 'データ状況を確認'}
          </button>
          {dataStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm whitespace-pre-wrap font-mono ${dataStatus.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              {dataStatus}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
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