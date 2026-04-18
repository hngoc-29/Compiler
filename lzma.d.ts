// Type declaration cho package `lzma` (không có built-in .d.ts)
declare module 'lzma' {
  export class LZMA {
    compress(
      data: string | number[],
      mode: number,
      on_finish: (result: number[], error: unknown) => void,
      on_progress?: (percent: number) => void
    ): void;
    decompress(
      data: number[] | Uint8Array,
      on_finish: (result: string | null, error: unknown) => void,
      on_progress?: (percent: number) => void
    ): void;
  }
}
