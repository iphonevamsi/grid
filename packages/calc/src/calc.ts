import {
  FormulaParser,
  Sheet,
  CellRange,
  Functions,
  ParseResults,
  CellPosition,
  SheetConfig,
} from "./parser";
import { Dag, Node, DependencyMapping } from "./graph";
import {
  cellToAddress,
  isNull,
  createPosition,
  detectDataType,
  castToString,
  log,
} from "./helpers";
import merge from "lodash.merge";
import FormulaError from "fast-formula-parser/formulas/error";
import { CellConfig, CellConfigGetter } from "./types";

interface CellInterface {
  rowIndex: number;
  columnIndex: number;
}
export type CellsBySheet = Record<string, Cells>;
type Cells = Record<string, Cell>;
type Cell = Record<string, CellConfig>;

export interface CalcEngineOptions {
  functions?: Functions;
  getSheetRange: (name: Sheet) => SheetConfig;
}

/**
 * Todo
 * Remove dependencies on delete
 */
class CalcEngine {
  parser: FormulaParser;
  dag: Dag<Node>;
  mapping: DependencyMapping;
  constructor(options: CalcEngineOptions) {
    this.parser = new FormulaParser(options);
    this.dag = new Dag<Node>((node) => node.children);
    this.mapping = new DependencyMapping();
  }

  /**
   * Parses a single cell
   * @param value
   * @param sheet
   * @param cell
   * @param getValue
   */
  calculate = async (
    value: string | undefined,
    sheet: Sheet,
    cell: CellInterface,
    getValue: CellConfigGetter
  ) => {
    const config = getValue(sheet, cell);
    if (value === void 0 || isNull(value) || config?.datatype !== "formula") {
      const cellAddress = cellToAddress(cell);
      if (!cellAddress) return void 0;
      if (!this.mapping.has(cellAddress, sheet)) {
        return void 0;
      }
      const node = this.mapping.get(cellAddress, sheet, cell);
      if (!node) return void 0;
      const dependencies = this.dag.visit([node]);
      /* Remove current node */
      dependencies.delete(node);
      if (dependencies.size > 0) {
        const values = await this.calculateDependencies(dependencies, getValue);
        /* Remove all caches after calculation is complete */
        this.parser.clearCachedValues();
        return values;
      }
      return void 0;
    }

    const formula = value.substr(1);
    const cellAddress = cellToAddress(cell);
    if (!cellAddress) {
      return void 0;
    }
    const parentNode = this.mapping.get(cellAddress, sheet, cell);
    if (!parentNode) {
      return void 0;
    }
    const position = createPosition(
      sheet,
      Number(cell.rowIndex),
      Number(cell.columnIndex)
    );
    const changes: CellsBySheet = {};
    changes[sheet] = changes[sheet] ?? {};
    changes[sheet][cell.rowIndex] = changes[sheet][cell.rowIndex] ?? {};

    /**
     * catch dependency errors
     */
    let dependencies;
    try {
      dependencies = this.parser.getDependencies(formula, position);
    } catch (err) {
      let error;
      let errorMessage;

      if ((err as any) instanceof FormulaError) {
        error = err.error;
        errorMessage = err.message;
      } else {
        error = new FormulaError("#ERROR").toString();
        errorMessage = err.toString();
      }
      log("Error parsing formula: ", formula, cell);
      changes[sheet][cell.rowIndex][cell.columnIndex] = {
        error,
        errorMessage,
      };
      /* Remove all caches after calculation is complete */
      this.parser.clearCachedValues();

      return changes;
    }

    /* Create results */
    changes[sheet] = changes[sheet] ?? {};
    changes[sheet][cell.rowIndex] = changes[sheet][cell.rowIndex] ?? {};

    /* Calculate */
    const result = await this.parser.parse(formula, position, getValue);

    /* Check collision */
    const collides = this.detectCollision(result, sheet, cell, getValue);
    if (collides) {
      const collisionAddress = cellToAddress(collides as CellInterface);
      changes[sheet][cell.rowIndex][cell.columnIndex] = {
        resultType: "error",
        errorMessage: `Array result was not expanded because it would overwrite data in ${collisionAddress}`,
        error: new FormulaError("#REF").toString(),
      };

      /* Remove all caches after calculation is complete */
      this.parser.clearCachedValues();
      return changes;
    }

    /* Update results */
    this.prepareResult(formula, result, sheet, cell, changes);

    /**
     * Cache current value
     * Eg
     * 1. User enters B1=SUM(A1, 20)
     * 2. B2 = B1
     * 3. When user changes B1, we need to use the result to calculate B2
     * 4. So we are merging the results to `getValue` in parser
     */
    this.parser.cacheValues(changes);

    /**
     * Add dependencies
     */
    for (const dep of dependencies) {
      if ((dep as CellRange).from) {
        const { rowCount, columnCount } = this.parser.sheetRange(dep.sheet);
        const { from, to, sheet } = this.restrictRowRange(
          dep as CellRange,
          rowCount
        );
        for (let i = from.row; i <= to.row; i++) {
          for (
            let j = Math.min(from.col, columnCount);
            j <= Math.min(to.col, columnCount);
            j++
          ) {
            const curCell = { rowIndex: i, columnIndex: j };
            const address = cellToAddress(curCell);
            if (!address) {
              continue;
            }
            const node = this.mapping.get(address, sheet, curCell);
            node?.children.add(parentNode);
          }
        }
      } else {
        const { row, col, sheet } = dep as CellPosition;
        const address = cellToAddress({
          rowIndex: row,
          columnIndex: col,
        }) as string;
        const cellNode = { rowIndex: row, columnIndex: col };
        const node = this.mapping.get(address, sheet, cellNode);
        node?.children.add(parentNode);
      }
    }

    /**
     * Visit dependents
     */
    const directDependencies = this.dag.visit([parentNode]);
    directDependencies.delete(parentNode);
    let values = {};
    if (directDependencies.size > 0) {
      values = await this.calculateDependencies(directDependencies, getValue);
    }

    /* Remove all caches after calculation is complete */
    this.parser.clearCachedValues();

    return this.prepareOutput(merge(changes, values));
  };

