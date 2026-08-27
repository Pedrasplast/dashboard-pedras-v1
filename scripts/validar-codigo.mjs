import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const raiz = process.cwd();
const pastaSrc = path.join(raiz, "src");
const extensoesCodigo = new Set([".js", ".jsx", ".ts", ".tsx"]);
const extensoesResolucao = [".js", ".jsx", ".ts", ".tsx", ".css"];

function listarArquivos(diretorio) {
  const arquivos = [];

  for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, entrada.name);

    if (entrada.isDirectory()) {
      arquivos.push(...listarArquivos(caminho));
      continue;
    }

    if (extensoesCodigo.has(path.extname(entrada.name))) {
      arquivos.push(caminho);
    }
  }

  return arquivos;
}

function resolverImportLocal(especificador, arquivoOrigem) {
  let base;

  if (especificador.startsWith("@/")) {
    base = path.join(pastaSrc, especificador.slice(2));
  } else if (especificador.startsWith(".")) {
    base = path.resolve(path.dirname(arquivoOrigem), especificador);
  } else {
    return null;
  }

  const candidatos = [
    base,
    ...extensoesResolucao.map((extensao) => `${base}${extensao}`),
    ...extensoesResolucao.map((extensao) => path.join(base, `index${extensao}`)),
  ];

  return candidatos.find((candidato) => fs.existsSync(candidato)) || false;
}

function formatarDiagnostico(diagnostico) {
  const arquivo = diagnostico.file?.fileName || "";
  const posicao =
    diagnostico.file && diagnostico.start !== undefined
      ? diagnostico.file.getLineAndCharacterOfPosition(diagnostico.start)
      : null;

  const local = posicao
    ? `${path.relative(raiz, arquivo)}:${posicao.line + 1}:${posicao.character + 1}`
    : path.relative(raiz, arquivo);

  return `${local} TS${diagnostico.code} ${ts.flattenDiagnosticMessageText(
    diagnostico.messageText,
    " ",
  )}`;
}

const arquivos = listarArquivos(pastaSrc);
const erros = [];

// 1. Sintaxe JS/JSX/TS/TSX sem depender da resolução dos pacotes externos.
for (const arquivo of arquivos) {
  const codigo = fs.readFileSync(arquivo, "utf8");
  const ehJsx = /\.(jsx|tsx)$/.test(arquivo);

  const opcoes = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    allowJs: true,
    ...(ehJsx ? { jsx: ts.JsxEmit.ReactJSX } : {}),
  };

  const resultado = ts.transpileModule(codigo, {
    compilerOptions: opcoes,
    fileName: arquivo,
    reportDiagnostics: true,
  });

  for (const diagnostico of resultado.diagnostics || []) {
    if (diagnostico.category === ts.DiagnosticCategory.Error) {
      erros.push(formatarDiagnostico(diagnostico));
    }
  }
}

// 2. Nomes inexistentes/duplicados. Erros de módulos externos são ignorados aqui
// porque o build real continuará sendo a validação final de dependências.
const programa = ts.createProgram(arquivos, {
  allowJs: true,
  checkJs: true,
  noEmit: true,
  noResolve: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  strict: false,
});

const codigosEscopo = new Set([2304, 2552, 2451, 2393, 2448, 2454]);

for (const diagnostico of ts.getPreEmitDiagnostics(programa)) {
  if (codigosEscopo.has(diagnostico.code)) {
    erros.push(formatarDiagnostico(diagnostico));
  }
}

// 3. Imports locais quebrados, inclusive diferenças de caminho/case no Linux.
for (const arquivo of arquivos) {
  const codigo = fs.readFileSync(arquivo, "utf8");
  const scriptKind = /\.tsx?$/.test(arquivo)
    ? ts.ScriptKind.TSX
    : /\.jsx$/.test(arquivo)
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.JS;

  const sourceFile = ts.createSourceFile(
    arquivo,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  for (const declaracao of sourceFile.statements) {
    if (
      !(
        ts.isImportDeclaration(declaracao) ||
        ts.isExportDeclaration(declaracao)
      ) ||
      !declaracao.moduleSpecifier ||
      !ts.isStringLiteral(declaracao.moduleSpecifier)
    ) {
      continue;
    }

    const especificador = declaracao.moduleSpecifier.text;
    const resolvido = resolverImportLocal(especificador, arquivo);

    if (resolvido === false) {
      erros.push(
        `${path.relative(raiz, arquivo)}: import local não encontrado: ${especificador}`,
      );
    }
  }
}

const errosUnicos = [...new Set(erros)];

if (errosUnicos.length > 0) {
  console.error(`\nFalha na validação estática (${errosUnicos.length} problema(s)):\n`);
  for (const erro of errosUnicos) {
    console.error(`- ${erro}`);
  }
  process.exit(1);
}

console.log(
  `Validação estática concluída: ${arquivos.length} arquivos verificados sem erros de sintaxe, escopo ou imports locais.`,
);
