import AICTEDashboard from "./components/aicte/AICTEDashboard";
import InstitutionManagement from "./components/aicte/InstitutionManagement";
import StudentMonitoring from "./components/aicte/StudentMonitoring";
import APAARDuplicateMonitoring from "./components/aicte/APAARDuplicateMonitoring";
import PortalSelection from "./components/PortalSelection";
import CsvUpload from "./components/CsvUpload";
import DuplicateReview from "./components/DuplicateReview";
import IntakeMonitoring from "./components/IntakeMonitoring";
import StudentRecords from "./components/StudentRecords";
import { useState, useEffect } from "react";
import Login, { type AuthUser } from "./components/Login";
import {
  LayoutDashboard,
  Users,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Search,
  FileCheck,
  Clock,
  ChevronDown,
  GraduationCap,
  Menu,
  X,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Student Records", icon: Users },
  { name: "CSV Upload & Validation", icon: Upload },
  { name: "Duplicate Review", icon: AlertTriangle },
  { name: "Intake Monitoring", icon: ChartNoAxesCombined },
  { name: "Institutions", icon: Building2 },
  { name: "Reports", icon: FileCheck },
  { name: "Settings", icon: Settings },
];

const activities = [
  {
    title: "Student records uploaded",
    detail: "Computer Science · Batch 2026",
    time: "10 minutes ago",
    status: "Completed",
  },
  {
    title: "Duplicate records detected",
    detail: "Mechanical Engineering · Batch 2026",
    time: "35 minutes ago",
    status: "Review",
  },
  {
    title: "Intake validation completed",
    detail: "Information Technology",
    time: "1 hour ago",
    status: "Completed",
  },
  {
    title: "CSV validation issues found",
    detail: "Electrical Engineering · Batch 2026",
    time: "2 hours ago",
    status: "Warning",
  },
];

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [selectedPortal, setSelectedPortal] = useState<
    "institution" | "aicte" | null
  >(null);

  useEffect(() => {
    const token = sessionStorage.getItem("aparassist_token");
    const savedUser = sessionStorage.getItem("aparassist_user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser) as AuthUser);
      } catch {
        sessionStorage.removeItem("aparassist_token");
        sessionStorage.removeItem("aparassist_user");
      }
    }
  }, []);
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    sessionStorage.removeItem("aparassist_token");
    sessionStorage.removeItem("aparassist_user");
    setUser(null);
    setSelectedPortal(null);
    setActivePage("Overview");
  };
  const stats = [
    {
      title: "Total Student Records",
      value: "2,450",
      change: "+12.5%",
      icon: Users,
      color: "blue",
    },
    {
      title: "Valid Records",
      value: "2,280",
      change: "93.1%",
      icon: ShieldCheck,
      color: "green",
    },
    {
      title: "Validation Errors",
      value: "120",
      change: "Needs attention",
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "Duplicate Records",
      value: "50",
      change: "Review required",
      icon: ClipboardList,
      color: "orange",
    },
  ];

  const pageTitle =
    activePage === "Overview" ? "Institution Overview" : activePage;
  if (!selectedPortal) {
    return <PortalSelection onSelect={(portal) => setSelectedPortal(portal)} />;
  }
  if (!user) {
    return (
      <Login
        portal={selectedPortal}
        onBack={() => setSelectedPortal(null)}
        onLogin={(loggedInUser) => setUser(loggedInUser)}
      />
    );
  }

  if (user.role === "AICTE_ADMIN" || user.role === "AICTE_DEMO") {
  const aicteNavigation = [
  "Overview",
  "Institutions",
  "Student Monitoring",
  "APAAR Monitoring",
];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            AparAssist
          </h1>
          <p className="text-xs text-slate-500">
            AICTE Administration Portal
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <div className="border-b border-slate-200 bg-white px-5 sm:px-8">
        <nav className="flex gap-6">
          {aicteNavigation.map((item) => (
            <button
              key={item}
              onClick={() => setActivePage(item)}
              className={`border-b-2 px-2 py-4 text-sm font-semibold ${
                activePage === item
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <main className="p-5 sm:p-8">
        {activePage === "Institutions" ? (
  <InstitutionManagement />
) : activePage === "Student Monitoring" ? (
  <StudentMonitoring />
) : activePage === "APAAR Monitoring" ? (
  <APAARDuplicateMonitoring />
) : (
  <AICTEDashboard />
)}
      </main>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">AparAssist</h1>
              <p className="text-xs text-slate-400">Student Data Platform</p>
            </div>
          </div>

          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActivePage(item.name);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Demo Environment</p>
            <p className="mt-1 text-sm font-semibold text-green-400">
              ● Prototype Active
            </p>
            <p className="mt-2 text-xs text-slate-500">SIH 2026 · SIH26263</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900">AparAssist</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Institution Management Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 sm:flex">
              <Search size={17} />
              Search
            </button>

            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Bell size={20} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  Admin User
                </p>
                <p className="text-xs text-slate-500">Institution Admin</p>
              </div>
              <ChevronDown
                size={15}
                className="hidden text-slate-400 sm:block"
              />
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {/* Page Heading */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-sm text-slate-500">
                Dashboard / {activePage}
              </p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {pageTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Monitor student admission data and institutional records.
              </p>
            </div>

            <button
              onClick={() => setActivePage("CSV Upload & Validation")}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-800"
            >
              <Upload size={17} />
              Upload Student Data
            </button>
          </div>

          {activePage === "Settings" ? (
            <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Account Settings
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage your AparAssist account and session.
              </p>

              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
                <h3 className="font-semibold text-red-800">Logout</h3>

                <p className="mt-1 text-sm text-red-700">
                  Sign out of your Institution Admin account.
                </p>

                <button
                  onClick={handleLogout}
                  className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : activePage === "Student Records" ? (
            <StudentRecords />
          ) : activePage === "CSV Upload & Validation" ? (
            <CsvUpload />
          ) : activePage === "Duplicate Review" ? (
            <DuplicateReview />
          ) : activePage === "Intake Monitoring" ? (
            <IntakeMonitoring />
          ) : (
            <>
              {/* Demo Notice */}
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-blue-600"
                  size={20}
                />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Prototype Demo Environment
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    All figures and student records currently displayed are
                    synthetic sample data. Official APAAR verification is not
                    connected.
                  </p>
                </div>
              </div>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                  const Icon = item.icon;

                  const colorStyles: Record<string, string> = {
                    blue: "bg-blue-100 text-blue-700",
                    green: "bg-green-100 text-green-700",
                    red: "bg-red-100 text-red-700",
                    orange: "bg-orange-100 text-orange-700",
                  };

                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          {item.title}
                        </p>
                        <div
                          className={`rounded-lg p-2.5 ${colorStyles[item.color]}`}
                        >
                          <Icon size={21} />
                        </div>
                      </div>

                      <h2 className="mt-4 text-3xl font-bold text-slate-900">
                        {item.value}
                      </h2>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {item.change}
                      </p>
                    </div>
                  );
                })}
              </div>
              {/* Middle Section */}
              <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Intake Monitoring */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Programme Intake Monitoring
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Approved intake vs actual enrolment
                      </p>
                    </div>
                    <button className="flex items-center gap-1 text-sm font-semibold text-blue-700">
                      View details <ArrowUpRight size={16} />
                    </button>
                  </div>

                  {[
                    {
                      name: "Computer Science Engineering",
                      enrolled: 180,
                      total: 240,
                    },
                    {
                      name: "Information Technology",
                      enrolled: 145,
                      total: 180,
                    },
                    {
                      name: "Mechanical Engineering",
                      enrolled: 95,
                      total: 120,
                    },
                    {
                      name: "Electrical Engineering",
                      enrolled: 110,
                      total: 120,
                    },
                  ].map((program) => (
                    <div key={program.name} className="mb-6 last:mb-0">
                      <div className="mb-2 flex justify-between gap-2 text-sm">
                        <span className="font-medium text-slate-700">
                          {program.name}
                        </span>
                        <span className="text-slate-500">
                          {program.enrolled}/{program.total}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${(program.enrolled / program.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="mt-5 text-xs text-slate-400">
                    Sample programme data · Actual approved limits must be
                    configured by the institution.
                  </p>
                </section>

                {/* Data Quality */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    Data Quality Score
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Based on sample validation results
                  </p>

                  <div className="my-8 flex justify-center">
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-green-500">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900">93%</p>
                        <p className="text-xs text-slate-500">Quality Score</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Valid records</span>
                      <span className="font-semibold text-green-600">
                        2,280
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Errors</span>
                      <span className="font-semibold text-red-600">120</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Duplicates</span>
                      <span className="font-semibold text-orange-600">50</span>
                    </div>
                  </div>
                </section>
              </div>
              {/* Recent Activity */}
              <section className="mt-7 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Recent Activity
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest institution data operations
                    </p>
                  </div>
                  <button className="text-sm font-semibold text-blue-700">
                    View all
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Activity</th>
                        <th className="px-5 py-4">Description</th>
                        <th className="px-5 py-4">Time</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activities.map((activity) => (
                        <tr key={activity.title} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {activity.title}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {activity.detail}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            <span className="flex items-center gap-2">
                              <Clock size={14} /> {activity.time}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                activity.status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : activity.status === "Review"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {activity.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400">
                <p>© 2026 AparAssist · MediMind Team</p>
                <p>SIH26263 · Prototype Version 1.0</p>
              </footer>{" "}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
