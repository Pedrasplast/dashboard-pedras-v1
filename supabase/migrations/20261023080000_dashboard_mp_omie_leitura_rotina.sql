-- A rotina sincronizar-dashboard-mp-omie (service_role) lê os pedidos já
-- gravados para ligar as notas de entrada. Escrita continua só pelas RPCs.
grant select on public.dashboard_mp_pedidos_omie, public.dashboard_mp_notas_omie to service_role;
