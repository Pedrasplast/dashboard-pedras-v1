import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "@/lib/navegacao";
import { supabase } from "@/lib/supabaseClient"; 
import './Cadastro.css';

function Cadastro() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Garante a limpeza forçada logo após a montagem do componente
    useEffect(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        setSuccessMsg('');
    }, []);

    const handleRegister = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            if (error.message.includes('User already registered')) {
                setErrorMsg('Este usuário (e-mail) já está cadastrado.');
            } else {
                setErrorMsg(error.message);
            }
        } else {
            setSuccessMsg('Cadastro realizado com sucesso! Você já pode fazer login.');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    }, [email, password, confirmPassword]);

    const irParaLogin = useCallback(() => {
        navigate('/');
    }, [navigate]);

    return (
        <div className="register-screen">
            <div className="register-card">
                <div className="register-header">
                    <div className="register-logo">📝</div>
                    <h2>Criar Nova Conta</h2>
                    <p>Cadastre-se para acessar o painel de consulta e produção</p>
                </div>

                {errorMsg && <div className="register-alert error">{errorMsg}</div>}
                {successMsg && <div className="register-alert success">{successMsg}</div>}

                {/* Adicionado autoComplete="off" no formulário e nos inputs */}
                <form onSubmit={handleRegister} className="register-form" autoComplete="off">
                    <div className="form-group">
                        <label>E-mail Corporativo</label>
                        <input 
                            type="email" 
                            placeholder="exemplo@empresa.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                            name="no-auto-email"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Senha</label>
                        <input 
                            type="password" 
                            placeholder="Mínimo 6 caracteres" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            name="no-auto-password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmar Senha</label>
                        <input 
                            type="password" 
                            placeholder="Digite a senha novamente" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            name="no-auto-confirm"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn-register" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Já possui uma conta?</p>
                    <button className="btn-back-login" onClick={irParaLogin}>
                        Voltar para o Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Cadastro;