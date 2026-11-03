
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { RefreshCw, Users, Building2 } from "lucide-react";

type InstitutionStat = {
  institution_id: number;
  institution_name: string;
  institution_code: string;
  institution_status: string;
  total_students: number;
};

type ProgrammeStat = {
  institution_name: string | null;
  programme: string;
  total_students: number;
};

type AcademicYearStat = {
  academic_year: string;
  total_students: number;
};

type CategoryStat = {
  category: string;
  total_students: number;
};

type MonitoringData = {
  institutionStats: InstitutionStat[];
  programmeStats: ProgrammeStat[];
  academicYearStats: AcademicYearStat[];
  categoryStats: CategoryStat[];
};

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#ef4444"];

export default function StudentMonitoring() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/admin/student-monitoring");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load monitoring data");
      }

      setData(result.monitoring);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-600">
        Loading student monitoring data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">{error}</p>
        <button
          onClick={fetchMonitoring}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalStudents = data.institutionStats.reduce(
    (sum, item) => sum + item.total_students,
    0
  );

  const totalInstitutions = data.institutionStats.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Student Monitoring
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Institution-wise and academic enrolment analytics
          </p>
        </div>

        <button
          onClick={fetchMonitoring}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Student Records</p>
            <Users className="text-blue-600" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Institutions with Records</p>
            <Building2 className="text-green-600" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {totalInstitutions}
          </p>
        </div>
      </div>

      {/* Institution-wise Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Institution-wise Enrolment
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Institution</th>
                <th className="p-3">Code</th>
                <th className="p-3">Status</th>
                <th className="p-3">Students</th>
              </tr>
            </thead>
            <tbody>
              {data.institutionStats.map((item) => (
                <tr key={item.institution_id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-slate-900">
                    {item.institution_name}
                  </td>
                  <td className="p-3 text-slate-600">
                    {item.institution_code}
                  </td>
                  <td className="p-3">{item.institution_status}</td>
                  <td className="p-3 font-semibold">
                    {item.total_students}
                  </td>
                </tr>
              ))}

              {data.institutionStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-slate-500">
                    No institution records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Programme-wise Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Programme-wise Enrolment
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.programmeStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="programme" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total_students" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Academic Year and Category Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Academic-year-wise Enrolment
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.academicYearStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="academic_year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total_students" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Category-wise Distribution
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryStats}
                  dataKey="total_students"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  label
                >
                  {data.categoryStats.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <p className="text-xs text-slate-500">
        Statistics are based on currently stored student records.
        Approved intake figures are not yet available in the database.
      </p>
    </div>
  );
}
