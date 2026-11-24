export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export type SidebarSection = 'dashboard' | 'all' | 'pending' | 'completed';
export type StatusFilter = 'All' | 'Pending' | 'Completed';
export type PriorityFilter = 'All' | TaskPriority;
export type SortOption =
  | 'due_date_asc'
  | 'priority_desc'
  | 'priority_asc'
  | 'created_desc';

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
}
