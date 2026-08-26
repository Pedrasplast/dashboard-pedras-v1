# Refatoração técnica — branch pedidos

Objetivo desta revisão: melhorar reutilização, manutenção e performance sem alterar regras de negócio ou identidade visual.

## Principais melhorias

- Filtros compartilhados em `src/components/filtros`.
- Dashboard de Produção dividido em utilitários e componentes menores/memoizados.
- Pedidos com utilitários compartilhados, hook único de consulta ao Supabase e atualização automática isolada.
- Paginação corrigida para ambiente Linux/Vercel (`Paginacao.css`) e componente memoizado.
- Relatórios de pedidos reutilizam a mesma consulta/cache da tela de Pedidos.
- Colunas de exportação compartilhadas entre PDF e Excel.
- Utilitários comuns de números, texto e coleções centralizados em `src/lib`.
- Importação Excel evita normalizações repetitivas de cabeçalhos por linha/campo.
- Navbar usa o estado oficial do TanStack Router em vez de interceptar o histórico global do navegador.
- OEE teve seletores/filtros extraídos para funções puras reutilizáveis e o período passou de ordenação completa para busca linear de menor/maior data.
- Pedidos agora são agrupados uma única vez antes da paginação, evitando múltiplas passagens sobre a mesma lista.
- Logs informativos de `carga_maquina` ficam restritos ao ambiente de desenvolvimento.
- Adicionada validação estática própria para sintaxe, nomes/escopo e imports locais.


## Ajustes de build e deploy — Vercel

- O projeto passou a usar a configuração oficial de Vite/TanStack Start diretamente, sem o wrapper `@lovable.dev/vite-tanstack-config`.
- O Nitro está explicitamente configurado com o preset `vercel`, alinhando o build local e de produção ao ambiente real de hospedagem.
- O Vite 8 usa `resolve.tsconfigPaths: true`, eliminando a dependência e o plugin legado `vite-tsconfig-paths`.
- PDF e Excel da Central de Relatórios são carregados somente quando o usuário solicita a exportação, reduzindo o JavaScript necessário para abrir a tela de relatórios.
- O limite de aviso de chunk foi ajustado apenas para os módulos pesados de exportação que agora são carregados sob demanda.
- `.output/` e `.vercel/` foram adicionados ao `.gitignore`, evitando versionar artefatos locais de build/deploy.
- O projeto foi padronizado em npm (`package-lock.json` + `packageManager`), removendo os lock/config do Bun para evitar detecção ambígua do gerenciador de pacotes na Vercel.
- A versão de Node foi fixada em `22.x`, igualando o runtime esperado entre desenvolvimento e Vercel.

## Validação antes do merge

Depois de instalar as dependências:

```bash
npm ci
npm run validate:static
npm run build
```

Ou execute tudo em sequência:

```bash
npm run validate
```

A validação estática não substitui o build; ela antecipa erros comuns de JSX/JS, referências inexistentes e caminhos locais quebrados.

## Regras preservadas

- Cálculos e regras existentes do Dashboard/OEE.
- Regras de filtros, turnos, pedidos e relatórios.
- Consulta dos pedidos já sincronizados no Supabase.
- Exportação PDF/Excel.
- Classes CSS e aparência existente.
- Fluxo de autenticação e permissões.
