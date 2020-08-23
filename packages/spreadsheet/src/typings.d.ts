declare module "fast-formula-parser/formulas/error" {
  class FormulaError {
    constructor(
      readonly error: string,
      readonly message?: string,
      readonly details?: string
    ) {}
  }
  export default FormulaError;
}

declare module "fast-formula-parser/grammar/lexing" {
  function lex(text: string): LexResult;
  const tokenVocabulary: Record<string, any> = {};
  export interface LexResult {
    tokens: Token[];
  }
  export interface Token {
    image: string;
    startOffset: number;
    index: number;
    range?: boolean;
    sel?: any;
    endOffset: number;
    endColumn: number;
    startColumn: number;
    sheetName?: string;
    tokenType: {
      name: string;
    };
  }
  export { lex, tokenVocabulary };
}
