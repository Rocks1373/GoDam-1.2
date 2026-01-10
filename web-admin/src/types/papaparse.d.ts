declare module "papaparse" {
  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
    column?: number;
  }

  export interface ParseMeta {
    fields?: string[];
    delimiter?: string;
    linebreak?: string;
    aborted?: boolean;
    truncated?: boolean;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (result: ParseResult<T>) => void;
    error?: (error: ParseError) => void;
  }

  export function parse<T>(input: File | string, config?: ParseConfig<T>): void;

  const papa: { parse: typeof parse };
  export default papa;
}

