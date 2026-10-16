export type AnimalClass = 'GATTO' | 'CANE' | 'ALTRO';

export interface DataPoint {
  id: string;
  class: AnimalClass;
  features: {
    orecchie: number;     // 0 - 100 (% punte orecchie)
    baffi: number;        // 0 - 100 (% regolarità baffi)
    coda: number;         // 0 - 100 (% lunghezza coda)
    peso: number;         // 0 - 100 (taglia / massa corporea normalizzata)
  };
  isOutlier?: boolean;
  isTest?: boolean;      // For train/test split
}

export type FeatureKey = 'orecchie' | 'baffi' | 'coda' | 'peso';

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  iconName: string;
  unit: string;
  description: string;
}

export type NormalizationMode = 'none' | 'minmax' | 'zscore';

export type ModelAlgorithm = 'knn' | 'neural_net';

export interface Hyperparameters {
  // k-NN
  knnK: number;
  knnDistanceMetric: 'euclidean' | 'manhattan';
  
  // Neural Net
  epochs: number;
  learningRate: number;
  batchSize: number;
  activation: 'relu' | 'sigmoid' | 'tanh';
}

export interface TrainingHistoryEpoch {
  epoch: number;
  trainLoss: number;
  testLoss: number;
  trainAcc: number;
  testAcc: number;
}

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  mode?: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  outliersCount: number;
}

export interface ConfusionMatrix {
  matrix: {
    [actual in AnimalClass]: {
      [predicted in AnimalClass]: number;
    };
  };
  accuracy: number;
  precision: { [key in AnimalClass]: number };
  recall: { [key in AnimalClass]: number };
  f1Score: { [key in AnimalClass]: number };
  macroF1: number;
}

export interface PredictionResult {
  predictedClass: AnimalClass;
  probabilities: {
    GATTO: number;
    CANE: number;
    ALTRO: number;
  };
  nearestNeighbors?: Array<{
    point: DataPoint;
    distance: number;
  }>;
  explanation: string;
}

export interface Challenge {
  id: string;
  title: string;
  badge: string;
  description: string;
  hint: string;
  isCompleted: boolean;
  verify: (data: DataPoint[], confMatrix?: ConfusionMatrix | null, modelTrained?: boolean) => boolean;
}
