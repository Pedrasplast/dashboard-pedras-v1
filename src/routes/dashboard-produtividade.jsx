import { createFileRoute } from '@tanstack/react-router';

import DashboardProdutividade from '@/features/dashboard-produtividade/DashboardProdutividade';

export const Route = createFileRoute(
  '/dashboard-produtividade'
)({
  component: DashboardProdutividade,
});