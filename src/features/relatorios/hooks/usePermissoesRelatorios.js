import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { RELATORIOS } from "../config/Relatorio.config";

/** Permissões controlam a exibição. A proteção dos dados depende também de RLS. */
export function usePermissoesRelatorios() {
  const [carregadas, setCarregadas] = useState(false);
  const [idsPermitidos, setIdsPermitidos] = useState(() => new Set());
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregadas(false);
      setErro("");
      try {
        const { data: dadosUsuario, error: erroUsuario } = await supabase.auth.getUser();
        if (erroUsuario) throw erroUsuario;
        const usuario = dadosUsuario?.user;
        if (!usuario?.id) {
          if (ativo) setIdsPermitidos(new Set());
          return;
        }

        const { data: perfil, error: erroPerfil } = await supabase
          .from("perfis")
          .select("regra")
          .eq("id", usuario.id)
          .maybeSingle();
        if (erroPerfil) throw erroPerfil;

        // Mantém a regra atual: o administrador vê todas as entradas do catálogo.
        if (perfil?.regra === "admin") {
          if (ativo) setIdsPermitidos(new Set(RELATORIOS.map((item) => item.id)));
          return;
        }

        const [respostaRelatorios, respostaPermissoes] = await Promise.all([
          supabase.from("relatorios_sistema").select("id, chave, ativo").eq("ativo", true),
          supabase.from("usuario_relatorio_permissoes")
            .select("relatorio_id, permitido")
            .eq("usuario_id", usuario.id)
            .eq("permitido", true),
        ]);
        if (respostaRelatorios.error) throw respostaRelatorios.error;
        if (respostaPermissoes.error) throw respostaPermissoes.error;

        const ids = new Set(
          (respostaPermissoes.data || []).map((permissao) => String(permissao.relatorio_id))
        );
        const chaves = new Set(
          (respostaRelatorios.data || [])
            .filter((item) => ids.has(String(item.id)))
            .map((item) => String(item.chave || "").trim())
            .filter(Boolean)
        );
        if (ativo) {
          setIdsPermitidos(new Set(
            RELATORIOS.filter((item) => chaves.has(item.id)).map((item) => item.id)
          ));
        }
      } catch (error) {
        console.error("Erro ao carregar permissões dos relatórios:", error);
        if (ativo) {
          setIdsPermitidos(new Set());
          setErro(error?.message || "Não foi possível verificar as permissões dos relatórios.");
        }
      } finally {
        if (ativo) setCarregadas(true);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  const relatoriosDisponiveis = useMemo(
    () => RELATORIOS.filter((item) => idsPermitidos.has(item.id)),
    [idsPermitidos]
  );

  return { carregadas, idsPermitidos, erro, relatoriosDisponiveis };
}
