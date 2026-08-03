import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "@/lib/navegacao";
import { supabase } from "@/lib/supabaseClient";
import './Login.css'; // Certifique-se de criar este arquivo CSS para estilos específicos do login

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Limpa o campo de senha sempre que a tela de login é aberta/montada
  useEffect(() => {
    setSenha('');
  }, []);

  // Função auxiliar para traduzir erros comuns do Supabase para o português
  const traduzirErroSupabase = (mensagemOriginal) => {
    const msg = mensagemOriginal.toLowerCase();
    
    if (msg.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('email not confirmed')) {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    }
    if (msg.includes('user not found')) {
      return 'Usuário não encontrado.';
    }
    if (msg.includes('too many requests')) {
      return 'Muitas tentativas de login. Tente novamente mais tarde.';
    }
    
    // Fallback caso seja um erro desconhecido
    return 'Ocorreu um erro ao entrar. Verifique seus dados.';
  };

  // Otimizado com useCallback para evitar recriação a cada render
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem(traduzirErroSupabase(error.message));
      setSenha(''); // Limpa a senha também caso ocorra erro de credencial
    } else {
      navigate('/');
    }
    setCarregando(false);
  }, [email, senha, navigate]);

  // Handlers de navegação otimizados
  const handleVoltar = useCallback(() => navigate('/'), [navigate]);
  const handleCadastro = useCallback(() => navigate('/cadastro'), [navigate]);

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white' }}>
      
      {/* Botão Voltar Profissional */}
      <button className="back-home-btn" onClick={handleVoltar} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontWeight: '500' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Voltar ao Início</span>
      </button>

      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>Acessar o Sistema</h2>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>E-mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={carregando}
          style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', opacity: carregando ? 0.7 : 1 }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      {mensagem && <p style={{ marginTop: '15px', color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{mensagem}</p>}
      
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
        Não tem conta?{' '}
        <span 
          onClick={handleCadastro} 
          style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
        >
          Cadastre-se
        </span>
      </p>
    </div>
  );
}

export default Login;