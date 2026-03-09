import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Inscricao = () => {
    const { slug } = useParams(); // Pega 'madri-2026' da URL
    const [evento, setEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [formData, setFormData] = useState({ nome: '', cpf: '', email: '', whatsapp: '' });
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' }); // Tipo ajuda a definir a cor (sucesso/erro)

    // 1. Busca info do Evento ao carregar
    useEffect(() => {
        axios.get(`http://127.0.0.1:8000/api/evento/info/${slug}/`)
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

    // 2. Envia o Cadastro (O seu Rito)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensagem({ texto: '', tipo: '' }); // Limpa mensagens anteriores

        try {
            const payload = { ...formData, evento: evento.id };
            await axios.post(`http://127.0.0.1:8000/api/evento/inscrever/`, payload);
            
            setMensagem({ texto: "✅ Cadastro realizado com sucesso! Aguarde a aprovação no seu e-mail ou WhatsApp.", tipo: "sucesso" });
            setFormData({ nome: '', cpf: '', email: '', whatsapp: '' }); // Limpa o formulário
        } catch (err) {
            const erroBackend = err.response?.data?.error || "Verifique os dados informados.";
            setMensagem({ texto: `❌ Erro: ${erroBackend}`, tipo: "erro" });
        } finally {
            setEnviando(false); // Libera o botão novamente
        }
    };

    // Tela de Carregamento Inicial
    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>Carregando informações do evento...</div>;
    
    // Se não achou o evento
    if (!evento) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red', fontFamily: 'sans-serif' }}>{mensagem.texto}</div>;

    // Interface Principal
    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            
            {/* Cabeçalho do Evento */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                {evento.organizacao_logo && (
                    <img src={evento.organizacao_logo} alt={`Logo ${evento.organizacao_nome}`} style={{ maxWidth: '120px', marginBottom: '15px' }} />
                )}
                <h1 style={{ color: '#2c3e50', fontSize: '24px', marginBottom: '10px' }}>{evento.titulo}</h1>
                <p style={{ color: '#7f8c8d', fontSize: '15px', lineHeight: '1.6' }}>{evento.mensagem_boas_vindas}</p>
                
                {evento.link_edital && (
                    <a href={evento.link_edital} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '15px', color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>
                        📄 Ler Edital de Convocação
                    </a>
                )}
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

            {/* Controle de Status: Mostra Formulário ou Mensagem */}
            {evento.status_evento === 'inscricoes_abertas' ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ textAlign: 'center', color: '#34495e', marginBottom: '10px' }}>Solicitação de Credenciamento</h3>
                    
                    <input type="text" placeholder="Nome Completo" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccd1d1', fontSize: '15px' }} />
                    <input type="text" placeholder="CPF (Somente números)" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccd1d1', fontSize: '15px' }} />
                    <input type="email" placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccd1d1', fontSize: '15px' }} />
                    <input type="text" placeholder="WhatsApp (com DDD)" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccd1d1', fontSize: '15px' }} />
                    
                    <button type="submit" disabled={enviando} style={{ padding: '14px', backgroundColor: enviando ? '#95a5a6' : '#27ae60', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: enviando ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                        {enviando ? 'Enviando Dados...' : 'Enviar Solicitação de Cadastro'}
                    </button>
                </form>
            ) : (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    {evento.status_evento === 'configuracao' && <p style={{ color: '#e67e22', fontWeight: 'bold' }}>⏳ As inscrições para este evento ainda não começaram.</p>}
                    
                    {evento.status_evento === 'em_andamento' && (
                        <div>
                            <p style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '15px' }}>🟢 A assembleia já está em andamento!</p>
                            <button style={{ padding: '12px 20px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Acessar Urna Eletrônica
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mensagem de Retorno (Sucesso ou Erro) */}
            {mensagem.texto && (
                <div style={{ marginTop: '20px', padding: '15px', borderRadius: '6px', textAlign: 'center', backgroundColor: mensagem.tipo === 'sucesso' ? '#e8f8f5' : '#fdedec', color: mensagem.tipo === 'sucesso' ? '#117a65' : '#c0392b', fontWeight: 'bold' }}>
                    {mensagem.texto}
                </div>
            )}
        </div>
    );
};

export default Inscricao;