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

    // 🔗 URL DA SUA API NA AWS (A regra de ouro)
    const API_BASE_URL = "https://api.cliquevoto.com.br";

    // 1. Busca info do Evento ao carregar
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/evento/info/${slug}/`)
            .then(res => {
                setEvento(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao buscar evento:", err);
                setMensagem({ texto: "Evento não encontrado ou link expirado.", tipo: "erro" });
                setLoading(false);
            });
    }, [slug]);

    // 2. Envia o Cadastro
    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' }); // Limpa mensagens

        try {
            const payload = { ...formData, evento: evento.id };
            await axios.post(`${API_BASE_URL}/api/evento/inscrever/`, payload);
            
            setMensagem({ texto: "✅ Cadastro realizado com sucesso! Aguarde a aprovação no seu e-mail ou WhatsApp.", tipo: "sucesso" });
            setFormData({ nome: '', cpf: '', email: '', whatsapp: '' }); // Limpa o form
        } catch (err) {
            const erroBackend = err.response?.data?.error || "Verifique os dados informados.";
            setMensagem({ texto: `❌ Erro: ${erroBackend}`, tipo: "erro" });
        } finally {
            setEnviando(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- TELAS DE ESTADO ---

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif', color: '#666' }}>Carregando informações do evento...</div>;
    }
    
    if (!evento) {
        return (
            <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
                <h2 style={{ color: '#d32f2f' }}>Evento indisponível</h2>
                <p>{mensagem.texto}</p>
            </div>
        );
    }

    // --- TELA PRINCIPAL (O FORMULÁRIO BONITO) ---
    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#f3f4f6', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '20px',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px 30px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                width: '100%',
                maxWidth: '450px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    {evento.organizacao_logo && (
                        <img 
                            src={evento.organizacao_logo} 
                            alt={evento.organizacao_nome} 
                            style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '15px' }}
                        />
                    )}
                    <h2 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '24px' }}>{evento.titulo}</h2>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>{evento.organizacao_nome}</p>
                </div>

                {mensagem.texto && (
                    <div style={{ 
                        padding: '12px', 
                        marginBottom: '20px', 
                        borderRadius: '6px',
                        backgroundColor: mensagem.tipo === 'erro' ? '#fee2e2' : '#d1fae5',
                        color: mensagem.tipo === 'erro' ? '#991b1b' : '#065f46',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {mensagem.texto}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>Nome Completo</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} required 
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>CPF</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} required 
                            placeholder="Apenas números"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required 
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>WhatsApp</label>
                        <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required 
                            placeholder="(DDD) 99999-9999"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', fontSize: '15px' }} />
                    </div>
                    
                    <button type="submit" disabled={enviando} style={{ 
                        width: '100%',
                        padding: '12px', 
                        backgroundColor: enviando ? '#9ca3af' : '#2563eb', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: enviando ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginTop: '10px',
                        transition: 'background-color 0.2s'
                    }}>
                        {enviando ? 'Enviando Cadastro...' : 'Solicitar Inscrição'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Inscricao;