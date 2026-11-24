import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  Menu,
  Plus,
  Search,
  ArrowUpDown,
  ClipboardList,
  AlertCircle,
  X,
} from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasks,
  updateTaskRequest,
} from './services/taskApi.ts';
import type {
  PriorityFilter,
  SidebarSection,
  SortOption,
  StatusFilter,
  Task,
  TaskFormValues,
  TaskPriority,
} from './types/task.ts';
import { AuthGate } from './components/AuthGate.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { StatsStrip } from './components/StatsStrip.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { TaskFormModal } from './components/TaskFormModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function sortTasks(list: Task[], sortBy: SortOption): Task[] {
  const copy = [...list];
  copy.sort((a, b) => {
    if (sortBy === 'priority_desc') {
      const diff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (diff !== 0) return diff;
    } else if (sortBy === 'priority_asc') {
      const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (diff !== 0) return diff;
    } else if (sortBy === 'due_date_asc') {
      if (a.due_date && b.due_date) {
        const cmp = a.due_date.localeCompare(b.due_date);
        if (cmp !== 0) return cmp;
      } else if (a.due_date && !b.due_date) {
        return -1;
      } else if (!a.due_date && b.due_date) {
        return 1;
      }
    }
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
      b.id - a.id
    );
  });
  return copy;
}

