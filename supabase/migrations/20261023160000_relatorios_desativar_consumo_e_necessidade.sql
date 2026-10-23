-- Relatórios removidos em 23/10 (a pedido): Consumo Programado por Injetora,
-- por Fornecedor e Necessidade de Compra de MP. Só desativa o cadastro; as
-- permissões dos usuários ficam guardadas.
-- Rollback: update public.relatorios_sistema set ativo = true where chave in (...);
update public.relatorios_sistema set ativo = false
 where chave in ('materia-prima-consumo-injetora','materia-prima-consumo-fornecedor','materia-prima-necessidade-compra');
