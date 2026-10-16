import React, { useRef, useEffect, useState } from 'react';
import {
  Brain,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import {
  AnimalClass,
  DataPoint,
  FeatureKey,
  Hyperparameters,
  ModelAlgorithm,
  TrainingHistoryEpoch
} from '../types';
import { FEATURE_METAS } from '../utils/sampleData';
import { generateDecisionBoundaryGrid } from '../utils/mlEngine';

interface Props {
  dataset: DataPoint[];
  algorithm: ModelAlgorithm;
  setAlgorithm: (alg: ModelAlgorithm) => void;
  hyperparameters: Hyperparameters;
  setHyperparameters: React.Dispatch<React.SetStateAction<Hyperparameters>>;
  isModelTrained: boolean;
  setIsModelTrained: (val: boolean) => void;
  xAxisFeature: FeatureKey;
  yAxisFeature: FeatureKey;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
}

export const ModelTrainingTab: React.FC<Props> = ({
  dataset,
  algorithm,
  setAlgorithm,
  hyperparameters,
  setHyperparameters,
  isModelTrained,
  setIsModelTrained,
  xAxisFeature,
  yAxisFeature,
  onNavigatePrev,
  onNavigateNext,
}) => {
  const boundaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lossCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryEpoch[]>([]);

  const trainData = dataset.filter(d => !d.isTest);
  const testData = dataset.filter(d => d.isTest);

  // Generate simulated training history curves
  const generateTrainingCurves = () => {
    const history: TrainingHistoryEpoch[] = [];
    const maxE = hyperparameters.epochs;
    let tLoss = 0.95;
    let valLoss = 0.98;

    const lr = hyperparameters.learningRate;
    const batch = hyperparameters.batchSize;

    for (let e = 1; e <= maxE; e++) {
      let decay = lr * 2.8;
      let noise = (Math.random() - 0.5) * (0.1 / Math.sqrt(batch));

      if (lr >= 0.05) {
        // High LR: oscillates
        noise += (Math.random() - 0.5) * 0.22;
      }

      tLoss = Math.max(0.04, tLoss - decay * Math.exp(-e / 35) + noise);
      
      // Validation loss might overfit if epochs are large
      const overfitFactor = e > 50 && hyperparameters.knnK === 1 ? (e - 50) * 0.003 : 0;
      valLoss = Math.max(0.08, tLoss + 0.06 + Math.abs(noise * 0.7) + overfitFactor);

      const tAcc = Math.min(0.99, Math.max(0.4, 1 - tLoss * 0.9));
      const valAcc = Math.min(0.95, Math.max(0.35, 1 - valLoss * 0.85));

      history.push({
        epoch: e,
        trainLoss: Number(tLoss.toFixed(3)),
        testLoss: Number(valLoss.toFixed(3)),
        trainAcc: Number(tAcc.toFixed(3)),
        testAcc: Number(valAcc.toFixed(3)),
      });
    }

    return history;
  };

  // Run Training Animation
  const handleStartTraining = () => {
    if (trainData.length === 0) return;
    setIsTraining(true);
    setCurrentEpoch(0);

    const fullHistory = generateTrainingCurves();
    let step = 0;
    const totalSteps = fullHistory.length;

    const interval = setInterval(() => {
      step += Math.max(1, Math.floor(totalSteps / 25));
      if (step >= totalSteps) {
        step = totalSteps;
        clearInterval(interval);
        setIsTraining(false);
        setIsModelTrained(true);
      }
      setCurrentEpoch(step);
      setTrainingHistory(fullHistory.slice(0, step));
    }, 45);
  };

  // Auto initialize curves on load
  useEffect(() => {
    const history = generateTrainingCurves();
    setTrainingHistory(history);
    setCurrentEpoch(history.length);
    setIsModelTrained(true);
  }, [hyperparameters, algorithm]);

  // Render Decision Boundary Canvas
  useEffect(() => {
    const canvas = boundaryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // 1. Compute 2D Decision Boundary Grid
    const activeData = trainData.length > 0 ? trainData : dataset;
    if (activeData.length > 0) {
      const resolution = 35;
      const grid = generateDecisionBoundaryGrid(
        activeData,
        hyperparameters,
        algorithm,
        [xAxisFeature, yAxisFeature],
        resolution
      );

      const cellW = plotW / resolution;
      const cellH = plotH / resolution;

      grid.forEach(cell => {
        const cx = padL + (cell.x / 100) * plotW - cellW / 2;
        const cy = padT + (1 - cell.y / 100) * plotH - cellH / 2;

        let fill = 'rgba(5, 150, 105, 0.22)'; // GATTO: green
        if (cell.cls === 'CANE') fill = 'rgba(245, 158, 11, 0.25)'; // CANE: amber
        if (cell.cls === 'ALTRO') fill = 'rgba(139, 92, 246, 0.22)'; // ALTRO: purple

        ctx.fillStyle = fill;
        ctx.fillRect(cx, cy, cellW + 0.8, cellH + 0.8);
      });
    }

    // 2. Draw axes and grid lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i += 2) {
      const x = padL + (i / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      const y = padT + (i / 10) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Axis labels
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${xAxisFeature} (%) ➔`, padL + plotW / 2, height - 10);

    // 3. Draw Training & Test Points on top of boundary
    dataset.forEach(pt => {
      const px = padL + (pt.features[xAxisFeature] / 100) * plotW;
      const py = padT + (1 - pt.features[yAxisFeature] / 100) * plotH;

      let color = '#059669';
      if (pt.class === 'CANE') color = '#f59e0b';
      if (pt.class === 'ALTRO') color = '#7e22ce';

      ctx.beginPath();
      ctx.arc(px, py, pt.isTest ? 5.5 : 5, 0, Math.PI * 2);

      if (pt.isTest) {
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
      }
    });
  }, [dataset, hyperparameters, algorithm, xAxisFeature, yAxisFeature]);

  // Render Loss & Accuracy Chart
  useEffect(() => {
    const canvas = lossCanvasRef.current;
    if (!canvas || trainingHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padL = 35;
    const padR = 15;
    const padT = 15;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.fillText((1 - i / 4).toFixed(2), padL - 5, y + 3);
    }

    // Border
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Draw Train Loss (Blue)
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;

    trainingHistory.forEach((item, idx) => {
      const x = padL + (idx / (trainingHistory.length - 1 || 1)) * plotW;
      const y = padT + (1 - Math.max(0, Math.min(1, item.trainLoss))) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Test Loss (Rose)
    ctx.beginPath();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    trainingHistory.forEach((item, idx) => {
      const x = padL + (idx / (trainingHistory.length - 1 || 1)) * plotW;
      const y = padT + (1 - Math.max(0, Math.min(1, item.testLoss))) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Train Accuracy (Emerald thin)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;

    trainingHistory.forEach((item, idx) => {
      const x = padL + (idx / (trainingHistory.length - 1 || 1)) * plotW;
      const y = padT + (1 - Math.max(0, Math.min(1, item.trainAcc))) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Plus Jakarta Sans"';
    ctx.textAlign = 'center';
    ctx.fillText('Epoche (Avanzamento dell\'apprendimento) ➔', padL + plotW / 2, height - 6);
  }, [trainingHistory]);

  const currentLossItem = trainingHistory[trainingHistory.length - 1];

  return (
    <div className="space-y-6">
      
      {/* Banner Titolo & Model Switcher */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-violet-700 uppercase font-mono">
                FASE 3 DI 4: IPERPARAMETRI &amp; ADDESTRAMENTO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-violet-100 text-violet-900 border border-violet-300">
                Decision Boundary
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Scelta Algoritmo &amp; Mappa dei Confini di Decisione
            </h2>
          </div>

          {/* Algorithm Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border-2 border-slate-300">
            <button
              onClick={() => setAlgorithm('knn')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                algorithm === 'knn'
                  ? 'bg-violet-700 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              k-NN (Geometria dei Vicini)
            </button>
            <button
              onClick={() => setAlgorithm('neural_net')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                algorithm === 'neural_net'
                  ? 'bg-violet-700 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Rete Neurale (Softmax)
            </button>
          </div>
        </div>

        {/* Algorithm description */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          {algorithm === 'knn' ? (
            <>
              💡 <strong>k-Nearest Neighbors (k-NN):</strong> Assegna la classe confrontando le distanze con i <strong>k vicini più prossimi</strong>. Guarda lo sfondo colorato: cambiando il valore di <em>k</em>, il confine decisionale passa da isole frastagliate (basso k) a zone morbide e stabili (alto k).
            </>
          ) : (
            <>
              💡 <strong>Rete Neurale Artificiale:</strong> Ottimizza i pesi sinaptici tramite discesa del gradiente stocastica. Modifica Epoche, Learning Rate e Batch Size per osservare in tempo reale come si comporta la curva di errore (Loss) e verificare se si verifica Overfitting!
            </>
          )}
        </p>
      </div>

      {/* Main Grid: Decision Boundary Visualizer vs Hyperparameters & Training Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Decision Boundary Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-700" />
                Confine di Decisione 2D in Tempo Reale
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                I colori di sfondo mostrano quale classe vincerebbe in ogni zona dello spazio
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              {isModelTrained ? 'Modello Attivo ✓' : 'In Addestramento...'}
            </span>
          </div>

          {/* Canvas */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-white flex items-center justify-center">
            <canvas
              ref={boundaryCanvasRef}
              width={640}
              height={400}
              className="w-full h-auto block select-none"
            />
          </div>

          {/* Territory Legend */}
          <div className="flex flex-wrap items-center justify-around gap-2 p-2.5 bg-slate-100 rounded-2xl border border-slate-300 text-xs font-extrabold font-mono">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-4 h-4 rounded bg-emerald-500/40 border border-emerald-700 inline-block"></span> Territorio Gatti 🐱
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-4 h-4 rounded bg-amber-500/40 border border-amber-700 inline-block"></span> Territorio Cani 🐶
            </span>
            <span className="flex items-center gap-1.5 text-purple-900">
              <span className="w-4 h-4 rounded bg-purple-500/40 border border-purple-700 inline-block"></span> Territorio Altri 🐾
            </span>
          </div>

          <div className="p-3 bg-violet-50 border border-violet-200 rounded-2xl text-xs text-violet-950 font-medium leading-relaxed">
            🔍 <strong>Cosa osservare per gli studenti:</strong> I punti vuoti (bianchi con bordo colorato) rappresentano il <strong>Test Set</strong>. Se un punto di test cade nella zona di colore errato, il modello farà un errore di previsione (visibile nella Matrice di Confusione della Fase 4)!
          </div>

        </div>

        {/* Right: Hyperparameters Configuration & Loss Curve (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Box 1: Hyperparameter Controls */}
          <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-700" />
                Iperparametri Modello
              </h4>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {algorithm === 'knn' ? 'Configurazione Vicini' : 'Configurazione SGD'}
              </span>
            </div>

            {algorithm === 'knn' ? (
              /* k-NN controls */
              <div className="space-y-4">
                {/* k slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-800">
                      Numero Vicini (k):
                    </label>
                    <span className="font-mono font-black text-violet-800 bg-violet-100 px-2.5 py-0.5 rounded-lg border border-violet-300 text-sm">
                      k = {hyperparameters.knnK}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="2"
                    value={hyperparameters.knnK}
                    onChange={(e) =>
                      setHyperparameters(prev => ({
                        ...prev,
                        knnK: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-violet-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                    <span>k=1 (Rischio Overfit)</span>
                    <span>k=5 (Bilanciato)</span>
                    <span>k=15 (Morbido)</span>
                  </div>
                </div>

                {/* Distance Metric */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800">
                    Metrica di Distanza Spaziale:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setHyperparameters(prev => ({
                          ...prev,
                          knnDistanceMetric: 'euclidean',
                        }))
                      }
                      className={`p-2 rounded-xl text-xs font-black border transition ${
                        hyperparameters.knnDistanceMetric === 'euclidean'
                          ? 'bg-violet-700 text-white border-violet-900 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                      }`}
                    >
                      Euclidea (In linea d'aria)
                    </button>
                    <button
                      onClick={() =>
                        setHyperparameters(prev => ({
                          ...prev,
                          knnDistanceMetric: 'manhattan',
                        }))
                      }
                      className={`p-2 rounded-xl text-xs font-black border transition ${
                        hyperparameters.knnDistanceMetric === 'manhattan'
                          ? 'bg-violet-700 text-white border-violet-900 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                      }`}
                    >
                      Manhattan (A griglia/blocchi)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Neural Network controls */
              <div className="space-y-3">
                {/* Epochs */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-800">Epoche di Training:</span>
                    <span className="font-mono font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      {hyperparameters.epochs} cicli
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="10"
                    value={hyperparameters.epochs}
                    onChange={(e) =>
                      setHyperparameters(prev => ({
                        ...prev,
                        epochs: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Learning Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-800">Learning Rate (η):</span>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {hyperparameters.learningRate}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-bold">
                    <button
                      onClick={() => setHyperparameters(prev => ({ ...prev, learningRate: 0.05 }))}
                      className={`p-1.5 rounded-lg border ${
                        hyperparameters.learningRate === 0.05 ? 'bg-rose-600 text-white border-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Alto (0.05)
                    </button>
                    <button
                      onClick={() => setHyperparameters(prev => ({ ...prev, learningRate: 0.01 }))}
                      className={`p-1.5 rounded-lg border ${
                        hyperparameters.learningRate === 0.01 ? 'bg-emerald-600 text-white border-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Ottimale (0.01)
                    </button>
                    <button
                      onClick={() => setHyperparameters(prev => ({ ...prev, learningRate: 0.001 }))}
                      className={`p-1.5 rounded-lg border ${
                        hyperparameters.learningRate === 0.001 ? 'bg-amber-600 text-white border-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Lento (0.001)
                    </button>
                  </div>
                </div>

                {/* Batch Size */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-800">Dimensione Batch:</span>
                    <span className="font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {hyperparameters.batchSize} campioni
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-xs font-mono font-bold">
                    {[4, 8, 16, 32].map(b => (
                      <button
                        key={b}
                        onClick={() => setHyperparameters(prev => ({ ...prev, batchSize: b }))}
                        className={`p-1.5 rounded-lg border ${
                          hyperparameters.batchSize === b ? 'bg-amber-600 text-white border-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={handleStartTraining}
              disabled={isTraining}
              className="w-full py-3 bg-gradient-to-r from-violet-700 to-indigo-800 hover:brightness-110 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 border-2 border-violet-950 transition active:scale-98 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isTraining ? `Addestramento in corso (${currentEpoch})...` : 'Ricalcola & Addestra Modello'}</span>
            </button>
          </div>

          {/* Box 2: Loss & Learning Curve Simulator */}
          <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Curva dell'Errore (Loss) &amp; Accuratezza
              </h4>
              {currentLossItem && (
                <span className="text-[11px] font-mono font-black text-blue-800">
                  Loss: {currentLossItem.trainLoss} | Acc: {Math.round(currentLossItem.trainAcc * 100)}%
                </span>
              )}
            </div>

            <div className="h-36 relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
              <canvas
                ref={lossCanvasRef}
                width={360}
                height={144}
                className="w-full h-full block"
              />
            </div>

            {/* Loss curve legend */}
            <div className="flex items-center justify-around text-[10px] font-mono font-black pt-1">
              <span className="text-blue-700 flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-600 inline-block"></span> Train Loss (Errore addestramento)
              </span>
              <span className="text-rose-700 flex items-center gap-1">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-600 inline-block"></span> Test Loss (Errore verifica)
              </span>
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> Accuratezza %
              </span>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              💡 Se la linea rossa tratteggiata (Test Loss) comincia a risalire mentre la blu scende, significa che il modello sta andando in <strong>Overfitting</strong>!
            </p>
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
          <span>Fase 2: Statistica in Tempo Reale</span>
        </button>

        <button
          onClick={onNavigateNext}
          className="py-3.5 px-8 bg-blue-800 hover:bg-blue-900 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl flex items-center gap-3 transition active:scale-98"
        >
          <span>Vai al Collaudo &amp; Matrice di Confusione (Fase 4)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
