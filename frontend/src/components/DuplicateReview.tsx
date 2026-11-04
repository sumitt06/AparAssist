import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Users } from 'lucide-react'
import { apiFetch } from '../utils/api'

type DuplicateStudent = {
  student_id: number
  student_name: string
  programme: string
  academic_year: string
}

type DuplicateGroup = {
  apaar_id: string
  duplicate_count: number
  student_records: DuplicateStudent[]
}

type DuplicateResponse = {
  success: boolean
  totalDuplicateGroups: number
  totalAffectedRecords: number
  duplicates: DuplicateGroup[]
  message?: string
}

export default function DuplicateReview() {
  const [data, setData] = useState<DuplicateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDuplicates = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiFetch('/students/duplicates')
      const result: DuplicateResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load duplicate records.')
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDuplicates()
  }, [fetchDuplicates])

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-slate-500">
        <RefreshCw className="mr-2 animate-spin" size={20} />
        Loading duplicate records...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{error}</p>
        <button
          onClick={() => void fetchDuplicates()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const duplicates = data?.duplicates ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Duplicate Review</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review records in your institution that share an APAAR ID. IDs are masked for privacy.
          </p>
        </div>
        <button
          onClick={() => void fetchDuplicates()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Duplicate Groups</p>
            <AlertTriangle className="text-orange-500" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {data?.totalDuplicateGroups ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Affected Records</p>
            <Users className="text-blue-600" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {data?.totalAffectedRecords ?? 0}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900">Matching Student Records</h3>
          <p className="mt-1 text-xs text-slate-500">
            Each group contains records with the same APAAR ID.
          </p>
        </div>

        {duplicates.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 text-green-600" size={36} />
            <h4 className="font-semibold text-slate-800">No Duplicate Records Found</h4>
            <p className="mt-1 text-sm text-slate-500">
              No student records in your institution currently share an APAAR ID.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">APAAR ID</th>
                  <th className="px-5 py-3">Records</th>
                  <th className="px-5 py-3">Student Records</th>
                  <th className="px-5 py-3">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {duplicates.map((group) => (
                  <tr key={group.apaar_id} className="align-top hover:bg-slate-50">
                    <td className="px-5 py-4 font-mono">{group.apaar_id}</td>
                    <td className="px-5 py-4">{group.duplicate_count}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-3">
                        {group.student_records.map((student) => (
                          <div key={student.student_id}>
                            <p className="font-medium text-slate-800">{student.student_name}</p>
                            <p className="text-xs text-slate-500">
                              {student.programme} · {student.academic_year}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                        Manual Review Required
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        A duplicate match is a prompt for verification, not proof of misconduct.
      </p>
    </div>
  )
}
