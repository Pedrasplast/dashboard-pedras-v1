import React from 'react';

import {
  createFileRoute
} from '@tanstack/react-router';

import DashboardMateriaPrima from '@/features/dashboard-materia-prima/DashboardMateriaPrima';

export const Route = createFileRoute(
  '/dashboard-materia-prima'
)({
  component: DashboardMateriaPrima
});