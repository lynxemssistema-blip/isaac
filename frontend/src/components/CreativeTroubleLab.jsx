import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Flame,
  Target,
  Sliders,
  Heart,
  Shield,
  Layers,
  Save,
  Check,
  RotateCcw,
  Loader2,
  Trash2,
  Calendar,
  MessageSquare,
  Clock,
  Zap,
  Mic,
  MicOff,
  Send,
  User,
  Bot,
  RefreshCw,
  Volume2,
  VolumeX,
  BarChart3,
  TrendingUp,
  Activity,
  Plus,
} from 'lucide-react';
import {
  analyzeFactWithAI,
  generateTroubleDiagnosis,
  createCreativeTrouble,
  fetchUserCreativeTroubles,
  updateCreativeTrouble,
  deleteCreativeTrouble,
  sendCreativeTroubleChatStep,
  fetchCreativeTroublesCrossAnalysis,
} from '../services/creativeTroublesApi';
import { humanVoiceService, unlockHtmlAudioElement } from '../services/voiceService';
import { cleanTextForSpeech } from '../services/api';
import { ambientAudio } from '../services/ambientAudioService';

// 10 Níveis de Postura metodológicos
const POSTURE_OPTIONS = [
  { level: 1, name: 'Reclamar', desc: 'Concentra em detalhar o problema, reclamando das situações e das pessoas.' },
  { level: 2, name: 'Justificar', desc: 'Concentra em dar os motivos porque não resolveu, citando que o comportamento de outras pessoas ou acontecimentos afetaram suas ações.' },
  { level: 3, name: 'Reconhecer', desc: 'Investigar causas, distinguir o que está fora do seu controle do que está sob sua responsabilidade e reconhecer sua parcela.' },
  { level: 4, name: 'Investigar', desc: 'Explorar hipóteses, alternativas e referências para compreender quais caminhos podem produzir uma solução adequada.' },
  { level: 5, name: 'Analisar', desc: 'Avaliar quanto o problema afeta você e seus objetivos.' },
  { level: 6, name: 'Decidir', desc: 'Definir as referências sobre seu envolvimento com a solução e consequências das suas escolhas.' },
  { level: 7, name: 'Propor', desc: 'Mapear ações específicas que irão resolver o problema e atingir os resultados desejados.' },
  { level: 8, name: 'Experimentar', desc: 'Testar e validar as referências de solução, entendendo capacidades, delimitações e efeitos colaterais.' },
  { level: 9, name: 'Adaptar', desc: 'Executar a solução, observar os resultados, aprender com os efeitos produzidos e ajustar as ações.' },
  { level: 10, name: 'Consolidar', desc: 'Estabelecer a solução como parte da sua rotina e avaliar desdobramentos (Sustentar e evoluir).' },
];

// Escala de Hawkins agrupada por zonas
const HAWKINS_GROUPS = [
  {
    category: 'Estados Reativos',
    color: 'border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400',
    states: [
      { name: 'vergonha', label: 'Vergonha (Humilhação, invisibilidade, autodestruição)' },
      { name: 'culpa', label: 'Culpa (Remorso, autoacusação, vitimização)' },
      { name: 'apatia', label: 'Apatia (Desespero, impotência, abandono)' },
      { name: 'medo', label: 'Medo (Ansiedade, insegurança, ameaça)' },
      { name: 'raiva', label: 'Raiva (Frustração, irritação, ressentimento)' },
      { name: 'angustia', label: 'Angústia (Dor profunda por perda)' },
      { name: 'euforia', label: 'Euforia (Empolgação passageira, vazio posterior)' },
      { name: 'tristeza', label: 'Tristeza (Dor por não atingir o potencial)' },
      { name: 'desejo', label: 'Desejo (Apego, vício, necessidade de provar valor)' },
    ],
  },
  {
    category: 'O Portal de Ativação',
    color: 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold',
    states: [
      { name: 'coragem', label: '⚡ Coragem (Determinação, iniciativa, validação interna)' },
    ],
  },
  {
    category: 'Estados Construtivos',
    color: 'border-teal-500/30 bg-teal-500/5 text-teal-700 dark:text-teal-400',
    states: [
      { name: 'neutralidade', label: 'Neutralidade (Flexibilidade, desapego, confiança básica)' },
      { name: 'disposicao', label: 'Disposição (Otimismo, cooperação, intenção positiva)' },
      { name: 'aceitacao', label: 'Aceitação (Responsabilidade, perdão, entendimento)' },
      { name: 'compreensao', label: 'Compreensão (Lógica, clareza, razão)' },
      { name: 'empatia', label: 'Empatia (Reciprocidade, acolhimento consciente)' },
      { name: 'alegria', label: 'Alegria (Gratidão, leveza, felicidade profunda)' },
      { name: 'amor', label: 'Amor (Compaixão, cuidado, harmonia)' },
      { name: 'paz', label: 'Paz (Serenidade, silêncio interior)' },
    ],
  },
  {
    category: 'Estados de Maestria',
    color: 'border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-400',
    states: [
      { name: 'iluminacao', label: 'Iluminação (Consciência pura, transcendência e unidade)' },
    ],
  },
];

const PARTIES_OPTIONS = [
  'Deus',
  'Eu mesmo',
  'Cônjuge',
  'Mãe',
  'Pai',
  'Irmãos / Irmãs',
  'Parentes',
  'Amigos',
  'Chefe',
  'Colegas de Trabalho',
  'Estranho / Desconhecido',
];

// Helper de Reconhecimento de Voz Web Speech API
const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

