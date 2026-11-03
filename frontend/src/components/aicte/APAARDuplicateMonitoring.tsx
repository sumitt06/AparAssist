
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { RefreshCw, ShieldAlert, Users, Building2 } from "lucide-react";

interface StudentRecord {
  student_id: number;
  student_name: string;
  programme: string;
  academic_year: string;
  institution_id: number | null;
  institution_name: string | null;
  institution_code: string | null;
}

interface DuplicateGroup {
  apaar_id: string;
  duplicate_count: number;
  institution_count: number;
  student_records: StudentRecord[];
}

interface DuplicateResponse {
  success: boolean;
  totalDuplicateGroups: number;
  totalAffectedRecords: number;
  duplicates: DuplicateGroup[];
  message?: string;
}

export default function APAARDuplicateMonitoring() {
  const [data, setData] = useState<DuplicateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invalidData, setInvalidData] = useState<{
  totalIssues: number;
  missingCount: number;
  invalidCount: number;
  records: {
    student_id: number;
    student_name: string;
    apaar_id: string | null;
    programme: string;
    academic_year: string;
    institution_name: string | null;
    institution_code: string | null;
    issue_type: string;
  }[];
} | null>(null);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/admin/duplicate-monitoring");
      const result: DuplicateResponse = await response.json();
      const invalidResponse = await apiFetch("/admin/invalid-apaar-monitoring");
const invalidResult = await invalidResponse.json();

if (!invalidResponse.ok || !invalidResult.success) {
  throw new Error(
    invalidResult.message || "Failed to load invalid APAAR records."
  );
}

setInvalidData(invalidResult);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load duplicate records.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const maskAPAAR = (id: string) => {
    if (!id || id.length <= 4) return "••••";
    return `${"•".repeat(id.length - 4)}${id.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <RefreshCw className="mr-2 animate-spin" size={20} />
        Loading APAAR monitoring...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{error}</p>
        <button
          onClick={fetchDuplicates}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const duplicates = data?.duplicates || [];
  const crossInstitutionGroups = duplicates.filter(
    (item) => item.institution_count > 1
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            APAAR & Duplicate Monitoring
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor exact duplicate APAAR IDs across student records.
          </p>
        </div>

        <button
          onClick={fetchDuplicates}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Duplicate Groups</p>
            <ShieldAlert className="text-orange-500" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-800">
            {data?.totalDuplicateGroups ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Affected Records</p>
            <Users className="text-blue-500" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-800">
            {data?.totalAffectedRecords ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Cross-Institution Groups
            </p>
            <Building2 className="text-purple-500" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-800">
            {crossInstitutionGroups}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Total APAAR Issues</p>
    <p className="mt-3 text-3xl font-bold text-gray-800">
      {invalidData?.totalIssues ?? 0}
    </p>
  </div>

  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Missing APAAR IDs</p>
    <p className="mt-3 text-3xl font-bold text-orange-600">
      {invalidData?.missingCount ?? 0}
    </p>
  </div>

  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Invalid APAAR IDs</p>
    <p className="mt-3 text-3xl font-bold text-red-600">
      {invalidData?.invalidCount ?? 0}
    </p>
  </div>
</div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h3 className="font-semibold text-gray-800">
            Exact Duplicate APAAR Records
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Records sharing the same APAAR ID are grouped below for manual review.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
  <div className="border-b p-5">
    <h3 className="font-semibold text-gray-800">
      Invalid & Missing APAAR Records
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Student records requiring APAAR ID correction or verification.
    </p>
  </div>

  {!invalidData || invalidData.records.length === 0 ? (
    <div className="p-10 text-center">
      <ShieldAlert className="mx-auto mb-3 text-green-500" size={36} />
      <h4 className="font-semibold text-gray-800">
        No Invalid or Missing Records
      </h4>
      <p className="mt-1 text-sm text-gray-500">
        All currently stored APAAR IDs passed the format check.
      </p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-5 py-3">Student</th>
            <th className="px-5 py-3">APAAR ID</th>
            <th className="px-5 py-3">Programme</th>
            <th className="px-5 py-3">Institution</th>
            <th className="px-5 py-3">Issue</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {invalidData.records.map((record) => (
            <tr key={record.student_id} className="hover:bg-gray-50">
              <td className="px-5 py-4 font-medium text-gray-800">
                {record.student_name}
              </td>
              <td className="px-5 py-4 font-mono">
                {record.apaar_id
                  ? maskAPAAR(record.apaar_id)
                  : "Not Provided"}
              </td>
              <td className="px-5 py-4">{record.programme}</td>
              <td className="px-5 py-4">
                {record.institution_name || "Unknown"}
              </td>
              <td className="px-5 py-4">
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  {record.issue_type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

        {duplicates.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldAlert className="mx-auto mb-3 text-green-500" size={36} />
            <h4 className="font-semibold text-gray-800">
              No Exact Duplicates Found
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              No duplicate APAAR ID groups were found in the current records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3">APAAR ID</th>
                  <th className="px-5 py-3">Records</th>
                  <th className="px-5 py-3">Institutions</th>
                  <th className="px-5 py-3">Student Records</th>
                  <th className="px-5 py-3">Review Note</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {duplicates.map((item) => (
                  <tr key={item.apaar_id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4 font-mono">
                      {maskAPAAR(item.apaar_id)}
                    </td>
                    <td className="px-5 py-4">{item.duplicate_count}</td>
                    <td className="px-5 py-4">{item.institution_count}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-3">
                        {item.student_records.map((student) => (
                          <div key={student.student_id}>
                            <p className="font-medium text-gray-800">
                              {student.student_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.institution_name || "Unknown institution"}
                              {student.institution_code
                                ? ` (${student.institution_code})`
                                : ""}
                            </p>
                            <p className="text-xs text-gray-500">
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
      </div>

      <p className="text-xs text-gray-500">
        A duplicate match is an alert for verification, not proof of fraud or
        misconduct. Records require authorized human review.
      </p>
    </div>
  );
}
