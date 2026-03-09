import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { User, CheckCircle2, ChevronRight, Loader2, AlertTriangle, Check, MonitorPlay, LogOut, RefreshCw, BarChart3, ListChecks, FileText, Lock, PlayCircle } from 'lucide-react';
import axios from 'axios';

// Importe a página de inscrição
import Inscricao from './pages/Inscricao';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// 1. COMPONENTE DA URNA 
// ==========================================
function PainelVotacao() {
  const navigate = useNavigate(); 
  
  // ADICIONANDO AS TIPAGENS DO TYPESCRIPT (<any>, <string>, etc)
  const [etapa, setEtapa] = useState<number>(1);
  const [cpf, setCpf] = useState<string>('');
  const [eleicao, setEleicao] = useState<any>(null); // <any> desativa o alerta chato
  
  const [enquetes, setEnquetes] = useState<any[]>([]);
  const [votosSelecionados, setVotosSelecionados] = useState<Record<number, number>>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');
  
  const [aba, setAba] = useState<'votacao' | 'resultados'>('votacao');
  const [resultados, setResultados] = useState<any>(null);
  const [carregandoResultados, setCarregandoResultados] = useState<boolean>(false);

  useEffect(() => {
    const carregarUrna = async () => {
      try {
        const res = await axios.get(`${API_URL}/eleicoes/ativas`);
        if (res.data.length > 0) {
          const ativa = res.data[0];
          setEleicao(ativa);
          
          const resEnquetes = await axios.get(`${API_URL}/eleicoes/${ativa.id}/enquetes`);
          setEnquetes(resEnquetes.data);
        } else {
          setErro("Nenhuma assembleia ativa no momento.");
        }
      } catch (err) {
        setErro("Não foi possível conectar ao servidor. Verifique sua internet.");
      } finally {
        setLoading(false);
      }
    };
    carregarUrna();

    const interval = setInterval(carregarUrna, 10000);
    return () => clearInterval(interval);
  }, []);

  const carregarResultados = async (silencioso = false) => {
    if (!eleicao) return;
    if (!silencioso) setCarregandoResultados(true);
    try {
      const res = await axios.get(`${API_URL}/eleicoes/${eleicao.id}/resultados`);
      setResultados(res.data);
    } catch (err) {
      console.error("Erro ao carregar resultados", err);
    } finally {
      if (!silencioso) setCarregandoResultados(false);
    }
  };

  useEffect(() => {
    let relogio: any;
    if (aba === 'resultados' && eleicao) {
      carregarResultados();
      relogio = setInterval(() => carregarResultados(true), 5000);
    }
    return () => { if (relogio) clearInterval(relogio); };
  }, [aba, eleicao]);

  const handleAcessarPainel = () => {
    if (eleicao?.status_evento === 'configuracao') {
      alert(`⚠️ A Assembleia "${eleicao.titulo}" ainda não começou!`);
      return;
    }
    setEtapa(2);
  };

  const handleSelecionarOpcao = (enqueteId: number, opcaoId: number, status: string) => {
    if (status !== 'em_votacao') return;
    setVotosSelecionados(prev => ({ ...prev, [enqueteId]: opcaoId }));
  };

  const pautasEmVotacao = enquetes.filter(e => e.status === 'em_votacao');
  const todasPautasRespondidas = pautasEmVotacao.length > 0 && pautasEmVotacao.every(e => votosSelecionados[e.id]);

  const handleIrParaConfirmacao = () => { if (todasPautasRespondidas) setEtapa(2.5); };
  const handleCorrigirVoto = () => setEtapa(2);

  const handleConfirmarVotoFinal = async () => {
    setLoading(true);
    try {
      const payloadVotos = Object.entries(votosSelecionados).map(([enqueteId, opcaoId]) => ({
        enquete_id: Number(enqueteId),
        opcao_id: Number(opcaoId)
      }));

      await axios.post(`${API_URL}/votar`, {
        evento_id: eleicao.id,
        cpf_eleitor: cpf,
        votos: payloadVotos
      });
      
      setEtapa(3);
    } catch (err: any) {
      alert(err.response?.data?.erro || "Erro ao registrar os votos.");
      setEtapa(1); 
      setCpf('');
      setVotosSelecionados({});
    } finally {
      setLoading(false);
    }
  };

  const resumoVotos = enquetes.filter(e => votosSelecionados[e.id]).map(enquete => {
    const opcaoEscolhidaId = votosSelecionados[enquete.id];
    const opcaoDetalhes = enquete.opcoes.find((o: any) => o.id === opcaoEscolhidaId);
    return { pauta: enquete.titulo, escolha: opcaoDetalhes };
  });

  if (loading && etapa === 1) return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  );

  if (erro) return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-xl text-center border-t-4 border-red-500 max-w-md w-full">
        <AlertTriangle className="mx-auto text-red-500 mb-4 w-12 h-12" />
        <p className="font-bold text-slate-200">{erro}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-emerald-500 font-bold hover:underline">Tentar novamente</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-200 flex flex-col font-sans relative">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm z-50 shrink-0 sticky top-0">
        <div className="flex items-center">
          {etapa > 1 && (
            eleicao?.logo_url ? (
              <img src={eleicao.logo_url} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="h-10 px-4 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600 border-dashed">
                <span className="font-bold text-slate-400 text-sm tracking-widest">LOGO</span>
              </div>
            )
          )}
        </div>
        {etapa > 1 && etapa < 3 && aba === 'votacao' && (
          <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-full border border-slate-600">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">CPF: {cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>
            <button onClick={() => { setEtapa(1); setCpf(''); setVotosSelecionados({}); setAba('votacao'); }} className="ml-2 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className={`flex-1 p-4 md:p-6 flex flex-col relative ${etapa === 1 ? 'items-center justify-center' : 'lg:flex-row gap-6'}`}>
        
        {etapa !== 1 && (
          <div className="w-full lg:flex-[2] flex flex-col items-center justify-start aspect-video lg:h-full shrink-0">
            <section className="w-full h-full bg-black rounded-2xl border border-slate-700 flex flex-col items-center justify-center overflow-hidden shadow-2xl relative group">
              <MonitorPlay className="w-16 h-16 text-slate-800 mb-4 absolute z-0" />
              <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 backdrop-blur-sm">
                 <p className="text-slate-300 font-medium text-lg tracking-wide bg-black/50 px-4 py-2 rounded-lg mb-2">Transmissão da Assembleia</p>
                 <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded animate-pulse">AO VIVO</span>
              </div>
            </section>
          </div>
        )}

        <div className={`w-full flex flex-col justify-start min-h-0 ${etapa === 1 ? 'max-w-md items-center' : 'lg:flex-[1] items-center lg:items-start lg:h-full'}`}>
          <section className="w-full bg-slate-800 rounded-2xl border border-slate-700 flex flex-col shadow-2xl flex-1 relative overflow-hidden">
            
            <div className="p-6 flex-1 flex flex-col">
              {aba === 'votacao' && (
                <>
                  {etapa === 1 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-500">
                      <div className="text-center mb-2">
                        {eleicao?.logo_url && <img src={eleicao.logo_url} alt="Logo" className="h-24 mx-auto object-contain mb-6 drop-shadow-xl" />}
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{eleicao?.titulo || "Assembleia Virtual"}</h2>
                        <p className="text-slate-400 font-medium text-lg">{eleicao?.organizacao_nome}</p>
                      </div>

                      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 mb-2 shadow-inner">
                        <p className="text-slate-300 text-sm leading-relaxed text-center italic">
                          "{eleicao?.mensagem_boas_vindas || "Seja bem-vindo ao portal de votação."}"
                        </p>
                      </div>

                      {eleicao?.status_evento === 'inscricoes_abertas' ? (
                        <div className="space-y-4 border-t border-slate-700/50 pt-6">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center">
                                {/* O CAMPO DINÂMICO QUE INTEGRAMOS! */}
                                <p className="text-amber-400 font-medium text-sm">
                                  {eleicao?.mensagem_credenciamento || "As inscrições para esta assembleia estão abertas."}
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate(`/inscricao/${eleicao.slug_convocacao}`)}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-500 transition-colors flex justify-center items-center"
                            >
                                INSCREVA-SE <ChevronRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                      ) : eleicao?.status_evento === 'configuracao' ? (
                        <div className="space-y-4 border-t border-slate-700/50 pt-6 text-center">
                            <p className="text-slate-400 font-medium">As inscrições e o acesso ainda não foram liberados.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 border-t border-slate-700/50 pt-6">
                            <label className="text-slate-400 text-sm font-medium text-center block mb-3">Digite seu CPF aprovado para acessar a urna</label>
                            <input 
                            type="text" 
                            placeholder="Somente números"
                            value={cpf}
                            onChange={e => setCpf(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-600 text-center text-xl font-mono text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                            maxLength={11}
                            />
                            <button 
                                onClick={handleAcessarPainel} 
                                disabled={cpf.length < 11}
                                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex justify-center items-center hover:bg-emerald-500 transition-colors mt-4"
                            >
                                ACESSAR PAINEL <ChevronRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                      )}
                    </div>
                  )}

                  {etapa === 2 && (<div className="text-center text-slate-400 py-10">Pautas da Assembleia (Código preservado)</div>)}
                  {etapa === 2.5 && (<div className="text-center text-slate-400 py-10">Revisão (Código preservado)</div>)}
                  {etapa === 3 && (<div className="text-center text-slate-400 py-10">Sucesso (Código preservado)</div>)}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 2. O MAESTRO (O Roteador Principal)
// ==========================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PainelVotacao />} />
        <Route path="/inscricao/:slug" element={<Inscricao />} />
      </Routes>
    </BrowserRouter>
  );
}