const SECTION_TITLES: Record<SidebarSection, string> = {
  dashboard: 'Dashboard',
  all: 'All Tasks',
  pending: 'Pending Tasks',
  completed: 'Completed Tasks',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [activeSection, setActiveSection] =
    useState<SidebarSection>('dashboard');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('due_date_asc');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loadUserTasks = useCallback(async (currentUser: User) => {
    setIsLoadingTasks(true);
    setLoadError(null);
    try {
      const data = await fetchTasks(currentUser);
      setTasks(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load your tasks.'
      );
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadUserTasks(user);
    } else {
      setTasks([]);
      setLoadError(null);
    }
  }, [user, loadUserTasks]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Sign-in could not be completed. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSelectSection = (section: SidebarSection) => {
    setActiveSection(section);
    if (section === 'pending') {
      setStatusFilter('Pending');
    } else if (section === 'completed') {
      setStatusFilter('Completed');
    } else {
      setStatusFilter('All');
    }
  };

  const handleStatusFilterChange = (nextStatus: StatusFilter) => {
    setStatusFilter(nextStatus);
    if (activeSection === 'pending' && nextStatus !== 'Pending') {
      setActiveSection(nextStatus === 'Completed' ? 'completed' : 'all');
    } else if (activeSection === 'completed' && nextStatus !== 'Completed') {
      setActiveSection(nextStatus === 'Pending' ? 'pending' : 'all');
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: TaskFormValues) => {
    if (!user) return;
    setIsSubmittingForm(true);
    setActionError(null);
    try {
      if (editingTask) {
        const updated = await updateTaskRequest(user, editingTask.id, values);
        setTasks((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        const created = await createTaskRequest(user, values);
        setTasks((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
      setEditingTask(null);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!user) return;
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setActionError(null);
    setUpdatingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(task.id);
      return next;
    });

    try {
      const updated = await updateTaskRequest(user, task.id, {
        status: nextStatus,
      });
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update task status.'
      );
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !taskToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const deletedId = await deleteTaskRequest(user, taskToDelete.id);
      setTasks((prev) => prev.filter((item) => item.id !== deletedId));
      setTaskToDelete(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete task.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const counts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    for (const task of tasks) {
      if (task.status === 'Completed') {
        completed += 1;
      } else {
        pending += 1;
      }
    }
    return {
      total: tasks.length,
      completed,
      pending,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matching = tasks.filter((task) => {
      if (statusFilter !== 'All' && task.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
        return false;
      }
      if (
        normalizedSearch &&
        !task.title.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });

    return sortTasks(matching, sortBy);
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  const pendingTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Pending'),
    [filteredTasks]
  );

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Completed'),
    [filteredTasks]
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'All' ||
    (statusFilter !== 'All' &&
      (activeSection === 'dashboard' || activeSection === 'all'));

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    if (activeSection === 'dashboard' || activeSection === 'all') {
      setStatusFilter('All');
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-sm font-medium text-slate-500">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGate
        onSignIn={handleSignIn}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  const showSeparateSections = statusFilter === 'All';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        counts={counts}
        userEmail={user.email ?? ''}
        userName={user.displayName}
        onSignOut={handleSignOut}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-10 h-10 -ml-2 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
              {SECTION_TITLES[activeSection]}
            </h1>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto space-y-6">
          {activeSection === 'dashboard' && (
            <StatsStrip
              total={counts.total}
              completed={counts.completed}
              pending={counts.pending}
            />
          )}

          {actionError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                aria-label="Dismiss error"
                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <section
            aria-label="Search, filter, and sort tasks"
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title..."
                aria-label="Search tasks by title"
                className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(activeSection === 'dashboard' || activeSection === 'all') && (
                <div
                  role="group"
                  aria-label="Filter by status"
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                >
                  {(['All', 'Pending', 'Completed'] as StatusFilter[]).map(
                    (statusOption) => {
                      const active = statusFilter === statusOption;
                      return (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleStatusFilterChange(statusOption)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {statusOption}
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as PriorityFilter)
                }
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              <div className="inline-flex items-center gap-1.5">
                <ArrowUpDown
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <select
                  aria-label="Sort tasks"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="due_date_asc">Due Date (Earliest)</option>
                  <option value="priority_desc">Priority (High to Low)</option>
                  <option value="priority_asc">Priority (Low to High)</option>
                  <option value="created_desc">Newest First</option>
                </select>
              </div>
            </div>
          </section>

          {isLoadingTasks ? (
            <div className="space-y-3" aria-label="Loading tasks">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
                >
                  <div className="h-5 w-1/3 bg-slate-200 rounded" />
                  <div className="mt-3 h-4 w-2/3 bg-slate-100 rounded" />
                  <div className="mt-4 h-3 w-1/4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
              <AlertCircle
                className="w-8 h-8 text-red-600 mx-auto"
                aria-hidden="true"
              />
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                Could not load tasks
              </h2>
              <p className="mt-1 text-sm text-slate-600">{loadError}</p>
              <button
                type="button"
                onClick={() => loadUserTasks(user)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <ClipboardList className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {tasks.length === 0
                  ? 'No tasks yet'
                  : 'No matching tasks found'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
                {tasks.length === 0
                  ? 'Create your first task to start organizing deadlines, priorities, and daily progress.'
                  : 'Try adjusting your search query or status and priority filters.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          ) : showSeparateSections ? (
            <div className="space-y-8">
              <section aria-labelledby="pending-heading" className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h2
                    id="pending-heading"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Pending Tasks
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {pendingTasks.length}
                  </span>
                </div>

                {pendingTasks.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                    All caught up — no pending tasks match your current view.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onEdit={openEditModal}
                        onDelete={setTaskToDelete}
                        isUpdating={updatingTaskIds.has(task.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section aria-labelledby="completed-heading" className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h2
                    id="completed-heading"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Completed Tasks
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {completedTasks.length}
                  </span>
                </div>

                {completedTasks.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                    No completed tasks yet. Check off a task when you finish it.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onEdit={openEditModal}
                        onDelete={setTaskToDelete}
                        isUpdating={updatingTaskIds.has(task.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section aria-label="Filtered tasks" className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={handleToggleStatus}
                  onEdit={openEditModal}
                  onDelete={setTaskToDelete}
                  isUpdating={updatingTaskIds.has(task.id)}
                />
              ))}
            </section>
          )}
        </main>
      </div>

      <TaskFormModal
        isOpen={isFormOpen}
        editingTask={editingTask}
        onClose={() => {
          if (!isSubmittingForm) {
            setIsFormOpen(false);
            setEditingTask(null);
          }
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmittingForm}
      />

      <DeleteConfirmModal
        task={taskToDelete}
        onCancel={() => !isDeleting && setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
