import { createFileRoute } from '@tanstack/react-router';

import DashboardProdutividade from '@/features/dashboard-produtividade/dashboardProdutividade';

export const Route = createFileRoute(
  '/dashboard-produtividade'
)({
  component: DashboardProdutividade,
});