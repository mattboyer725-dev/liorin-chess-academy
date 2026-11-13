export class LocalPolicy {
  constructor(
    key: string,
    catalog: string[],
    storage?: Storage | null,
    random?: () => number,
  );
  enabled: boolean;
  persistent: boolean;
  scores: Record<string, { q: number; n: number }>;
  readonly count: number;
  setEnabled(enabled: boolean): void;
  choose(candidates: string[]): string | null;
  expose(id: string): number | null;
  reward(receipt: number, value: number): boolean;
  forget(): boolean;
}
