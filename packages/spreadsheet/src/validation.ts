import { CellConfig, SheetID } from "./Spreadsheet";
import { CellInterface } from "@rowsncolumns/grid";
import { detectDataType } from "./constants";

export interface ValidationResponse {
  valid?: boolean;
  message?: string;
}

/**
 * Validate cell changes
 * @param id
 * @param value
 * @param cell
 * @param cellConfig
 */
export const validate = async (
  value: React.ReactText,
  id: SheetID,
  cell: CellInterface,
  cellConfig: CellConfig | undefined
): Promise<ValidationResponse | undefined> => {
  let valid;
  switch (cellConfig?.dataValidation?.type) {
    case "list": {
      const validList = cellConfig?.dataValidation?.formulae;
      if (!validList) {
        valid = false;
        return { valid };
      }
      valid = validList?.includes(value);
      return {
        valid,
      };
    }

    case "boolean": {
      const validList = cellConfig?.dataValidation?.formulae;
      if (!validList) {
        valid = false;
        return { valid };
      }
      valid = validList?.includes(value);
      return {
        valid,
      };
    }

    case "decimal": {
      const { operator, formulae } = cellConfig.dataValidation;
      const inferredType = detectDataType(value);
      if (inferredType !== "number") return { valid: false };
      let valid = true;
      const num = parseFloat(value as string);
      switch (operator) {
        case "notBetween":
        case "between":
          const [from, to] = formulae as number[];
          const isBetween = num >= from && num <= to;
          valid = operator === "between" ? isBetween : !isBetween;
          break;

        case "equal":
          valid = num === formulae?.[0];
          break;

        case "notEqual":
          valid = num !== formulae?.[0];
          break;

        case "greaterThan":
          valid = num > formulae?.[0];
          break;

        case "lessThan":
          valid = num < formulae?.[0];
          break;

        case "greaterThanOrEqual":
          valid = num >= formulae?.[0];
          break;

        case "lessThanOrEqual":
          valid = num <= formulae?.[0];
          break;
      }
      return {
        valid,
      };
    }

    default:
      return void 0;
  }
};

export default validate;
