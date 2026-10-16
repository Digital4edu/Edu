import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Zap,
  Target,
  BarChart2,
  CheckSquare,
  HelpCircleIcon
} from 'lucide-react';
import {
  AnimalClass,
  ConfusionMatrix,
  DataPoint,
  FeatureKey,
  Hyperparameters,
  ModelAlgorithm,
  PredictionResult
} from '../types';
import { FEATURE_METAS } from '../utils/sampleData';
import { buildConfusionMatrix, predictKNN, predictNeuralNet } from '../utils/mlEngine';

interface Props {
  dataset: DataPoint[];
  algorithm: ModelAlgorithm;
  hyperparameters: Hyperparameters;
  isModelTrained: boolean;
  onNavigatePrev: () => void;
  onRestartDataset: () => void;
}

export const EvaluationTestingTab: React.FC<Props> = ({
  dataset,
  algorithm,
  hyperparameters,
  isModelTrained,
  onNavigatePrev,
  onRestartDataset,
}) => {
  // Test sample inputs
  const [testFeatures, setTestFeatures] = useState<{ [key in FeatureKey]: number }>({
    orecchie: 82,
    baffi: 85,
    coda: 78,
    peso: 25,
  });

  const [activeCellDetail, setActiveCellDetail] = useState<{
    actual: AnimalClass;
    predicted: AnimalClass;
    count: number;
  } | null>(null);

  const classes: AnimalClass[] = ['GATTO', 'CANE', 'ALTRO'];

  // Real-time prediction
  const prediction: PredictionResult = algorithm === 'knn'
    ? predictKNN(testFeatures, dataset.filter(d => !d.isTest), hyperparameters)
    : predictNeuralNet(testFeatures, dataset.filter(d => !d.isTest), hyperparameters);

  // Compute real-time Confusion Matrix & Metrics
  const confMatrix: ConfusionMatrix = buildConfusionMatrix(
    dataset,
    hyperparameters,
    algorithm
  );

  const testSetCount = dataset.filter(d => d.isTest).length;
  const trainSetCount = dataset.filter(d => !d.isTest).length;

  // Preset test points
  const handleSetTestPreset = (type: 'cat' | 'dog' | 'other' | 'boundary') => {
    if (type === 'cat') {
      setTestFeatures({ orecchie: 85, baffi: 88, coda: 80, peso: 20 });
    } else if (type === 'dog') {
      setTestFeatures({ orecchie: 25, baffi: 22, coda: 40, peso: 70 });
    } else if (type === 'other') {
      setTestFeatures({ orecchie: 45, baffi: 30, coda: 20, peso: 35 });
    } else {
      // Borderline point
      setTestFeatures({ orecchie: 55, baffi: 52, coda: 50, peso: 45 });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Titolo */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-slate-300 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-emerald-700 uppercase font-mono">
                FASE 4 DI 4: COLLAUDO, PREDIZIONI &amp; METRICHE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                Evaluation &amp; XAI
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Collaudo in Tempo Reale &amp; Matrice di Confusione
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-700">
              Valutazione su: {testSetCount > 0 ? `Test Set (${testSetCount} campioni mai visti)` : `Train Set (${trainSetCount} campioni)`}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Metti alla prova il modello cambiando le caratteristiche o usa la <strong>Matrice di Confusione</strong> per scoprire quali animali vengono scambiati tra loro!
        </p>
      </div>

      {/* SECTION 1: Real-time Testing Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              Caratteristiche del Nuovo Animale da Testare
            </h3>

            {/* Quick Test Presets */}
            <div className="flex gap-1 text-[11px] font-extrabold font-mono">
              <button
                onClick={() => handleSetTestPreset('cat')}
                className="px-2 py-1 bg-emerald-100 text-emerald-900 rounded-lg hover:bg-emerald-200"
                title="Imposta caratteristiche tipiche da gatto"
              >
                🐱 Gatto
              </button>
              <button
                onClick={() => handleSetTestPreset('dog')}
                className="px-2 py-1 bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200"
                title="Imposta caratteristiche tipiche da cane"
              >
                🐶 Cane
              </button>
              <button
                onClick={() => handleSetTestPreset('boundary')}
                className="px-2 py-1 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200"
                title="Imposta punto incerto sul confine"
              >
                ❓ Confine
              </button>
            </div>
          </div>

          {/* 4 Feature Sliders */}
          <div className="space-y-4">
            {FEATURE_METAS.map(f => {
              const val = testFeatures[f.key];
              let color = 'accent-emerald-600';
              if (f.key === 'baffi') color = 'accent-amber-500';
              if (f.key === 'coda') color = 'accent-purple-600';
              if (f.key === 'peso') color = 'accent-blue-600';

              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">
                      {f.label}:
                    </span>
                    <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300 text-sm">
                      {val} {f.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) =>
                      setTestFeatures(prev => ({
                        ...prev,
                        [f.key]: parseInt(e.target.value),
                      }))
                    }
                    className={`w-full ${color} h-2.5 bg-slate-200 rounded-lg cursor-pointer`}
                  />
                  <div className="text-[10px] text-slate-500 font-medium">
                    {f.description}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Prediction Verdict Card (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
              <span className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider">
                Verdetto di Predizione del Modello
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-100 text-blue-900 uppercase">
                {algorithm === 'knn' ? `k-NN (k=${hyperparameters.knnK})` : 'Rete Neurale'}
              </span>
            </div>

            {/* Verdict Box */}
            <div
              className={`mt-4 p-5 rounded-2xl border-4 text-center space-y-2 transition-all ${
                prediction.predictedClass === 'GATTO'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-md'
                  : prediction.predictedClass === 'CANE'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-md'
                  : 'bg-purple-50 border-purple-500 text-purple-950 shadow-md'
              }`}
            >
              <div className="text-4xl">
                {prediction.predictedClass === 'GATTO' && '🐱'}
                {prediction.predictedClass === 'CANE' && '🐶'}
                {prediction.predictedClass === 'ALTRO' && '🐾'}
              </div>
              <div className="text-2xl font-black uppercase tracking-tight">
                Classe Prevista: {prediction.predictedClass}
              </div>
              <div className="text-sm font-mono font-extrabold">
                Confidenza: {Math.round(prediction.probabilities[prediction.predictedClass] * 100)}%
              </div>
            </div>

            {/* Probability Breakdown Bars */}
            <div className="mt-4 space-y-2 font-mono text-xs">
              {classes.map(cls => {
                const prob = prediction.probabilities[cls];
                const pct = Math.round(prob * 100);
                let barColor = 'bg-emerald-600';
                if (cls === 'CANE') barColor = 'bg-amber-500';
                if (cls === 'ALTRO') barColor = 'bg-purple-600';

                return (
                  <div key={cls} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{cls === 'GATTO' ? '🐱 Gatto' : cls === 'CANE' ? '🐶 Cane' : '🐾 Altro'}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
                      <div
                        className={`${barColor} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainability Callout (XAI) */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-700 space-y-1">
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Spiegazione dell'I.A. (Explainability):
            </span>
            <p className="font-medium text-[11px] leading-relaxed">
              {prediction.explanation}
            </p>
          </div>

        </div>

      </div>

      {/* SECTION 2: Confusion Matrix & Core Evaluation Metrics */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-slate-300 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-700" />
              Matrice di Confusione 3×3 &amp; Indicatori di Accuratezza
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Le celle verdi sulla diagonale sono le predizioni corrette. Le celle arancioni/rosse indicano errori di classificazione.
            </p>
          </div>
          <div className="px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-mono font-black text-emerald-900">
            Accuratezza Globale: {Math.round(confMatrix.accuracy * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Confusion Matrix Table (6 cols) */}
          <div className="lg:col-span-6 overflow-x-auto">
            <div className="text-center font-mono text-[11px] font-bold text-slate-500 mb-1">
              CLASSE PREDETTA DALL'I.A. ➔
            </div>
            
            <table className="w-full text-center border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-bold text-slate-500 text-[10px] uppercase">
                    Classe Reale ↓
                  </th>
                  <th className="p-2 font-black text-emerald-800 bg-emerald-50 rounded-t-xl border border-emerald-200">
                    Gatto 🐱
                  </th>
                  <th className="p-2 font-black text-amber-800 bg-amber-50 rounded-t-xl border border-amber-200">
                    Cane 🐶
                  </th>
                  <th className="p-2 font-black text-purple-900 bg-purple-50 rounded-t-xl border border-purple-200">
                    Altro 🐾
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map(actual => (
                  <tr key={actual}>
                    <td className="p-2 text-left font-black text-slate-800 text-xs border border-slate-200 bg-slate-50">
                      {actual === 'GATTO' ? '🐱 Gatto (Reale)' : actual === 'CANE' ? '🐶 Cane (Reale)' : '🐾 Altro (Reale)'}
                    </td>
                    {classes.map(predicted => {
                      const count = confMatrix.matrix[actual][predicted];
                      const isCorrect = actual === predicted;

                      return (
                        <td key={predicted} className="p-1">
                          <button
                            onClick={() => setActiveCellDetail({ actual, predicted, count })}
                            className={`w-full py-3 px-2 rounded-xl text-sm font-black transition border-2 ${
                              isCorrect
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400 shadow-sm'
                                : count > 0
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-rose-400 shadow-sm'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {count}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {activeCellDetail && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-300 rounded-2xl text-xs font-mono text-blue-900">
                💡 <strong>Dettaglio Cella:</strong> {activeCellDetail.count} campioni realmente appartenenti a <strong>{activeCellDetail.actual}</strong> sono stati classificati come <strong>{activeCellDetail.predicted}</strong> {activeCellDetail.actual === activeCellDetail.predicted ? '(Predizione Esatta! ✓)' : '(Errore di Confusione! ⚠️)'}.
              </div>
            )}
          </div>

          {/* Metrics Dashboard: Precision, Recall, F1 (6 cols) */}
          <div className="lg:col-span-6 space-y-3 bg-slate-50 p-5 rounded-2xl border-2 border-slate-300">
            <h4 className="font-extrabold text-xs uppercase font-mono text-slate-600 flex items-center justify-between">
              <span>Metriche di Valutazione per Classe</span>
              <span className="font-bold text-slate-800">Macro F1: {confMatrix.macroF1}</span>
            </h4>

            <div className="space-y-3 font-mono text-xs">
              {classes.map(cls => (
                <div key={cls} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-black text-slate-900">
                    <span>{cls === 'GATTO' ? '🐱 Gatto' : cls === 'CANE' ? '🐶 Cane' : '🐾 Altro'}</span>
                    <span className="text-[11px] font-bold text-indigo-700">
                      F1-Score: {confMatrix.f1Score[cls]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-700">
                    <div>
                      Precision: <strong>{Math.round(confMatrix.precision[cls] * 100)}%</strong>
                      <span className="block text-[10px] text-slate-500 font-sans">
                        Quando dice {cls}, quante volte indovina?
                      </span>
                    </div>
                    <div>
                      Recall: <strong>{Math.round(confMatrix.recall[cls] * 100)}%</strong>
                      <span className="block text-[10px] text-slate-500 font-sans">
                        Quanti dei veri {cls} ha intercettato?
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 font-medium leading-tight">
              💡 <strong>Perché non basta solo l'Accuracy?</strong> Se un dataset ha 95 cani e 5 gatti, un modello che risponde sempre "Cane" ha il 95% di accuratezza, ma il Recall sui gatti è 0%! Precision e Recall svelano questo trucco.
            </div>

          </div>

        </div>

      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onNavigatePrev}
          className="py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Fase 3: Iperparametri &amp; Modello</span>
        </button>

        <button
          onClick={onRestartDataset}
          className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg flex items-center gap-2 transition active:scale-98"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Nuovo Esperimento (Fase 1)</span>
        </button>
      </div>

    </div>
  );
};
