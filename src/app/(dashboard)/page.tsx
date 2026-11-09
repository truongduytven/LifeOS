import React from 'react';
import DashboardView from '@/components/dashboard/DashboardView';

export const metadata = {
  title: 'Tổng quan — LifeOS Command Center',
  description: 'Trung tâm chỉ huy cuộc sống cá nhân với dữ liệu thời gian thực và không gian 3D tương tác.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
