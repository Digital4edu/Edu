import { AnimalClass, ConfusionMatrix, DataPoint, FeatureKey, Hyperparameters, PredictionResult } from '../types';

/**
 * Calculates distance between two points on selected features
 */
export function calculateDistance(
  p1: { [key in FeatureKey]: number },
  p2: { [key in FeatureKey]: number },
  features: FeatureKey[],
  metric: 'euclidean' | 'manhattan' = 'euclidean'
): number {
  if (metric === 'manhattan') {
    return features.reduce((sum, f) => sum + Math.abs(p1[f] - p2[f]), 0);
  }
  // Euclidean
  const sumSq = features.reduce((sum, f) => sum + Math.pow(p1[f] - p2[f], 2), 0);
  return Math.sqrt(sumSq);
}

/**
 * Predicts class using k-Nearest Neighbors
 */
export function predictKNN(
  query: { [key in FeatureKey]: number },
  trainData: DataPoint[],
  hyper: Hyperparameters,
  features: FeatureKey[] = ['orecchie', 'baffi']
): PredictionResult {
  if (trainData.length === 0) {
    return {
      predictedClass: 'GATTO',
      probabilities: { GATTO: 0.33, CANE: 0.33, ALTRO: 0.34 },
      explanation: 'Nessun dato di addestramento disponibile.',
    };
  }

  // Calculate distance to all training points
  const distances = trainData.map(pt => ({
    point: pt,
    distance: calculateDistance(query, pt.features, features, hyper.knnDistanceMetric),
  }));

  // Sort by distance ascending
  distances.sort((a, b) => a.distance - b.distance);

  const k = Math.min(hyper.knnK, distances.length);
  const nearest = distances.slice(0, k);

  const votes: Record<AnimalClass, number> = {
    GATTO: 0,
    CANE: 0,
    ALTRO: 0,
  };

  // Weighted voting by inverse distance (plus small epsilon)
  nearest.forEach(n => {
    const weight = 1 / (n.distance + 0.001);
    votes[n.point.class] += weight;
  });

  const totalWeight = votes.GATTO + votes.CANE + votes.ALTRO;
  const probs = {
    GATTO: Number((votes.GATTO / totalWeight).toFixed(2)),
    CANE: Number((votes.CANE / totalWeight).toFixed(2)),
    ALTRO: Number((votes.ALTRO / totalWeight).toFixed(2)),
  };

  // Determine winner
  let bestClass: AnimalClass = 'GATTO';
  let bestProb = probs.GATTO;

  if (probs.CANE > bestProb) {
    bestClass = 'CANE';
    bestProb = probs.CANE;
  }
  if (probs.ALTRO > bestProb) {
    bestClass = 'ALTRO';
  }

  const nearestSummary = nearest
    .slice(0, 3)
    .map(n => `${n.point.class} (dist: ${n.distance.toFixed(1)})`)
    .join(', ');

  const explanation = `Basato sui ${k} vicini più prossimi (${nearestSummary}). Con metrica ${
    hyper.knnDistanceMetric === 'euclidean' ? 'Euclidea' : 'Manhattan'
  }, il ${Math.round(probs[bestClass] * 100)}% dei pesi vicini appartiene a ${bestClass}.`;

  return {
    predictedClass: bestClass,
    probabilities: probs,
    nearestNeighbors: nearest,
    explanation,
  };
}

/**
 * Predicts class using simulated Neural Network weights
 */
export function predictNeuralNet(
  query: { [key in FeatureKey]: number },
  trainData: DataPoint[],
  hyper: Hyperparameters,
  features: FeatureKey[] = ['orecchie', 'baffi']
): PredictionResult {
  if (trainData.length === 0) {
    return {
      predictedClass: 'GATTO',
      probabilities: { GATTO: 0.33, CANE: 0.33, ALTRO: 0.34 },
      explanation: 'Modello non addestrato.',
    };
  }

  // Centroids learned by the network
  const catPoints = trainData.filter(d => d.class === 'GATTO');
  const dogPoints = trainData.filter(d => d.class === 'CANE');
  const otherPoints = trainData.filter(d => d.class === 'ALTRO');

  const getCenter = (pts: DataPoint[], defaultX: number, defaultY: number) => {
    if (pts.length === 0) return { x: defaultX, y: defaultY };
    const x = pts.reduce((acc, p) => acc + p.features[features[0]], 0) / pts.length;
    const y = pts.reduce((acc, p) => acc + p.features[features[1]], 0) / pts.length;
    return { x, y };
  };

  const centerCat = getCenter(catPoints, 80, 80);
  const centerDog = getCenter(dogPoints, 25, 25);
  const centerOther = getCenter(otherPoints, 50, 20);

  const qX = query[features[0]];
  const qY = query[features[1]];

  const dCat = Math.hypot(qX - centerCat.x, qY - centerCat.y);
  const dDog = Math.hypot(qX - centerDog.x, qY - centerDog.y);
  const dOther = Math.hypot(qX - centerOther.x, qY - centerOther.y);

  // Softmax on inverse distances scaled by learning factor
  const tau = 22; // temperature
  const scoreCat = Math.exp(-dCat / tau);
  const scoreDog = Math.exp(-dDog / tau);
  const scoreOther = Math.exp(-dOther / tau);
  const sumScores = scoreCat + scoreDog + scoreOther;

  const probs = {
    GATTO: Number((scoreCat / sumScores).toFixed(2)),
    CANE: Number((scoreDog / sumScores).toFixed(2)),
    ALTRO: Number((scoreOther / sumScores).toFixed(2)),
  };

  let bestClass: AnimalClass = 'GATTO';
  if (probs.CANE > probs[bestClass]) bestClass = 'CANE';
  if (probs.ALTRO > probs[bestClass]) bestClass = 'ALTRO';

  return {
    predictedClass: bestClass,
    probabilities: probs,
    explanation: `Attivazione dei neuroni di output con softmax (Epoche: ${hyper.epochs}, LR: ${hyper.learningRate}). Punteggio più alto: ${bestClass} (${Math.round(probs[bestClass] * 100)}%).`,
  };
}

