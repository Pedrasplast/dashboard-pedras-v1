/* =========================================================
   VALIDAÇÃO DE NOMES (ver NOMENCLATURA.md)
   ---------------------------------------------------------
   Confere nomes de pastas e arquivos de src/ e os nomes em
   inglês mais comuns em declarações novas (isX, handleX,
   toggleX, loadingX). Uso: node scripts/validar-nomes.mjs
========================================================= */

import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const pastaSrc = path.join(raiz, "src");

/* Arquivos que seguem convenção de ferramenta e ficam como estão. */
const EXCECOES_ARQUIVO = new Set([
  "src/routeTree.gen.ts",
  "src/router.tsx",
  "src/server.ts",
  "src/start.ts",
  "src/lib/error-capture.ts",
  "src/lib/error-page.ts",
  "src/lib/lovable-error-reporting.ts",
]);

const PASTA = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COMPONENTE = /^[A-Z][A-Za-z0-9]*(\.test)?\.(jsx|tsx)$/;
const MODULO = /^[a-z][A-Za-z0-9]*(\.[a-z]+)*\.(js|ts|mjs)$/;
const ROTA = /^(__root|[a-z0-9]+(-[a-z0-9]+)*)\.(jsx|tsx)$/;
const SUFIXO_SEM_PONTO = /(Service|Utils|Config|Selectors|Constants|Regras)\.(js|ts)$/;

/* Declarações com nome em inglês que têm equivalente no padrão. */
const DECLARACAO_EM_INGLES =
  /\b(?:const|let|var|function)\s+(?:\[\s*)?((?:is|has|handle|toggle)[A-Z]\w*|loading\w*)\b/g;

const problemas = [];

function relativo(caminho) {
  return path.relative(raiz, caminho).split(path.sep).join("/");
}

function conferirArquivo(caminho) {
  const rel = relativo(caminho);
  const nome = path.basename(caminho);

  if (EXCECOES_ARQUIVO.has(rel) || !/\.(jsx?|tsx?|mjs)$/.test(nome)) {
    return;
  }

  if (rel.startsWith("src/routes/")) {
    if (!ROTA.test(nome)) {
      problemas.push(`${rel}: rota deve ser kebab-case (exigência do TanStack Router)`);
    }
  } else if (/\.(jsx|tsx)$/.test(nome)) {
    if (!COMPONENTE.test(nome)) {
      problemas.push(`${rel}: arquivo de componente deve ser PascalCase (ex.: PedidosPage.jsx)`);
    }
  } else if (SUFIXO_SEM_PONTO.test(nome)) {
    problemas.push(`${rel}: use o papel com ponto (ex.: entradas.service.js, entradas.utils.js)`);
  } else if (!MODULO.test(nome)) {
    problemas.push(`${rel}: módulo deve ser camelCase (ex.: gerarPdf.js, pedidos.service.js)`);
  }

  const texto = fs.readFileSync(caminho, "utf8");

  for (const encontrado of texto.matchAll(DECLARACAO_EM_INGLES)) {
    const linha = texto.slice(0, encontrado.index).split("\n").length;

    problemas.push(
      `${rel}:${linha}: "${encontrado[1]}" em inglês (use eh/tem/pode/esta, carregando*, verbo em português)`,
    );
  }
}

function percorrer(diretorio) {
  for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, entrada.name);

    if (entrada.isDirectory()) {
      if (!PASTA.test(entrada.name)) {
        problemas.push(`${relativo(caminho)}/: pasta deve ser kebab-case (ex.: compras-futuras)`);
      }

      percorrer(caminho);
    } else {
      conferirArquivo(caminho);
    }
  }
}

percorrer(pastaSrc);

if (problemas.length) {
  console.error(`Nomes fora do padrão (${problemas.length}):`);

  for (const problema of problemas) {
    console.error(`- ${problema}`);
  }

  process.exitCode = 1;
} else {
  console.log("Nomes de pastas, arquivos e declarações seguem o padrão (NOMENCLATURA.md).");
}
