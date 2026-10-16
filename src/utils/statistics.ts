import { DataPoint, DescriptiveStats, FeatureKey, NormalizationMode } from '../types';

/**
 * Calculates complete descriptive statistics for a numeric array.
 */
export function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outliersCount: 0,
    };
  }

  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  
  // Mean
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Variance & Standard Deviation
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  // Min and Max
  const min = sorted[0];
  const max = sorted[n - 1];

  // Quartiles (Tukey's method)
  const getQuantile = (q: number) => {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  const q1 = getQuantile(0.25);
  const q3 = getQuantile(0.75);
  const iqr = Math.max(0, q3 - q1);

  // Outliers count using 1.5 * IQR rule
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliersCount = values.filter(v => v < lowerBound || v > upperBound).length;

  return {
    count: n,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    outliersCount,
  };
}

/**
 * Calculates Pearson Correlation Coefficient r between two series:
 * r = sum((x - meanX)*(y - meanY)) / sqrt(sum((x-meanX)^2) * sum((y-meanY)^2))
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length < 2 || x.length !== y.length) return 0;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  const r = numerator / denominator;
  return Number(Math.max(-1, Math.min(1, r)).toFixed(3));
}

/**
 * Normalizes dataset according to selected mode:
 * 'none' => original [0, 100]
 * 'minmax' => scaled to [0, 1]
 * 'zscore' => mean 0, stdDev 1
 */
export function normalizeData(
  points: DataPoint[],
  mode: NormalizationMode
): DataPoint[] {
  if (mode === 'none' || points.length === 0) return points;

  const featuresList: FeatureKey[] = ['orecchie', 'baffi', 'coda', 'peso'];
  const statsMap: Record<FeatureKey, { min: number; max: number; mean: number; stdDev: number }> = {} as any;

  featuresList.forEach((f) => {
    const vals = points.map(p => p.features[f]);
    const stats = calculateDescriptiveStats(vals);
    statsMap[f] = {
      min: stats.min,
      max: stats.max,
      mean: stats.mean,
      stdDev: stats.stdDev || 1, // avoid div by 0
    };
  });

  return points.map(pt => {
    const newFeatures = { ...pt.features };
    featuresList.forEach(f => {
      const v = pt.features[f];
      const s = statsMap[f];

      if (mode === 'minmax') {
        const range = s.max - s.min;
        newFeatures[f] = range > 0 ? (v - s.min) / range : 0.5;
        // Scale to 0-100 for consistent plotting or visual coordinates
        newFeatures[f] = Number((newFeatures[f] * 100).toFixed(1));
      } else if (mode === 'zscore') {
        // Z = (x - mean) / stdDev. Normal range roughly [-3, 3].
        // To visualize within 0-100 space centered at 50:
        const z = (v - s.mean) / s.stdDev;
        // Map [-3, 3] to [0, 100]
        const mapped = ((z + 3) / 6) * 100;
        newFeatures[f] = Number(Math.max(0, Math.min(100, mapped)).toFixed(1));
      }
    });

    return {
      ...pt,
      features: newFeatures,
    };
  });
}

/**
 * Generates histogram distribution bins for a feature.
 */
export interface HistogramBin {
  binStart: number;
  binEnd: number;
  label: string;
  countGatto: number;
  countCane: number;
  countAltro: number;
  total: number;
}

export function generateHistogramBins(
  points: DataPoint[],
  feature: FeatureKey,
  binCount: number = 10
): HistogramBin[] {
  if (points.length === 0) return [];

  const min = 0;
  const max = 100;
  const step = (max - min) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * step;
    const end = start + step;
    return {
      binStart: start,
      binEnd: end,
      label: `${Math.round(start)}-${Math.round(end)}`,
      countGatto: 0,
      countCane: 0,
      countAltro: 0,
      total: 0,
    };
  });

  points.forEach(p => {
    const val = p.features[feature];
    let binIdx = Math.floor((val - min) / step);
    if (binIdx >= binCount) binIdx = binCount - 1;
    if (binIdx < 0) binIdx = 0;

    const b = bins[binIdx];
    b.total++;
    if (p.class === 'GATTO') b.countGatto++;
    else if (p.class === 'CANE') b.countCane++;
    else b.countAltro++;
  });

  return bins;
}

/**
 * Detects points that qualify as outliers based on multiple features
 */
export function identifyOutliers(points: DataPoint[]): string[] {
  if (points.length < 5) return [];

  const outlierIds = new Set<string>();
  const features: FeatureKey[] = ['orecchie', 'baffi', 'coda', 'peso'];

  // Calculate IQR bounds per class to be statistically sensible
  const classes: Array<'GATTO' | 'CANE' | 'ALTRO'> = ['GATTO', 'CANE', 'ALTRO'];

  classes.forEach(cls => {
    const classPoints = points.filter(p => p.class === cls);
    if (classPoints.length < 4) return;

    features.forEach(f => {
      const vals = classPoints.map(p => p.features[f]);
      const stats = calculateDescriptiveStats(vals);
      const lowerBound = stats.q1 - 2.0 * stats.iqr;
      const upperBound = stats.q3 + 2.0 * stats.iqr;

      classPoints.forEach(p => {
        const v = p.features[f];
        if (v < lowerBound || v > upperBound) {
          outlierIds.add(p.id);
        }
      });
    });
  });

  return Array.from(outlierIds);
}
