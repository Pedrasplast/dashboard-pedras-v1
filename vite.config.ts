import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { resolve } from "node:path";

import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";

import { nitro } from "nitro/vite";

import type { ChildNode, Container, Plugin as PostcssPlugin } from "postcss";

/* =========================================================
   VERSÃO AUTOMÁTICA DO SISTEMA
========================================================= */

function criarPluginVersao(versao: string) {
  return {
    name: "pedrasplast-app-version",

    apply: "build" as const,

    buildStart() {
      const pastaPublic = resolve(process.cwd(), "public");

      mkdirSync(pastaPublic, {
        recursive: true,
      });

      writeFileSync(
        resolve(pastaPublic, "version.json"),

        JSON.stringify(
          {
            version: versao,

            buildAt: new Date().toISOString(),
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
   CAMADAS CSS (@layer)
   ---------------------------------------------------------
   Cada arquivo CSS entra numa camada conforme a pasta onde
   está. Entre camadas, quem vence é sempre a camada mais
   alta da lista, sem depender de especificidade nem da
   ordem em que os arquivos carregam.

     base         tokens, animações e reset global
     bibliotecas  CSS de pacotes (node_modules)
     componentes  src/components e src/styles
     telas        src/features
     componentes-padrao
                  visual padrão que deve vencer as telas
                  (hoje só o Modal: todos os modais seguem
                  o mesmo padrão, mesmo que a tela tenha
                  CSS próprio para o modal)
     utilitarios  src/styles/utilitarios.css

   Os arquivos CSS não precisam declarar a camada: este
   plugin faz isso no build e no modo dev.
========================================================= */

const ORDEM_CAMADAS = [
  "base",
  "bibliotecas",
  "componentes",
  "telas",
  "componentes-padrao",
  "utilitarios",
];

const ARQUIVOS_COMPONENTES_PADRAO = ["/src/components/Modal/Modal.css"];

const ARQUIVOS_BASE = [
  "/src/styles/tokens.css",
  "/src/styles/animacoes.css",
  "/src/legacy-base.css",
  "/src/app-layout.css",
];

function camadaDoArquivo(arquivo: string | undefined): string | null {
  if (!arquivo) return null;

  const caminho = arquivo.replace(/\\/g, "/").split("?")[0];

  if (caminho.includes("/node_modules/")) return "bibliotecas";
  if (caminho.endsWith("/src/styles/utilitarios.css")) return "utilitarios";
  if (ARQUIVOS_BASE.some((base) => caminho.endsWith(base))) return "base";
  if (ARQUIVOS_COMPONENTES_PADRAO.some((arquivo) => caminho.endsWith(arquivo))) {
    return "componentes-padrao";
  }
  if (caminho.includes("/src/components/") || caminho.includes("/src/styles/")) {
    return "componentes";
  }
  if (caminho.includes("/src/features/")) return "telas";

  return null;
}

function criarPluginCamadasCss(): PostcssPlugin {
  return {
    postcssPlugin: "pedrasplast-camadas-css",

    Once(raiz, { AtRule }) {
      /*
       * Depois que o Vite resolve os @import, os trechos
       * importados continuam marcando o arquivo de origem.
       * Por isso a camada é decidida trecho a trecho.
       */
      let criouCamada = false;

      /*
       * Regras que já declaram @layer ficam como estão.
       * Um @media que tem @layer dentro é percorrido por
       * dentro, para não criar camadas aninhadas.
       */
      const temCamadaDentro = (no: ChildNode) => {
        let achou = false;
        if (no.type === "atrule") no.walkAtRules("layer", () => void (achou = true));
        return achou;
      };

      const distribuir = (container: Container) => {
        let blocoAtual: InstanceType<typeof AtRule> | null = null;

        for (const no of [...(container.nodes ?? [])]) {
          if (no.type === "atrule" && no.name === "layer") {
            blocoAtual = null;
            continue;
          }

          if (temCamadaDentro(no)) {
            blocoAtual = null;
            distribuir(no as Container);
            continue;
          }

          const camada = camadaDoArquivo(no.source?.input.file);

          if (!camada) {
            blocoAtual = null;
            continue;
          }

          if (!blocoAtual || blocoAtual.params !== camada) {
            blocoAtual = new AtRule({ name: "layer", params: camada });
            no.before(blocoAtual);
            criouCamada = true;
          }

          blocoAtual.append(no);
        }
      };

      distribuir(raiz);

      let usaCamada = criouCamada;
      raiz.walkAtRules("layer", () => void (usaCamada = true));

      if (usaCamada) {
        raiz.prepend(new AtRule({ name: "layer", params: ORDEM_CAMADAS.join(", ") }));
      }
    },
  };
}

/* =========================================================
   BREAKPOINTS (@custom-media)
   ---------------------------------------------------------
   A escala fica em src/styles/breakpoints.css. Este plugin
   troca cada nome, como (--tablet), pelo valor definido lá.
   Um nome que não existe na escala para o build com erro,
   para não virar um @media que nunca se aplica.
========================================================= */

function lerBreakpoints(): Map<string, string> {
  const texto = readFileSync(resolve(process.cwd(), "src/styles/breakpoints.css"), "utf8");
  const mapa = new Map<string, string>();

  for (const [, nome, valor] of texto.matchAll(/@custom-media\s+(--[\w-]+)\s+([^;]+);/g)) {
    mapa.set(nome, valor.trim());
  }

  return mapa;
}

function criarPluginBreakpoints(): PostcssPlugin {
  const breakpoints = lerBreakpoints();

  return {
    postcssPlugin: "pedrasplast-breakpoints",

    AtRule: {
      "custom-media": (regra) => {
        regra.remove();
      },

      media: (regra) => {
        if (!regra.params.includes("(--")) return;

        regra.params = regra.params.replace(/\((--[\w-]+)\)/g, (_, nome: string) => {
          const valor = breakpoints.get(nome);

          if (!valor) {
            throw regra.error(`Breakpoint desconhecido: ${nome} (veja src/styles/breakpoints.css)`);
          }

          return valor;
        });
      },
    },
  };
}

/* =========================================================
   VITE
========================================================= */

export default defineConfig(({ command }) => {
  /*
   * Cada build recebe uma versão única.
   *
   * No Vercel usamos o SHA do commit,
   * quando disponível, junto com o horário
   * para garantir uma versão nova até em
   * redeploy do mesmo commit.
   */
  const versao =
    command === "build"
      ? `${process.env["VERCEL_GIT_COMMIT_SHA"] || "build"}-${Date.now()}`
      : "dev";

  return {
    resolve: {
      tsconfigPaths: true,
    },

    /*
     * A mesma versão que vai para
     * version.json é embutida no
     * JavaScript do navegador.
     */
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(versao),
    },

    plugins: [
      criarPluginVersao(versao),

      tanstackStart(),

      nitro({
        preset: "vercel",
      }),

      viteReact(),
    ],

    css: {
      postcss: {
        plugins: [criarPluginBreakpoints(), criarPluginCamadasCss()],
      },
    },

    build: {
      /*
       * PDF e Excel são carregados sob
       * demanda na tela de relatórios.
       */
      chunkSizeWarningLimit: 1100,
    },
  };
});
