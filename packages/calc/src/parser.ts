import FastFormulaParser from "fast-formula-parser";
import { DepParser } from "fast-formula-parser/grammar/dependency/hooks";
import FormulaError from "fast-formula-parser/formulas/error";
import { detectDataType, DATATYPES } from "./helpers";
import { CellsBySheet } from "./calc";
import merge from "lodash.merge";
import { CellConfig, castToString, CellConfigGetter } from '@rowsncolumns/spreadsheet'

export type Sheet = string;

export interface Position {
  sheet: Sheet;
  row: number;
  col: number;
}

export interface CellRange {
  sheet: Sheet;
  from: Omit<Position, "sheet">;
  to: Omit<Position, "sheet">;
}

export type ResultArray = any[][];

export interface ParseResults {
  result?: React.ReactText | undefined | ResultArray;
  formulatype?: DATATYPES;
  error?: string;
}

const basePosition: Position = { row: 1, col: 1, sheet: "Sheet1" };

export interface CellInterface {
  rowIndex: number;
  columnIndex: number;
}

export type GetValue = (sheet: Sheet, cell: CellInterface) => CellConfig;

export interface Functions {
  [key: string]: (args: any) => any;
}

export interface FormulaProps {
  getValue?: CellConfigGetter | undefined;
  functions?: Functions;
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
  constructor(options?: FormulaProps) {
    if (options?.getValue) {
      this.getValue = options.getValue;
    }
    this.formulaParser = new FastFormulaParser({
      functions: options?.functions,
      onCell: this.getCellValue,
      onRange: this.getRangeValue
    });
    this.dependencyParser = new DepParser();
  }

  cacheValues = (changes: CellsBySheet) => {
    this.currentValues = merge(this.currentValues, changes);
  };

  clearCachedValues = () => {
    this.currentValues = undefined;
  };

  getCellConfig = (position: Position) => {
    const sheet = position.sheet;
    const cell = { rowIndex: position.row, columnIndex: position.col };
    const config =
      this.currentValues?.[position.sheet]?.[position.row]?.[position.col] ??
      this.getValue?.(sheet, cell) ??
      null;

    if (config === null) return config;
    if (config?.datatype === "formula") {
      return config?.result;
    }
    return (config && config.datatype === "number") ||
      config?.formulatype === "number"
      ? parseFloat(castToString(config.text) || "0")
      : config.text ?? null;
  };

  getCellValue = (pos: Position) => {
    return this.getCellConfig(pos);
  };

  getRangeValue = (ref: CellRange) => {
    const arr = [];
    for (let row = ref.from.row; row <= ref.to.row; row++) {
      const innerArr = [];
      for (let col = ref.from.col; col <= ref.to.col; col++) {
        innerArr.push(this.getCellValue({ sheet: ref.sheet, row, col }));
      }
      arr.push(innerArr);
    }
    return arr;
  };
  parse = async (
    text: string | null,
    position: Position = basePosition,
    getValue?: CellConfigGetter
  ): Promise<ParseResults> => {
    /* Update getter */
    if (getValue !== void 0) this.getValue = getValue;
    let result;
    let error;
    let formulatype: DATATYPES | undefined;
    try {
      result = await this.formulaParser.parseAsync(text, position, true);
      if ((result as any) instanceof FormulaError) {
        error =
          ((result as unknown) as FormulaError).message ||
          ((result as unknown) as FormulaError).error;
      }
      formulatype = detectDataType(result);
    } catch (err) {
      error = err.toString();
      formulatype = "error";
    }
    return { result, formulatype, error };
  };
  getDependencies = (text: string, position: Position = basePosition) => {
    return this.dependencyParser.parse(text, position);
  };
}

export { FormulaParser };
