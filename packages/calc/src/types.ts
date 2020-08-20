import { CellInterface } from "./parser";
import { DATATYPES } from "./helpers";

export interface CellConfig {
  text?: string | number;
  /**
   * Result from formula calculation
   */
  result?: string | number | boolean | Date;
  datatype?: DATATYPES;
  /**
   * Used for formulas to indicate datatype of result
   */
  resultType?: DATATYPES;
  /**
   * Formulas can extend range of a cell
   * When a cell with `range` is deleted, all cells within that range will be cleared
   */
  formulaRange?: number[];
  /**
   * Address of parent cell. For Array formula
   */
  parentCell?: string;
  error?: string;
  errorMessage?: string;
  color?: string;
  underline?: boolean;
}

export type CellConfigGetter = (
  id: string,
  cell: CellInterface | null
) => CellConfig | undefined;
