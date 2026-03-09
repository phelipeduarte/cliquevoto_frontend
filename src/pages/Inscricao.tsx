import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Inscricao = () => {
    const { slug } = useParams(); // Pega 'madri-2026' da URL
    const [evento, setEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [formData, setFormData] = useState({ nome: '', cpf: '', email: '', whatsapp: '' });
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

    // 🔗 URL DA SUA API NA AWS (Usando HTTPS para o celular não bloquear)
    const API_BASE_URL = "https://api.cliquevoto.com.br";

    // 1. Busca info do Evento ao carregar
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/evento/info/${slug}/`)
            .then(res => {
                setEvento(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro completo:", err);
                // A MÁGICA 1: Pega o erro real da rede ou do servidor e joga na tela
                const erroCausa = err.response ? `Status ${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message;
                setMensagem({ texto: `🚨 ERRO DE CONEXÃO: ${erroCausa}`, tipo: "erro" });
                setLoading(false);
            });
    }, [slug]);

    // 2. Envia o Cadastro
    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' }); // Limpa mensagens anteriores

        try {
            const payload = { ...formData, evento: evento.id };
            await axios.post(`${API_BASE_URL}/api/evento/inscrever/`, payload);
            
            setMensagem({ texto: "✅ Cadastro realizado com sucesso! Aguarde a aprovação.", tipo: "sucesso" });
            setFormData({ nome: '', cpf: '', email: '', whatsapp: '' }); // Limpa o formulário
        } catch (err) {
            // A MÁGICA 2: Mostra exatamente por que falhou ao salvar
            const erroBackend = err.response?.data?.error || err.message;
            setMensagem({ texto: `❌ FALHA AO SALVAR: ${erroBackend}`, tipo: "erro" });
        } finally {
            setEnviando(false);
        }
    };

    // Atualiza os dados do formulário
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Tela de Carregamento Inicial
    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>Carregando informações do evento...</div>;
    
    // Se não achou o evento e deu erro na busca inicial
    if (!evento) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', padding: '20px' }}>
                <h2 style={{ color: 'red' }}>Ops, algo deu errado!</h2>
                <p style={{ fontWeight: 'bold' }}>{mensagem.texto}</p>
                <p>Tire um print desta tela e envie para o suporte.</p>
            </div>
        );
    }

    // O Formulário Principal
    return (
        <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>{evento.titulo}</h2>
            <p style={{ textAlign: 'center', color: '#555', marginBottom: '20px' }}>{evento.organizacao_nome}</p>

            {mensagem.texto && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '15px', 
                    borderRadius: '5px',
                    backgroundColor: mensagem.tipo === 'erro' ? '#ffebee' : '#e8f5e9',
                    color: mensagem.tipo === 'erro' ? '#c62828' : '#2e7d32',
                    border: `1px solid ${mensagem.tipo === 'erro' ? '#ef9a9a' : '#a5d6a7'}`
                }}>
                    {mensagem.texto}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nome Completo:</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>CPF:</label>
                    <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>E-mail:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>WhatsApp:</label>
                    <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                </div>
                
                <button type="submit" disabled={enviando} style={{ 
                    padding: '12px', 
                    backgroundColor: enviando ? '#ccc' : '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: enviando ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    marginTop: '10px'
                }}>
                    {enviando ? 'Enviando...' : 'Inscreva-se'}
                </button>
            </form>
        </div>
    );
};

export default Inscricao;