declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T[];
    errors: Array<{ message: string }>;
    meta: Record<string, unknown>;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: { message: string }) => void;
  }

  const Papa: {
    parse<T>(file: File, config: ParseConfig<T>): void;
  };

  export default Papa;
}
