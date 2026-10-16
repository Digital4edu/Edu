import { AnimalClass, DataPoint, FeatureMeta } from '../types';

export const FEATURE_METAS: FeatureMeta[] = [
  {
    key: 'orecchie',
    label: 'Forma Orecchie',
    iconName: 'Shapes',
    unit: '%',
    description: '0% = Rotonde/Piatte (es. Cane/Orso) ➔ 100% = A Punta/Triangolari (es. Gatto/Lince)',
  },
  {
    key: 'baffi',
    label: 'Regolarità Baffi (Vibrisse)',
    iconName: 'Sparkles',
    unit: '%',
    description: '0% = Assenti o corti/irregolari ➔ 100% = Baffi lunghi, simmetrici e definiti',
  },
  {
    key: 'coda',
    label: 'Lunghezza & Agilità Coda',
    iconName: 'Activity',
    unit: '%',
    description: '0% = Coda corta/mozza ➔ 100% = Coda lunga, sinuosa ed elastica',
  },
  {
    key: 'peso',
    label: 'Massa Corporea Relativa',
    iconName: 'Scale',
    unit: 'kg eq.',
    description: 'Taglia corporea approssimata: 0% = Piccolo (<4kg) ➔ 100% = Grande (>25kg)',
  },
];

/**
 * Creates random Gaussian-like noise
 */
function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, val)));
}

let idCounter = 1;

export function generateSinglePoint(cls: AnimalClass, isOutlier = false): DataPoint {
  const id = `pt_${idCounter++}_${Date.now().toString(36)}`;

  if (isOutlier) {
    return {
      id,
      class: cls,
      features: {
        orecchie: clamp(randomNormal(15, 8)),
        baffi: clamp(randomNormal(95, 4)),
        coda: clamp(randomNormal(10, 5)),
        peso: clamp(randomNormal(90, 8)),
      },
      isOutlier: true,
      isTest: Math.random() < 0.2,
    };
  }

  if (cls === 'GATTO') {
    return {
      id,
      class: 'GATTO',
      features: {
        orecchie: clamp(randomNormal(82, 8)),
        baffi: clamp(randomNormal(85, 7)),
        coda: clamp(randomNormal(78, 9)),
        peso: clamp(randomNormal(25, 7)),
      },
      isTest: Math.random() < 0.2,
    };
  }

  if (cls === 'CANE') {
    return {
      id,
      class: 'CANE',
      features: {
        orecchie: clamp(randomNormal(28, 10)),
        baffi: clamp(randomNormal(25, 9)),
        coda: clamp(randomNormal(45, 14)),
        peso: clamp(randomNormal(68, 12)),
      },
      isTest: Math.random() < 0.2,
    };
  }

  // ALTRO (es. Coniglio, Furetto, Volpe, Uccello)
  const zone = Math.random();
  let ear = 50, whis = 25, tail = 20, weight = 15;
  if (zone < 0.33) {
    // Es. Coniglio: orecchie lunghe ma baffi medi e coda cortissima
    ear = randomNormal(75, 7);
    whis = randomNormal(30, 8);
    tail = randomNormal(12, 5);
    weight = randomNormal(20, 6);
  } else if (zone < 0.66) {
    // Es. Orsacchiotto / Bovino: orecchie tonde, baffi zero, peso enorme
    ear = randomNormal(20, 7);
    whis = randomNormal(10, 5);
    tail = randomNormal(35, 10);
    weight = randomNormal(85, 8);
  } else {
    // Zona centrale mista
    ear = randomNormal(52, 10);
    whis = randomNormal(55, 10);
    tail = randomNormal(50, 10);
    weight = randomNormal(45, 10);
  }

  return {
    id,
    class: 'ALTRO',
    features: {
      orecchie: clamp(ear),
      baffi: clamp(whis),
      coda: clamp(tail),
      peso: clamp(weight),
    },
    isTest: Math.random() < 0.2,
  };
}

export function generateBatchPoints(cls: AnimalClass, count: number, isOutlier = false): DataPoint[] {
  return Array.from({ length: count }, () => generateSinglePoint(cls, isOutlier));
}

export function getPresetDataset(presetName: 'pets_balanced' | 'pets_imbalanced' | 'with_outliers' | 'iris_style'): DataPoint[] {
  const points: DataPoint[] = [];

  if (presetName === 'pets_balanced') {
    points.push(...generateBatchPoints('GATTO', 14));
    points.push(...generateBatchPoints('CANE', 14));
    points.push(...generateBatchPoints('ALTRO', 14));
  } else if (presetName === 'pets_imbalanced') {
    // Heavy bias towards Cane
    points.push(...generateBatchPoints('GATTO', 3));
    points.push(...generateBatchPoints('CANE', 30));
    points.push(...generateBatchPoints('ALTRO', 4));
  } else if (presetName === 'with_outliers') {
    points.push(...generateBatchPoints('GATTO', 12));
    points.push(...generateBatchPoints('CANE', 12));
    points.push(...generateBatchPoints('ALTRO', 12));
    // Inject 5 obvious outliers
    points.push(...generateBatchPoints('GATTO', 3, true));
    points.push(...generateBatchPoints('CANE', 2, true));
  } else {
    // Iris style: Compact clusters with distinctive overlap
    points.push(...generateBatchPoints('GATTO', 15));
    points.push(...generateBatchPoints('CANE', 15));
    points.push(...generateBatchPoints('ALTRO', 15));
  }

  // Ensure roughly 20% test points distributed evenly
  let testCount = 0;
  const targetTest = Math.floor(points.length * 0.2);
  points.forEach((p, idx) => {
    p.isTest = idx % 5 === 0;
    if (p.isTest) testCount++;
  });

  return points;
}
