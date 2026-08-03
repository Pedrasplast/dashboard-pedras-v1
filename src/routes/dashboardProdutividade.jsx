import React from 'react';

import {
  createFileRoute
} from '@tanstack/react-router';

import dashboardProdutividade from '@/features/dashboard-produtividade/dashboardProdutividade';

export const Route = createFileRoute(
  '/dashboardProdutividade'
)({
  component: dashboardProdutividade
});