function renderFormattedTroubleText(rawText) {
  const text = String(rawText || '');
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export default function CreativeTroubleLab({ user, profile, onBackToChat }) {
  // Três visões: 'chat' (Jornada Guiada por Conversa) | 'wizard' (Painel & Sliders) | 'history' (Meus Registros)
  const [activeView, setActiveView] = useState('chat');
  const [currentStep, setCurrentStep] = useState(1);

  // Dados Estruturados do Incômodo
  const [formData, setFormData] = useState({
    title: '',
    fact_description: '',
    posture_level: 1,
    trouble_type: 'mental',
    cause_aspects: '',
    effect_aspects: '',
    internal_state: 'coragem',
    context: 'profissional',
    parties_involved: ['Eu mesmo'],
    intensity_score: 3,
    intensity_notes: '',
    relevance_score: 3,
    relevance_notes: '',
    responsibility_score: 3,
    responsibility_notes: '',
    influence_score: 3,
    influence_notes: '',
    attention_reason: '',
    additional_notes: '',
    micro_action_24h: '',
  });

  // Estado da Análise Socrática e Diagnóstico
  const [analyzingFact, setAnalyzingFact] = useState(false);
  const [socraticResult, setSocraticResult] = useState(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Lista de incômodos históricos
  const [userTroubles, setUserTroubles] = useState([]);
  const [loadingTroubles, setLoadingTroubles] = useState(false);

  // ==========================================
  // RECONHECIMENTO DE VOZ EM TODAS AS CAIXAS
  // ==========================================
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = (fieldName, onTextReceived) => {
    if (!SpeechRecognition) {
      alert('O ditado contínuo por voz não está disponível neste navegador (ex.: Firefox). Você pode digitar normalmente ou usar o ditado do teclado do celular.');
      return;
    }

    if (isListening && activeVoiceField === fieldName) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setActiveVoiceField(null);
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.abort();

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setActiveVoiceField(fieldName);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        if (transcript && transcript.trim()) {
          onTextReceived(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn('Erro de reconhecimento de voz:', event.error);
        setIsListening(false);
        setActiveVoiceField(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveVoiceField(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Falha ao iniciar microfone:', err);
      setIsListening(false);
      setActiveVoiceField(null);
    }
  };

  // Botão reutilizável de microfone para caixas de texto
  const renderVoiceButton = (fieldName, currentText, onChange) => {
    const isThisActive = isListening && activeVoiceField === fieldName;
    return (
      <button
        type="button"
        onClick={() =>
          toggleListening(fieldName, (heardText) => {
            const separator = currentText && currentText.trim().length > 0 ? ' ' : '';
            onChange(currentText + separator + heardText);
          })
        }
        title={isThisActive ? 'Parar escuta de áudio' : 'Falar resposta por áudio'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${
          isThisActive
            ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
            : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:text-teal-600 dark:hover:text-teal-400'
        }`}
      >
        {isThisActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        <span>{isThisActive ? 'Ouvindo...' : 'Falar por Áudio'}</span>
      </button>
    );
  };

  // ==========================================
  // ESTADO DO CHAT GUIADO (JORNADA INTERATIVA NA PLATAFORMA)
  // ==========================================
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStep, setChatStep] = useState('welcome');
  const [chatData, setChatData] = useState({});
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [chatCompleted, setChatCompleted] = useState(false);
  const chatScrollRef = useRef(null);

  // Reprodução de Voz Humanizada Conectada às Configurações do Isaac
  const audioElementRef = useRef(null);
  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState(null);

  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState(() => {
    return localStorage.getItem('izaque_incomodo_autovoice') === 'true';
  });

  const toggleAutoVoice = () => {
    const newVal = !autoVoiceEnabled;
    setAutoVoiceEnabled(newVal);
    localStorage.setItem('izaque_incomodo_autovoice', newVal ? 'true' : 'false');
    if (!newVal) {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        audioElementRef.current.pause();
      }
      humanVoiceService.stop();
      setActiveVoiceMessageId(null);
      setLoadingVoiceId(null);
      ambientAudio.restoreAfterSpeech(0.5);
    }
  };

  // Reprodução de Voz Nativa com Configurações Personalizadas do Usuário
  const playNativeSpeech = (rawText, messageId) => {
    try {
      humanVoiceService.stop();
      setActiveVoiceMessageId(null);
      setLoadingVoiceId(null);

      const cleanText = cleanTextForSpeech(rawText);
      if (!cleanText) return;

      if (!humanVoiceService.isSupported()) {
        console.warn('Síntese de voz nativa não suportada.');
        return;
      }

      setLoadingVoiceId(messageId);
      ambientAudio.initContext();
      ambientAudio.duckForSpeech(0.04, 0.8);

      humanVoiceService.stop();
      humanVoiceService.speak(cleanText, {
        onStart: () => {
          setLoadingVoiceId(null);
          setActiveVoiceMessageId(messageId);
        },
        onEnd: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(1.0);
        },
        onError: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(0.5);
        },
      });
    } catch (synthErr) {
      console.error('Erro na síntese local:', synthErr);
      setLoadingVoiceId(null);
      setActiveVoiceMessageId(null);
      ambientAudio.restoreAfterSpeech(0.5);
    }
  };

  // Tocar ou Pausar Voz do Mentor (Usa parâmetros globais da voz do Edson + reprodução progressiva rápida)
  const handleToggleVoicePlay = async (messageId, text) => {
    if (activeVoiceMessageId === messageId || loadingVoiceId === messageId) {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        audioElementRef.current.pause();
      }
      humanVoiceService.stop();
      setActiveVoiceMessageId(null);
      setLoadingVoiceId(null);
      ambientAudio.restoreAfterSpeech(1.0);
      return;
    }

    if (audioElementRef.current) audioElementRef.current.pause();
    humanVoiceService.stop();
    setActiveVoiceMessageId(null);

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    unlockHtmlAudioElement(audio);
    ambientAudio.initContext();
    setLoadingVoiceId(messageId);

    try {
      await humanVoiceService.playSmartAudio(text, {
        audioElement: audio,
        isPreview: false,
        onStart: () => {
          setActiveVoiceMessageId(messageId);
          setLoadingVoiceId(null);
          ambientAudio.duckForSpeech(0.04, 0.8);
        },
        onEnd: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(1.5);
        },
        onError: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(1.0);
        },
      });
    } catch (err) {
      console.warn('⚠️ Fallback para sintetizador local:', err?.message);
      playNativeSpeech(text, messageId);
    }
  };

  // Limpeza de áudio ao desmontar
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      humanVoiceService.stop();
      ambientAudio.restoreAfterSpeech(0.1);
    };
  }, []);

  // Cruzamento de Múltiplos Incômodos (Raio-X de Padrões)
  const [crossAnalysis, setCrossAnalysis] = useState(null);
  const [loadingCrossAnalysis, setLoadingCrossAnalysis] = useState(false);

  const loadCrossAnalysis = async () => {
    if (!user?.id) return;
    setLoadingCrossAnalysis(true);
    try {
      const data = await fetchCreativeTroublesCrossAnalysis(user.id);
      if (data) setCrossAnalysis(data);
    } catch (e) {
      console.warn('Erro ao carregar cruzamento:', e);
    } finally {
      setLoadingCrossAnalysis(false);
    }
  };

  // Iniciar um Novo Incômodo Criativo do zero (Multi-Incômodos)
  const handleStartNewTrouble = (mode = 'chat') => {
    setFormData({
      title: '',
      fact_description: '',
      posture_level: 1,
      trouble_type: 'mental',
      cause_aspects: '',
      effect_aspects: '',
      internal_state: 'coragem',
      context: 'pessoal',
      parties_involved: [],
      intensity_score: 3,
      intensity_notes: '',
      relevance_score: 3,
      relevance_notes: '',
      responsibility_score: 3,
      responsibility_notes: '',
      influence_score: 3,
      influence_notes: '',
      attention_reason: '',
      additional_notes: '',
      micro_action_24h: '',
    });
    setDiagnosisResult(null);
    setCurrentStep(1);
    setSaveSuccess(false);

    setChatMessages([]);
    setChatData({});
    setChatStep('welcome');
    setChatCompleted(false);

    setActiveView(mode);
    if (mode === 'chat') {
      startChatSession();
    }
  };

  // Iniciar conversa no modo Chat
  const startChatSession = async () => {
    setIsAgentTyping(true);
    try {
      const res = await sendCreativeTroubleChatStep({
        step: 'welcome',
        userMessage: '',
        history: [],
        currentData: {},
      });

      setChatStep(res.nextStep || 'fact');
      setChatData(res.extractedData || {});
      setChatMessages([
        {
          id: 'welcome',
          sender: 'agent',
          text: res.agentMessage,
          options: res.suggestedOptions || [],
        },
      ]);

      if (autoVoiceEnabled && res.agentMessage) {
        handleToggleVoicePlay('welcome', res.agentMessage);
      }
    } catch (err) {
      console.error('Erro ao iniciar chat:', err);
    } finally {
      setIsAgentTyping(false);
    }
  };

  useEffect(() => {
    if (activeView === 'chat' && chatMessages.length === 0) {
      startChatSession();
    }
  }, [activeView]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAgentTyping]);

  // Enviar mensagem no chat (ou clique de opção rápida)
  const handleSendChatMessage = async (customText = null) => {
    const textToSend = (customText !== null ? customText : chatInput).trim();
    if (!textToSend || isAgentTyping) return;

    if (customText === null) setChatInput('');

    // Adiciona fala do usuário
    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: textToSend,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsAgentTyping(true);

    try {
      const history = chatMessages.map((m) => ({
        role: m.sender === 'agent' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await sendCreativeTroubleChatStep({
        step: chatStep,
        userMessage: textToSend,
        history,
        currentData: chatData,
      });

      const nextData = { ...chatData, ...(res.extractedData || {}) };
      setChatData(nextData);
      setFormData((prev) => ({ ...prev, ...nextData }));
      setChatStep(res.nextStep || 'completed');

      if (res.isCompleted || res.nextStep === 'completed') {
        setChatCompleted(true);
      }

      const agentMsgId = 'agt_' + Date.now();
      setChatMessages((prev) => [
        ...prev,
        {
          id: agentMsgId,
          sender: 'agent',
          text: res.agentMessage,
          options: res.suggestedOptions || [],
          diagnosis: res.diagnosis || null,
        },
      ]);

      if (autoVoiceEnabled && res.agentMessage) {
        handleToggleVoicePlay(agentMsgId, res.agentMessage);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'agent',
          text: 'Tive um breve lapso na reflexão. Poderia responder novamente?',
          options: ['Tentar novamente'],
        },
      ]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  // Salvar no Banco a partir do Chat ou Formulário
  const handleSaveTrouble = async (dataToSave = null) => {
    if (!user) {
      alert('Você precisa estar logado para salvar seu incômodo criativo.');
      return;
    }

    const payloadSource = dataToSave || formData;
    if (!payloadSource.fact_description || !payloadSource.fact_description.trim()) {
      alert('O fato concreto é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...payloadSource,
        user_id: user.id,
        title:
          payloadSource.title?.trim() ||
          payloadSource.fact_description.slice(0, 50) + '...',
        ai_diagnosis: payloadSource.ai_diagnosis || diagnosisResult,
        status: 'ativo',
      };

      await createCreativeTrouble(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveView('history');
      }, 1500);
    } catch (err) {
      alert('Erro ao registrar incômodo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Carregar histórico do usuário
  const loadHistory = async (withCrossAnalysis = false) => {
    if (!user?.id) return;
    try {
      setLoadingTroubles(true);
      const data = await fetchUserCreativeTroubles(user.id);
      const safeData = Array.isArray(data) ? data : [];
      setUserTroubles(safeData);
      if (withCrossAnalysis && safeData.length > 0 && !crossAnalysis) {
        loadCrossAnalysis();
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingTroubles(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadHistory(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeView === 'history' && user?.id) {
      loadHistory(true);
    }
  }, [activeView, user?.id]);

  // Handler de Análise Socrática do Fato
  const handleAnalyzeFact = async () => {
    if (!formData.fact_description.trim()) {
      alert('Por favor, descreva primeiro o que está te incomodando.');
      return;
    }

    try {
      setAnalyzingFact(true);
      const res = await analyzeFactWithAI(formData.fact_description);
      setSocraticResult(res);
    } catch (err) {
      alert('Erro ao analisar fato: ' + err.message);
    } finally {
      setAnalyzingFact(false);
    }
  };

  // Toggle nas partes envolvidas
  const toggleParty = (party) => {
    setFormData((prev) => {
      const exists = prev.parties_involved.includes(party);
      const updated = exists
        ? prev.parties_involved.filter((p) => p !== party)
        : [...prev.parties_involved, party];
      return { ...prev, parties_involved: updated };
    });
  };

  // Handler de Geração do Diagnóstico Clínico (Etapa 5)
  const handleGenerateDiagnosis = async () => {
    try {
      setDiagnosing(true);
      const diag = await generateTroubleDiagnosis(formData);
      setDiagnosisResult(diag);
      if (diag.suggestedMicroAction && !formData.micro_action_24h) {
        setFormData((prev) => ({ ...prev, micro_action_24h: diag.suggestedMicroAction }));
      }
    } catch (err) {
      alert('Erro ao gerar diagnóstico: ' + err.message);
    } finally {
      setDiagnosing(false);
    }
  };

  // Atualizar status no histórico
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateCreativeTrouble(id, { status: newStatus });
      setUserTroubles((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Excluir incômodo
  const handleDeleteTrouble = async (id) => {
    if (!window.confirm('Deseja realmente excluir este incômodo registrado?')) return;
    try {
      await deleteCreativeTrouble(id);
      setUserTroubles((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
              <Compass className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif">
                Laboratório do Incômodo Criativo
              </h1>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Metodologia do Mentor Thiago Prata · Escala Hawkins de Consciência
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE MODOS: CHAT GUIADO | FORMULÁRIO | HISTÓRICO */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-200/60 dark:bg-slate-800/60 text-xs font-semibold">
          <button
            onClick={() => setActiveView('chat')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'chat'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Jornada Guiada (Chat)</span>
          </button>

          <button
            onClick={() => setActiveView('wizard')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'wizard'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Painel & Sliders</span>
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Meus Registros ({userTroubles.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: MODO JORNADA GUIADA POR CHAT (DINÂMICO COM OPÇÕES) */}
      {/* ======================================================== */}
      {activeView === 'chat' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm flex flex-col h-[75vh] max-h-[800px] overflow-hidden">
          {/* HEADER DO CHAT */}
          <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50/80 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-serif font-bold text-base shadow-xs">
                I
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                    Mentor ISAAC
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-stone-400 font-medium">Orquestrador Metodológico</span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-slate-400">
                  Perguntas socráticas, escuta de áudio e sugestões com a metodologia de Thiago Prata.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAutoVoice}
                title={autoVoiceEnabled ? 'Desativar voz automática' : 'Ativar leitura automática em voz alta'}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  autoVoiceEnabled
                    ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700'
                }`}
              >
                {autoVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">Voz: {autoVoiceEnabled ? 'Ligada' : 'Desligada'}</span>
              </button>

              <button
                onClick={() => {
                  setChatMessages([]);
                  setChatData({});
                  setChatCompleted(false);
                  startChatSession();
                }}
                title="Reiniciar Sessão na Plataforma"
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-slate-700/50 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HISTÓRICO DE MENSAGENS COM BALÕES */}
          <div ref={chatScrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-2`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isAgent
                        ? 'bg-stone-100 dark:bg-slate-800/90 text-stone-900 dark:text-stone-100 rounded-tl-xs shadow-xs'
                        : 'bg-teal-700 text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{renderFormattedTroubleText(msg.text)}</div>

                    {/* BOTÃO OUVIR RESPOSTA DO MENTOR POR VOZ */}
                    {isAgent && (
                      <button
                        type="button"
                        onClick={() => handleToggleVoicePlay(msg.id, msg.text)}
                        title={activeVoiceMessageId === msg.id ? 'Pausar leitura de voz' : 'Ouvir mensagem por voz'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition mt-3 ${
                          activeVoiceMessageId === msg.id
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs animate-pulse'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                      >
                        {loadingVoiceId === msg.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                            <span>Preparando voz...</span>
                          </>
                        ) : activeVoiceMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Pausar Voz</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>Ouvir Texto</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* CHIPS DE OPÇÕES INTERATIVAS OFERECIDAS PELO AGENTE */}
                  {isAgent && msg.options && msg.options.length > 0 && !chatCompleted && (
                    <div className="flex flex-wrap gap-1.5 pt-1 pl-1 max-w-[90%]">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendChatMessage(opt)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-teal-600/30 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-600 shadow-xs transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* CARD DE CONCLUSÃO & SALVAMENTO */}
                  {isAgent && msg.diagnosis && (
                    <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 space-y-2 max-w-[88%] text-xs">
                      <div className="font-bold text-teal-900 dark:text-teal-200">
                        🎯 Resumo Clínico Consolidado: {msg.diagnosis.quadrant}
                      </div>
                      <p className="text-stone-700 dark:text-slate-300">
                        {msg.diagnosis.quadrantAdvice}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* DIGITAÇÃO DO AGENTE */}
            {isAgentTyping && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-500 text-xs w-max animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Mentor ISAAC está refletindo...</span>
              </div>
            )}
          </div>

          {/* BARRA INFERIOR DE RESPOSTA DO USUÁRIO COM MICROFONE */}
          <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/90">
            {chatCompleted ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  🎉 Todos os dados foram coletados! Deseja salvar este incômodo no seu histórico?
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveTrouble(chatData)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Incômodo no Meu Histórico
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* BOTÃO DE MICROFONE DO CHAT */}
                <button
                  type="button"
                  onClick={() =>
                    toggleListening('chat_input', (heardText) => {
                      setChatInput((prev) => (prev ? prev + ' ' + heardText : heardText));
                    })
                  }
                  title={
                    isListening && activeVoiceField === 'chat_input'
                      ? 'Parar gravação de voz'
                      : 'Falar sua resposta por áudio'
                  }
                  className={`p-3 rounded-2xl border transition flex items-center justify-center shrink-0 ${
                    isListening && activeVoiceField === 'chat_input'
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  {isListening && activeVoiceField === 'chat_input' ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* CAMPO DE TEXTO DO CHAT */}
                <input
                  type="text"
                  placeholder={
                    isListening && activeVoiceField === 'chat_input'
                      ? 'Ouvindo sua voz...'
                      : 'Responda aqui ou clique em uma opção acima...'
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChatMessage();
                  }}
                  className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />

                {/* BOTÃO ENVIAR */}
                <button
                  type="button"
                  onClick={() => handleSendChatMessage()}
                  disabled={!chatInput.trim() || isAgentTyping}
                  className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition disabled:opacity-40 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: FLUXO DO WIZARD (PAINEL & SLIDERS) */}
      {/* ======================================================== */}
      {activeView === 'wizard' && (
        <div className="space-y-6">
          {/* STEPPER PROGRESS BAR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400 mb-2">
              <span>Etapa {currentStep} de 5</span>
              <span>
                {currentStep === 1 && '1. O Fato Concreto'}
                {currentStep === 2 && '2. Auto Percepções (Postura & Emoção)'}
                {currentStep === 3 && '3. Conexões & Pessoas'}
                {currentStep === 4 && '4. Matriz de Impacto IRRI'}
                {currentStep === 5 && '5. Dossiê da Virada & Ação'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* ETAPA 1: DESCRIÇÃO DO INCÔMODO (FATO VS INTERPRETAÇÃO) */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Seção 1: Informações Gerais e Fato Concreto
                </span>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                  O que está te incomodando?
                </h2>
                <p className="text-xs text-stone-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Descreva objetivamente a situação que está gerando desconforto, insatisfação ou desejo
                  de mudança.{' '}
                  <strong className="text-stone-800 dark:text-stone-200">
                    Registre aquilo que você percebe, sem tentar explicar ainda por que acontece ou como
                    deveria ser resolvido. Descreva fatos e ações e não a sua visão ou interpretação.
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                  Título Curto para este Incômodo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entrega atrasada do projeto do sócio"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                      Descrição do que Aconteceu (Fato Concreto) *
                    </label>
                    {renderVoiceButton('fact_description', formData.fact_description, (newVal) =>
                      setFormData((prev) => ({ ...prev, fact_description: newVal }))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeFact}
                    disabled={analyzingFact || !formData.fact_description.trim()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 disabled:opacity-50 transition"
                  >
                    {analyzingFact ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Descontaminar Fato com Isaac
                  </button>
                </div>

                <textarea
                  rows={5}
                  placeholder="Ex: Ontem tínhamos combinado uma entrega às 18h e o documento não foi enviado. Sinto que..."
                  value={formData.fact_description}
                  onChange={(e) => setFormData({ ...formData, fact_description: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* CARD DE FEEDBACK SOCRÁTICO DA IA */}
              {socraticResult && (
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    Espelho Socrático do Mentor Isaac
                  </div>

                  <div className="text-xs text-stone-700 dark:text-slate-300">
                    <strong className="text-stone-900 dark:text-stone-100">Fato Descontaminado Sugerido:</strong>{' '}
                    <p className="mt-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/50 font-medium text-stone-800 dark:text-slate-200">
                      "{socraticResult.cleanFact}"
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fact_description: socraticResult.cleanFact }))}
                      className="mt-2 text-xs font-bold text-teal-700 dark:text-teal-400 underline hover:no-underline"
                    >
                      Usar esta versão descontaminada
                    </button>
                  </div>

                  {socraticResult.perceivedJudgments && (
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      <strong>Interpretações detectadas:</strong> {socraticResult.perceivedJudgments}
                    </div>
                  )}

                  {socraticResult.socraticQuestion && (
                    <div className="text-xs text-stone-600 dark:text-slate-400 italic">
                      💡 <strong>Para refletir:</strong> {socraticResult.socraticQuestion}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 2: AUTO PERCEPÇÕES (POSTURA, GATILHO, HAWKINS) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Seção 2: Auto Percepções
                </span>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Qual a sua principal reação diante desse incômodo?
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  ⚠️ <strong>Regra Metodológica:</strong> Se identificar mais de um tipo de reação,
                  selecione a opção de <strong>MENOR NÚMERO</strong>. Considere ações concretas e comportamentos.
                </p>
              </div>

              {/* LISTA DAS 10 POSTURAS */}
              <div className="space-y-2">
                {POSTURE_OPTIONS.map((opt) => {
                  const selected = formData.posture_level === opt.level;
                  return (
                    <div
                      key={opt.level}
                      onClick={() => setFormData({ ...formData, posture_level: opt.level })}
                      className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        selected
                          ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30 shadow-xs ring-1 ring-teal-600'
                          : 'border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 bg-stone-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          selected
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-stone-300 dark:border-slate-600'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                            [{opt.level}] {opt.name}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TIPO DE INCÔMODO (GATILHO) */}
              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Tipo de Incômodo (Principal Gatilho) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'mental', label: 'Mental', desc: 'Pensamentos, crenças, expectativas' },
                    { id: 'comportamento', label: 'Comportamento', desc: 'O que faço, evito, adio' },
                    { id: 'relacionamento', label: 'Relacionamento', desc: 'Limites, comunicação, atritos' },
                    { id: 'acontecimento', label: 'Acontecimento', desc: 'Eventos recorrentes externos' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setFormData({ ...formData, trouble_type: t.id })}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                        formData.trouble_type === t.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold'
                          : 'border-stone-200 dark:border-slate-800 hover:bg-stone-100 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs">{t.label}</div>
                      <div className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5">
                        {t.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESTADO INTERNO (ESCALA HAWKINS) */}
              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                    Estado Interno Predominante (Escala David Hawkins & Thiago Prata) *
                  </label>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    Qual emoção ou sentimento você experimenta ao olhar para esse incômodo?
                  </p>
                </div>

                <div className="space-y-3">
                  {HAWKINS_GROUPS.map((grp, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl border ${grp.color} space-y-2`}>
                      <span className="text-[11px] font-bold uppercase tracking-wider block">
                        {grp.category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {grp.states.map((st) => (
                          <button
                            key={st.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, internal_state: st.name })}
                            className={`p-2 rounded-xl text-left text-xs transition border flex items-center justify-between ${
                              formData.internal_state === st.name
                                ? 'bg-white dark:bg-slate-900 border-teal-600 font-bold shadow-xs'
                                : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-slate-900/50'
                            }`}
                          >
                            <span>{st.label}</span>
                            {formData.internal_state === st.name && (
                              <Check className="w-3.5 h-3.5 text-teal-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CAUSAS E EFEITOS COM BOTÕES DE VOZ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                      Aspectos de Causa (Crenças Internas)
                    </label>
                    {renderVoiceButton('cause_aspects', formData.cause_aspects, (newVal) =>
                      setFormData((prev) => ({ ...prev, cause_aspects: newVal }))
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Quais regras internas, cobranças ou expectativas suas estão ligadas a isso?"
                    value={formData.cause_aspects}
                    onChange={(e) => setFormData({ ...formData, cause_aspects: e.target.value })}
                    className="w-full p-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                      Aspectos de Efeito (Comportamentos)
                    </label>
                    {renderVoiceButton('effect_aspects', formData.effect_aspects, (newVal) =>
                      setFormData((prev) => ({ ...prev, effect_aspects: newVal }))
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Como isso se manifesta na rotina? Fuga, paralisia, discussões, adiamentos..."
                    value={formData.effect_aspects}
                    onChange={(e) => setFormData({ ...formData, effect_aspects: e.target.value })}
                    className="w-full p-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 3: CONEXÕES SISTÊMICAS */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Seção 3: Conexões Sistêmicas
                </span>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Qual o contexto e quem está envolvido?
                </h2>
              </div>

              {/* CONTEXTO */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Principal Contexto do Incômodo *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'pessoal', label: 'Pessoal', desc: 'Consigo mesmo' },
                    { id: 'profissional', label: 'Profissional', desc: 'Trabalho / Carreira' },
                    { id: 'social', label: 'Social', desc: 'Família / Amigos / Público' },
                  ].map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setFormData({ ...formData, context: c.id })}
                      className={`p-3.5 rounded-2xl border text-center cursor-pointer transition ${
                        formData.context === c.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold ring-1 ring-teal-600'
                          : 'border-stone-200 dark:border-slate-800 hover:bg-stone-100 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold">{c.label}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PARTES ENVOLVIDAS */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Partes Envolvidas (Marque todas as que se aplicam)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PARTIES_OPTIONS.map((party) => {
                    const active = formData.parties_involved.includes(party);
                    return (
                      <button
                        key={party}
                        type="button"
                        onClick={() => toggleParty(party)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                          active
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-100'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        {party}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 4: MATRIZ DE IMPACTO (IRRI) COM VOZ */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Seção 4: Matriz de Impacto IRRI
                </span>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Calibre a Intensidade, Relevância, Responsabilidade e Influência
                </h2>
              </div>

              {/* 1. INTENSIDADE */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    1. Intensidade Emocional: {formData.intensity_score} / 5
                  </span>
                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    {formData.intensity_score === 1 && 'Muito Baixa (quase não ocupa a mente)'}
                    {formData.intensity_score === 2 && 'Baixa (desconforto ocasional)'}
                    {formData.intensity_score === 3 && 'Moderada (desconforto perceptível)'}
                    {formData.intensity_score === 4 && 'Alta (interfere em energia e relações)'}
                    {formData.intensity_score === 5 && 'Muito Alta (paralisante / domina a mente)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={formData.intensity_score}
                  onChange={(e) => setFormData({ ...formData, intensity_score: Number(e.target.value) })}
                  className="w-full accent-teal-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="O que este incômodo faz você pensar ou sentir com tanta frequência?"
                    value={formData.intensity_notes}
                    onChange={(e) => setFormData({ ...formData, intensity_notes: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {renderVoiceButton('intensity_notes', formData.intensity_notes, (val) =>
                    setFormData((prev) => ({ ...prev, intensity_notes: val }))
                  )}
                </div>
              </div>

              {/* 2. RELEVÂNCIA */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    2. Relevância para Seus Objetivos: {formData.relevance_score} / 5
                  </span>
                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    {formData.relevance_score === 1 && 'Muito Baixa (pouca relação com objetivos)'}
                    {formData.relevance_score === 2 && 'Baixa (não compromete o importante)'}
                    {formData.relevance_score === 3 && 'Moderada (área importante)'}
                    {formData.relevance_score === 4 && 'Alta (diretamente ligado a objetivos vitais)'}
                    {formData.relevance_score === 5 && 'Muito Alta (fundamental para o futuro)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={formData.relevance_score}
                  onChange={(e) => setFormData({ ...formData, relevance_score: Number(e.target.value) })}
                  className="w-full accent-teal-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="O que em sua vida está sendo afetado caso não seja resolvido?"
                    value={formData.relevance_notes}
                    onChange={(e) => setFormData({ ...formData, relevance_notes: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {renderVoiceButton('relevance_notes', formData.relevance_notes, (val) =>
                    setFormData((prev) => ({ ...prev, relevance_notes: val }))
                  )}
                </div>
              </div>

              {/* 3. RESPONSABILIDADE */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    3. Responsabilidade Pessoal: {formData.responsibility_score} / 5
                  </span>
                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    {formData.responsibility_score === 1 && 'Melhor Não Envolver'}
                    {formData.responsibility_score === 2 && 'Posso Dialogar'}
                    {formData.responsibility_score === 3 && 'Posso Contribuir se acionado'}
                    {formData.responsibility_score === 4 && 'Responsabilidade Compartilhada'}
                    {formData.responsibility_score === 5 && 'Responsabilidade Direta Minha'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={formData.responsibility_score}
                  onChange={(e) => setFormData({ ...formData, responsibility_score: Number(e.target.value) })}
                  className="w-full accent-teal-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Quais decisões ou ações concretas dependem de você?"
                    value={formData.responsibility_notes}
                    onChange={(e) => setFormData({ ...formData, responsibility_notes: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {renderVoiceButton('responsibility_notes', formData.responsibility_notes, (val) =>
                    setFormData((prev) => ({ ...prev, responsibility_notes: val }))
                  )}
                </div>
              </div>

              {/* 4. INFLUÊNCIA */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    4. Capacidade Real de Influência: {formData.influence_score} / 5
                  </span>
                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    {formData.influence_score === 1 && 'Muito Baixa (quase nenhuma capacidade)'}
                    {formData.influence_score === 2 && 'Baixa (depende muito de terceiros)'}
                    {formData.influence_score === 3 && 'Moderada (produzo algum impacto)'}
                    {formData.influence_score === 4 && 'Alta (minhas escolhas mudam a rota)'}
                    {formData.influence_score === 5 && 'Muito Alta (condições diretas de resolver)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={formData.influence_score}
                  onChange={(e) => setFormData({ ...formData, influence_score: Number(e.target.value) })}
                  className="w-full accent-teal-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="O que você poderia decidir hoje que alteraria a situação?"
                    value={formData.influence_notes}
                    onChange={(e) => setFormData({ ...formData, influence_notes: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {renderVoiceButton('influence_notes', formData.influence_notes, (val) =>
                    setFormData((prev) => ({ ...prev, influence_notes: val }))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 5: SÍNTESE, DIAGNÓSTICO DO ISAAC & COMPROMISSO */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Seção 5: Síntese e Desabafo
                </span>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Por que este incômodo merece sua atenção?
                </h2>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                    Motivo pelo qual merece Atenção
                  </label>
                  {renderVoiceButton('attention_reason', formData.attention_reason, (newVal) =>
                    setFormData((prev) => ({ ...prev, attention_reason: newVal }))
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Considerando o IRRI, por que merece sua atenção?"
                  value={formData.attention_reason}
                  onChange={(e) => setFormData({ ...formData, attention_reason: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                    Espaço Livre / Desabafo Adicional
                  </label>
                  {renderVoiceButton('additional_notes', formData.additional_notes, (newVal) =>
                    setFormData((prev) => ({ ...prev, additional_notes: newVal }))
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder="Momento totalmente livre para desabafar qualquer ponto complementar..."
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* BOTÃO GERAR DIAGNÓSTICO COM ISAAC */}
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    Pronto para o Choque de Lucidez?
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400">
                    O Isaac vai cruzar a Matriz IRRI, o nível de Postura e a escala Hawkins.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateDiagnosis}
                  disabled={diagnosing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition disabled:opacity-50"
                >
                  {diagnosing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {diagnosisResult ? 'Recalcular Diagnóstico' : 'Gerar Diagnóstico da Virada'}
                </button>
              </div>

              {/* RETORNO DO DIAGNÓSTICO CLÍNICO DA IA */}
              {diagnosisResult && (
                <div className="p-6 rounded-3xl bg-teal-600/10 border border-teal-600/30 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
                      <Sparkles className="w-5 h-5" />
                      Dossiê da Virada (Orquestração Isaac)
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleVoicePlay(
                          'wizard_dossier',
                          `Dossiê da Virada. Quadrante IRRI: ${diagnosisResult.quadrant}. ${diagnosisResult.quadrantAdvice || diagnosisResult.summary}. Postura: ${diagnosisResult.postureCritique}. Ponte de Hawkins: ${diagnosisResult.hawkinsBridge}. Micro ação para as próximas 24 horas: ${formData.micro_action_24h || diagnosisResult.suggestedMicroAction || ''}`
                        )
                      }
                      title="Ouvir diagnóstico completo em áudio"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        activeVoiceMessageId === 'wizard_dossier'
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs animate-pulse'
                          : 'bg-white dark:bg-slate-900 border-teal-600/30 text-teal-800 dark:text-teal-300 hover:border-teal-600 shadow-xs'
                      }`}
                    >
                      {loadingVoiceId === 'wizard_dossier' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          <span>Preparando voz...</span>
                        </>
                      ) : activeVoiceMessageId === 'wizard_dossier' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Pausar Leitura</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Ouvir Diagnóstico</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-600/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Classificação da Realidade (Matriz IRRI)
                    </span>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {diagnosisResult.quadrant}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                      {diagnosisResult.quadrantAdvice || diagnosisResult.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                      <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                        Sua Postura Atual vs Próximo Degrau:
                      </strong>
                      <p className="text-stone-600 dark:text-slate-300">
                        {diagnosisResult.postureCritique}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                      <strong className="text-purple-700 dark:text-purple-400 block mb-1">
                        Ponte de Consciência (Hawkins):
                      </strong>
                      <p className="text-stone-600 dark:text-slate-300">
                        {diagnosisResult.hawkinsBridge}
                      </p>
                    </div>
                  </div>

                  {/* MICRO-AÇÃO 24H COM BOTÃO DE VOZ */}
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Target className="w-4 h-4" />
                        Seu Compromisso: Micro-Ação em 24 Horas
                      </div>
                      {renderVoiceButton('micro_action_24h', formData.micro_action_24h, (newVal) =>
                        setFormData((prev) => ({ ...prev, micro_action_24h: newVal }))
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.micro_action_24h}
                      onChange={(e) => setFormData({ ...formData, micro_action_24h: e.target.value })}
                      placeholder="Ex: Vou conversar calmamente com o fulano e alinhar uma única entrega."
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* BOTÃO SALVAR INCÔMODO E SELAR COMPROMISSO */}
              <div className="pt-2 flex items-center justify-end gap-3">
                {saveSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Incômodo Criativo Salvo com Sucesso!
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveTrouble(formData)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Incômodo & Selar Compromisso
                  </button>
                )}
              </div>
            </div>
          )}

          {/* NAVEGAÇÃO ENTRE ETAPAS DO WIZARD */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Etapa Anterior
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 transition"
              >
                Próxima Etapa
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: HISTÓRICO DE INCÔMODOS E CRUZAMENTO DE PADRÕES */}
      {/* ======================================================== */}
      {activeView === 'history' && (
        <div className="space-y-6 animate-in fade-in">
          {/* CABEÇALHO DO HISTÓRICO COM BOTÕES DE NOVO INCÔMODO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Meus Incômodos & Padrões (Laboratório Vivo)
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Crie múltiplos incômodos para diferentes frentes (sócio, vendas, relacionamentos, hábitos) e acompanhe o cruzamento.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartNewTrouble('chat')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                + Novo Incômodo (Chat)
              </button>
              <button
                type="button"
                onClick={() => handleStartNewTrouble('wizard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition"
              >
                + Formulário Direto
              </button>
            </div>
          </div>

          {loadingTroubles ? (
            <div className="p-12 text-center text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
              Carregando seus incômodos e cruzamentos...
            </div>
          ) : userTroubles.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400 space-y-3">
              <Compass className="w-12 h-12 mx-auto text-teal-600 opacity-40" />
              <div>
                <p className="font-bold text-stone-800 dark:text-stone-200 text-base">
                  Nenhum incômodo registrado ainda
                </p>
                <p className="text-xs mt-1 text-stone-500 max-w-md mx-auto">
                  Você pode cadastrar atritos com sócios, gargalos financeiros, desafios de vendas ou travas pessoais. Cada incômodo terá seu próprio prontuário e micro-ação.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleStartNewTrouble('chat')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition"
                >
                  Iniciar Meu Primeiro Incômodo no Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* PAINEL DE CRUZAMENTO DE DADOS (RAIO-X DE PADRÕES) */}
              {/* ======================================================== */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-900/10 via-white to-purple-900/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-teal-500/30 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-500/20 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white mb-1">
                      <Sparkles className="w-3 h-3" /> Metadiagnóstico Cruzado
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      Raio-X de Padrões Inconscientes (Cruzamento Multi-Incômodos)
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-slate-400">
                      Análise integrada que cruza todos os seus incômodos para revelar onde sua energia está vazando.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadCrossAnalysis}
                    disabled={loadingCrossAnalysis}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-teal-600/30 text-teal-800 dark:text-teal-300 hover:border-teal-600 shadow-xs transition shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCrossAnalysis ? 'animate-spin' : ''}`} />
                    Recalcular Raio-X
                  </button>
                </div>

                {/* MÉTRICAS PANORÂMICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/60 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total de Incômodos</span>
                    <div className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
                      {crossAnalysis?.total || userTroubles.length}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/60 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Postura Média</span>
                    <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">
                      Nível {crossAnalysis?.avgPosture || (userTroubles.reduce((a, b) => a + (b.posture_level || 1), 0) / userTroubles.length).toFixed(1)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/60 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Ralo Reativo (&lt;200Hz)</span>
                    <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                      {crossAnalysis?.reactivePercentage !== undefined ? `${crossAnalysis.reactivePercentage}%` : 'Calculando...'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/60 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Em Andamento</span>
                    <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {userTroubles.filter((t) => t.status === 'ativo').length} ativos
                    </div>
                  </div>
                </div>

                {/* SÍNTESE CLÍNICA DO CRUZAMENTO */}
                {crossAnalysis?.analysis && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-1">
                        <strong className="text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-bold">
                          🔍 Padrão Repetitivo Inconsciente:
                        </strong>
                        <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
                          {crossAnalysis.analysis.corePattern}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-1">
                        <strong className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-bold">
                          ⚡ Ralo de Energia Vital:
                        </strong>
                        <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
                          {crossAnalysis.analysis.energyDrain}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-1">
                        <strong className="text-teal-700 dark:text-teal-400 flex items-center gap-1.5 font-bold">
                          🗝️ Alavanca Mestra de Postura:
                        </strong>
                        <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
                          {crossAnalysis.analysis.masterLever}
                        </p>
                      </div>
                    </div>

                    {/* CONSELHO DO MENTOR COM BOTÃO DE VOZ (VOZ CONFIGURADA DO USUÁRIO) */}
                    {crossAnalysis.analysis.mentorInsight && (
                      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                            Direcionamento do Mentor Isaac
                          </span>
                          <p className="text-xs text-stone-800 dark:text-stone-200 font-serif italic leading-relaxed">
                            "{crossAnalysis.analysis.mentorInsight}"
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleVoicePlay('cross_mentor_insight', crossAnalysis.analysis.mentorInsight)
                          }
                          title="Ouvir conselho do mentor em voz alta com suas preferências"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 ${
                            activeVoiceMessageId === 'cross_mentor_insight'
                              ? 'bg-teal-600 text-white border-teal-700 shadow-xs animate-pulse'
                              : 'bg-white dark:bg-slate-900 border-teal-600/30 text-teal-800 dark:text-teal-300 hover:border-teal-600 shadow-xs'
                          }`}
                        >
                          {loadingVoiceId === 'cross_mentor_insight' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                              <span>Carregando voz...</span>
                            </>
                          ) : activeVoiceMessageId === 'cross_mentor_insight' ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Pausar Voz</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                              <span>Ouvir Conselho</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LISTA INDIVIDUAL DE INCÔMODOS */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-stone-700 dark:text-slate-300">
                  Registros Individuais ({userTroubles.length})
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {userTroubles.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-teal-600/40 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {tr.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
                              {tr.trouble_type}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400">
                            Registrado em {new Date(tr.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={tr.status}
                            onChange={(e) => handleStatusChange(tr.id, e.target.value)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-200"
                          >
                            <option value="ativo">Ativo</option>
                            <option value="em_experimentacao">Em Experimentação</option>
                            <option value="superado">Superado / Consolidado</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteTrouble(tr.id)}
                            title="Excluir este incômodo"
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 dark:text-slate-300 italic line-clamp-2">
                        "{tr.fact_description}"
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-semibold">
                          Postura: [{tr.posture_level}]{' '}
                          {POSTURE_OPTIONS.find((p) => p.level === tr.posture_level)?.name}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 capitalize">
                          Hawkins: {tr.internal_state}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 font-mono">
                          IRRI: I:{tr.intensity_score} · R:{tr.relevance_score} · Resp:{tr.responsibility_score} · Inf:{tr.influence_score}
                        </span>

                        {/* BOTÃO OUVIR DIAGNÓSTICO DO INCÔMODO COM A VOZ DO USUÁRIO */}
                        <button
                          type="button"
                          onClick={() => {
                            const speechContent = `Incômodo: ${tr.title}. Fato concreto: ${tr.fact_description}. Postura nível ${tr.posture_level}. Emoção na escala de Hawkins: ${tr.internal_state}. Quadrante IRRI: ${tr.ai_diagnosis?.quadrant || ''}. ${tr.ai_diagnosis?.quadrantAdvice || ''}. Micro-ação de 24 horas assumida: ${tr.micro_action_24h || ''}`;
                            handleToggleVoicePlay('trouble_diag_' + tr.id, speechContent);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border transition ${
                            activeVoiceMessageId === 'trouble_diag_' + tr.id
                              ? 'bg-teal-600 text-white border-teal-700 shadow-xs animate-pulse'
                              : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-teal-600'
                          }`}
                        >
                          {loadingVoiceId === 'trouble_diag_' + tr.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                              <span>Preparando voz...</span>
                            </>
                          ) : activeVoiceMessageId === 'trouble_diag_' + tr.id ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-teal-600" />
                              <span>Ouvir Diagnóstico</span>
                            </>
                          )}
                        </button>
                      </div>

                      {tr.micro_action_24h && (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                          🎯 <strong>Micro-Ação assumida:</strong> {tr.micro_action_24h}
                        </div>
                      )}

                      {tr.ai_diagnosis?.quadrant && (
                        <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 text-xs text-teal-900 dark:text-teal-300">
                          <strong>Direcionamento Isaac:</strong> {tr.ai_diagnosis.quadrant} —{' '}
                          {tr.ai_diagnosis.quadrantAdvice}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
