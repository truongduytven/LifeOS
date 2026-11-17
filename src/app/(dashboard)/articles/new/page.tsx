import React from 'react';
import { Metadata } from 'next';
import ArticleEditorPage from '@/components/articles/ArticleEditorPage';

export const metadata: Metadata = {
  title: 'Viết bài mới | LifeOS',
  description: 'Trang soạn thảo bài viết chuyên sâu trên không gian số LifeOS.',
};

export default function NewArticlePage() {
  return <ArticleEditorPage mode="create" />;
}
