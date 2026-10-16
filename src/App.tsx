import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  AnimalClass,
  Challenge,
  DataPoint,
  FeatureKey,
  Hyperparameters,
  ModelAlgorithm,
  NormalizationMode
} from './types';
import { getPresetDataset } from './utils/sampleData';
import { buildConfusionMatrix } from './utils/mlEngine';
import { Header } from './components/Header';
import { DataManipulationTab } from './components/DataManipulationTab';
import { StatisticsTab } from './components/StatisticsTab';
import { ModelTrainingTab } from './components/ModelTrainingTab';
import { EvaluationTestingTab } from './components/EvaluationTestingTab';
import { GlossaryModal } from './components/GlossaryModal';
import { DidacticChallengesModal } from './components/DidacticChallengesModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isLimMode, setIsLimMode] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState<boolean>(false);

  // Core Dataset State
  const [dataset, setDataset] = useState<DataPoint[]>(() => getPresetDataset('pets_balanced'));
  const [xAxisFeature, setXAxisFeature] = useState<FeatureKey>('orecchie');
  const [yAxisFeature, setYAxisFeature] = useState<FeatureKey>('baffi');
  const [normMode, setNormMode] = useState<NormalizationMode>('none');
  const [trainTestSplitRatio, setTrainTestSplitRatio] = useState<number>(0.8);

  // Model & Hyperparameters State
  const [algorithm, setAlgorithm] = useState<ModelAlgorithm>('knn');
  const [hyperparameters, setHyperparameters] = useState<Hyperparameters>({
    knnK: 5,
    knnDistanceMetric: 'euclidean',
    epochs: 50,
    learningRate: 0.01,
    batchSize: 16,
    activation: 'relu',
  });
  const [isModelTrained, setIsModelTrained] = useState<boolean>(true);

  // Didactic Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'c1_balance',
      title: 'Il Patto dell\'Equilibrio (Anti-Bias)',
      badge: 'Data Cleaning',
      description: 'Porta il dataset ad avere almeno 10 campioni per ciascuna delle tre classi (Gatti, Cani, Altri) con un bilanciamento uniforme.',
      hint: 'Usa i pulsanti batch (+10) o aggiungi singoli punti per equilibrare i conteggi.',
      isCompleted: false,
      verify: (data) => {
        const cG = data.filter(d => d.class === 'GATTO').length;
        const cC = data.filter(d => d.class === 'CANE').length;
        const cA = data.filter(d => d.class === 'ALTRO').length;
        const total = data.length;
        if (total === 0) return false;
        const minCount = Math.min(cG, cC, cA);
        const maxRatio = Math.max(cG, cC, cA) / total;
        return minCount >= 10 && maxRatio <= 0.45;
      },
    },
    {
      id: 'c2_outlier',
      title: 'Caccia all\'Outlier',
      badge: 'Statistica Robusta',
      description: 'Inserisci un valore anomalo (+ Outlier) per osservare come si discosta dalle medie, quindi usa "Pulisci Outlier" per ripristinare la purezza dei dati.',
      hint: 'Clicca su "+ Outlier" nella Fase 1 per sperimentare la contaminazione del dataset.',
      isCompleted: false,
      verify: (data) => {
        return data.some(d => d.isOutlier);
      },
    },
    {
      id: 'c3_split',
      title: 'La Separazione di Verifica',
      badge: 'Metodologia',
      description: 'Configura un partizionamento del dataset impostando almeno 8 campioni nel Test Set per validare il modello su dati non visti.',
      hint: 'Regola lo slider "Partizione Train/Test" nella Fase 1.',
      isCompleted: false,
      verify: (data) => {
        const testCount = data.filter(d => d.isTest).length;
        return testCount >= 8;
      },
    },
    {
      id: 'c4_accuracy',
      title: 'Maestro del Confine Decisionale',
      badge: 'Machine Learning',
      description: 'Addestra il modello e raggiungi un\'accuratezza globale superiore all\'80% sulla matrice di confusione.',
      hint: 'Usa k=3 o k=5 e assicurati che le classi siano ben separate.',
      isCompleted: false,
      verify: (data, confMatrix) => {
        return !!(confMatrix && confMatrix.accuracy >= 0.80 && data.length >= 20);
      },
    },
  ]);

  // Check challenge completion dynamically
  useEffect(() => {
    const confMatrix = buildConfusionMatrix(dataset, hyperparameters, algorithm);
    let justCompleted = false;

    setChallenges(prev =>
      prev.map(c => {
        const wasDone = c.isCompleted;
        const isNowDone = wasDone || c.verify(dataset, confMatrix, isModelTrained);
        if (!wasDone && isNowDone) {
          justCompleted = true;
        }
        return { ...c, isCompleted: isNowDone };
      })
    );

    if (justCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [dataset, hyperparameters, algorithm, isModelTrained]);

  const completedChallengesCount = challenges.filter(c => c.isCompleted).length;

  return (
    <div className={`min-h-screen flex flex-col justify-between p-3 sm:p-5 transition-colors ${
      isLimMode ? 'bg-slate-200 text-slate-950 text-lg' : 'bg-slate-100 text-slate-900'
    }`}>
      
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataset={dataset}
        isLimMode={isLimMode}
        setIsLimMode={setIsLimMode}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenChallenges={() => setIsChallengesOpen(true)}
        completedChallengesCount={completedChallengesCount}
        totalChallengesCount={challenges.length}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto flex-1 my-4">
        {activeTab === 1 && (
          <DataManipulationTab
            dataset={dataset}
            setDataset={setDataset}
            xAxisFeature={xAxisFeature}
            setXAxisFeature={setXAxisFeature}
            yAxisFeature={yAxisFeature}
            setYAxisFeature={setYAxisFeature}
            normMode={normMode}
            setNormMode={setNormMode}
            trainTestSplitRatio={trainTestSplitRatio}
            setTrainTestSplitRatio={setTrainTestSplitRatio}
            onNavigateNext={() => setActiveTab(2)}
          />
        )}

        {activeTab === 2 && (
          <StatisticsTab
            dataset={dataset}
            onNavigatePrev={() => setActiveTab(1)}
            onNavigateNext={() => setActiveTab(3)}
          />
        )}

        {activeTab === 3 && (
          <ModelTrainingTab
            dataset={dataset}
            algorithm={algorithm}
            setAlgorithm={setAlgorithm}
            hyperparameters={hyperparameters}
            setHyperparameters={setHyperparameters}
            isModelTrained={isModelTrained}
            setIsModelTrained={setIsModelTrained}
            xAxisFeature={xAxisFeature}
            yAxisFeature={yAxisFeature}
            onNavigatePrev={() => setActiveTab(2)}
            onNavigateNext={() => setActiveTab(4)}
          />
        )}

        {activeTab === 4 && (
          <EvaluationTestingTab
            dataset={dataset}
            algorithm={algorithm}
            hyperparameters={hyperparameters}
            isModelTrained={isModelTrained}
            onNavigatePrev={() => setActiveTab(3)}
            onRestartDataset={() => {
              setDataset(getPresetDataset('pets_balanced'));
              setActiveTab(1);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto text-center py-4 border-t border-slate-300 text-xs text-slate-600 font-medium">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Laboratorio Didattico Interattivo di Machine Learning &amp; Data Science per Scuole e Università
          </span>
          <div className="flex items-center gap-3 font-mono">
            <span>🐱 Gatto | 🐶 Cane | 🐾 Altro</span>
            <span>•</span>
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="text-blue-800 font-bold hover:underline"
            >
              Glossario Didattico
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      <DidacticChallengesModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        challenges={challenges}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsChallengesOpen(false);
        }}
      />

    </div>
  );
}
