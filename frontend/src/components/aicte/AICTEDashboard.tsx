
import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import {
    Building2,
    GraduationCap,
    CheckCircle2,
    Clock,
    XCircle,
    Ban,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface OverviewData {
    institutions: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        suspended: number;
    };
    totalStudents: number;
    programmeStats: { programme: string; total: number }[];
    academicYearStats: { academic_year: string; total: number }[];
    categoryStats: { category: string; total: number }[];
}

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#ef4444'];

export default function AICTEDashboard() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOverview = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await apiFetch('/admin/dashboard/overview');

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load dashboard');
            }

            setOverview(data.overview);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <RefreshCw className="animate-spin text-blue-600" size={28} />
                <span className="ml-3 text-gray-600">
                    Loading dashboard...
                </span>
            </div>
        );
    }

    if (error || !overview) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <p>{error || 'Dashboard data unavailable'}</p>
                </div>
                <button
                    onClick={fetchOverview}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Institutions',
            value: overview.institutions.total,
            icon: Building2,
            color: 'bg-blue-100 text-blue-700'
        },
        {
            title: 'Approved',
            value: overview.institutions.approved,
            icon: CheckCircle2,
            color: 'bg-green-100 text-green-700'
        },
        {
            title: 'Pending',
            value: overview.institutions.pending,
            icon: Clock,
            color: 'bg-yellow-100 text-yellow-700'
        },
        {
            title: 'Rejected',
            value: overview.institutions.rejected,
            icon: XCircle,
            color: 'bg-red-100 text-red-700'
        },
        {
            title: 'Suspended',
            value: overview.institutions.suspended,
            icon: Ban,
            color: 'bg-purple-100 text-purple-700'
        },
        {
            title: 'Student Records',
            value: overview.totalStudents,
            icon: GraduationCap,
            color: 'bg-indigo-100 text-indigo-700'
        }
    ];

    const categoryData = overview.categoryStats.map((item) => ({
        name: item.category,
        value: item.total
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        AICTE Overview
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Institution and student monitoring dashboard
                    </p>
                </div>

                <button
                    onClick={fetchOverview}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">
                                    {card.title}
                                </p>
                                <div className={`rounded-lg p-2 ${card.color}`}>
                                    <Icon size={21} />
                                </div>
                            </div>

                            <p className="mt-4 text-3xl font-bold text-gray-900">
                                {card.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-5 text-lg font-semibold text-gray-900">
                        Programme-wise Enrolment
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={overview.programmeStats}
                                margin={{ top: 10, right: 10, left: 0, bottom: 35 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="programme"
                                    angle={-20}
                                    textAnchor="end"
                                    interval={0}
                                    fontSize={11}
                                />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar
                                    dataKey="total"
                                    name="Students"
                                    fill="#2563eb"
                                    radius={[5, 5, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-5 text-lg font-semibold text-gray-900">
                        Student Category Distribution
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="45%"
                                    outerRadius={90}
                                    label
                                >
                                    {categoryData.map((_, index) => (
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
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                    Academic Year-wise Enrolment
                </h2>

                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overview.academicYearStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="academic_year" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar
                                dataKey="total"
                                name="Students"
                                fill="#16a34a"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
