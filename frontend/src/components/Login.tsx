
import { useState } from 'react'
import { LockKeyhole, Mail, Eye, EyeOff, GraduationCap } from 'lucide-react'
import { apiFetch } from '../utils/api'

export type AuthUser = {
  id: number
  role: 'INSTITUTION_ADMIN' | 'AICTE_ADMIN'
  institution_id: number | null
}

type LoginProps = {
  onLogin: (user: AuthUser) => void
  portal: 'institution' | 'aicte'
  onBack: () => void
}

function Login({ onLogin, portal, onBack }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDemo, setShowDemo] = useState(false)
const [showRegistration, setShowRegistration] = useState(false)
const demoEmail = 'institution.demo@aparassist.com'
const demoPassword = 'AparDemo@2026'

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid server response')
      }
      const expectedRole =
  portal === 'institution' ? 'INSTITUTION_ADMIN' : 'AICTE_ADMIN'

if (data.user.role !== expectedRole) {
  throw new Error(
    `This account is not authorized for the ${portal === 'institution' ? 'Institution' : 'AICTE'} Portal.`
  )
}
      sessionStorage.setItem('aparassist_token', data.token)
      sessionStorage.setItem('aparassist_user', JSON.stringify(data.user))
      onLogin(data.user as AuthUser)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to login. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6">
  <button
    type="button"
    onClick={onBack}
    className="text-sm font-medium text-blue-700 hover:text-blue-900"
  >
    ← Back to Portal Selection
  </button>
</div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <GraduationCap size={34} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            AparAssist
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Student Data Management & Verification Platform
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to access your administrative portal.
          </p>
        </div>
        <div className="mb-5 space-y-3">
  <button
    type="button"
    onClick={() => setShowDemo(true)}
    className="w-full rounded-lg border border-blue-200 bg-blue-50 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
  >
    View Demo Credentials
  </button>

  {portal === 'institution' && (
    <button
      type="button"
      onClick={() => setShowRegistration(true)}
      className="w-full rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Register Institution
    </button>
  )}
</div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {showDemo && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-slate-900">
        Demo Credentials
      </h2>

      {portal === 'institution' ? (
        <>
          <p className="mt-2 text-sm text-slate-500">
            Use these credentials to access the Institution Demo Portal.
          </p>

          <div className="mt-5 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
            <p>
              <strong>Email:</strong>
              <br />
              {demoEmail}
            </p>
            <p>
              <strong>Password:</strong>
              <br />
              {demoPassword}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          A separate AICTE demo account has not been configured yet.
          Please use an authorized AICTE account.
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowDemo(false)}
        className="mt-6 w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
      >
        Close
      </button>
    </div>
  </div>
)}
{showRegistration && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
        🚧
      </div>

      <h2 className="mt-4 text-xl font-bold text-slate-900">
        Institution Registration
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        Online institution registration is currently under development.
        Please check back soon.
      </p>

      <button
        type="button"
        onClick={() => setShowRegistration(false)}
        className="mt-6 w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
      >
        Close
      </button>
    </div>
  </div>
)}
        <p className="mt-8 text-center text-xs text-slate-400">
          Authorized Institution Administrators & AICTE Officials Only
        </p>

        <p className="mt-3 text-center text-xs text-slate-400">
          SIH26263 · AparAssist
        </p>
      </div>
    </div>
  )
}

export default Login
