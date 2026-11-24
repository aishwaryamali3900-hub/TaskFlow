import {
  LayoutDashboard,
  ListTodo,
  CheckCircle2,
  Clock,
  LogOut,
  CheckSquare,
  X,
} from 'lucide-react';
import type { SidebarSection } from '../types/task.ts';

interface SidebarProps {
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  counts: {
    total: number;
    pending: number;
    completed: number;
  };
  userEmail: string;
  userName: string | null;
  onSignOut: () => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  counts,
  userEmail,
  userName,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: SidebarSection;
    label: string;
    count: number;
    icon: typeof LayoutDashboard;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      count: counts.total,
      icon: LayoutDashboard,
    },
    {
      id: 'all',
      label: 'All Tasks',
      count: counts.total,
      icon: ListTodo,
    },
    {
      id: 'pending',
      label: 'Pending',
      count: counts.pending,
      icon: Clock,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
    },
  ];

  const handleNavClick = (section: SidebarSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200 w-64">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-slate-900 font-display truncate">
              TaskFlow
            </div>
            <div className="text-xs text-slate-500 truncate">
              Smart To-Do Manager
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 -mr-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Primary" className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </span>
              <span
                className={`text-xs font-mono tabular-nums ${
                  isActive ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="px-2 py-1.5">
          <div className="text-sm font-medium text-slate-900 truncate">
            {userName || 'Workspace User'}
          </div>
          <div className="text-xs text-slate-500 truncate">{userEmail}</div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