/**
 * Builds a 3x3 Confusion Matrix and computes accuracy, precision, recall, and F1
 */
export function buildConfusionMatrix(
  dataset: DataPoint[],
  hyper: Hyperparameters,
  algorithm: 'knn' | 'neural_net',
  features: FeatureKey[] = ['orecchie', 'baffi']
): ConfusionMatrix {
  const classes: AnimalClass[] = ['GATTO', 'CANE', 'ALTRO'];

  const matrix: ConfusionMatrix['matrix'] = {
    GATTO: { GATTO: 0, CANE: 0, ALTRO: 0 },
    CANE: { GATTO: 0, CANE: 0, ALTRO: 0 },
    ALTRO: { GATTO: 0, CANE: 0, ALTRO: 0 },
  };

  // Evaluate points
  const testPoints = dataset.filter(d => d.isTest);
  const evalSet = testPoints.length > 0 ? testPoints : dataset;
  const trainSet = dataset.filter(d => !d.isTest);
  const trainingData = trainSet.length > 0 ? trainSet : dataset;

  let correctCount = 0;

  evalSet.forEach(pt => {
    const pred = algorithm === 'knn'
      ? predictKNN(pt.features, trainingData, hyper, features)
      : predictNeuralNet(pt.features, trainingData, hyper, features);

    matrix[pt.class][pred.predictedClass]++;
    if (pt.class === pred.predictedClass) {
      correctCount++;
    }
  });

  const total = evalSet.length || 1;
  const accuracy = Number((correctCount / total).toFixed(3));

  // Compute Precision, Recall, F1 for each class
  const precision: Record<AnimalClass, number> = { GATTO: 0, CANE: 0, ALTRO: 0 };
  const recall: Record<AnimalClass, number> = { GATTO: 0, CANE: 0, ALTRO: 0 };
  const f1Score: Record<AnimalClass, number> = { GATTO: 0, CANE: 0, ALTRO: 0 };

  classes.forEach(cls => {
    const tp = matrix[cls][cls];
    const fp = classes.filter(c => c !== cls).reduce((acc, c) => acc + matrix[c][cls], 0);
    const fn = classes.filter(c => c !== cls).reduce((acc, c) => acc + matrix[cls][c], 0);

    const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

    precision[cls] = Number(prec.toFixed(2));
    recall[cls] = Number(rec.toFixed(2));
    f1Score[cls] = Number(f1.toFixed(2));
  });

  const macroF1 = Number(
    ((f1Score.GATTO + f1Score.CANE + f1Score.ALTRO) / 3).toFixed(2)
  );

  return {
    matrix,
    accuracy,
    precision,
    recall,
    f1Score,
    macroF1,
  };
}

/**
 * Computes decision boundary grid (e.g. 50x50 cells) for canvas background
 */
export function generateDecisionBoundaryGrid(
  trainData: DataPoint[],
  hyper: Hyperparameters,
  algorithm: 'knn' | 'neural_net',
  features: FeatureKey[] = ['orecchie', 'baffi'],
  resolution: number = 40
): { x: number; y: number; cls: AnimalClass; confidence: number }[] {
  if (trainData.length === 0) return [];

  const grid: { x: number; y: number; cls: AnimalClass; confidence: number }[] = [];
  const step = 100 / resolution;

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x = i * step + step / 2;
      const y = j * step + step / 2;
      const query = {
        orecchie: x,
        baffi: y,
        coda: 50,
        peso: 50,
      };

      const pred = algorithm === 'knn'
        ? predictKNN(query, trainData, hyper, features)
        : predictNeuralNet(query, trainData, hyper, features);

      grid.push({
        x,
        y,
        cls: pred.predictedClass,
        confidence: pred.probabilities[pred.predictedClass],
      });
    }
  }

  return grid;
}
