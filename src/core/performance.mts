export function formatElapsedTime(timeSpanMs: number): string {
  return `${(timeSpanMs / 1000).toFixed(6)}s`;
}

export class Stopwatch {
  private startTime: number;

  private constructor(
    private readonly label: string | undefined
  ) {
    this.startTime = performance.now();
  }

  static start(label?: string): Stopwatch {
    return new Stopwatch(label);
  }

  [Symbol.dispose]() {
    const endTime = performance.now();
    console.log(`${this.label ?? 'Elapsed'}: ${formatElapsedTime(endTime - this.startTime)}`);
  }
}
