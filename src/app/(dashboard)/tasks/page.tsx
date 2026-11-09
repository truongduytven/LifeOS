import { Metadata } from 'next';
import TaskManager from '@/components/tasks/TaskManager';

export const metadata: Metadata = {
  title: 'Công việc & Checklist — LifeOS',
  description: 'Quản lý task, checklist đa cấp và kanban board thời gian thực.',
};

export default function TasksPage() {
  return <TaskManager />;
}
