
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

type PortalSelectionProps = {
  onSelect: (portal: 'institution' | 'aicte') => void
}

function PortalSelection({ onSelect }: PortalSelectionProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg">
            <GraduationCap size={36} />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            AparAssist
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Student Data Management & Verification Platform
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-800">
            Select Your Portal
          </h2>

          <p className="mt-2 text-slate-500">
            Choose the portal according to your role.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Building2 size={30} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Institution Portal
            </h3>

            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
              Manage student records, upload admission data and monitor
              institutional enrolment.
            </p>

            <button
              onClick={() => onSelect('institution')}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Institution Login <ArrowRight size={18} />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck size={30} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              AICTE Portal
            </h3>

            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
              Access centralized institutional monitoring and administrative
              verification services.
            </p>

            <button
              onClick={() => onSelect('aicte')}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 py-3 font-semibold text-white transition hover:bg-indigo-800"
            >
              AICTE Login <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          SIH26263 · AparAssist · Authorized Access Only
        </p>
      </div>
    </div>
  )
}

export default PortalSelection
