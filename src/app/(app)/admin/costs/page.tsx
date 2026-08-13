import AICostsDashboardClient from './costs-client';

export const metadata = {
  title: 'Coûts IA | Helmdash Admin',
  description: 'Dashboard interne des coûts IA',
};

export default function AICostsDashboard() {
  return <AICostsDashboardClient />;
}
