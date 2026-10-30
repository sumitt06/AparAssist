
import { useState } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
} from 'lucide-react'

type RecordRow = {
  row: number
  name: string
  apaarId: string
  programme: string
  year: string
  category: string
  errors: string[]
  status: 'Valid' | 'Invalid'
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function CsvUpload() {
  const [records, setRecords] = useState<RecordRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
const [saveSummary, setSaveSummary] = useState('')

  const processFile = (file?: File) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file only.')
      return
    }

    const reader = new FileReader()

    reader.onload = async () => {
      const content = String(reader.result || '')
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '')

      if (lines.length < 2) {
        setError('The CSV file is empty or has no student records.')
        return
      }

      const headers = parseCSVLine(lines[0]).map(header =>
        header.trim().toLowerCase().replace(/^\uFEFF/, '')
      )

      const required = [
        'student_name',
        'apaar_id',
        'programme',
        'academic_year',
        'category',
      ]

      const missing = required.filter(header => !headers.includes(header))

      if (missing.length > 0) {
        setError(`Missing CSV columns: ${missing.join(', ')}`)
        return
      }

      const indexes = required.map(header => headers.indexOf(header))
      const seenIds = new Set<string>()

      const result: RecordRow[] = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line)
        const [nameIndex, idIndex, programmeIndex, yearIndex, categoryIndex] = indexes

        const name = values[nameIndex] || ''
        const apaarId = values[idIndex] || ''
        const programme = values[programmeIndex] || ''
        const year = values[yearIndex] || ''
        const category = values[categoryIndex] || ''

        const errors: string[] = []

        if (!name) errors.push('Student name is missing')
        if (!apaarId) {
          errors.push('APAAR ID is missing')
        } else if (!/^\d{12}$/.test(apaarId)) {
          errors.push('APAAR ID must contain exactly 12 digits')
        }

        if (!programme) errors.push('Programme is missing')
        if (!year) errors.push('Academic year is missing')
        if (!category) errors.push('Admission category is missing')

        if (apaarId && /^\d{12}$/.test(apaarId)) {
          if (seenIds.has(apaarId)) {
            errors.push('Duplicate APAAR ID in uploaded file')
          }
          seenIds.add(apaarId)
        }

        return {
          row: index + 2,
          name,
          apaarId,
          programme,
          year,
          category,
          errors,
          status: errors.length === 0 ? 'Valid' : 'Invalid',
        }
      })

      try {
  const validIds = result
    .filter(record => record.status === 'Valid')
    .map(record => record.apaarId)

  const response = await fetch(
  `${import.meta.env.VITE_API_URL}/students/check`,
  {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apaar_ids: validIds
      })
    }
  )

  if (!response.ok) {
    throw new Error('Unable to check existing APAAR IDs')
  }

  const data = await response.json()
  const existingIds = new Set<string>(data.existingIds)

  const updatedRecords = result.map(record => {
    if (existingIds.has(record.apaarId)) {
      return {
        ...record,
        errors: [...record.errors, 'APAAR ID already exists in database'],
        status: 'Invalid' as const
      }
    }

    return record
  })

  setRecords(updatedRecords)
  setFileName(file.name)
  setError('')

} catch (err) {
  console.error('Database duplicate check failed:', err)
  setError('Could not check existing APAAR IDs. Please try again.')
}
    }

    reader.onerror = () => setError('Unable to read this file.')
    reader.readAsText(file)
  }

  const validCount = records.filter(r => r.status === 'Valid').length
  const invalidCount = records.length - validCount
  const duplicateCount = records.filter(r =>
    r.errors.some(e => e.includes('Duplicate'))
  ).length
  const saveValidRecords = async () => {
  const validRecords = records.filter(
    (record) => record.status === 'Valid'
  )

  if (validRecords.length === 0) {
    setSaveSummary('No valid records available to save.')
    return
  }

  setIsSaving(true)
  setSaveSummary('')

  let successCount = 0
  let failedCount = 0

  try {
    for (const record of validRecords) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            student_name: record.name,
            apaar_id: record.apaarId,
            programme: record.programme,
            academic_year: record.year,
            category: record.category
          })
        })

        if (response.ok) {
  successCount++
} else {
  failedCount++
  const errorMessage = await response.text()
  console.log('Backend error:', response.status, errorMessage)
}
      } catch (err) {
  failedCount++
  console.log('Request error:', err)
}
    }

    setSaveSummary(
      `Upload completed: ${successCount} saved, ${failedCount} failed.`
    )
  } finally {
    setIsSaving(false)
  }
}

  const downloadReport = () => {
    const header = [
      'Row',
      'Student Name',
      'APAAR ID',
      'Programme',
      'Academic Year',
      'Category',
      'Status',
      'Errors',
    ]

    const escapeCSV = (value: string) =>
      `"${value.replace(/"/g, '""')}"`

    const rows = records.map(r => [
      r.row,
      r.name,
      r.apaarId,
      r.programme,
      r.year,
      r.category,
      r.status,
      r.errors.join('; '),
    ])

    const csv = [header, ...rows]
      .map(row => row.map(value => escapeCSV(String(value))).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'AparAssist_Validation_Report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const csv =
      'student_name,apaar_id,programme,academic_year,category\n' +
      'Aarav Sharma,123456789012,Computer Science,2026-27,Regular\n' +
      'Priya Verma,234567890123,Information Technology,2026-27,Regular\n' +
      'Rahul Patel,345678901234,Mechanical Engineering,2026-27,NRI\n' +
      'Neha Singh,456789012345,Computer Science,2026-27,OCI'

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'AparAssist_Student_Template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-bold text-slate-900">
          CSV Upload & Validation
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload institution student data and run automatic local checks.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          Prototype Notice
        </p>
        <p className="mt-1 text-xs text-blue-800">
          This module performs local format, required-field and duplicate
          checks. It does not verify student identity with official APAAR systems.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Upload Student File</h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a CSV file containing student records.
            </p>
          </div>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Download size={16} />
            Download Template
          </button>
        </div>

        <label
          onDragOver={e => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setIsDragging(false)
            processFile(e.dataTransfer.files[0])
          }}
          className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-10 text-center transition ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400'
          }`}
        >
          <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-700">
            <Upload size={28} />
          </div>

          <h3 className="font-semibold text-slate-800">
            Drag and drop your CSV file here
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            or click to browse files
          </p>

          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => processFile(e.target.files?.[0])}
          />
        </label>

        {fileName && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FileSpreadsheet className="text-green-600" size={20} />
              {fileName}
            </div>
            <button
              onClick={() => {
                setRecords([])
                setFileName('')
                setError('')
              }}
              className="text-slate-400 hover:text-red-600"
              title="Clear uploaded file"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {records.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-500">Total Records</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {records.length}
              </h3>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-500">Valid Records</p>
              <h3 className="mt-2 text-3xl font-bold text-green-600">
                {validCount}
              </h3>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-500">Invalid Records</p>
              <h3 className="mt-2 text-3xl font-bold text-red-600">
                {invalidCount}
              </h3>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Validation Results
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {duplicateCount} duplicate rows flagged for review
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
  <button
    onClick={saveValidRecords}
    disabled={isSaving || validCount === 0}
    className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Upload size={16} />
    {isSaving ? 'Saving...' : 'Save to Database'}
  </button>

  <button
    onClick={downloadReport}
    className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
  >
    <Download size={16} />
    Download Report
  </button>
</div>
            </div>
            {saveSummary && (
  <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
    {saveSummary}
  </p>
)}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Row</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">APAAR ID</th>
                    <th className="p-3">Programme</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Validation Issues</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {records.map(record => (
                    <tr key={record.row} className="hover:bg-slate-50">
                      <td className="p-3">{record.row}</td>
                      <td className="p-3 font-medium">{record.name || '—'}</td>
                      <td className="p-3 font-mono text-xs">
                        {record.apaarId || '—'}
                      </td>
                      <td className="p-3">{record.programme || '—'}</td>
                      <td className="p-3">
                        {record.status === 'Valid' ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                            <CheckCircle size={15} /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-red-700">
                            <XCircle size={15} /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-red-600">
                        {record.errors.length
                          ? record.errors.join(', ')
                          : 'No issues found'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

export default CsvUpload
