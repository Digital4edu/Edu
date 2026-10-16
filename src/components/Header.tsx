import React from 'react';
import {
  Brain,
  Database,
  BarChart3,
  Sliders,
  CheckSquare,
  BookOpen,
  Trophy,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AnimalClass, DataPoint } from '../types';

interface Props {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  dataset: DataPoint[];
  isLimMode: boolean;
  setIsLimMode: (val: boolean) => void;
  onOpenGlossary: () => void;
  onOpenChallenges: () => void;
  completedChallengesCount: number;
  totalChallengesCount: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  dataset,
  isLimMode,
  setIsLimMode,
  onOpenGlossary,
  onOpenChallenges,
  completedChallengesCount,
  totalChallengesCount,
}) => {
  const catCount = dataset.filter(d => d.class === 'GATTO').length;
  const dogCount = dataset.filter(d => d.class === 'CANE').length;
  const otherCount = dataset.filter(d => d.class === 'ALTRO').length;
  const total = dataset.length;

  return (
    <header className="w-full max-w-7xl mx-auto space-y-3">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-xl border-4 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase">
                  LABORATORIO DATA SCIENCE &amp; ML
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Didattica Interattiva
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-blue-200/90 mt-0.5">
                Manipolazione dati, analisi statistica in tempo reale, k-NN &amp; Reti Neurali per studenti
              </p>
            </div>
          </div>

          {/* Quick Info & Didactic Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Class distribution badge */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-2xl px-3 py-1.5 font-mono text-xs shadow-inner">
              <Database className="w-4 h-4 text-amber-400" />
              <span className="font-extrabold text-white mr-1">{total} campioni:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> {catCount}
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> {dogCount}
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> {otherCount}
              </span>
            </div>

            {/* Glossary Button */}
            <button
              onClick={onOpenGlossary}
              className="px-3 py-2 bg-blue-800/60 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs flex items-center gap-1.5 border border-blue-600/60 transition shadow-sm"
              title="Dizionario dei concetti statistici e machine learning"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Dizionario</span>
            </button>

            {/* Challenges Button */}
            <button
              onClick={onOpenChallenges}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs flex items-center gap-1.5 border-2 border-amber-300 transition shadow-md"
              title="Sfide e missioni didattiche"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>Sfide ({completedChallengesCount}/{totalChallengesCount})</span>
            </button>

            {/* LIM / High Contrast Mode Toggle */}
            <button
              onClick={() => setIsLimMode(!isLimMode)}
              className={`p-2 rounded-2xl border transition text-xs font-bold flex items-center gap-1 ${
                isLimMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Modalità LIM (caratteri grandi e contrasto per proiezione)"
            >
              {isLimMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">LIM</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main 4 Step Tabs */}
      <nav className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {/* Tab 1 */}
        <button
          onClick={() => setActiveTab(1)}
          className={`py-3 px-3 rounded-2xl border-4 font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] ${
            activeTab === 1
              ? 'border-blue-600 bg-blue-700 text-white shadow-md'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black flex items-center justify-center text-xs sm:text-sm shrink-0 ${
              activeTab === 1 ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-700'
            }`}
          >
            1
          </span>
          <span className="truncate">1. Manipolazione Dati</span>
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setActiveTab(2)}
          className={`py-3 px-3 rounded-2xl border-4 font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] ${
            activeTab === 2
              ? 'border-indigo-600 bg-indigo-700 text-white shadow-md'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black flex items-center justify-center text-xs sm:text-sm shrink-0 ${
              activeTab === 2 ? 'bg-white text-indigo-900' : 'bg-slate-200 text-slate-700'
            }`}
          >
            2
          </span>
          <span className="truncate">2. Statistica in Tempo Reale</span>
        </button>

        {/* Tab 3 */}
        <button
          onClick={() => setActiveTab(3)}
          className={`py-3 px-3 rounded-2xl border-4 font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] ${
            activeTab === 3
              ? 'border-violet-600 bg-violet-700 text-white shadow-md'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black flex items-center justify-center text-xs sm:text-sm shrink-0 ${
              activeTab === 3 ? 'bg-white text-violet-900' : 'bg-slate-200 text-slate-700'
            }`}
          >
            3
          </span>
          <span className="truncate">3. Iperparametri &amp; Modelli</span>
        </button>

        {/* Tab 4 */}
        <button
          onClick={() => setActiveTab(4)}
          className={`py-3 px-3 rounded-2xl border-4 font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] ${
            activeTab === 4
              ? 'border-emerald-600 bg-emerald-700 text-white shadow-md'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black flex items-center justify-center text-xs sm:text-sm shrink-0 ${
              activeTab === 4 ? 'bg-white text-emerald-900' : 'bg-slate-200 text-slate-700'
            }`}
          >
            4
          </span>
          <span className="truncate">4. Valutazione &amp; Collaudo</span>
        </button>
      </nav>
    </header>
  );
};
