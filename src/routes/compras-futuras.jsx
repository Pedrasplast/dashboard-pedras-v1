import {
  useEffect,
  useState,
} from "react";

import {
  createFileRoute,
} from "@tanstack/react-router";

import RotaProtegida
  from "@/components/layout/RotaProtegida";

import ComprasMateriaPrimaPage
  from "@/features/compras-materia-prima/ComprasMateriaPrimaPage";

import {
  supabase,
} from "@/lib/supabaseClient";


export const Route =
  createFileRoute(
    "/compras-futuras",
  )({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Compras Futuras | Pedrasplast",
        },
        {
          name:
            "description",

          content:
            "Controle das compras futuras de matéria-prima da Pedrasplast.",
        },
      ],
    }),

    component:
      ComprasFuturasRoute,
  });


function ComprasFuturasRoute() {
  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);


  useEffect(() => {
    let ativo = true;


    async function verificarAdministrador() {
      try {
        const {
          data:
            dadosUsuario,

          error:
            erroUsuario,
        } =
          await supabase
            .auth
            .getUser();


        if (erroUsuario) {
          throw erroUsuario;
        }


        const usuario =
          dadosUsuario
            ?.user;


        if (!usuario?.id) {
          if (ativo) {
            setIsAdmin(
              false,
            );
          }

          return;
        }


        const {
          data:
            perfil,

          error:
            erroPerfil,
        } =
          await supabase
            .from(
              "perfis",
            )
            .select(
              "regra",
            )
            .eq(
              "id",
              usuario.id,
            )
            .maybeSingle();


        if (erroPerfil) {
          throw erroPerfil;
        }


        if (ativo) {
          setIsAdmin(
            perfil?.regra ===
              "admin",
          );
        }
      } catch (error) {
        console.error(
          "Erro ao verificar perfil administrativo:",
          error,
        );


        if (ativo) {
          setIsAdmin(
            false,
          );
        }
      }
    }


    void verificarAdministrador();


    return () => {
      ativo = false;
    };
  }, []);


  return (
    <RotaProtegida
      permissao="compras"
    >

      <ComprasMateriaPrimaPage
        secao="compras-futuras"
        isAdmin={
          isAdmin
        }
      />

    </RotaProtegida>
  );
}