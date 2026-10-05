import { useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { login, apiError } from '../services/api';

function Login({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const email = form.get('email')?.trim();
    const password = form.get('password');

    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      await login(email, password);

      onLogin();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#edf1ef] text-[#1a3832]">

      {/* LEFT PANEL */}
      <aside className="hidden w-[42%] flex-col justify-between bg-[#1a3832] p-12 text-white lg:flex">

        <div className="flex items-center gap-3">
          <Building2 size={25} strokeWidth={1.8} />

          <span className="text-sm font-bold uppercase tracking-[0.16em]">
            BuildTrack
          </span>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9c9bd]">
            Construction operations
          </p>

          <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight">
            Project oversight, from site to closeout.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
            Manage projects, employees, materials, suppliers,
            equipment, expenses and payments from one workspace.
          </p>
        </div>

        <p className="text-xs text-white/50">
          BuildTrack Management System
        </p>
      </aside>

      {/* LOGIN */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">

        <section className="w-full max-w-md">

          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Building2 size={24} />

            <span className="text-sm font-bold uppercase tracking-[0.16em]">
              BuildTrack
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d6d78]">
            Operations workspace
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Log in
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Access your project workspace.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={submit}
          >

            <label className="block text-sm font-semibold">
              Email address

              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Enter your email"
                required
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-normal outline-none transition focus:border-[#1d6d78] focus:ring-2 focus:ring-[#1d6d78]/20"
              />
            </label>

            <label className="block text-sm font-semibold">
              Password

              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-normal outline-none transition focus:border-[#1d6d78] focus:ring-2 focus:ring-[#1d6d78]/20"
              />
            </label>

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1d6d78] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#165761] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log In'}

              {!loading && (
                <ArrowRight size={17} />
              )}
            </button>

          </form>

        </section>

      </main>

    </div>
  );
}

export default Login;