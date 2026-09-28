import {
  mkdirSync,
  writeFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

import {
  defineConfig,
} from "vite";

import {
  tanstackStart,
} from "@tanstack/react-start/plugin/vite";

import viteReact
  from "@vitejs/plugin-react";

import tailwindcss
  from "@tailwindcss/vite";

import {
  nitro,
} from "nitro/vite";


/* =========================================================
   VERSÃO AUTOMÁTICA DO SISTEMA
========================================================= */

function criarPluginVersao(
  versao: string,
) {
  return {
    name:
      "pedrasplast-app-version",

    apply:
      "build" as const,

    buildStart() {
      const pastaPublic =
        resolve(
          process.cwd(),
          "public",
        );

      mkdirSync(
        pastaPublic,
        {
          recursive: true,
        },
      );

      writeFileSync(
        resolve(
          pastaPublic,
          "version.json",
        ),

        JSON.stringify(
          {
            version:
              versao,

            buildAt:
              new Date()
                .toISOString(),
          },

          null,

          2,
        ),

        "utf8",
      );
    },
  };
}


/* =========================================================
   VITE
========================================================= */

export default defineConfig(
  ({
    command,
  }) => {
    /*
     * Cada build recebe uma versão única.
     *
     * No Vercel usamos o SHA do commit,
     * quando disponível, junto com o horário
     * para garantir uma versão nova até em
     * redeploy do mesmo commit.
     */
    const versao =
      command ===
      "build"
        ? `${
            process.env["VERCEL_GIT_COMMIT_SHA"] || "build"
          }-${Date.now()}`
        : "dev";


    return {
      resolve: {
        tsconfigPaths:
          true,
      },


      /*
       * A mesma versão que vai para
       * version.json é embutida no
       * JavaScript do navegador.
       */
      define: {
        "import.meta.env.VITE_APP_VERSION":
          JSON.stringify(
            versao,
          ),
      },


      plugins: [
        criarPluginVersao(
          versao,
        ),

        tanstackStart(),

        nitro({
          preset:
            "vercel",
        }),

        viteReact(),

        tailwindcss(),
      ],


      build: {
        /*
         * PDF e Excel são carregados sob
         * demanda na tela de relatórios.
         */
        chunkSizeWarningLimit:
          1100,
      },
    };
  },
);