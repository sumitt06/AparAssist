import { apiFetch } from '../utils/api'
import { useEffect, useState } from 'react'
import {
  Search,
  Users,
  Eye,
  Filter,
  X,
  UserRound,
} from 'lucide-react'

type Student = {
  id: number
  name: string
  apaarId: string
  programme: string
  year: string
  category: string
  status: 'Valid' | 'Review' | 'Invalid'
}


function StudentRecords() {
  const [students, setStudents] = useState<Student[]>([])
const [search, setSearch] = useState('')
const [statusFilter, setStatusFilter] = useState('All')
const [categoryFilter, setCategoryFilter] = useState('All')
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
  useEffect(() => {
    apiFetch('/students')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch student records')
        }
        return response.json()
      })
      .then((data) => {
        const formattedStudents: Student[] = data.students.map((student: any) => ({
          id: student.id,
          name: student.student_name,
          apaarId: student.apaar_id,
          programme: student.programme,
          year: student.academic_year,
          category: student.category,
          status: /^\d{12}$/.test(student.apaar_id) ? 'Valid' : 'Invalid'
        }))

        setStudents(formattedStudents)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.apaarId.includes(search) ||
      student.programme.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || student.status === statusFilter

    const matchesCategory =
      categoryFilter === 'All' || student.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })
  const totalRecords = students.length

const validRecords = students.filter(
  (student) => student.status === 'Valid'
).length

const reviewRecords = students.filter(
  (student) => student.status === 'Review' || student.status === 'Invalid'
).length

  const statusStyle = (status: Student['status']) => {
    if (status === 'Valid') return 'bg-green-100 text-green-700'
    if (status === 'Review') return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  if (loading) {
  return <div className="p-6">Loading student records...</div>
}

if (error) {
  return <div className="p-6 text-red-600">{error}</div>
}

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Records</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{totalRecords}</h2>
          <p className="mt-1 text-xs text-slate-400">Institution sample data</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Valid Records</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">{validRecords}</h2>
          <p className="mt-1 text-xs text-slate-400">Passed local checks</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Needs Review</p>
          <h2 className="mt-2 text-3xl font-bold text-orange-600">{reviewRecords}</h2>
          <p className="mt-1 text-xs text-slate-400">Errors and review flags</p>
        </div>
      </div>

      {/* Student Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-bold text-slate-900">Student Directory</h3>
            <p className="mt-1 text-xs text-slate-500">
              Search and review institution student records
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users size={18} />
            {filteredStudents.length} sample records shown
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search name, APAAR ID or programme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={17} className="text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Valid">Valid</option>
              <option value="Review">Review</option>
              <option value="Invalid">Invalid</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Regular">Regular</option>
              <option value="Supernumerary">Supernumerary</option>
              <option value="NRI">NRI</option>
              <option value="OCI">OCI</option>
              <option value="FN">FN</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">APAAR ID</th>
                <th className="px-5 py-4">Programme</th>
                <th className="px-5 py-4">Academic Year</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">
                        {student.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-600">
                    {student.apaarId}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.programme}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.year}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {student.category}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(student.status)}`}>
                      {student.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>

                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No matching student records found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
          Demonstration records only. No real student data is stored.
        </div>

      </section>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Student Details
              </h3>

              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserRound size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  {selectedStudent.name}
                </h4>
                <p className="text-xs text-slate-500">Synthetic demo record</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['APAAR ID', selectedStudent.apaarId],
                ['Programme', selectedStudent.programme],
                ['Academic Year', selectedStudent.year],
                ['Admission Category', selectedStudent.category],
                ['Local Validation Status', selectedStudent.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Local format and data checks do not establish official APAAR identity verification.
            </p>

            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-6 w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Close Details
            </button>

          </div>
        </div>
      )}

    </div>
  )
}

export default StudentRecords
