import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type {
  Task,
  TaskFormValues,
  TaskPriority,
  TaskStatus,
} from '../types/task.ts';

interface TaskFormModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const STATUSES: TaskStatus[] = ['Pending', 'Completed'];

export function TaskFormModal({
  isOpen,
  editingTask,
  onClose,
  onSubmit,
  isSubmitting,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? '');
      setDueDate(editingTask.due_date ?? '');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Medium');
      setStatus('Pending');
    }
    setValidationError(null);
  }, [isOpen, editingTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setValidationError('Please enter a task title before saving.');
      return;
    }
    if (trimmedTitle.length > 160) {
      setValidationError('Task title must be 160 characters or fewer.');
      return;
    }
    if (description.trim().length > 2000) {
      setValidationError('Description must be 2000 characters or fewer.');
      return;
    }

    setValidationError(null);
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        due_date: dueDate,
        priority,
        status,
      });
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Unable to save task.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="task-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {validationError && (
            <div
              role="alert"
              className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700"
            >
              {validationError}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Task Title <span className="text-red-600">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Finalize quarterly roadmap"
              maxLength={160}
              autoFocus
              required
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, links, or acceptance criteria..."
              maxLength={2000}
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {isSubmitting
                ? 'Saving...'
                : editingTask
                  ? 'Save Changes'
                  : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
