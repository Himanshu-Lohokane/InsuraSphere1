import { Policy, UserPreferences } from '@/types/policy';
import * as tf from '@tensorflow/tfjs';
import { Scaler } from './scaler';

interface PolicyFeatures {
  age: number;
  income: number;
  premium: number;
  coverage: number;
  term: number;
  claimSettlementRatio: number;
  riskTolerance: number;
  familySize: number;
  occupationRisk: number;
  goalsMatch: number;
}

export class MLPolicyRecommendationEngine {
  private model: tf.Sequential;
  private featureScaler: Scaler;
  private labelScaler: Scaler;

  constructor() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }));
    this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    this.featureScaler = new Scaler();
    this.labelScaler = new Scaler();
  }

  private extractFeatures(policy: Policy, preferences: UserPreferences): PolicyFeatures {
    return {
      age: preferences.age,
      income: preferences.income,
      premium: policy.premium,
      coverage: policy.coverage,
      term: policy.term || 0,
      claimSettlementRatio: policy.claimSettlementRatio || 0,
      riskTolerance: preferences.riskTolerance,
      familySize: preferences.familySize,
      occupationRisk: this.calculateOccupationRisk(preferences.occupation),
      goalsMatch: this.calculateGoalsMatch(preferences.goals, policy.goals || []),
    };
  }

  private featuresToArray(features: PolicyFeatures): number[] {
    return [
      features.age,
      features.income,
      features.premium,
      features.coverage,
      features.term,
      features.claimSettlementRatio,
      features.riskTolerance,
      features.familySize,
      features.occupationRisk,
      features.goalsMatch,
    ];
  }

  private calculateOccupationRisk(occupation: string): number {
    const riskLevels: { [key: string]: number } = {
      'student': 0.2,
      'professional': 0.4,
      'business': 0.6,
      'self-employed': 0.7,
      'high-risk': 0.9,
    };
    return riskLevels[occupation.toLowerCase()] || 0.5;
  }

  private calculateGoalsMatch(userGoals: string[], policyGoals: string[]): number {
    if (!userGoals.length || !policyGoals.length) return 0;
    const matches = userGoals.filter(goal => policyGoals.includes(goal)).length;
    return matches / userGoals.length;
  }

  public async train(trainingData: { policy: Policy; preferences: UserPreferences; score: number }[]) {
    const features = trainingData.map(data => 
      this.featuresToArray(this.extractFeatures(data.policy, data.preferences))
    );
    const labels = trainingData.map(data => data.score);

    // Scale features and labels
    const scaledFeatures = this.featureScaler.fitTransform(features);
    const scaledLabels = this.labelScaler.fitTransform([labels]);

    // Convert to tensors
    const featureTensor = tf.tensor2d(scaledFeatures);
    const labelTensor = tf.tensor2d(scaledLabels);

    // Train the model
    await this.model.fit(featureTensor, labelTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
        }
      }
    });

    // Clean up tensors
    featureTensor.dispose();
    labelTensor.dispose();
  }

  public async predict(policy: Policy, preferences: UserPreferences): Promise<number> {
    const features = this.featuresToArray(this.extractFeatures(policy, preferences));
    const scaledFeatures = this.featureScaler.transform([features]);
    const featureTensor = tf.tensor2d(scaledFeatures);
    
    const prediction = this.model.predict(featureTensor) as tf.Tensor;
    const score = await prediction.data();
    
    // Clean up tensors
    featureTensor.dispose();
    prediction.dispose();
    
    return this.labelScaler.inverseTransform([[score[0]]])[0][0];
  }

  public async recommendPolicies(
    preferences: UserPreferences,
    availablePolicies: Policy[],
    topN: number = 5
  ): Promise<{ policy: Policy; score: number }[]> {
    const predictions = await Promise.all(
      availablePolicies.map(async (policy) => ({
        policy,
        score: await this.predict(policy, preferences),
      }))
    );

    return predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
} 