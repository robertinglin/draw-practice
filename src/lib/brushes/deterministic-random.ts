
class DeterministicRandom {
    private seed: number;
  
    constructor(seed: number) {
      this.seed = seed;
    }
  
    // Simple implementation of the xorshift algorithm
    private xorshift(): number {
      let x = this.seed;
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      this.seed = x;
      return (x >>> 0) / 4294967296; // Normalize to [0, 1)
    }
  
    // Get a random number between 0 and 1
    random(): number {
      return this.xorshift();
    }
  
    // Get a random number between min and max (inclusive)
    randomRange(min: number, max: number): number {
      return Math.floor(this.random() * (max - min + 1)) + min;
    }
  }
  
  export default DeterministicRandom;
  