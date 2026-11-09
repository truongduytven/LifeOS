import React from 'react';
import { Metadata } from 'next';
import DocumentCenter from '@/components/documents/DocumentCenter';

export const metadata: Metadata = {
  title: 'Tài liệu & Lưu trữ | LifeOS',
  description: 'Quản lý tài liệu cá nhân, tệp đính kèm nội bộ và liên kết đám mây tập trung.',
};

export default function DocumentsPage() {
  return (
    <div className="w-full">
      <DocumentCenter />
    </div>
  );
}
