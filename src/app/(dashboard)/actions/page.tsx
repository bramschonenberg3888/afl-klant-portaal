import { redirect } from 'next/navigation';

export default function ActionsPage() {
  redirect('/quick-scan?tab=acties');
}
