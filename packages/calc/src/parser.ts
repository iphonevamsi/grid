import FastFormulaParser from "fast-formula-parser";
import { DepParser } from "fast-formula-parser/grammar/dependency/hooks";
import FormulaError from "fast-formula-parser/formulas/error";
import {
  detectDataType,
  DATATYPES,
  castToString,
  isNull,
  createPosition,
  ERROR_REFERENCE,
} from "./helpers";
import { CellsBySheet } from "./calc";
import merge from "lodash.merge";
import { CellConfig, CellConfigGetter } from "./types";

export type Sheet = string;

export interface CellPosition {
  sheet: Sheet;
  row: number;
  col: number;
}

export interface CellRange {
  sheet: Sheet;
  from: Omit<CellPosition, "sheet">;
  to: Omit<CellPosition, "sheet">;
}

export type ResultArray = any[][];

export const DEFAULT_HYPERLINK_COLOR = "#1155CC";

// Should match SpreadSheet CellConfig
export interface ParseResults {
  result?: React.ReactText | undefined | ResultArray;
  resultType?: DATATYPES;
  error?: string;
  hyperlink?: string;
  errorMessage?: string;
  color?: string;
  underline?: boolean;
  horizontalAlign?: string;
}

const basePosition: CellPosition = { row: 1, col: 1, sheet: "Sheet1" };

/**
 * Remove undefined entries from calculation results
 * @param Object
 */
export const removeUndefined = (o: ParseResults) => {
  for (const key in o) {
    if (o[key as keyof ParseResults] === void 0) {
      delete o[key as keyof ParseResults];
    }
  }
  return o;
};

/**
 * Returns default error message
 * @param err
 */
export const getDefaultErrorMessage = (
  err: FormulaError
): string | undefined => {
  if (err === FormulaError.REF) {
    return ERROR_REFERENCE;
  }
  return void 0;
};

export interface CellInterface {
  rowIndex: number;
  columnIndex: number;
}

export type GetValue = (sheet: Sheet, cell: CellInterface) => CellConfig;

export type Functions = Record<string, (...args: any[]) => any>;

export interface FormulaProps {
  getSheetRange: (name: Sheet) => SheetConfig;
  getValue?: CellConfigGetter | undefined;
  functions?: Functions;
}

export interface SheetConfig {
  rowCount: number;
  columnCount: number;
}

/**
 * Extract JSON object
 * @param str
 */
function extractIfJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}
/**
 * Uppercase boolean
 * @param str
 */
function extractBoolean(str: any) {
  if (str === true || str === false) return str.toString().toUpperCase();
  return str;
}

/**
 * Create a formula parser
 * @param param0
 */
class FormulaParser {
  formulaParser: FastFormulaParser;
  dependencyParser: DepParser;
  getValue: CellConfigGetter | undefined;
  currentValues: CellsBySheet | undefined;
  getSheetRange!: (name: string) => SheetConfig;
  constructor(options: FormulaProps) {
    if (options.getValue) {
      this.getValue = options.getValue;
    }
    if (options.getSheetRange) {
      this.getSheetRange = options.getSheetRange;
    }
    this.formulaParser = new FastFormulaParser({
      functionsNeedContext: options?.functions ?? {},
      onCell: this.getCellValue,
      onRange: this.getRangeValue,
    });
    this.dependencyParser = new DepParser();
  }

  sheetRange(name: Sheet) {
    return this.getSheetRange(name);
  }

  cacheValues = (changes: CellsBySheet) => {
    this.currentValues = merge(this.currentValues, changes);
  };

  clearCachedValues = () => {
    this.currentValues = undefined;
  };

  getCellConfig = (position: CellPosition) => {
    const sheet = position.sheet;
    const cell = {
      rowIndex: position.row,
      columnIndex: position.col,
    };
    const config =
      this.currentValues?.[position.sheet]?.[position.row]?.[position.col] ??
      this.getValue?.(sheet, cell) ??
      null;
    if (config === null) return config;
    if (config?.datatype === "formula" || !isNull(config?.resultType)) {
      return config?.resultType === "number"
        ? Number(castToString(config?.result) ?? "0")
        : config?.result;
    }
    return config && config.datatype === "number"
      ? Number(castToString(config.text) ?? "0")
      : config.text ?? null;
  };

  getCellValue = (pos: CellPosition) => {
    return this.getCellConfig(pos);
  };

  getRangeValue = (ref: CellRange) => {
    const arr = [];
    // Restrict ranges to max row and column count
    const { rowCount, columnCount } = this.sheetRange(ref.sheet);
    for (
      let row = Math.min(ref.from.row, rowCount);
      row <= Math.min(ref.to.row, rowCount);
      row++
    ) {
      const innerArr = [];
      for (
        let col = Math.min(ref.from.col, columnCount);
        col <= Math.min(ref.to.col, columnCount);
        col++
      ) {
        innerArr.push(this.getCellValue({ sheet: ref.sheet, row, col }));
      }
      arr.push(innerArr);
    }
    return arr;
  };
  parse = async (
    text: string | null,
    position: CellPosition = basePosition,
    getValue?: CellConfigGetter
  ): Promise<ParseResults> => {
    /* Update getter */
    if (getValue !== void 0) this.getValue = getValue;
    let result;
    let error;
    let errorMessage;
    let hyperlink;
    let underline;
    let color;
    let horizontalAlign;
    let resultType: DATATYPES | undefined;
    try {
      result = await this.formulaParser
        .parseAsync(text, position, true)
        .catch((err: FormulaError) => {
          result = void 0;
          error = err.error || err.message;
          errorMessage = err.message;
        });

      /* Check if its JSON */
      result = extractIfJSON(result);

      /* Boolean */

      result = extractBoolean(result);

      /**
       * Parse special types
       * 1. Hyperlink
       */
      if (!Array.isArray(result) && typeof result === "object") {
        // Hyperlink
        if (result?.datatype === "hyperlink") {
          resultType = result.datatype;
          hyperlink = result.hyperlink;
          result = result.title || result.hyperlink;
          color = DEFAULT_HYPERLINK_COLOR;
          underline = true;
        }
      } else {
        resultType = detectDataType(result);
      }
      /* For boolean */
      if (resultType === "boolean") {
        horizontalAlign = "center";
      }

      if ((result as any) instanceof FormulaError) {
        error = ((result as unknown) as FormulaError).error;
        errorMessage =
          ((result as unknown) as FormulaError).message ||
          getDefaultErrorMessage(result);
        result = void 0;
      }
    } catch (err) {
      error = err.toString();
      resultType = "error";
    }

    return removeUndefined({
      result,
      resultType,
      hyperlink,
      color,
      underline,
      error,
      errorMessage,
      horizontalAlign,
    });
  };
  getDependencies = (
    text: string,
    position: CellPosition = basePosition
  ): CellRange[] | CellPosition[] => {
    return this.dependencyParser.parse(text, position);
  };
}

export { FormulaParser, FastFormulaParser };
