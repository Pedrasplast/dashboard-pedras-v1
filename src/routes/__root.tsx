import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuthContext } from "../lib/auth-context";
import { normalizarCamposMaiusculos } from "../lib/uppercase-fields";
import Navbar from "../components/layout/Navbar";

import "../styles/tokens.css";
import "../styles/animacoes.css";
import "../legacy-base.css";
import "../app-layout.css";
import "../styles/paginas-sistema.css";

/* =========================================================
   PAGINA NAO ENCONTRADA
========================================================= */

function NotFoundComponent() {
  return (
    <div className="pagina-sistema">
      <div className="pagina-sistema__conteudo">
        <h1 className="pagina-sistema__codigo">404</h1>

        <h2 className="pagina-sistema__titulo">Página não encontrada</h2>

        <p className="pagina-sistema__texto">A página que você procura não existe ou foi movida.</p>

        <div className="pagina-sistema__acoes">
          <Link to="/" className="pagina-sistema__botao">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ERRO GLOBAL
========================================================= */

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  // Memorizado: um Error novo a cada render faria o useEffect abaixo reportar o mesmo erro de novo.
  const erroNormalizado = useMemo(
    () =>
      error instanceof Error
        ? error
        : new Error(typeof error === "string" ? error : "Erro desconhecido"),
    [error],
  );

  useEffect(() => {
    console.error(error);

    reportLovableError(erroNormalizado, {
      boundary: "tanstack_root_error_component",
    });
  }, [error, erroNormalizado]);

  return (
    <div className="pagina-sistema">
      <div className="pagina-sistema__conteudo">
        <h1 className="pagina-sistema__titulo">Não foi possível carregar esta página</h1>

        <p className="pagina-sistema__texto">
          Algo deu errado. Tente novamente ou volte para o início.
        </p>

        <div className="pagina-sistema__acoes">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="pagina-sistema__botao"
          >
            Tentar novamente
          </button>

          <a href="/" className="pagina-sistema__botao pagina-sistema__botao--secundario">
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ROOT ROUTE
========================================================= */

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Painel de Produção Pedrasplast",
      },
      {
        name: "description",
        content: "Painel de produção Pedrasplast: eficiência das injetoras, paradas e relatórios.",
      },
      {
        name: "author",
        content: "Pedrasplast",
      },
      {
        property: "og:title",
        content: "Painel de Produção Pedrasplast",
      },
      {
        property: "og:description",
        content: "Eficiência das injetoras, paradas e relatórios de produção.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:site",
        content: "@Lovable",
      },
    ],

    links: [
      {
        rel: "icon",
        href: "/Logo_pedras.png",
        type: "image/x-icon",
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/* =========================================================
   HTML SHELL
========================================================= */

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}

        <Scripts />
      </body>
    </html>
  );
}

/* =========================================================
   LAYOUT PRINCIPAL
========================================================= */

function LayoutAplicacao() {
  const { user, isAdmin } = useAuthContext();

  return (
    <div className="app-layout" onChangeCapture={normalizarCamposMaiusculos}>
      <Navbar user={user} isAdmin={isAdmin} />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

/* =========================================================
   ROOT COMPONENT
========================================================= */

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const primeiroAcesso = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, "") === "/definir-senha",
  });

  return (
    <QueryClientProvider client={queryClient}>
      {primeiroAcesso ? (
        <main>
          <Outlet />
        </main>
      ) : (
        <AuthProvider>
          <LayoutAplicacao />
        </AuthProvider>
      )}
    </QueryClientProvider>
  );
}
