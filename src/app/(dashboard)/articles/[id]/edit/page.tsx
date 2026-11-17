import React from 'react';
import { Metadata } from 'next';
import ArticleEditorPage from '@/components/articles/ArticleEditorPage';

export const metadata: Metadata = {
  title: 'Chỉnh sửa bài viết | LifeOS',
  description: 'Chỉnh sửa bài viết chuyên sâu trên không gian số LifeOS.',
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = parseInt(id, 10);

  return <ArticleEditorPage mode="edit" articleId={articleId} />;
}
