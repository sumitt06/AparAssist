
import { useEffect, useMemo, useState } from 'react';
import {
    Search,
    RefreshCw,
    Building2,
    Mail,
    MapPin,
    CheckCircle2,
    XCircle,
    Ban,
    RotateCcw,
    Eye,
    X,
    AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

type Institution = {
    id: number;
    institution_name: string;
    institution_code: string;
    email: string;
    address: string | null;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
    created_at: string;
};

type FilterStatus = 'All' | Institution['status'];

const filters: FilterStatus[] = [
    'All',
    'Pending',
    'Approved',
    'Rejected',
    'Suspended'
];

export default function InstitutionManagement() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('All');
    const [selected, setSelected] = useState<Institution | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    const fetchInstitutions = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await apiFetch('/admin/institutions');
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch institutions');
            }

            setInstitutions(data.institutions);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const filteredInstitutions = useMemo(() => {
        return institutions.filter((institution) => {
            const matchesSearch = [
                institution.institution_name,
                institution.institution_code,
                institution.email
            ].some((value) =>
                value.toLowerCase().includes(search.toLowerCase())
            );

            const matchesStatus =
                filter === 'All' || institution.status === filter;

            return matchesSearch && matchesStatus;
        });
    }, [institutions, search, filter]);

    const updateStatus = async (
        institution: Institution,
        action: 'approve' | 'reject' | 'suspend' | 'reactivate'
    ) => {
        const actionLabels = {
            approve: 'approve',
            reject: 'reject',
            suspend: 'suspend',
            reactivate: 'reactivate'
        };

        if (!window.confirm(
            `Are you sure you want to ${actionLabels[action]} ${institution.institution_name}?`
        )) {
            return;
        }

        try {
            setActionLoading(institution.id);
            setMessage('');
            setError('');

            const response = await apiFetch(
                `/admin/institutions/${institution.id}/${action}`,
                { method: 'PATCH' }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to update institution');
            }

            setMessage(data.message);
            setSelected(null);
            await fetchInstitutions();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong'
            );
        } finally {
            setActionLoading(null);
        }
    };

    const statusStyle: Record<string, string> = {
        Approved: 'bg-green-100 text-green-700',
        Pending: 'bg-yellow-100 text-yellow-700',
        Rejected: 'bg-red-100 text-red-700',
        Suspended: 'bg-purple-100 text-purple-700'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Institution Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage and monitor registered institutions.
                    </p>
                </div>

                <button
                    onClick={fetchInstitutions}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {filters.map((status) => {
                    const count = status === 'All'
                        ? institutions.length
                        : institutions.filter(
                            (item) => item.status === status
                        ).length;

                    return (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`rounded-xl border p-4 text-left transition ${
                                filter === status
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <p className="text-xs text-slate-500">{status}</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {count}
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="relative max-w-md">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, institution code or email..."
                        className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Institution</th>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                        Loading institutions...
                                    </td>
                                </tr>
                            ) : filteredInstitutions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                        No institutions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInstitutions.map((institution) => (
                                    <tr key={institution.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-4 font-semibold text-slate-800">
                                            {institution.institution_name}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            {institution.institution_code}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            {institution.email}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[institution.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {institution.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => setSelected(institution)}
                                                className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                Institution Details
                            </h2>
                            <button
                                onClick={() => setSelected(null)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Building2 className="mt-1 text-blue-600" size={19} />
                                <div>
                                    <p className="text-xs text-slate-500">Institution Name</p>
                                    <p className="font-semibold text-slate-800">
                                        {selected.institution_name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building2 className="mt-1 text-blue-600" size={19} />
                                <div>
                                    <p className="text-xs text-slate-500">Institution Code</p>
                                    <p className="font-semibold text-slate-800">
                                        {selected.institution_code}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="mt-1 text-blue-600" size={19} />
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="font-semibold text-slate-800">
                                        {selected.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="mt-1 text-blue-600" size={19} />
                                <div>
                                    <p className="text-xs text-slate-500">Address</p>
                                    <p className="font-semibold text-slate-800">
                                        {selected.address || 'Not provided'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[selected.status] || ''}`}>
                                    {selected.status}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">Registration Date</p>
                                <p className="font-semibold text-slate-800">
                                    {new Date(selected.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 flex flex-wrap gap-2">
                            {selected.status === 'Pending' && (
                                <>
                                    <button
                                        disabled={actionLoading === selected.id}
                                        onClick={() => updateStatus(selected, 'approve')}
                                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} />
                                        Approve
                                    </button>
                                    <button
                                        disabled={actionLoading === selected.id}
                                        onClick={() => updateStatus(selected, 'reject')}
                                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <XCircle size={16} />
                                        Reject
                                    </button>
                                </>
                            )}

                            {selected.status === 'Approved' && (
                                <button
                                    disabled={actionLoading === selected.id}
                                    onClick={() => updateStatus(selected, 'suspend')}
                                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                                >
                                    <Ban size={16} />
                                    Suspend
                                </button>
                            )}

                            {selected.status === 'Suspended' && (
                                <button
                                    disabled={actionLoading === selected.id}
                                    onClick={() => updateStatus(selected, 'reactivate')}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    <RotateCcw size={16} />
                                    Reactivate
                                </button>
                            )}

                            <button
                                onClick={() => setSelected(null)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
