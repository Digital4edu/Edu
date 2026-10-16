import React from 'react';
import { Trophy, CheckCircle, Circle, ArrowRight, X, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Challenge } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  challenges: Challenge[];
  onNavigateTab: (tabId: number) => void;
}

export const DidacticChallengesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  challenges,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const completedCount = challenges.filter(c => c.isCompleted).length;

  const handleConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-4 border-amber-500 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-amber-700 flex items-center justify-center shadow-md">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">Sfide di Apprendimento</h2>
                <span className="px-2.5 py-0.5 bg-slate-950 text-amber-400 font-mono font-black text-xs rounded-full">
                  {completedCount} / {challenges.length}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900/80">Obiettivi pratici per padroneggiare la Data Science e il Machine Learning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/10 hover:bg-black/20 text-slate-950 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-amber-100 p-3 border-b border-amber-200">
          <div className="flex justify-between text-xs font-extrabold text-amber-950 mb-1">
            <span>Progresso delle Missioni Didattiche</span>
            <span>{Math.round((completedCount / challenges.length) * 100)}%</span>
          </div>
          <div className="w-full bg-amber-200 h-3 rounded-full overflow-hidden border border-amber-300">
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${(completedCount / challenges.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Challenge list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {challenges.map((c, idx) => (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border-2 transition ${
                c.isCompleted
                  ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {c.isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-500">SFIDA {idx + 1}</span>
                      <h3 className="text-base font-extrabold text-slate-900">{c.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white border border-slate-300 text-slate-700">
                        {c.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium">
                      {c.description}
                    </p>
                    <div className="p-2 bg-white/70 rounded-xl text-xs text-slate-600 font-mono">
                      💡 <strong>Consiglio pratico:</strong> {c.hint}
                    </div>
                  </div>
                </div>

                {c.isCompleted && (
                  <button
                    onClick={handleConfetti}
                    title="Festeggia completamento"
                    className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition shrink-0"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600">
            {completedCount === challenges.length
              ? '🎉 Bravissimo! Hai completato tutte le sfide di Machine Learning!'
              : 'Completa le sfide manipolando dati, metriche e modelli.'}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition"
          >
            Continua Laboratorio
          </button>
        </div>

      </div>
    </div>
  );
};
