import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "./supabaseClient";

const ContextoAuth = createContext({
  user: null,
  perfil: null,
  isAdmin: false,
  loadingAuth: true,
  loadingPerfil: true,
});

/*
 * Provedor único de sessão e perfil.
 *
 * Antes cada tela abria sua própria assinatura de auth e
 * consulta de perfil. Aqui existe um listener e uma consulta
 * por sessão, compartilhados por toda a árvore.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo) return;
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id ?? null;

  useEffect(() => {
    let ativo = true;

    if (!userId) {
      setPerfil(null);
      setLoadingPerfil(false);
      return () => {
        ativo = false;
      };
    }

    setLoadingPerfil(true);

    supabase
      .from("perfis")
      .select("regra")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (!ativo) return;

        if (error) {
          console.error("Erro ao carregar perfil:", error);
          setPerfil(null);
        } else {
          setPerfil(data);
        }

        setLoadingPerfil(false);
      });

    return () => {
      ativo = false;
    };
  }, [userId]);

  const valor = useMemo(
    () => ({
      user,
      perfil,
      isAdmin: perfil?.regra === "admin",
      loadingAuth,
      loadingPerfil,
    }),
    [user, perfil, loadingAuth, loadingPerfil],
  );

  return (
    <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
  );
}

export function useAuthContext() {
  return useContext(ContextoAuth);
}
