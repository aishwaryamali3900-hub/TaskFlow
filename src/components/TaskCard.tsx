import { Calendar, Check, Flag, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskPriority } from '../types/task.ts';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isUpdating: boolean;
}

function formatDueDate(dateStr: string | null): {
  label: string;
  isOverdue: boolean;
} | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { label: dateStr, isOverdue: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = parsed.getTime() < today.getTime();

  const formatted = parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return { label: formatted, isOverdue };
}

function getPriorityStyle(priority: TaskPriority): {
  textClass: string;
  label: string;
} {
  switch (priority) {
    case 'High':
      return { textClass: 'text-red-600 font-medium', label: 'High priority' };
    case 'Medium':
      return { textClass: 'text-amber-600 font-medium', label: 'Medium priority' };
    case 'Low':
    default:
      return { textClass: 'text-slate-500 font-medium', label: 'Low priority' };
  }
}

export function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  isUpdating,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const dueInfo = formatDueDate(task.due_date);
  const priorityStyle = getPriorityStyle(task.priority);

  return (
    <article
      className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 transition-colors ${
        isCompleted ? 'bg-slate-50/70' : 'hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggleStatus(task)}
            disabled={isUpdating}
            aria-label={
              isCompleted
                ? `Mark "${task.title}" as pending`
                : `Mark "${task.title}" as completed`
            }
            aria-pressed={isCompleted}
            className={`mt-0.5 w-10 h-10 -ml-2 -mt-1.5 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 ${
              isCompleted
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`text-base font-semibold leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`mt-1.5 text-sm leading-relaxed break-words ${
                  isCompleted ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {task.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
              <span className={`inline-flex items-center gap-1 ${priorityStyle.textClass}`}>
                <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{priorityStyle.label}</span>
              </span>

              {dueInfo && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono tabular-nums ${
                      !isCompleted && dueInfo.isOverdue
                        ? 'text-red-600 font-medium'
                        : 'text-slate-500'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {!isCompleted && dueInfo.isOverdue
                        ? `Overdue (${dueInfo.label})`
                        : `Due ${dueInfo.label}`}
                    </span>
                  </span>
                </>
              )}

              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span
                className={
                  isCompleted ? 'text-emerald-600 font-medium' : 'text-slate-500'
                }
              >
                {task.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 -mr-1.5 -mt-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            title="Edit task"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Delete "${task.title}"`}
            title="Delete task"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
