declare module "fast-formula-parser" {
  class FormulaParser {
    constructor(options: any) {}
    parse: (text: string | null, position: any) => any;
    parseAsync: (
      text: string | null,
      position: any,
      array?: boolean
    ) => Promise<any | undefined>;
    getValue: (
      sheet: Sheet,
      row: number,
      col: number
    ) => React.ReactText | undefined;
    getSupportedFormulas: () => string[];
  }

  export default FormulaParser;
}

declare module "fast-formula-parser/grammar/dependency/hooks" {
  class DepParser {
    parse: (text: string, position: any) => any;
  }
}

declare module "fast-formula-parser/formulas/error" {
  class FormulaError {
    static REF: any;
    constructor(readonly error: string, readonly message?: string) {}
  }
  export default FormulaError;
}
