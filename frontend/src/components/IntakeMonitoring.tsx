import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Download, RefreshCw, Upload, Users } from 'lucide-react'
import { apiFetch } from '../utils/api'

type IntakeRow = {
  programme: string
  academic_year: string
  category: string
  approved_intake: number | null
  enrolled_count: number
  vacant_seats: number | null
  utilization_percentage: number | null
}

type IntakeData = {
  summary: {
    totalApprovedSeats: number
    totalEnrolledStudents: number
    vacantSeats: number
    utilizationPercentage: number | null
  }
  academicYears: string[]
  categories: string[]
  programmes: IntakeRow[]
}

type ImportRow = {
  programme: string
  academic_year: string
  category: string
  approved_intake: number
}

type IntakeAlert = {
  row: IntakeRow
  kind: 'missing' | 'over' | 'near'
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      values.push(value.trim())
      value = ''
    } else {
      value += char
    }
  }
  values.push(value.trim())
  return values
}

export default function IntakeMonitoring() {
  const [data, setData] = useState<IntakeData | null>(null)
  const [academicYear, setAcademicYear] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [importError, setImportError] = useState('')
  const [notice, setNotice] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const fetchIntake = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (academicYear) params.set('academic_year', academicYear)
      if (category) params.set('category', category)
      const query = params.size ? `?${params.toString()}` : ''
      const response = await apiFetch(`/intake-monitoring${query}`)
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load intake data.')
      }
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [academicYear, category])

  useEffect(() => {
    void fetchIntake()
  }, [fetchIntake])

  const alerts = useMemo<IntakeAlert[]>(() => (data?.programmes ?? []).flatMap((row): IntakeAlert[] => {
    if (row.approved_intake === null) {
      return row.enrolled_count > 0 ? [{ row, kind: 'missing' as const }] : []
    }
    if (row.enrolled_count > row.approved_intake) return [{ row, kind: 'over' as const }]
    if (row.approved_intake > 0 && row.enrolled_count / row.approved_intake >= 0.9) {
      return [{ row, kind: 'near' as const }]
    }
    return []
  }), [data])

  const importCSV = async (file?: File) => {
    setImportError('')
    setNotice('')
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please choose a CSV file.')
      return
    }

    try {
      const content = await file.text()
      const lines = content.split(/\r?\n/).filter((line) => line.trim())
      if (lines.length < 2) throw new Error('The CSV must include a header and at least one data row.')

      const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase().replace(/^\uFEFF/, ''))
      const required = ['programme', 'academic_year', 'category', 'approved_intake']
      const missing = required.filter((header) => !headers.includes(header))
      if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}`)

      const rows: ImportRow[] = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line)
        const programme = values[headers.indexOf('programme')] ?? ''
        const year = values[headers.indexOf('academic_year')] ?? ''
        const admissionCategory = values[headers.indexOf('category')] ?? ''
        const intakeText = values[headers.indexOf('approved_intake')] ?? ''
        if (!programme || !year || !admissionCategory || !/^\d+$/.test(intakeText)) {
          throw new Error(`Row ${index + 2} must have programme, academic year, category, and a whole-number approved intake.`)
        }
        return {
          programme,
          academic_year: year,
          category: admissionCategory,
          approved_intake: Number(intakeText),
        }
      })

      setIsImporting(true)
      const response = await apiFetch('/intake-monitoring/approved-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not import the CSV.')

      setNotice(`${result.importedCount} approved intake rows imported.`)
      await fetchIntake()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read this CSV file.')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = [
      'programme,academic_year,category,approved_intake',
      'Computer Science,2026-27,Regular,120',
      'Computer Science,2026-27,NRI,10',
      'Mechanical Engineering,2026-27,Regular,90',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'AparAssist_Approved_Intake_Template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Intake Monitoring</h2>
          <p className="mt-1 text-sm text-slate-500">
            Compare approved seats with enrolled students by programme, academic year, and category.
          </p>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          <Download size={16} /> Approved Intake CSV Template
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Approved Intake CSV</h3>
            <p className="mt-1 text-xs text-slate-500">
              Required columns: programme, academic_year, category, approved_intake. Re-importing a row updates its approved seats.
            </p>
          </div>
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${isImporting ? 'bg-slate-400' : 'bg-blue-700 hover:bg-blue-800'}`}>
            <Upload size={16} /> {isImporting ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv,text/csv" className="hidden" disabled={isImporting} onChange={(event) => {
              void importCSV(event.target.files?.[0])
              event.currentTarget.value = ''
            }} />
          </label>
        </div>
        {notice && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        {importError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{importError}</p>}
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-700">
          Academic year
          <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="mt-1 block min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">All academic years</option>
            {(data?.academicYears ?? []).map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Admission category
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">All categories</option>
            {(data?.categories ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button onClick={() => void fetchIntake()} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-slate-500"><RefreshCw className="mr-2 animate-spin" size={20} /> Loading intake data...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Approved Seats', value: data?.summary.totalApprovedSeats.toLocaleString() ?? '0', icon: CheckCircle, color: 'text-blue-600' },
              { label: 'Enrolled Students', value: data?.summary.totalEnrolledStudents.toLocaleString() ?? '0', icon: Users, color: 'text-green-600' },
              { label: 'Vacant Seats', value: data?.summary.vacantSeats.toLocaleString() ?? '0', icon: Users, color: 'text-orange-600' },
              { label: 'Seat Utilization', value: data?.summary.utilizationPercentage === null || data?.summary.utilizationPercentage === undefined ? '—' : `${data.summary.utilizationPercentage}%`, icon: AlertTriangle, color: 'text-purple-600' },
            ].map((item) => {
              const Icon = item.icon
              return <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{item.label}</p><Icon className={item.color} size={21} /></div><p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p></div>
            })}
          </div>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h3 className="font-bold text-slate-900">Capacity Alerts</h3><p className="mt-1 text-xs text-slate-500">Near capacity means at least 90% of approved seats.</p></div>
            {alerts.length === 0 ? (
              <div className="p-6 text-sm text-green-700">No programmes are over or near approved capacity.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {alerts.map(({ row, kind }) => <li key={`${row.programme}-${row.academic_year}-${row.category}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <div><p className="font-semibold text-slate-800">{row.programme} · {row.academic_year} · {row.category}</p><p className="mt-1 text-slate-500">{row.enrolled_count} enrolled{row.approved_intake === null ? ' · approved intake missing' : ` of ${row.approved_intake} seats`}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === 'over' ? 'bg-red-100 text-red-700' : kind === 'near' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>{kind === 'over' ? 'Over capacity' : kind === 'near' ? 'Near capacity' : 'Add approved intake'}</span>
                </li>)}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h3 className="font-bold text-slate-900">Programme-wise Intake</h3><p className="mt-1 text-xs text-slate-500">Student counts come from records in your institution.</p></div>
            {(data?.programmes.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">No intake or student records match these filters.</div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Programme</th><th className="px-5 py-3">Academic Year</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Approved Intake</th><th className="px-5 py-3">Enrolled</th><th className="px-5 py-3">Vacant Seats</th><th className="px-5 py-3">Utilization</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{data?.programmes.map((row) => <tr key={`${row.programme}-${row.academic_year}-${row.category}`} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-800">{row.programme}</td><td className="px-5 py-4">{row.academic_year}</td><td className="px-5 py-4">{row.category}</td><td className="px-5 py-4">{row.approved_intake ?? 'Not set'}</td><td className="px-5 py-4">{row.enrolled_count}</td><td className="px-5 py-4">{row.vacant_seats ?? '—'}</td><td className="px-5 py-4">{row.utilization_percentage === null ? '—' : `${row.utilization_percentage}%`}</td></tr>)}</tbody>
              </table></div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
