import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils/date';

export default function DashboardIndex() {
  redirect(`/dashboard/${formatDate(new Date())}`);
}