  /**
   * Does array formula collides
   * @param result
   * @param sheet
   * @param cell
   * @param getValue
   */
  detectCollision = (
    result: ParseResults,
    sheet: Sheet,
    cell: CellInterface,
    getValue: CellConfigGetter
  ): boolean | CellInterface => {
    const address = cellToAddress(cell);
    if (result.resultType === "array") {
      const arrayResult = result.result as any[][];
      for (let i = 0; i < arrayResult.length; i++) {
        for (let j = 0; j < arrayResult[i].length; j++) {
          if (i === 0 && j === 0) {
            continue;
          }
          const currentCell = {
            rowIndex: cell.rowIndex + i,
            columnIndex: cell.columnIndex + j,
          };
          const currentConfig = getValue(sheet, currentCell);
          if (
            currentConfig &&
            !isNull(currentConfig.text) &&
            currentConfig?.parentCell !== address
          ) {
            return currentCell;
          }
        }
      }
    }
    return false;
  };

  restrictRowRange = (ref: CellRange, rowCount: number) => {
    return {
      ...ref,
      from: {
        ...ref.from,
        row: Math.min(ref.from.row, rowCount),
      },
      to: {
        ...ref.to,
        row: Math.min(ref.to.row, rowCount),
      },
    };
  };

  prepareOutput = (changes: CellsBySheet) => {
    if (Object.keys(changes).length) return changes;
    return void 0;
  };

