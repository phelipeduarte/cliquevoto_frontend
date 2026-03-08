import { useState, useEffect } from 'react';
import { User, CheckCircle2, ChevronRight, Loader2, AlertTriangle, Check, MonitorPlay, LogOut, RefreshCw, BarChart3, ListChecks, FileText, Lock, PlayCircle } from 'lucide-react';
import axios from 'axios';

// API Apontando para o seu Django Local
const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [etapa, setEtapa] = useState(1);
  const [cpf, setCpf] = useState('');
  const [eleicao, setEleicao] = useState<any>(null);
  
  const [enquetes, setEnquetes] = useState<any[]>([]);
  const [votosSelecionados, setVotosSelecionados] = useState<Record<number, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  const [aba, setAba] = useState<'votacao' | 'resultados'>('votacao');
  const [resultados, setResultados] = useState<any>(null);
  const [carregandoResultados, setCarregandoResultados] = useState(false);

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

    // Polling rápido para atualizar os status das pautas em tempo real
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
      relogio = setInterval(() => {
        carregarResultados(true);
      }, 5000);
    }
    return () => {
      if (relogio) clearInterval(relogio);
    };
  }, [aba, eleicao]);

  const handleAcessarPainel = () => {
    if (eleicao?.status === 'aguardando' || eleicao?.aberta === false) {
      alert(`⚠️ A Assembleia "${eleicao.titulo}" ainda não começou!\n\nAguarde o horário oficial de início para registrar sua presença e acessar a urna.`);
      return;
    }
    setEtapa(2);
  };

  const handleSelecionarOpcao = (enqueteId: number, opcaoId: number, status: string) => {
    // Trava de segurança: só permite clicar se a pauta estiver rolando
    if (status !== 'em_votacao') return;
    setVotosSelecionados(prev => ({ ...prev, [enqueteId]: opcaoId }));
  };

  // LÓGICA ATUALIZADA: Só exige voto nas pautas que estão 'em_votacao'
  const pautasEmVotacao = enquetes.filter(e => e.status === 'em_votacao');
  //const pautasAguardando = enquetes.filter(e => e.status === 'aguardando');
  
  const todasPautasRespondidas = pautasEmVotacao.length > 0 && pautasEmVotacao.every(e => votosSelecionados[e.id]);

  const handleIrParaConfirmacao = () => {
    if (todasPautasRespondidas) {
      setEtapa(2.5);
    }
  };

  const handleCorrigirVoto = () => {
    setEtapa(2);
  };

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
    return {
      pauta: enquete.titulo,
      escolha: opcaoDetalhes
    };
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
              <img src={eleicao.logo_url} alt="Logo do Cliente" className="h-10 object-contain" />
            ) : (
              <div className="h-10 px-4 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600 border-dashed">
                <span className="font-bold text-slate-400 text-sm tracking-widest">LOGO DO CLIENTE</span>
              </div>
            )
          )}
        </div>

        {etapa > 1 && etapa < 3 && aba === 'votacao' && (
          <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-full border border-slate-600">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">CPF: {cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>
            <button 
              onClick={() => { setEtapa(1); setCpf(''); setVotosSelecionados({}); setAba('votacao'); }} 
              title="Sair" 
              className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
            >
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
          <section className="w-full bg-slate-800 rounded-2xl border border-slate-700 flex flex-col shadow-2xl flex-1 relative">
            
            {etapa !== 1 && (
              <div className="flex border-b border-slate-700 bg-slate-800/80 shrink-0 rounded-t-2xl overflow-hidden">
                <button 
                  onClick={() => setAba('votacao')}
                  className={`flex-1 lg:flex-none px-6 py-4 font-bold text-sm tracking-wide transition-colors ${aba === 'votacao' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'}`}
                >
                  PAUTAS
                </button>
                <button 
                  onClick={() => setAba('resultados')}
                  className={`flex-1 lg:flex-none px-6 py-4 font-bold text-sm tracking-wide transition-colors flex items-center justify-center lg:justify-start gap-2 ${aba === 'resultados' ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'}`}
                >
                  <BarChart3 className="w-4 h-4" /> APURAÇÃO
                </button>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              
              {aba === 'votacao' && (
                <>
                  {etapa !== 1 && etapa !== 3 && (
                    <div className="flex justify-between items-start mb-6 shrink-0">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1 leading-tight">{eleicao?.titulo || "Carregando..."}</h2>
                        <p className="text-sm text-slate-400">{eleicao?.organizacao_nome}</p>
                      </div>
                    </div>
                  )}

                  {etapa === 1 && (
                    <div className="space-y-6 flex-1 flex flex-col justify-center animate-in zoom-in-95 duration-500">
                      <div className="text-center mb-2">
                        {eleicao?.logo_url && (
                          <img src={eleicao.logo_url} alt="Logo" className="h-24 mx-auto object-contain mb-6 drop-shadow-xl" />
                        )}
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{eleicao?.titulo || "Assembleia Virtual"}</h2>
                        <p className="text-slate-400 font-medium text-lg">{eleicao?.organizacao_nome}</p>
                      </div>

                      {/* NOVO: Caixa de Boas-Vindas e Termos */}
                      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 mb-2 shadow-inner">
                        <p className="text-slate-300 text-sm leading-relaxed text-center italic">
                          "{eleicao?.mensagem_boas_vindas || "Seja bem-vindo ao portal de votação."}"
                        </p>
                        {eleicao?.link_termos && (
                          <div className="mt-4 text-center">
                            <a href={eleicao.link_termos} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold hover:text-emerald-300 transition-colors bg-emerald-400/10 px-3 py-1.5 rounded-full">
                              <FileText className="w-3 h-3" /> VER EDITAL DA ASSEMBLEIA
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-slate-700/50 pt-6">
                        <label className="text-slate-400 text-sm font-medium text-center block mb-3">Digite seu CPF para credenciamento</label>
                        <input 
                          type="text" 
                          placeholder="Somente números"
                          value={cpf}
                          onChange={e => setCpf(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-600 text-center text-xl font-mono text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                          maxLength={11}
                        />
                      </div>
                      
                      <button 
                        onClick={handleAcessarPainel} 
                        disabled={cpf.length < 11}
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex justify-center items-center hover:bg-emerald-500 transition-colors"
                      >
                        ACESSAR PAINEL <ChevronRight className="w-5 h-5 ml-2" />
                      </button>
                    </div>
                  )}

                  {etapa === 2 && (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                      
                      <div className="space-y-6 flex-1 pb-4">
                        {enquetes.length === 0 ? (
                           <div className="text-center text-slate-500 py-10">Nenhuma pauta cadastrada.</div>
                        ) : (
                          enquetes.map((enquete, index) => {
                            const isAguardando = enquete.status === 'aguardando';
                            const isEncerrada = enquete.status === 'encerrada';
                            const isAtiva = enquete.status === 'em_votacao';

                            return (
                              <div key={enquete.id} className={`bg-slate-800/50 border rounded-2xl p-5 shadow-sm transition-all duration-300 ${isAguardando ? 'border-amber-500/30 opacity-70 grayscale-[30%]' : isEncerrada ? 'border-red-500/30 opacity-50 grayscale' : 'border-slate-700'}`}>
                                
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Pauta {index + 1}</span>
                                    {isAguardando && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><Lock className="w-3 h-3" /> AGUARDANDO</span>}
                                    {isAtiva && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded animate-pulse"><PlayCircle className="w-3 h-3" /> EM VOTAÇÃO</span>}
                                    {isEncerrada && <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">ENCERRADA</span>}
                                  </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-4 leading-snug">{enquete.titulo}</h3>
                                
                                <div className="space-y-3 relative">
                                  {isAguardando && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] rounded-xl cursor-not-allowed">
                                    </div>
                                  )}
                                  
                                  {enquete.opcoes.map((opcao: any) => {
                                    const isSelecionado = votosSelecionados[enquete.id] === opcao.id;
                                    return (
                                      <button 
                                        key={opcao.id}
                                        onClick={() => handleSelecionarOpcao(enquete.id, opcao.id, enquete.status)}
                                        disabled={!isAtiva}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                          isSelecionado 
                                            ? 'border-emerald-500 bg-slate-700/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]' 
                                            : 'border-slate-600 bg-slate-900/50 hover:bg-slate-700/60 disabled:hover:bg-slate-900/50'
                                        }`}
                                      >
                                        <div className="flex items-center text-left">
                                          {eleicao?.mostrar_fotos && opcao.foto_url && (
                                            <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden mr-4 shrink-0">
                                              <img src={opcao.foto_url} alt={opcao.nome} className="w-full h-full object-cover" />
                                            </div>
                                          )}
                                          <div>
                                            <span className={`font-bold block ${isSelecionado ? 'text-emerald-400' : 'text-slate-200'}`}>{opcao.nome}</span>
                                            {opcao.numero && <span className="text-xs text-slate-400 font-mono">Nº {opcao.numero}</span>}
                                          </div>
                                        </div>
                                        
                                        {isSelecionado && (
                                          <div className="text-emerald-400 bg-emerald-400/10 p-1 rounded-full shrink-0 ml-2">
                                            <Check className="w-4 h-4 font-bold" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 z-50 rounded-b-2xl mt-2 shadow-top">
                        <div className="flex justify-between items-center mb-3 text-sm font-medium">
                          {pautasEmVotacao.length === 0 ? (
                            <span className="text-amber-400 w-full text-center text-xs">Aguarde a liberação das pautas pelo administrador.</span>
                          ) : (
                            <>
                              <span className="text-slate-400">Pautas Ativas:</span>
                              <span className={todasPautasRespondidas ? "text-emerald-400 font-bold" : "text-amber-400"}>
                                {Object.keys(votosSelecionados).length} de {pautasEmVotacao.length} respondidas
                              </span>
                            </>
                          )}
                        </div>
                        <button 
                          onClick={handleIrParaConfirmacao}
                          disabled={!todasPautasRespondidas || pautasEmVotacao.length === 0}
                          className={`w-full py-4 rounded-xl font-bold flex justify-center items-center transition-all duration-300 ${
                            (!todasPautasRespondidas || pautasEmVotacao.length === 0)
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/50'
                          }`}
                        >
                          REVISAR VOTOS <ChevronRight className="w-5 h-5 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {etapa === 2.5 && (
                    <div className="flex-1 flex flex-col py-2 animate-in slide-in-from-right-4 duration-300">
                      <div className="text-center mb-6">
                        <ListChecks className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-white">Revisão Final</h3>
                        <p className="text-slate-400 text-sm">Confirme suas escolhas antes de assinar digitalmente</p>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto mb-4 custom-scrollbar">
                        {resumoVotos.map((resumo, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                            <div className="pr-4">
                               <p className="text-sm font-medium text-slate-300 leading-snug">{resumo.pauta}</p>
                            </div>
                            <div className="text-right shrink-0">
                               <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-sm font-bold block">
                                  {resumo.escolha?.nome}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4 shrink-0 mt-auto pt-4 border-t border-slate-700">
                        <button 
                          onClick={handleCorrigirVoto}
                          disabled={loading}
                          className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                          CORRIGIR
                        </button>
                        <button 
                          onClick={handleConfirmarVotoFinal}
                          disabled={loading}
                          className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "CONFIRMAR E ENVIAR"}
                        </button>
                      </div>
                    </div>
                  )}

                  {etapa === 3 && (
                    <div className="text-center py-10 flex-1 flex flex-col justify-center animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
                      <h2 className="text-3xl font-bold text-white mb-2">Votos Computados!</h2>
                      <p className="text-slate-400">Obrigado pela sua participação nesta assembleia.</p>
                      <div className="mt-8 p-4 bg-slate-800 rounded-xl border border-slate-700">
                         <p className="text-sm text-slate-500">Seus votos foram registrados no sistema sob o CPF com final {cpf.slice(-2)}.</p>
                      </div>
                      <button 
                        onClick={() => { setEtapa(1); setCpf(''); setVotosSelecionados({}); setAba('votacao'); }} 
                        className="mt-8 px-6 py-4 bg-slate-700 font-bold text-emerald-400 rounded-xl hover:bg-slate-600 transition-colors w-full"
                      >
                        Sair da Urna
                      </button>
                    </div>
                  )}
                </>
              )}

              {aba === 'resultados' && (
                <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                      <h2 className="text-xl font-bold text-white leading-tight">Apuração Oficial</h2>
                      <p className="text-sm text-slate-400 hidden sm:block">Resultados por pauta da assembleia</p>
                    </div>
                    <button 
                      onClick={() => carregarResultados(false)} 
                      className="p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 border border-slate-600 text-emerald-400 transition-all shadow-sm"
                      title="Atualizar Apuração Manualmente"
                    >
                      <RefreshCw className={`w-5 h-5 ${carregandoResultados ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-8 flex-1 pb-4">
                    {carregandoResultados && !resultados ? (
                      <div className="flex justify-center items-center h-full min-h-[200px]">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      </div>
                    ) : (
                      resultados?.resultados_por_enquete?.map((enqueteResultado: any) => (
                        <div key={enqueteResultado.enquete_id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm">
                           <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
                              <h3 className="font-bold text-white text-lg">{enqueteResultado.titulo}</h3>
                              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">Total: {enqueteResultado.total_votos} votos</span>
                           </div>

                           <div className="space-y-3">
                            {enqueteResultado.ranking.map((c: any, index: number) => (
                              <div key={index} className="bg-slate-900/50 p-3 rounded-xl border border-slate-600/50 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-2 relative z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200">{c.nome}</span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-bold text-emerald-400 block">{c.porcentagem}%</span>
                                  </div>
                                </div>
                                
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner relative z-10">
                                  <div 
                                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${c.porcentagem}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                           </div>
                        </div>
                      ))
                    )}
                    
                    {!carregandoResultados && (!resultados?.resultados_por_enquete || resultados?.resultados_por_enquete.length === 0) && (
                      <div className="text-center text-slate-500 py-10">
                        Nenhum voto computado ainda.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>
        </div>

      </main>
    </div>
  );
}