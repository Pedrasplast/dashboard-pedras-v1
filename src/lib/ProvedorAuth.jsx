import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const ContextoAuth = createContext({
  usuario: null,
  perfil: null,
  ehAdmin: false,
  carregandoAuth: true,
  carregandoPerfil: true,
});

/*
 * Provedor único de sessão e perfil.
 *
 * Antes cada tela abria sua própria assinatura de auth e
 * consulta de perfil. Aqui existe um listener e uma consulta
 * por sessão, compartilhados por toda a árvore.
 */
export function ProvedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo) return;
      setUsuario(session?.user ?? null);
      setCarregandoAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
      setCarregandoAuth(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  const idUsuario = usuario?.id ?? null;

  useEffect(() => {
    let ativo = true;

    if (!idUsuario) {
      setPerfil(null);
      setCarregandoPerfil(false);
      return () => {
        ativo = false;
      };
    }

    setCarregandoPerfil(true);

    supabase
      .from("perfis")
      .select("regra")
      .eq("id", idUsuario)
      .single()
      .then(({ data, error }) => {
        if (!ativo) return;

        if (error) {
          console.error("Erro ao carregar perfil:", error);
          setPerfil(null);
        } else {
          setPerfil(data);
        }

        setCarregandoPerfil(false);
      });

    return () => {
      ativo = false;
    };
  }, [idUsuario]);

  const valor = useMemo(
    () => ({
      usuario,
      perfil,
      ehAdmin: perfil?.regra === "admin",
      carregandoAuth,
      carregandoPerfil,
    }),
    [usuario, perfil, carregandoAuth, carregandoPerfil],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export function useContextoAuth() {
  return useContext(ContextoAuth);
}
