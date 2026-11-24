import { CheckSquare, CalendarClock, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
}

export function AuthGate({ onSignIn, isSigningIn, authError }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <CheckSquare className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight font-display">
                TaskFlow
              </span>
            </div>

            <h1 className="mt-8 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              Smart daily task management without the clutter
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              Organize priorities, track deadlines, and separate active work from completed milestones. Every change persists automatically to your PostgreSQL workspace.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CalendarClock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Priority &amp; Deadline Sorting
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Filter by status, search instantly by title, and sort by priority or due date.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Persistent PostgreSQL Storage
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Your tasks stay synced safely across sessions and devices.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 p-8 sm:p-10 bg-slate-50/60 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Sign in to your workspace
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Use your Google account to access your personal TaskFlow – Smart To-Do Manager dashboard.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700 leading-relaxed"
            >
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={onSignIn}
            disabled={isSigningIn}
            className="mt-6 w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Authentication secures your private task records via verified session tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
