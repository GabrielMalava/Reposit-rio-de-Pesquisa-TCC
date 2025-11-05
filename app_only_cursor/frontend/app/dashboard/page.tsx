'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import KPICard from '@/components/KPICard'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadData()
  }, [isAuthenticated, router])

  const loadData = async () => {
    try {
      const [dashboardRes, coursesRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/courses'),
      ])
      setDashboard(dashboardRes.data)
      setCourses(coursesRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
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

  const barData = {
    labels: courses.slice(0, 10).map((c) => c.name),
    datasets: [
      {
        label: 'Média',
        data: courses.slice(0, 10).map((c) => c.average),
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 1,
      },
    ],
  }

  const pieData = {
    labels: ['Aprovados', 'Reprovados'],
    datasets: [
      {
        data: [
          dashboard?.overallApprovalRate || 0,
          100 - (dashboard?.overallApprovalRate || 0),
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(239, 68, 68, 0.5)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <KPICard
            title="Total de Alunos"
            value={dashboard?.totalStudents || 0}
            icon="👥"
          />
          <KPICard
            title="Média Geral (GPA)"
            value={dashboard?.overallGPA || 0}
            icon="📊"
          />
          <KPICard
            title="Taxa de Aprovação"
            value={`${dashboard?.overallApprovalRate || 0}%`}
            icon="✅"
          />
          <KPICard
            title="Total de Disciplinas"
            value={dashboard?.totalCourses || 0}
            icon="📚"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Médias por Disciplina (Top 10)
            </h2>
            <Bar data={barData} options={{ responsive: true }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Distribuição de Aprovação
            </h2>
            <Pie data={pieData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </Layout>
  )
}


