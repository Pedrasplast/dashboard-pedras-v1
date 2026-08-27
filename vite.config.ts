import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

/*
 * Configuração de produção alinhada ao ambiente real do projeto: Vercel.
 *
 * - TanStack Start cuida de SSR, rotas e server functions.
 * - Nitro gera a saída compatível com Vercel Functions.
 * - Vite 8 resolve os aliases do tsconfig nativamente, sem vite-tsconfig-paths.
 * - src/server.ts é detectado automaticamente pelo TanStack Start como
 *   server entry customizado.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    tanstackStart(),
    nitro({
      preset: "vercel",
    }),
    viteReact(),
    tailwindcss(),
  ],

  build: {
    /*
     * PDF e Excel são carregados sob demanda na tela de relatórios.
     * Bibliotecas de exportação podem formar chunks maiores, mas não fazem
     * mais parte do carregamento inicial da tela. O limite evita um alerta
     * enganoso para esses chunks deliberadamente lazy-loaded.
     */
    chunkSizeWarningLimit: 1100,
  },
});
