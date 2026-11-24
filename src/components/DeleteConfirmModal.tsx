import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Task } from '../types/task.ts';

interface DeleteConfirmModalProps {
  task: Task | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirmModal({
  task,
  onCancel,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, isDeleting, onCancel]);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={() => !isDeleting && onCancel()}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="delete-modal-title"
                className="text-base font-semibold text-slate-900"
              >
                Delete Task
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-medium text-slate-900">
                  &ldquo;{task.title}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close confirmation"
            className="w-10 h-10 -mr-2 -mt-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
