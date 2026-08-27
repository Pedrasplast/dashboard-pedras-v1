import React, { useEffect } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { useNavigate } from "@/lib/navegacao";

export const Route = createFileRoute("/cadastro")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Cadastro indisponível | Pedrasplast",
      },
      {
        name: "description",
        content:
          "O cadastro de usuários é realizado exclusivamente pelo administrador.",
      },
    ],
  }),

  component: CadastroDesativado,
});

function CadastroDesativado() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", {
      replace: true,
    });
  }, [navigate]);

  return null;
}
