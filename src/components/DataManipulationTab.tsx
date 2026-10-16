import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Filter,
  Download,
  Upload,
  Layers,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import { AnimalClass, DataPoint, FeatureKey, NormalizationMode } from '../types';
import { FEATURE_METAS, generateBatchPoints, generateSinglePoint, getPresetDataset } from '../utils/sampleData';
import { identifyOutliers } from '../utils/statistics';

interface Props {
  dataset: DataPoint[];
  setDataset: React.Dispatch<React.SetStateAction<DataPoint[]>>;
  xAxisFeature: FeatureKey;
  setXAxisFeature: (f: FeatureKey) => void;
  yAxisFeature: FeatureKey;
  setYAxisFeature: (f: FeatureKey) => void;
  normMode: NormalizationMode;
  setNormMode: (m: NormalizationMode) => void;
  trainTestSplitRatio: number;
  setTrainTestSplitRatio: (r: number) => void;
  onNavigateNext: () => void;
}

export const DataManipulationTab: React.FC<Props> = ({
  dataset,
  setDataset,
  xAxisFeature,
  setXAxisFeature,
  yAxisFeature,
  setYAxisFeature,
  normMode,
  setNormMode,
  trainTestSplitRatio,
  setTrainTestSplitRatio,
  onNavigateNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePlacementClass, setActivePlacementClass] = useState<AnimalClass>('GATTO');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Identify outliers in real-time
  const outlierIds = identifyOutliers(dataset);

  // Re-apply train/test split whenever ratio changes or requested
  const applyTrainTestSplit = (points: DataPoint[], ratio: number): DataPoint[] => {
    return points.map(pt => ({
      ...pt,
      isTest: Math.random() > ratio,
    }));
  };

  const handleResplit = () => {
    setDataset(prev => applyTrainTestSplit(prev, trainTestSplitRatio));
  };

  const handleAddBatch = (cls: AnimalClass, count: number) => {
    const newPoints = generateBatchPoints(cls, count).map(pt => ({
      ...pt,
      isTest: Math.random() > trainTestSplitRatio,
    }));
    setDataset(prev => [...prev, ...newPoints]);
  };

  const handleAddSingleOutlier = (cls: AnimalClass) => {
    const outlier = generateSinglePoint(cls, true);
    outlier.isTest = Math.random() > trainTestSplitRatio;
    setDataset(prev => [...prev, outlier]);
  };

  const handleRemoveOutliers = () => {
    if (outlierIds.length === 0) return;
    setDataset(prev => prev.filter(p => !outlierIds.includes(p.id)));
  };

  const handleClearDataset = () => {
    setDataset([]);
  };

  const handleLoadPreset = (preset: 'pets_balanced' | 'pets_imbalanced' | 'with_outliers') => {
    const pts = getPresetDataset(preset);
    setDataset(pts);
  };

  // Canvas click to add point directly
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert pixel coordinates to feature 0-100 values
    // Padding: 40px left & bottom, 20px top & right
    const padL = 45;
    const padR = 25;
    const padT = 25;
    const padB = 45;

    const plotW = canvas.width - padL - padR;
    const plotH = canvas.height - padT - padB;

    if (clickX < padL || clickX > padL + plotW || clickY < padT || clickY > padT + plotH) {
      return;
    }

    const featX = Math.round(((clickX - padL) / plotW) * 100);
    // Y axis is inverted on canvas
    const featY = Math.round((1 - (clickY - padT) / plotH) * 100);

    const newPoint: DataPoint = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      class: activePlacementClass,
      features: {
        orecchie: xAxisFeature === 'orecchie' ? featX : yAxisFeature === 'orecchie' ? featY : 50,
        baffi: xAxisFeature === 'baffi' ? featX : yAxisFeature === 'baffi' ? featY : 50,
        coda: xAxisFeature === 'coda' ? featX : yAxisFeature === 'coda' ? featY : 50,
        peso: xAxisFeature === 'peso' ? featX : yAxisFeature === 'peso' ? featY : 40,
      },
      isTest: Math.random() > trainTestSplitRatio,
    };

    setDataset(prev => [...prev, newPoint]);
  };

  // Hover detection on canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    const padL = 45;
    const padR = 25;
    const padT = 25;
    const padB = 45;
    const plotW = canvas.width - padL - padR;
    const plotH = canvas.height - padT - padB;

    let found: DataPoint | null = null;

    for (const pt of dataset) {
      const px = padL + (pt.features[xAxisFeature] / 100) * plotW;
      const py = padT + (1 - pt.features[yAxisFeature] / 100) * plotH;
      const dist = Math.hypot(mouseX - px, mouseY - py);
      if (dist < 10) {
        found = pt;
        break;
      }
    }

    setHoveredPoint(found);
  };

  // Draw 2D feature scatter plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padL = 45;
    const padR = 25;
    const padT = 25;
    const padB = 45;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Draw background grid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padL, padT, plotW, plotH);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
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

    // Grid labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i += 2) {
      const x = padL + (i / 10) * plotW;
      ctx.fillText(`${i * 10}%`, x, height - 28);

      const y = padT + (1 - i / 10) * plotH;
      ctx.textAlign = 'right';
      ctx.fillText(`${i * 10}%`, padL - 8, y + 4);
    }

    // Border around plot area
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Axis labels
    const xMeta = FEATURE_METAS.find(f => f.key === xAxisFeature);
    const yMeta = FEATURE_METAS.find(f => f.key === yAxisFeature);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${xMeta?.label || xAxisFeature} ➔`, padL + plotW / 2, height - 10);

    // Y Axis label (rotated)
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${yMeta?.label || yAxisFeature} ➔`, 0, 0);
    ctx.restore();

    // Draw data points
    dataset.forEach(pt => {
      const px = padL + (pt.features[xAxisFeature] / 100) * plotW;
      const py = padT + (1 - pt.features[yAxisFeature] / 100) * plotH;

      const isOutlier = outlierIds.includes(pt.id) || pt.isOutlier;
      const radius = isOutlier ? 8 : 6.5;

      // Color mapping
      let fillColor = '#059669'; // GATTO: emerald
      let strokeColor = '#064e3b';
      if (pt.class === 'CANE') {
        fillColor = '#f59e0b'; // CANE: amber
        strokeColor = '#78350f';
      } else if (pt.class === 'ALTRO') {
        fillColor = '#8b5cf6'; // ALTRO: purple
        strokeColor = '#4c1d95';
      }

      if (isOutlier) {
        // Red warning glow for outlier
        ctx.beginPath();
        ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);

      if (pt.isTest) {
        // Test point: hollow circle with thick colored border
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = fillColor;
        ctx.stroke();
        // Inner dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
      } else {
        // Train point: solid circle
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
      }
    });

    // If mouse is inside canvas, draw placement guide
    // (Handled by interaction)
  }, [dataset, xAxisFeature, yAxisFeature, outlierIds]);

  // CSV Export
  const handleExportCSV = () => {
    if (dataset.length === 0) return;
    const header = 'id,class,orecchie,baffi,coda,peso,isTest,isOutlier\n';
    const rows = dataset.map(d =>
      `${d.id},${d.class},${d.features.orecchie},${d.features.baffi},${d.features.coda},${d.features.peso},${d.isTest ? 1 : 0},${d.isOutlier ? 1 : 0}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dataset_ml_didattico_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dataset quality analysis
  const catCount = dataset.filter(d => d.class === 'GATTO').length;
  const dogCount = dataset.filter(d => d.class === 'CANE').length;
  const otherCount = dataset.filter(d => d.class === 'ALTRO').length;
  const total = dataset.length;
  const trainCount = dataset.filter(d => !d.isTest).length;
  const testCount = dataset.filter(d => d.isTest).length;

  let qualityStatus: { text: string; color: string; advice: string } = {
    text: 'Nessun dato presente',
    color: 'text-slate-500 bg-slate-100 border-slate-300',
    advice: 'Genera o inserisci dati per tutte le classi per avviare il laboratorio!',
  };

  if (total > 0 && total < 15) {
    qualityStatus = {
      text: 'Campione ridotto (< 15)',
      color: 'text-amber-800 bg-amber-100 border-amber-300',
      advice: 'Un dataset con pochi campioni rende le stime statistiche instabili e favorisce l\'underfitting.',
    };
  } else if (total >= 15) {
    const maxRatio = Math.max(catCount, dogCount, otherCount) / total;
    const minCount = Math.min(catCount, dogCount, otherCount);

    if (minCount === 0 || maxRatio > 0.6) {
      qualityStatus = {
        text: 'Dataset Sbilanciato (Rischio Elevato di Bias)',
        color: 'text-rose-800 bg-rose-100 border-rose-300',
        advice: 'Una classe domina la maggioranza! Il modello imparerà a prevedere sempre la classe più comune (Bias cognitivo / algoritmico).',
      };
    } else if (maxRatio > 0.45) {
      qualityStatus = {
        text: 'Moderatamente Sbilanciato',
        color: 'text-amber-800 bg-amber-100 border-amber-300',
        advice: 'Bilancia ulteriormente aggiungendo qualche elemento alle classi minoritarie.',
      };
    } else {
      qualityStatus = {
        text: 'Ottimo & Ben Bilanciato',
        color: 'text-emerald-800 bg-emerald-100 border-emerald-300',
        advice: 'Tutte le classi sono equamente rappresentate! Base ideale per calcolare statistiche robuste e addestrare il modello.',
      };
    }
  }

  // Filtered dataset for table
  const filteredTableData = dataset.filter(pt => {
    const matchesFilter = selectedClassFilter === 'ALL' || pt.class === selectedClassFilter;
    const matchesSearch =
      pt.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pt.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* CARD 1: Presets & Dataset Health Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-blue-700 uppercase font-mono">
                FASE 1 DI 4: INGEGNERIZZAZIONE &amp; RACCOLTA DATI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-blue-100 text-blue-900 border border-blue-300">
                Data Manipulation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Manipolazione Dati nello Spazio delle Caratteristiche
            </h2>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-500">Preset Didattici:</span>
            <button
              onClick={() => handleLoadPreset('pets_balanced')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-800 hover:text-blue-900 text-xs font-extrabold rounded-xl border border-slate-300 transition"
              title="Carica dataset equamente bilanciato"
            >
              Bilanciato (Ideale)
            </button>
            <button
              onClick={() => handleLoadPreset('pets_imbalanced')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-800 hover:text-rose-900 text-xs font-extrabold rounded-xl border border-slate-300 transition"
              title="Carica dataset con 30 cani e 3 gatti per testare il bias"
            >
              Con Bias (Sbilanciato)
            </button>
            <button
              onClick={() => handleLoadPreset('with_outliers')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 text-xs font-extrabold rounded-xl border border-slate-300 transition"
              title="Carica dataset con anomalie da ripulire"
            >
              Con Outliers
            </button>
          </div>
        </div>

        {/* Quality status banner */}
        <div className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-3 ${qualityStatus.color}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm font-mono uppercase tracking-wide">
                Stato Dataset:
              </span>
              <span className="font-black text-sm">{qualityStatus.text}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              💡 <strong>Spiegazione Didattica:</strong> {qualityStatus.advice}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono text-xs font-bold">
              <div>Train: <strong className="text-slate-900">{trainCount}</strong> ({Math.round((trainCount / (total || 1)) * 100)}%)</div>
              <div>Test: <strong className="text-slate-900">{testCount}</strong> ({Math.round((testCount / (total || 1)) * 100)}%)</div>
            </div>
            {outlierIds.length > 0 && (
              <button
                onClick={handleRemoveOutliers}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
                title="Rimuovi automaticamente i campioni statisticamente anomali"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Pulisci {outlierIds.length} Outlier</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: Main Interactive 2D Space & Manipulation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 2D Canvas Plot (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-700" />
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Mappa 2D delle Caratteristiche
              </h3>
            </div>
            
            {/* Axis selectors */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="font-mono text-slate-500">Assi:</span>
              <select
                value={xAxisFeature}
                onChange={(e) => setXAxisFeature(e.target.value as FeatureKey)}
                className="p-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-extrabold"
              >
                <option value="orecchie">X: Forma Orecchie</option>
                <option value="baffi">X: Regolarità Baffi</option>
                <option value="coda">X: Lunghezza Coda</option>
                <option value="peso">X: Peso / Taglia</option>
              </select>
              <span>vs</span>
              <select
                value={yAxisFeature}
                onChange={(e) => setYAxisFeature(e.target.value as FeatureKey)}
                className="p-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-extrabold"
              >
                <option value="baffi">Y: Regolarità Baffi</option>
                <option value="orecchie">Y: Forma Orecchie</option>
                <option value="coda">Y: Lunghezza Coda</option>
                <option value="peso">Y: Peso / Taglia</option>
              </select>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              className="w-full h-auto cursor-crosshair block select-none"
            />

            {/* Click instruction floating badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-300 px-3 py-1.5 rounded-xl shadow-sm pointer-events-none text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>Clicca sulla mappa per inserire un {activePlacementClass}!</span>
            </div>
          </div>

          {/* Canvas Legend */}
          <div className="flex flex-wrap items-center justify-around gap-2 p-2.5 bg-slate-100 rounded-2xl border border-slate-300 text-xs font-extrabold font-mono">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block border border-slate-900"></span> Gatti (🐱)
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block border border-slate-900"></span> Cani (🐶)
            </span>
            <span className="flex items-center gap-1.5 text-purple-900">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-700 inline-block border border-slate-900"></span> Altri (🐾)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-800 bg-white inline-block"></span> Test Set (Hollow)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-600 bg-rose-100 inline-block"></span> Outlier (Anomalo)
            </span>
          </div>

          {/* Hover Inspector Banner */}
          {hoveredPoint ? (
            <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-2xl text-xs font-mono flex items-center justify-between">
              <span className="font-black text-blue-900 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${hoveredPoint.class === 'GATTO' ? 'bg-emerald-600' : hoveredPoint.class === 'CANE' ? 'bg-amber-500' : 'bg-purple-700'}`}></span>
                Campione: {hoveredPoint.class} ({hoveredPoint.isTest ? 'TEST' : 'TRAIN'})
              </span>
              <span className="text-slate-800 font-bold">
                Orecchie: <strong>{hoveredPoint.features.orecchie}%</strong> | Baffi: <strong>{hoveredPoint.features.baffi}%</strong> | Coda: <strong>{hoveredPoint.features.coda}%</strong> | Peso: <strong>{hoveredPoint.features.peso}%</strong>
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-500 font-semibold text-center">
              Passa il mouse su un punto per ispezionare i suoi valori, o clicca ovunque per posizionare un nuovo dato.
            </div>
          )}

        </div>

        {/* Right: Generation & Manipulation Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tool 1: Direct placement selector */}
          <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-3">
            <h4 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Scegli la Classe per il Clic Diretto
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActivePlacementClass('GATTO')}
                className={`py-2 px-1 rounded-2xl font-black text-xs sm:text-sm border-2 transition flex items-center justify-center gap-1 ${
                  activePlacementClass === 'GATTO'
                    ? 'bg-emerald-600 text-white border-emerald-800 shadow-md scale-102'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span>🐱 Gatto</span>
              </button>

              <button
                onClick={() => setActivePlacementClass('CANE')}
                className={`py-2 px-1 rounded-2xl font-black text-xs sm:text-sm border-2 transition flex items-center justify-center gap-1 ${
                  activePlacementClass === 'CANE'
                    ? 'bg-amber-500 text-slate-950 border-amber-700 shadow-md scale-102'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>🐶 Cane</span>
              </button>

              <button
                onClick={() => setActivePlacementClass('ALTRO')}
                className={`py-2 px-1 rounded-2xl font-black text-xs sm:text-sm border-2 transition flex items-center justify-center gap-1 ${
                  activePlacementClass === 'ALTRO'
                    ? 'bg-purple-700 text-white border-purple-950 shadow-md scale-102'
                    : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <span>🐾 Altro</span>
              </button>
            </div>
          </div>

          {/* Tool 2: Batch Generation */}
          <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-3">
            <h4 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Generazione Dati in Batch
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddBatch('GATTO', 10)}
                className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-emerald-900 shadow-sm transition active:scale-95 flex flex-col items-center gap-1"
              >
                <span>🐱 +10 Gatti</span>
                <span className="text-[10px] opacity-80 font-normal">Tratti tipici</span>
              </button>

              <button
                onClick={() => handleAddBatch('CANE', 10)}
                className="py-3 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl border-2 border-amber-800 shadow-sm transition active:scale-95 flex flex-col items-center gap-1"
              >
                <span>🐶 +10 Cani</span>
                <span className="text-[10px] opacity-80 font-normal">Tratti tipici</span>
              </button>

              <button
                onClick={() => handleAddBatch('ALTRO', 10)}
                className="py-3 px-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-purple-950 shadow-sm transition active:scale-95 flex flex-col items-center gap-1"
              >
                <span>🐾 +10 Altri</span>
                <span className="text-[10px] opacity-80 font-normal">Tratti sparsi</span>
              </button>
            </div>

            {/* Single additions and Outlier injection */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
              <button
                onClick={() => handleAddBatch('GATTO', 1)}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-xs rounded-xl border border-emerald-300"
              >
                +1 Gatto
              </button>
              <button
                onClick={() => handleAddBatch('CANE', 1)}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs rounded-xl border border-amber-300"
              >
                +1 Cane
              </button>
              <button
                onClick={() => handleAddBatch('ALTRO', 1)}
                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs rounded-xl border border-purple-300"
              >
                +1 Altro
              </button>
              <button
                onClick={() => handleAddSingleOutlier('GATTO')}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-extrabold text-xs rounded-xl border border-rose-300 flex items-center gap-1"
                title="Inserisci un dato anomalo per osservare il comportamento statistico"
              >
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>+ Outlier</span>
              </button>
            </div>
          </div>

          {/* Tool 3: Train / Test Split Control */}
          <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                Partizione Train / Test
              </h4>
              <button
                onClick={handleResplit}
                className="text-[11px] font-mono font-extrabold text-blue-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Re-distribuisci
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold font-mono text-slate-700">
                <span>Train: {Math.round(trainTestSplitRatio * 100)}% ({trainCount} pz)</span>
                <span>Test: {Math.round((1 - trainTestSplitRatio) * 100)}% ({testCount} pz)</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={trainTestSplitRatio}
                onChange={(e) => {
                  const newRatio = parseFloat(e.target.value);
                  setTrainTestSplitRatio(newRatio);
                  setDataset(prev => applyTrainTestSplit(prev, newRatio));
                }}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                💡 <strong>Didattica:</strong> I dati di Test (hollow) vengono nascosti al modello durante l'apprendimento e usati solo per verificare la capacità di generalizzazione!
              </p>
            </div>
          </div>

          {/* Tool 4: Actions (Export CSV, View Table, Clear) */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex gap-2">
              <button
                onClick={() => setShowTable(!showTable)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showTable ? 'Nascondi Tabella' : 'Tabella Dati'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                title="Esporta il dataset come file CSV per analisi esterne"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Esporta CSV</span>
              </button>
            </div>

            <button
              onClick={handleClearDataset}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-extrabold text-xs rounded-xl border border-rose-300 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Svuota</span>
            </button>
          </div>

        </div>
      </div>

      {/* CARD 3: Collapsible Dataset Table */}
      {showTable && (
        <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">Tabella dei Campioni Raccolti ({dataset.length})</h3>
              <p className="text-xs text-slate-500 font-medium">Modifica, filtra o elimina record individuali</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filtra per ID o classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              />
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">Tutte le Classi</option>
                <option value="GATTO">Solo Gatti</option>
                <option value="CANE">Solo Cani</option>
                <option value="ALTRO">Solo Altri</option>
              </select>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 sticky top-0">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Classe</th>
                  <th className="p-2.5">Orecchie (%)</th>
                  <th className="p-2.5">Baffi (%)</th>
                  <th className="p-2.5">Coda (%)</th>
                  <th className="p-2.5">Peso (eq.)</th>
                  <th className="p-2.5">Tipo</th>
                  <th className="p-2.5 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTableData.slice(0, 100).map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">{pt.id.substring(0, 10)}...</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        pt.class === 'GATTO' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        pt.class === 'CANE' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}>
                        {pt.class}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">{pt.features.orecchie}%</td>
                    <td className="p-2.5 font-bold text-slate-800">{pt.features.baffi}%</td>
                    <td className="p-2.5 font-bold text-slate-800">{pt.features.coda}%</td>
                    <td className="p-2.5 font-bold text-slate-800">{pt.features.peso}%</td>
                    <td className="p-2.5">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        pt.isTest ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {pt.isTest ? 'TEST' : 'TRAIN'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setDataset(prev => prev.filter(p => p.id !== pt.id))}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="Elimina questo singolo campione"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navigation to Next Step */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNavigateNext}
          className="py-3.5 px-8 bg-blue-800 hover:bg-blue-900 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl flex items-center gap-3 transition active:scale-98"
        >
          <span>Vai all'Analisi Statistica (Fase 2)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