  prepareResult = (
    formula: string,
    result: ParseResults,
    sheet: Sheet,
    cell: CellInterface,
    changes: CellsBySheet
  ) => {
    changes[sheet] = changes[sheet] ?? {};
    changes[sheet][cell.rowIndex] = changes[sheet][cell.rowIndex] ?? {};
    const parentCell = cellToAddress(cell) as string;
    const parentNode = this.mapping.get(parentCell, sheet, cell);
    if (!parentCell || !parentNode) {
      return changes;
    }
    if (result.resultType === "array") {
      const array = result.result as any[][];
      const vLen = array.length;
      const hLen = array[0].length;
      /* Add range of this array to formula cell */
      changes[sheet][cell.rowIndex][cell.columnIndex] =
        changes[sheet][cell.rowIndex][cell.columnIndex] ?? {};

      for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
          const value = array[i][j];
          const row = cell.rowIndex + i;
          const col = cell.columnIndex + j;
          const currentCell = { rowIndex: row, columnIndex: col };
          changes[sheet][row] = changes[sheet][row] ?? {};
          if (i === 0 && j === 0) {
            // Active formula cell
            changes[sheet][row][col] = {
              result: value,
              resultType: detectDataType(value),
              parentCell,
              error: void 0,
            };
          } else {
            changes[sheet][row][col] = {
              text: value,
              parentCell,
              datatype: detectDataType(value),
            };
          }

          const address = cellToAddress({
            rowIndex: row,
            columnIndex: col,
          }) as string;

          const node = this.mapping.get(address, sheet, currentCell);
          node?.children.add(parentNode);
        }
      }
      /* Add range */
      changes[sheet][cell.rowIndex][cell.columnIndex].formulaRange = [
        hLen,
        vLen,
      ];
    } else {
      // @ts-ignore
      changes[sheet][cell.rowIndex][cell.columnIndex] = result;
    }
    return changes;
  };

  calculateDependencies = async (
    dependencies: Set<Node>,
    getValue: CellConfigGetter
  ) => {
    const changes: CellsBySheet = {};
    for (const { cell, sheet } of dependencies) {
      const config = getValue(sheet, cell);
      const isFormula = config?.datatype === "formula";
      if (!isFormula || isNull(config?.text) || config?.text === void 0)
        continue;
      const position = createPosition(
        sheet,
        Number(cell.rowIndex),
        Number(cell.columnIndex)
      );
      const formula = castToString(config?.text)?.substr(1) ?? null;
      if (formula === null) {
        continue;
      }

      const result = await this.parser.parse(formula, position, getValue);

      /* Check collision in dependencies */
      const collides = this.detectCollision(result, sheet, cell, getValue);
      if (collides) {
        changes[sheet] = changes[sheet] ?? {};
        changes[sheet][cell.rowIndex] = changes[sheet][cell.rowIndex] ?? {};
        const collisionAddress = cellToAddress(collides as CellInterface);
        changes[sheet][cell.rowIndex][cell.columnIndex] = {
          errorMessage: `Array result was not expanded because it would overwrite data in ${collisionAddress}`,
          error: new FormulaError("#REF").toString(),
        };
        return changes;
      }

      /* Update results */
      this.prepareResult(formula, result, sheet, cell, changes);

      /* Cache current values so subsequent calculations can use the result */
      this.parser.cacheValues(changes);
    }
    return changes;
  };

  calculateBatch = async (
    changes: CellsBySheet,
    getValue: CellConfigGetter
  ) => {
    const values = {};
    for (const sheet in changes) {
      for (const rowIndex in changes[sheet]) {
        for (const columnIndex in changes[sheet][rowIndex]) {
          const cell = {
            rowIndex: Number(rowIndex),
            columnIndex: Number(columnIndex),
          };
          const config =
            getValue(sheet, cell) ?? changes[sheet][rowIndex][columnIndex];
          if (config === void 0) {
            continue;
          }
          const results = await this.calculate(
            castToString(config?.text),
            sheet,
            cell,
            getValue
          );

          merge(values, results);
        }
      }
    }
    return this.prepareOutput(values);
  };

  /**
   * Set dependencies in graph
   * @param changes
   */
  initialize = async (changes: CellsBySheet, getValue: CellConfigGetter) => {
    /* Clear all mapping */
    this.mapping.clearAll();
    const values = {};
    for (const sheet in changes) {
      for (const rowIndex in changes[sheet]) {
        for (const columnIndex in changes[sheet][rowIndex]) {
          const cellConfig = changes[sheet][rowIndex][columnIndex];
          const datatype = cellConfig.datatype;
          const text = cellConfig?.text as string;

          if (!isNull(text) && datatype === "formula") {
            const formula = text.substr(1);
            const cell = {
              rowIndex: Number(rowIndex),
              columnIndex: Number(columnIndex),
            };
            const cellAddress = cellToAddress(cell);
            if (!cellAddress) {
              continue;
            }

            const parentNode = this.mapping.get(cellAddress, sheet, cell);
            if (!cellAddress || !parentNode) {
              continue;
            }
            const position = createPosition(
              sheet,
              Number(rowIndex),
              Number(columnIndex)
            );

            const result = await this.calculate(text, sheet, cell, getValue);

            /* Merge results  */
            merge(values, result);

            try {
              const dependents = this.parser.getDependencies(formula, position);
              for (const dep of dependents) {
                if ((dep as CellRange).from) {
                  const { rowCount, columnCount } = this.parser.sheetRange(
                    dep.sheet
                  );
                  const { from, to, sheet } = this.restrictRowRange(
                    dep as CellRange,
                    rowCount
                  );
                  for (let i = from.row; i <= to.row; i++) {
                    for (
                      let j = Math.min(from.col, columnCount);
                      j <= Math.min(to.col, columnCount);
                      j++
                    ) {
                      const cell = { rowIndex: i, columnIndex: j };
                      const address = cellToAddress(cell);
                      if (!address) {
                        continue;
                      }
                      const node = this.mapping.get(address, sheet, cell);
                      node?.children.add(parentNode);
                    }
                  }
                } else {
                  const { row, col, sheet } = dep as CellPosition;
                  const address = cellToAddress({
                    rowIndex: row,
                    columnIndex: col,
                  }) as string;
                  const cell = { rowIndex: row, columnIndex: col };
                  const node = this.mapping.get(address, sheet, cell);
                  node?.children.add(parentNode);
                }
              }
            } catch (err) {
              log("Error parsing formula ", err);
            }
          }
        }
      }

      return values;
    }
  };
}

export default CalcEngine;
