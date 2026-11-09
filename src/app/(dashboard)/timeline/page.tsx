import { Metadata } from 'next';
import TimelineView from '@/components/timeline/TimelineView';

export const metadata: Metadata = {
  title: 'Timeline & Cột mốc — LifeOS',
  description: 'Dòng thời gian trực quan cho các cột mốc cuộc sống, dự án và hạn chót công việc.',
};

export default function TimelinePage() {
  return <TimelineView />;
}
