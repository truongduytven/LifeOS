import React from 'react';
import { Metadata } from 'next';
import NotesGrid from '@/components/notes/NotesGrid';

export const metadata: Metadata = {
  title: 'Ghi chú | LifeOS',
  description: 'Quản lý ghi chú nhanh, phân loại theo màu sắc, ghim và thẻ nội dung.',
};

export default function NotesPage() {
  return (
    <div className="w-full">
      <NotesGrid />
    </div>
  );
}
