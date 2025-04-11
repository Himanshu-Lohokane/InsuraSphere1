export class Scaler {
  private min: number[] = [];
  private max: number[] = [];
  private fitted = false;

  fitTransform(data: number[][]): number[][] {
    if (data.length === 0) return [];
    
    const numFeatures = data[0].length;
    this.min = new Array(numFeatures).fill(Infinity);
    this.max = new Array(numFeatures).fill(-Infinity);

    // Find min and max for each feature
    data.forEach(row => {
      row.forEach((value, i) => {
        this.min[i] = Math.min(this.min[i], value);
        this.max[i] = Math.max(this.max[i], value);
      });
    });

    this.fitted = true;
    return this.transform(data);
  }

  transform(data: number[][]): number[][] {
    if (!this.fitted) {
      throw new Error('Scaler must be fitted before transforming data');
    }

    return data.map(row => 
      row.map((value, i) => {
        const range = this.max[i] - this.min[i];
        if (range === 0) return 0;
        return (value - this.min[i]) / range;
      })
    );
  }

  inverseTransform(data: number[][]): number[][] {
    if (!this.fitted) {
      throw new Error('Scaler must be fitted before inverse transforming data');
    }

    return data.map(row =>
      row.map((value, i) => {
        const range = this.max[i] - this.min[i];
        return value * range + this.min[i];
      })
    );
  }
} 