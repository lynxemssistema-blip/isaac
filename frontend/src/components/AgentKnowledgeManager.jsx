import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  FileUp,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Loader2,
  Feather,
} from 'lucide-react';
import {
  fetchAgentDocuments,
  uploadAgentDocument,
  deleteAgentDocument,
  fetchDocumentChunks,
} from '../services/adminApi';

export default function AgentKnowledgeManager({ agent, onUpdated }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [mimeType, setMimeType] = useState('text/plain');
  const [mode, setMode] = useState('file'); // 'file' | 'text'
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estado para expandir chunks de um documento
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [chunksMap, setChunksMap] = useState({});
  const [loadingChunksDocId, setLoadingChunksDocId] = useState(null);

  const loadDocs = async () => {
    if (!agent?.id) return;
    try {
      setLoading(true);
      const list = await fetchAgentDocuments(agent.id);
      setDocuments(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [agent?.id]);

  // Manipulação de arquivo local (.pdf, .txt, .md, .doc, .docx)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setSelectedFile(file);
    setMimeType(file.type || 'text/plain');

    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';
    const isText = file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.startsWith('text/');

    if (isText) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result || '');
        setFileBase64(null);
      };
      reader.readAsText(file);
    } else if (isPdf) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fullDataUrl = event.target?.result;
        const base64Only = fullDataUrl?.split(',')[1];
        setFileBase64(base64Only);
        setContent('');
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fullDataUrl = event.target?.result;
        const base64Only = fullDataUrl?.split(',')[1];
        setFileBase64(base64Only);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Informe um título descritivo para o material de estudo.');
      return;
    }

    if (mode === 'text' && !content.trim()) {
      setErrorMsg('Cole o conteúdo para o especialista estudar.');
      return;
    }

    if (mode === 'file' && !content.trim() && !fileBase64) {
      setErrorMsg('Selecione um arquivo de estudo válido (.pdf, .txt, .md).');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);
    setUploadStep('Processando material de estudo...');

    try {
      const isPdf = selectedFile?.name?.endsWith('.pdf') || mimeType === 'application/pdf';

      setUploadStep(isPdf ? 'Lendo e extraindo conteúdo do livro...' : 'Memorizando na plataforma...');

      await uploadAgentDocument(agent.id, {
        title: title.trim(),
        content: content.trim(),
        fileBase64: fileBase64 || undefined,
        mimeType: mimeType || 'text/plain',
        fileType: isPdf ? 'pdf' : (mode === 'file' ? 'file' : 'text'),
      });

      setFeedback(`Material "${title}" estudado e memorizado com sucesso pelo especialista!`);
      setTitle('');
      setContent('');
      setSelectedFile(null);
      setFileBase64(null);
      loadDocs();
      if (onUpdated) onUpdated();
      setTimeout(() => setFeedback(''), 5000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao ingerir material de estudo');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (!confirm(`Deseja remover o estudo "${docTitle}" da memória do mentor?`)) return;
    try {
      await deleteAgentDocument(agent.id, docId);
      loadDocs();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleExpandDoc = async (docId) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null);
      return;
    }

    setExpandedDocId(docId);
    if (!chunksMap[docId]) {
      try {
        setLoadingChunksDocId(docId);
        const chunks = await fetchDocumentChunks(agent.id, docId);
        setChunksMap((prev) => ({ ...prev, [docId]: chunks }));
      } catch (err) {
        console.error('Erro ao buscar trechos:', err);
      } finally {
        setLoadingChunksDocId(null);
      }
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-4xl bg-white/70 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
            <BookOpen className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50 flex items-center gap-2">
              Base de Conhecimento & Estudos: <span className="text-teal-800 dark:text-teal-300 font-semibold">{agent?.name}</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Faça o mentor estudar livros, artigos e métodos para fundamentar suas reflexões com profundidade.
            </p>
          </div>
        </div>

        <span className="text-xs font-serif px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-stone-200 w-fit border border-stone-200 dark:border-slate-600">
          {documents.length} estudo(s) ativo(s)
        </span>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FORMULÁRIO DE INGESTÃO */}
      <form onSubmit={handleIngest} className="space-y-4 p-5 rounded-3xl bg-stone-50 dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
            <Feather className="w-3.5 h-3.5" />
            + Inserir Material de Estudo
          </span>

          <div className="flex bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-stone-200 dark:border-slate-700 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`px-3 py-1 rounded-lg transition ${
                mode === 'file' ? 'bg-teal-700 text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-white'
              }`}
            >
              Arquivo (PDF / TXT)
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-3 py-1 rounded-lg transition ${
                mode === 'text' ? 'bg-teal-700 text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-white'
              }`}
            >
              Colar Texto
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
            Título do Livro / Framework
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Livro A Psicologia Financeira - Morgan Housel ou Manual de Vendas High Ticket"
            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition"
          />
        </div>

        {mode === 'file' ? (
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Selecionar Arquivo (.pdf, .txt, .md, .doc, .docx)
            </label>
            <div className="border-2 border-dashed border-stone-300 dark:border-slate-700 hover:border-teal-600 rounded-3xl p-6 text-center cursor-pointer bg-white/60 dark:bg-slate-800/40 transition">
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx,.text"
                onChange={handleFileChange}
                className="hidden"
                id="study-file-input"
              />
              <label htmlFor="study-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <FileUp className="w-8 h-8 text-teal-700 dark:text-teal-400" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-200">
                  {selectedFile ? selectedFile.name : 'Clique para carregar o arquivo de estudo'}
                </span>
                <span className="text-[10px] text-stone-500">
                  Formatos aceitos: Livros e artigos em PDF (.pdf) ou texto (.txt, .md)
                </span>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between text-xs text-teal-800 dark:text-teal-300 mt-2 p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/40">
                <span>✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <span className="text-[11px] text-stone-500">Pronto para estudo</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Conteúdo de Estudo (Cole o texto integral, capítulos ou regras)
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o conteúdo técnico completo que você quer que este mentor domine..."
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs font-mono text-stone-800 dark:text-stone-200 outline-none leading-relaxed"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !title.trim() || (mode === 'text' ? !content.trim() : (!content && !fileBase64))}
          className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploadStep || 'Memorizando na plataforma...'}</span>
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" />
              <span>Fazer o Mentor Estudar este Material</span>
            </>
          )}
        </button>
      </form>

      {/* LISTA DE ESTUDOS ATIVOS */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          Materiais que este especialista já domina:
        </h4>

        {loading ? (
          <div className="p-6 text-center text-xs text-stone-500">Carregando base de estudos...</div>
        ) : documents.length === 0 ? (
          <div className="p-6 rounded-3xl bg-stone-50 dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 text-center text-xs text-stone-500">
            Nenhum arquivo de estudo vinculado ainda. Envie um livro ou manual acima para especializá-lo!
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => {
              const isExpanded = expandedDocId === doc.id;
              const chunks = chunksMap[doc.id];
              const isLoadingChunks = loadingChunksDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="rounded-3xl bg-stone-50 dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 overflow-hidden transition shadow-sm"
                >
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h5 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">{doc.title}</h5>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                          <span className="text-teal-800 dark:text-teal-300 font-medium">
                            {doc.total_chunks} fragmentos memorizados
                          </span>
                          <span>•</span>
                          <span>Tipo: {doc.file_type?.toUpperCase() || 'DOCUMENT'}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpandDoc(doc.id)}
                        className="p-2 text-xs text-stone-500 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-stone-200/50 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver Trechos</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        title="Excluir estudo"
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-stone-200/50 dark:hover:bg-slate-800 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
                      <div className="text-[11px] font-medium text-stone-700 dark:text-stone-300 flex items-center justify-between">
                        <span>Fragmentos de Estudo Ativos:</span>
                        <span className="text-[10px] text-stone-500">{chunks?.length || doc.total_chunks} fragmento(s)</span>
                      </div>

                      {isLoadingChunks ? (
                        <div className="p-4 text-center text-xs text-stone-500">Carregando trechos...</div>
                      ) : !chunks || chunks.length === 0 ? (
                        <div className="p-3 text-xs text-stone-500">Nenhum trecho retornado.</div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {chunks.map((chunk, idx) => (
                            <div
                              key={chunk.id || idx}
                              className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-[11px] text-stone-700 dark:text-stone-300 font-serif leading-relaxed"
                            >
                              <div className="flex items-center justify-between text-[9px] text-stone-400 uppercase pb-1 mb-1 border-b border-stone-200 dark:border-slate-700">
                                <span>Fragmento #{idx + 1}</span>
                                <span className="text-teal-700 dark:text-teal-400">Ativo nas Reflexões</span>
                              </div>
                              <p className="whitespace-pre-wrap">{chunk.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
