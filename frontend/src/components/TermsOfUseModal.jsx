import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Calendar,
  Lock,
} from 'lucide-react';

export const TERMS_VERSION = 'v1.0-beta-2026';

export default function TermsOfUseModal({
  isOpen,
  onClose,
  onAccept,
  alreadyAccepted = false,
  acceptedAt = null,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl flex flex-col max-h-[90dvh] text-stone-800 dark:text-stone-100 overflow-hidden font-sans"
        >
          {/* HEADER DO MODAL */}
          <div className="p-5 sm:p-6 pb-4 border-b border-stone-200/80 dark:border-slate-800 flex items-start justify-between gap-4 bg-stone-50/80 dark:bg-slate-900/80">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-stone-900 dark:text-stone-50">
                    Termos e Condições de Uso
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    Versão Beta • {TERMS_VERSION}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Última atualização: 18 de Outubro de 2026 • Lynx EMS</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Fechar leitura"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ALERTA DE FASE BETA */}
          <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Aviso Importante de Validade Jurídica:</strong> O ISAAC opera em fase experimental contínua (Beta). A leitura atenta e a concordância expressa com as cláusulas de isenção de responsabilidade e autonomia de backup são condições obrigatórias para acesso à plataforma.
            </div>
          </div>

          {/* CORPO DO TEXTO JURÍDICO */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif select-text">
            <div>
              <p className="mb-3">
                Bem-vindo(a) ao <strong>ISAAC</strong> (
                <a
                  href="https://isaac.lynxems.com.br/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 dark:text-teal-400 hover:underline"
                >
                  https://isaac.lynxems.com.br/
                </a>
                ), um aplicativo desenvolvido, operado e mantido por <strong>Lynx EMS Soluções Tecnológicas Ltda.</strong> (doravante denominada "Desenvolvedora").
              </p>
              <p>
                A leitura, compreensão e aceitação destes Termos de Uso são obrigatórias e indispensáveis para a utilização do aplicativo. Ao marcar a caixa de aceitação e utilizar o ISAAC, você ("Usuário") expressa sua <strong>concordância plena, integral e sem reservas</strong> com todas as condições aqui descritas. Caso não concorde com qualquer disposição, você deve interromper imediatamente o acesso e não utilizar a plataforma.
              </p>
            </div>

            {/* SEÇÃO 1 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 space-y-2 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                1. Fase de Desenvolvimento (Versão Beta)
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>1.1.</strong> O Usuário reconhece e concorda expressamente que o Aplicativo ISAAC encontra-se em fase de desenvolvimento, testes e aprimoramento contínuo (Versão Beta).
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>1.2.</strong> A plataforma é disponibilizada <em>"no estado em que se encontra" (as is)</em> e <em>"conforme a disponibilidade" (as available)</em>. Devido à natureza de um software em construção, o sistema pode apresentar instabilidades operacionais, erros estruturais (bugs), interrupções de acesso, lentidão ou resultar na perda, corrupção e indisponibilidade temporária ou permanente de dados.
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>1.3.</strong> O Usuário concorda em utilizar a plataforma assumindo integral e exclusivamente todos os riscos inerentes a esta fase de testes e desenvolvimento.
              </p>
            </div>

            {/* SEÇÃO 2 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 space-y-2 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                2. Direito de Alteração e Suspensão Sem Aviso Prévio
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>2.1.</strong> A Desenvolvedora reserva-se o direito exclusivo, absoluto e incondicional de, a qualquer momento e sem a necessidade de qualquer aviso prévio, notificação ou consentimento do Usuário:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-stone-600 dark:text-stone-300">
                <li>Modificar, atualizar, adicionar ou remover funcionalidades, interfaces, layouts e ferramentas do Aplicativo;</li>
                <li>Alterar regras de negócio, fluxos de acesso, limites de uso ou modelos de precificação;</li>
                <li>Suspender, descontinuar ou encerrar parcial ou totalmente o funcionamento do Aplicativo.</li>
              </ul>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                <strong>2.2.</strong> O Usuário concorda expressamente que nenhuma dessas alterações gerará qualquer tipo de direito adquirido, reclamação, indenização ou compensação por eventuais impactos em suas operações. A continuidade do uso do Aplicativo após as mudanças configura a aceitação tácita e irrevogável do novo estado do sistema.
              </p>
            </div>

            {/* SEÇÃO 3 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 space-y-2 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                3. Isenção e Limitação de Responsabilidade Jurídica
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>3.1.</strong> Na extensão máxima permitida pela legislação aplicável, a Desenvolvedora, seus mantenedores, sócios, programadores e parceiros não serão responsabilizados, em nenhuma hipótese, nas esferas cível, criminal ou administrativa, por:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-stone-600 dark:text-stone-300">
                <li>Quaisquer danos diretos, indiretos, incidentais, especiais, morais ou lucros cessantes resultantes do uso, do mau funcionamento ou da incapacidade de usar o Aplicativo;</li>
                <li>Perda, corrupção, exclusão involuntária ou vazamento de dados, arquivos e informações inseridas na plataforma pelo Usuário;</li>
                <li>Quaisquer falhas operacionais, atrasos, ou prejuízos financeiros derivados da dependência do Usuário em relação às informações, processos ou relatórios gerados pelo sistema.</li>
              </ul>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                <strong>3.2.</strong> O Aplicativo atua como ferramenta de apoio reflexivo e metodológico. É de inteira e exclusiva responsabilidade do Usuário manter cópias de segurança (backups) em ambientes externos de todas as informações críticas inseridas no ISAAC. Ao aceitar estes termos, o Usuário isenta a Desenvolvedora e renuncia ao direito de ajuizar processos por eventuais perdas.
              </p>
            </div>

            {/* SEÇÃO 4 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 space-y-2 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                4. Propriedade Intelectual
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>4.1.</strong> Todo o código-fonte, design, interfaces, bancos de dados, logotipos, marca e arquitetura do Aplicativo ISAAC são de propriedade exclusiva da Desenvolvedora. O acesso à plataforma concede apenas uma licença de uso temporária, precária, revogável, intransferível e não exclusiva, não conferindo ao Usuário nenhum direito de propriedade intelectual, cópia, modificação, engenharia reversa, comercialização ou distribuição do software.
              </p>
            </div>

            {/* SEÇÃO 5 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 space-y-2 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                5. Conduta do Usuário
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>5.1.</strong> O Usuário compromete-se a utilizar o aplicativo de forma lícita e ética. É terminantemente proibido tentar burlar a segurança do sistema, realizar ataques cibernéticos, utilizar robôs (bots), ou inserir códigos maliciosos.
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>5.2.</strong> Qualquer violação destas regras resultará no banimento e exclusão imediata da conta do Usuário, sem a necessidade de aviso prévio.
              </p>
            </div>

            {/* SEÇÃO 6 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 space-y-2 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                6. Disposições Gerais e Foro
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>6.1.</strong> Estes termos são regidos e interpretados segundo as leis da República Federativa do Brasil.
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <strong>6.2.</strong> Para dirimir quaisquer litígios, processos ou controvérsias oriundas deste instrumento, fica eleito o foro da Comarca de <strong>Belo Horizonte / Minas Gerais</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </div>
          </div>

          {/* FOOTER COM BOTÕES */}
          <div className="p-4 sm:p-5 border-t border-stone-200/80 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 w-full sm:w-auto">
              <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Aceite registrado com carimbo forense (IP + Timestamp)</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 text-xs font-medium transition cursor-pointer"
              >
                Voltar
              </button>

              {onAccept && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold tracking-wide shadow-md shadow-teal-700/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Li e Concordo com os Termos</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
