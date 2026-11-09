import React from 'react';
import { Metadata } from 'next';
import ArticlesStudio from '@/components/articles/ArticlesStudio';

export const metadata: Metadata = {
  title: 'Bài viết & Chế độ đọc | LifeOS',
  description: 'Quản lý bài viết cá nhân, danh sách đọc và chế độ đọc tập trung không phân tâm.',
};

export default function ArticlesPage() {
  return (
    <div className="w-full">
      <ArticlesStudio />
    </div>
  );
}
