'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function HistoryPage() {
  const [imports, setImports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadHistory()
  }, [isAuthenticated, router])

  const loadHistory = async () => {
    try {
      const response = await api.get('/import')
      setImports(response.data)
    } catch (error) {
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (importId: number, type: string) => {
    try {
      if (type === 'original') {
        const response = await api.get(`/import/${importId}/original`, {
          responseType: 'blob',
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `original_${importId}.xml`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success('Download realizado com sucesso!')
      } else {
        const response = await api.get(
          `/reports/imports/${importId}/consolidated/${type}`,
          {
            responseType: 'blob',
          }
        )
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `consolidado_${importId}.${type}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success(`Download ${type.toUpperCase()} realizado com sucesso!`)
      }
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Histórico de Importações
        </h1>

        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma importação encontrada
                    </td>
                  </tr>
                ) : (
                  imports.map((importItem) => (
                    <tr key={importItem.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(
                          new Date(importItem.createdAt),
                          "dd/MM/yyyy 'às' HH:mm"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {importItem.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {importItem.recordsImported}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            importItem.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {importItem.status === 'success' ? 'Sucesso' : 'Falha'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {importItem.processingTime
                          ? `${importItem.processingTime}ms`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(importItem.id, 'original')}
                            className="text-primary-600 hover:text-primary-900"
                            title="Download original"
                          >
                            XML
                          </button>
                          <button
                            onClick={() => handleDownload(importItem.id, 'xml')}
                            className="text-primary-600 hover:text-primary-900"
                            title="Download consolidado XML"
                          >
                            XML C
                          </button>
                          <button
                            onClick={() => handleDownload(importItem.id, 'csv')}
                            className="text-primary-600 hover:text-primary-900"
                            title="Download consolidado CSV"
                          >
                            CSV
                          </button>
                          <button
                            onClick={() => handleDownload(importItem.id, 'pdf')}
                            className="text-primary-600 hover:text-primary-900"
                            title="Download consolidado PDF"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

