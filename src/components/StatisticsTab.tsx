import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Sliders,
  Scale,
  Activity,
  Layers,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { AnimalClass, DataPoint, FeatureKey } from '../types';
import { FEATURE_METAS } from '../utils/sampleData';
import {
  calculateDescriptiveStats,
  calculatePearsonCorrelation,
  generateHistogramBins,
  HistogramBin
} from '../utils/statistics';

interface Props {
  dataset: DataPoint[];
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
}

export const StatisticsTab: React.FC<Props> = ({
  dataset,
  onNavigatePrev,
  onNavigateNext,
}) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('baffi');
  const [selectedCorrelationPair, setSelectedCorrelationPair] = useState<[FeatureKey, FeatureKey]>([
    'orecchie',
    'baffi',
  ]);

  const featureKeys: FeatureKey[] = ['orecchie', 'baffi', 'coda', 'peso'];

  // Global stats for selected feature
  const allValues = dataset.map(p => p.features[selectedFeature]);
  const globalStats = calculateDescriptiveStats(allValues);

  // Per-class stats
  const catValues = dataset.filter(p => p.class === 'GATTO').map(p => p.features[selectedFeature]);
  const dogValues = dataset.filter(p => p.class === 'CANE').map(p => p.features[selectedFeature]);
  const otherValues = dataset.filter(p => p.class === 'ALTRO').map(p => p.features[selectedFeature]);

  const catStats = calculateDescriptiveStats(catValues);
  const dogStats = calculateDescriptiveStats(dogValues);
  const otherStats = calculateDescriptiveStats(otherValues);

  // Histogram data
  const bins = generateHistogramBins(dataset, selectedFeature, 10);
  const maxBinCount = Math.max(1, ...bins.map(b => b.total));

  // Pearson correlation matrix
  const correlationMatrix: Record<FeatureKey, Record<FeatureKey, number>> = {} as any;
  featureKeys.forEach(f1 => {
    correlationMatrix[f1] = {} as any;
    const v1 = dataset.map(p => p.features[f1]);
    featureKeys.forEach(f2 => {
      const v2 = dataset.map(p => p.features[f2]);
      correlationMatrix[f1][f2] = calculatePearsonCorrelation(v1, v2);
    });
  });

  const selectedR = correlationMatrix[selectedCorrelationPair[0]][selectedCorrelationPair[1]];

  const getCorrelationColor = (r: number) => {
    if (r > 0.6) return 'bg-emerald-600 text-white';
    if (r > 0.25) return 'bg-emerald-200 text-emerald-950 font-bold';
    if (r > -0.25) return 'bg-slate-100 text-slate-800';
    if (r > -0.6) return 'bg-rose-200 text-rose-950 font-bold';
    return 'bg-rose-600 text-white';
  };

  const getCorrelationDescription = (r: number) => {
    if (Math.abs(r) < 0.15) {
      return 'Nessuna correlazione lineare significativa: le due feature variano in modo indipendente l\'una dall\'altra.';
    }
    if (r > 0.6) {
      return `Forte correlazione positiva (r = ${r}): quando cresce "${selectedCorrelationPair[0]}", tende a crescere decisamente anche "${selectedCorrelationPair[1]}".`;
    }
    if (r > 0) {
      return `Moderata correlazione positiva (r = ${r}): esiste una debole tendenza a crescere insieme.`;
    }
    if (r < -0.6) {
      return `Forte correlazione inversa/negativa (r = ${r}): all'aumentare di "${selectedCorrelationPair[0]}", "${selectedCorrelationPair[1]}" tende a diminuire marcatamente.`;
    }
    return `Moderata correlazione inversa (r = ${r}).`;
  };

  const currentMeta = FEATURE_METAS.find(f => f.key === selectedFeature);

  return (
    <div className="space-y-6">
      
      {/* Banner Titolo */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-slate-300 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-indigo-700 uppercase font-mono">
                FASE 2 DI 4: ANALISI STATISTICA IN TEMPO REALE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                Data Science EDA
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Statistiche Descrittive &amp; Correlazione delle Caratteristiche
            </h2>
          </div>

          {/* Feature selector pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Feature Attiva:</span>
            {featureKeys.map(fk => {
              const meta = FEATURE_METAS.find(m => m.key === fk);
              return (
                <button
                  key={fk}
                  onClick={() => setSelectedFeature(fk)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    selectedFeature === fk
                      ? 'bg-indigo-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {meta?.label || fk}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature description note */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          💡 <strong>Definizione:</strong> {currentMeta?.description}
        </p>
      </div>

      {/* TOP STATS CARDS: Mean vs Median showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Media */}
        <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black uppercase text-slate-500">Media Campionaria (μ)</span>
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">x̄</span>
          </div>
          <div className="text-3xl font-black text-blue-900 font-mono">
            {globalStats.mean}%
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Somma di tutti i valori divisa per {globalStats.count}. Sensibile ai valori anomali.
          </p>
        </div>

        {/* Card 2: Mediana */}
        <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black uppercase text-slate-500">Mediana (Q2 - 50%)</span>
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">M</span>
          </div>
          <div className="text-3xl font-black text-emerald-900 font-mono">
            {globalStats.median}%
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Valore che divide il dataset a metà (50% sopra, 50% sotto). Robusta agli outlier.
          </p>
        </div>

        {/* Card 3: Deviazione Standard & Varianza */}
        <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black uppercase text-slate-500">Dispersione (σ)</span>
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">σ</span>
          </div>
          <div className="text-3xl font-black text-purple-900 font-mono">
            ±{globalStats.stdDev}%
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Dev. Standard (Varianza: {globalStats.variance}). Indica quanto i punti si allontanano da μ.
          </p>
        </div>

        {/* Card 4: IQR & Outliers */}
        <div className="bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black uppercase text-slate-500">Range Interquartile (IQR)</span>
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">IQR</span>
          </div>
          <div className="text-3xl font-black text-amber-900 font-mono">
            {globalStats.iqr}%
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Q1 ({globalStats.q1}%) a Q3 ({globalStats.q3}%). Outlier rilevati (regola 1.5×IQR): <strong>{globalStats.outliersCount}</strong>.
          </p>
        </div>

      </div>

      {/* DIDACTIC HIGHLIGHT: Media vs Mediana Visual Comparison */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border-4 border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base sm:text-lg">
              Confronto Visivo: Media vs Mediana sulla Caratteristica "{currentMeta?.label}"
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-300 font-bold">
            {Math.abs(globalStats.mean - globalStats.median) < 2
              ? 'Distribuzione Simmetrica (Media ≈ Mediana)'
              : globalStats.mean > globalStats.median
              ? 'Asimmetria a Destra: la Media è trascinata da valori alti'
              : 'Asimmetria a Sinistra: la Media è trascinata da valori bassi'}
          </span>
        </div>

        {/* Visual Ruler Bar */}
        <div className="relative pt-6 pb-4">
          <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-700 relative">
            {/* Markers range 0-100 */}
          </div>

          {/* Q1-Q3 Box */}
          <div
            className="absolute top-6 h-4 bg-indigo-500/30 border-y border-indigo-400"
            style={{
              left: `${globalStats.q1}%`,
              width: `${Math.max(2, globalStats.q3 - globalStats.q1)}%`,
            }}
            title={`Intervallo Interquartile IQR: da ${globalStats.q1}% a ${globalStats.q3}%`}
          />

          {/* Media Marker */}
          <div
            className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{ left: `${Math.max(4, Math.min(96, globalStats.mean))}%` }}
          >
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-mono font-black shadow">
              Media: {globalStats.mean}%
            </span>
            <div className="w-0.5 h-7 bg-blue-400"></div>
          </div>

          {/* Mediana Marker */}
          <div
            className="absolute top-7 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{ left: `${Math.max(4, Math.min(96, globalStats.median))}%` }}
          >
            <div className="w-0.5 h-6 bg-emerald-400"></div>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-mono font-black shadow">
              Mediana: {globalStats.median}%
            </span>
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800">
          <span>0% (Min teorico)</span>
          <span>50% (Punto centrale)</span>
          <span>100% (Max teorico)</span>
        </div>
      </div>

      {/* SECTION 2: Histograms & Per-Class Box Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Histogram (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-700" />
                Istogramma di Distribuzione per Classe
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quanti campioni cadono in ciascuna fascia di valori?
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {bins.length} Scaglioni (Bins)
            </span>
          </div>

          {/* Histogram Bars */}
          <div className="h-64 flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-2 border-b border-slate-200">
            {bins.map((bin, idx) => {
              const hTotal = (bin.total / maxBinCount) * 100;
              const hCat = bin.total > 0 ? (bin.countGatto / bin.total) * 100 : 0;
              const hDog = bin.total > 0 ? (bin.countCane / bin.total) * 100 : 0;
              const hOther = bin.total > 0 ? (bin.countAltro / bin.total) * 100 : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-1.5 rounded-lg shadow-lg z-20 pointer-events-none whitespace-nowrap font-mono">
                    <span className="font-bold">Fascia {bin.label}%</span>
                    <span>Tot: {bin.total} (🐱{bin.countGatto} 🐶{bin.countCane} 🐾{bin.countAltro})</span>
                  </div>

                  {/* Value number atop bar */}
                  {bin.total > 0 && (
                    <span className="text-[10px] font-mono font-bold text-slate-600 mb-1">
                      {bin.total}
                    </span>
                  )}

                  {/* Stacked bar */}
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300"
                    style={{ height: `${Math.max(bin.total > 0 ? 6 : 0, hTotal)}%` }}
                  >
                    {/* Altro (Purple) */}
                    <div
                      style={{ height: `${hOther}%` }}
                      className="w-full bg-purple-600 hover:bg-purple-500"
                    />
                    {/* Cane (Amber) */}
                    <div
                      style={{ height: `${hDog}%` }}
                      className="w-full bg-amber-500 hover:bg-amber-400"
                    />
                    {/* Gatto (Emerald) */}
                    <div
                      style={{ height: `${hCat}%` }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Histogram X Axis labels */}
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 px-1">
            {bins.map((bin, i) => (
              <span key={i} className="truncate">{bin.binStart}%</span>
            ))}
            <span>100%</span>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs font-mono font-extrabold pt-2">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> Gatti
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Cani
            </span>
            <span className="flex items-center gap-1.5 text-purple-900">
              <span className="w-3 h-3 rounded-full bg-purple-700 inline-block"></span> Altri
            </span>
          </div>
        </div>

        {/* Per-Class Statistical Breakdown Table (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
          <div className="border-b-2 border-slate-200 pb-3">
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-700" />
              Confronto Statistico per Classe
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Come si differenziano le medie e le dispersioni tra gli animali?
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Gatto Row */}
            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-emerald-900 flex items-center gap-1.5 text-sm">
                  🐱 GATTO ({catStats.count} campioni)
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  Range: [{catStats.min} - {catStats.max}%]
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-slate-800">
                <div>Media: <strong>{catStats.mean}%</strong></div>
                <div>Mediana: <strong>{catStats.median}%</strong></div>
                <div>Dev.Std: <strong>±{catStats.stdDev}%</strong></div>
              </div>
            </div>

            {/* Cane Row */}
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-amber-950 flex items-center gap-1.5 text-sm">
                  🐶 CANE ({dogStats.count} campioni)
                </span>
                <span className="text-[11px] font-bold text-amber-800">
                  Range: [{dogStats.min} - {dogStats.max}%]
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-slate-800">
                <div>Media: <strong>{dogStats.mean}%</strong></div>
                <div>Mediana: <strong>{dogStats.median}%</strong></div>
                <div>Dev.Std: <strong>±{dogStats.stdDev}%</strong></div>
              </div>
            </div>

            {/* Altro Row */}
            <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-2xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-purple-950 flex items-center gap-1.5 text-sm">
                  🐾 ALTRO ({otherStats.count} campioni)
                </span>
                <span className="text-[11px] font-bold text-purple-800">
                  Range: [{otherStats.min} - {otherStats.max}%]
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-slate-800">
                <div>Media: <strong>{otherStats.mean}%</strong></div>
                <div>Mediana: <strong>{otherStats.median}%</strong></div>
                <div>Dev.Std: <strong>±{otherStats.stdDev}%</strong></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-2xl text-[11px] text-slate-700 font-medium leading-relaxed">
            💡 <strong>Principio Chiave di Machine Learning:</strong> Più le medie sono separate e le deviazioni standard sono contenute, più facile sarà per il modello tracciare un confine netto senza sbagliare!
          </div>

        </div>

      </div>

      {/* SECTION 3: Pearson Correlation Heatmap */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-slate-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-700" />
              Matrice di Correlazione Lineare di Pearson (r)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Clicca su una cella per analizzare come due caratteristiche variano insieme
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-700">
            r ∈ [-1.00, +1.00]
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Heatmap Table (6 cols) */}
          <div className="md:col-span-6 overflow-x-auto">
            <table className="w-full text-center border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-bold text-slate-500">Feature</th>
                  {featureKeys.map(f => (
                    <th key={f} className="p-2 font-black text-slate-800 uppercase text-[11px]">
                      {f.substring(0, 4)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureKeys.map(rowF => (
                  <tr key={rowF} className="border-t border-slate-200">
                    <td className="p-2 text-left font-extrabold text-slate-800 capitalize">
                      {rowF}
                    </td>
                    {featureKeys.map(colF => {
                      const rVal = correlationMatrix[rowF][colF];
                      const isSelected =
                        (selectedCorrelationPair[0] === rowF && selectedCorrelationPair[1] === colF) ||
                        (selectedCorrelationPair[0] === colF && selectedCorrelationPair[1] === rowF);

                      return (
                        <td key={colF} className="p-1.5">
                          <button
                            onClick={() => setSelectedCorrelationPair([rowF, colF])}
                            className={`w-full py-2 px-1 rounded-xl text-xs font-mono font-black transition ${getCorrelationColor(
                              rVal
                            )} ${isSelected ? 'ring-3 ring-blue-600 scale-105 shadow-md' : 'hover:opacity-90'}`}
                            title={`Correlazione tra ${rowF} e ${colF}: r = ${rVal}`}
                          >
                            {rVal > 0 ? `+${rVal}` : rVal}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanation Box (6 cols) */}
          <div className="md:col-span-6 bg-slate-50 p-5 rounded-2xl border-2 border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase font-mono text-slate-500">Coppia Selezionata:</span>
              <span className="px-3 py-1 rounded-full font-mono font-black text-xs bg-indigo-100 text-indigo-900 border border-indigo-300">
                r = {selectedR > 0 ? `+${selectedR}` : selectedR}
              </span>
            </div>

            <h4 className="text-base font-black text-slate-900 capitalize">
              {selectedCorrelationPair[0]} ↔ {selectedCorrelationPair[1]}
            </h4>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {getCorrelationDescription(selectedR)}
            </p>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1 font-mono">
              <div className="font-bold text-slate-800">Formula di Pearson:</div>
              <div className="text-[11px] text-indigo-800 font-semibold">
                r = Σ[(x - x̄)(y - ȳ)] / [ √(Σ(x - x̄)²) · √(Σ(y - ȳ)²) ]
              </div>
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
          <span>Fase 1: Manipola Dati</span>
        </button>

        <button
          onClick={onNavigateNext}
          className="py-3.5 px-8 bg-blue-800 hover:bg-blue-900 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl flex items-center gap-3 transition active:scale-98"
        >
          <span>Configura Iperparametri &amp; Modello (Fase 3)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
