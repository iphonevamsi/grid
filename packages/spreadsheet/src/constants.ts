import { Sheet, CellConfig, Cells } from "./Spreadsheet";
import {
  BORDER_VARIANT,
  BORDER_STYLE,
  DataValidation,
  EditorType,
  DataValidationType,
  FormatInputValue,
  DATATYPES,
  FORMATTING_TYPE,
  STROKE_FORMATTING,
} from "./types";
import {
  isNull,
  SelectionArea,
  CellInterface,
  AreaProps,
  canUseDOM,
  castToString,
} from "@rowsncolumns/grid";
import SSF from "ssf";

export const DEFAULT_ROW_COUNT = 1000;
export const DEFAULT_COLUMN_COUNT = 1000;
export const COLUMN_HEADER_HEIGHT = 24;
export const FORMULABAR_LEFT_CORNER_WIDTH = 47;
export const ROW_HEADER_WIDTH = 46;
export const DEFAULT_ROW_HEIGHT = 21;
export const DEFAULT_COLUMN_WIDTH = 100;
export const DARK_MODE_COLOR = "rgb(26, 32, 44)";
export const DARK_MODE_COLOR_LIGHT = "#252E3E";
export const EMPTY_ARRAY = [];
export const HEADER_BORDER_COLOR = "#C0C0C0";
export const CELL_BORDER_COLOR = "#E3E2E2";
export const FORMAT_PERCENT = "0.00%";
export const FORMAT_CURRENCY = "$0.00";
export const FORMAT_DEFAULT_DECIMAL = "0.0";
export const SYSTEM_FONT =
  "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji";
export const FORMULA_FONT = "Inconsolata,monospace,arial,sans,sans-serif";
export const FORMULA_FONT_SIZE = 14;
export const INVALID_COLOR = "#FF5621";
export const ERROR_COLOR = "#C63929";
export const INFO_COLOR = "#1D72E8";
export const HYPERLINK_COLOR = "#1155CC";
export const LINE_HEIGHT_RATIO = 1;
export const DEFAULT_CELL_PADDING = 4;
export const CELL_BORDER_WIDTH = 1;

/**
 * Number to alphabet
 * @param i
 */
export const number2Alpha = (i: number): string => {
  return (
    (i >= 26 ? number2Alpha(((i / 26) >> 0) - 1) : "") +
    "abcdefghijklmnopqrstuvwxyz"[i % 26 >> 0]
  ).toUpperCase();
};

/**
 * Converts a letter to number
 * A = 1
 * B => 2
 * @param letters
 */
export const alpha2number = (letters: string): number => {
  return letters.split("").reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0);
};

/**
 * Converts address string to CellInterface
 * @param address
 */
export const addressToCell = (address: string): CellInterface | null => {
  const regex = /\$?([A-Z]+)\$?(\d+)/gim;
  let m;
  let matches: string[] = [];

  while ((m = regex.exec(address)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      if (groupIndex > 0) matches.push(match);
    });
  }
  if (!matches.length) return null;
  const [columnAlpha, rowIndex] = matches;
  return {
    rowIndex: parseInt(rowIndex),
    columnIndex: alpha2number(columnAlpha),
  };
};

/**
 * Convert cellInterface to address string
 * @param cell
 */
export const cellToAddress = (
  cell: CellInterface | null,
  isAbsoluteColumn: boolean = false,
  isAbsoluteRow: boolean = false
): string | null => {
  if (!cell) return null;
  if (cell.columnIndex === 0) {
    return null;
  }
  return `${isAbsoluteColumn ? "$" : ""}${number2Alpha(cell.columnIndex - 1)}${
    isAbsoluteRow ? "$" : ""
  }${Math.max(0, cell.rowIndex)}`;
};

/**
 * Create a new sheet
 * @param param0
 */
export const createNewSheet = ({ count }: { count: number }): Sheet => ({
  id: uuid(),
  name: `Sheet${count}`,
  cells: {},
  activeCell: {
    rowIndex: 1,
    columnIndex: 1,
  },
  selections: [],
  scrollState: { scrollTop: 0, scrollLeft: 0 },
  columnSizes: {},
  rowSizes: {},
});

/**
 * UUID generator
 */
export const uuid = () => "_" + Math.random().toString(36).substr(2, 9);

/**
 * Format a string
 * @param value
 * @param datatype
 * @param formatting
 *
 * More info https://github.com/SheetJS/ssf
 */
export const format = (
  value: FormatInputValue,
  datatype?: DATATYPES,
  cellConfig?: CellConfig
): string | undefined => {
  if (value === void 0 || isNull(value) || isNull(datatype))
    return castToString(value);
  if (!cellConfig) return castToString(value);
  if (datatype === "date") {
    return SSF.format(cellConfig.format || DEFAULT_DATE_FORMAT, value);
  }
  const num = parseFloat(typeof value !== "string" ? "" + value : value);
  try {
    if (cellConfig.decimals) {
      let fmt = Array.from({ length: cellConfig.decimals })
        .map((_) => "0")
        .join("");
      value = SSF.format(`#.${fmt}`, num);
    }
    if (cellConfig.format) {
      value = SSF.format(cellConfig.format, num);
    }
  } catch (err) {
    console.error("Error while formatting ", num, err);
  }
  return "" + value;
};

/**
 * Check if a cell is numeric
 */
export const isNumeric = (cell: CellConfig) => {
  return cell && (cell.datatype === "number" || cell.resultType === "number");
};

/**
 * Detect datatype of a string
 * @param value
 */
export const detectDataType = (value?: any): DATATYPES | undefined => {
  if (isNull(value)) return void 0;
  if (!isNaN(Number(value))) return "number";
  if (castToString(value)?.startsWith("=")) return "formula";
  return void 0;
};

export const FONT_SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 18, 24, 36];

export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Source Sans Pro",
  "Comic Sans MS",
  "Courier New",
  "Verdana",
  "Times New Roman",
];

export const AVAILABLE_FORMATS = [
  {
    label: "Number",
    value: "0.00",
    sample: "1,000.12",
  },
  {
    label: "Percent",
    value: FORMAT_PERCENT,
    sample: "10.12%",
  },
  {
    label: "Scientific",
    value: "0.00E+00",
    sample: "1.01E+03",
  },
];

export const AVAILABLE_CURRENCY_FORMATS = [
  {
    label: "Accounting",
    value: "$(0.00)",
    sample: "$(1,000.12)",
  },
  {
    label: "Financial",
    value: "(0.00)",
    sample: "(1,000.12)",
  },
  {
    label: "Currency",
    value: FORMAT_CURRENCY,
    sample: "$1,000.00",
  },
  {
    label: "Currency (rounded)",
    value: "$#",
    sample: "$1,000",
  },
];

export const SCALE_VALUES = [
  {
    label: "50%",
    value: 0.5,
  },
  {
    label: "75%",
    value: 0.75,
  },
  {
    label: "100%",
    value: 1,
  },
  {
    label: "125%",
    value: 1.25,
  },
  {
    label: "150%",
    value: 1.5,
  },
  {
    label: "200%",
    value: 2,
  },
];
export const DEFAULT_DATE_FORMAT = "d-mmm-yy";
export const DEFAULT_FONT_SIZE = 12;
export const DEFAULT_FONT_FAMILY = "Arial";
/**
 * Lighten or darken colors
 * @param color
 * @param amount
 */
export const luminance = (color: string | undefined, amount: number) => {
  if (!color || !color.startsWith("#")) return color;
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        (
          "0" +
          Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
        ).substr(-2)
      )
  );
};

/* DPR */
const dpr = canUseDOM ? window.devicePixelRatio : 1;
const dashDotWidth = Math.max(Math.floor(dpr / 2), 0.5);
export const dotArray =
  dpr === 1 ? [dashDotWidth, dashDotWidth + dpr] : [dashDotWidth, dashDotWidth];
export const dashArray = [2, 2];
export const cellsInSelectionVariant = (
  selections: SelectionArea[],
  variant: BORDER_VARIANT | undefined,
  borderStyle: BORDER_STYLE = "thin",
  color?: string,
  boundGetter?: (coords: CellInterface | null) => AreaProps | undefined
) => {
  const thickness =
    borderStyle === "medium" ? 2 : borderStyle === "thick" ? 3 : 1;
  const dash =
    borderStyle === "dashed"
      ? dashArray
      : borderStyle === "dotted"
      ? dotArray
      : [];

  const lineCap = "butt";
  const cells: Cells = {};
  for (let i = 0; i < selections.length; i++) {
    const { bounds } = selections[i];
    for (let j = bounds.top; j <= bounds.bottom; j++) {
      cells[j] = cells[j] ?? {};
      for (let k = bounds.left; k <= bounds.right; k++) {
        cells[j][k] = cells[j][k] || {};
        const actualBounds = boundGetter?.({ rowIndex: j, columnIndex: k });
        const { rowIndex, columnIndex } = actualBounds
          ? { rowIndex: actualBounds.top, columnIndex: actualBounds.left }
          : { rowIndex: j, columnIndex: k };

        switch (variant) {
          case "outer":
            if (j === bounds.top) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeTopColor: color,
                strokeTopWidth: thickness,
                strokeTopDash: dash,
                lineCap,
              };
            }
            if (k === bounds.right) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeRightColor: color,
                strokeRightWidth: thickness,
                strokeRightDash: dash,
                lineCap,
              };
            }
            if (j === bounds.bottom) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeBottomColor: color,
                strokeBottomWidth: thickness,
                strokeBottomDash: dash,
                lineCap,
              };
            }
            if (k === bounds.left) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeLeftColor: color,
                strokeLeftWidth: thickness,
                strokeLeftDash: dash,
                lineCap,
              };
            }
            break;

          case "all":
            cells[rowIndex][columnIndex] = {
              strokeTopColor: color,
              strokeTopWidth: thickness,
              strokeTopDash: dash,
              strokeLeftColor: color,
              strokeLeftWidth: thickness,
              strokeLeftDash: dash,
              strokeRightColor: color,
              strokeRightDash: dash,
              strokeRightWidth: thickness,
              strokeBottomColor: color,
              strokeBottomDash: dash,
              strokeBottomWidth: thickness,
              lineCap,
            };
            break;

          case "inner":
            if (k !== bounds.left && k !== bounds.right) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeLeftColor: color,
                strokeLeftWidth: thickness,
                strokeLeftDash: dash,
                strokeRightColor: color,
                strokeRightDash: dash,
                strokeRightWidth: thickness,
              };
            }
            if (j !== bounds.top && j !== bounds.bottom) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeTopColor: color,
                strokeTopWidth: thickness,
                strokeTopDash: dash,
                strokeBottomColor: color,
                strokeBottomDash: dash,
                strokeBottomWidth: thickness,
              };
            }
            if (bounds.top !== bounds.bottom) {
              if (j === bounds.top) {
                cells[rowIndex][columnIndex] = {
                  ...cells[rowIndex][columnIndex],
                  strokeBottomColor: color,
                  strokeBottomDash: dash,
                  strokeBottomWidth: thickness,
                };
              }
              if (j === bounds.bottom) {
                cells[rowIndex][columnIndex] = {
                  ...cells[rowIndex][columnIndex],
                  strokeTopColor: color,
                  strokeTopDash: dash,
                  strokeTopWidth: thickness,
                };
              }
            }
            if (bounds.left !== bounds.right) {
              if (k === bounds.left) {
                cells[rowIndex][columnIndex] = {
                  ...cells[rowIndex][columnIndex],
                  strokeRightColor: color,
                  strokeRightDash: dash,
                  strokeRightWidth: thickness,
                };
              }
              if (k === bounds.right) {
                cells[rowIndex][columnIndex] = {
                  ...cells[rowIndex][columnIndex],
                  strokeLeftColor: color,
                  strokeLeftDash: dash,
                  strokeLeftWidth: thickness,
                };
              }
            }
            break;

          case "horizontal":
            cells[rowIndex][columnIndex] = {
              strokeBottomColor: color,
              strokeBottomDash: dash,
              strokeBottomWidth: thickness,
              lineCap,
            };
            if (j === bounds.bottom) {
              cells[rowIndex][columnIndex] = {};
            }
            break;

          case "vertical":
            cells[rowIndex][columnIndex] = {
              strokeRightColor: color,
              strokeRightDash: dash,
              strokeRightWidth: thickness,
              lineCap,
            };
            if (k === bounds.right) {
              cells[rowIndex][columnIndex] = {};
            }
            break;

          case "left":
            if (k === bounds.left) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeLeftColor: color,
                strokeLeftDash: dash,
                strokeLeftWidth: thickness,
                lineCap,
              };
            }
            break;

          case "right":
            if (k === bounds.right) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeRightColor: color,
                strokeRightDash: dash,
                strokeRightWidth: thickness,
                lineCap,
              };
            }
            break;

          case "top":
            if (j === bounds.top) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeTopColor: color,
                strokeTopDash: dash,
                strokeTopWidth: thickness,
                lineCap,
              };
            }
            break;

          case "bottom":
            if (j === bounds.bottom) {
              cells[rowIndex][columnIndex] = {
                ...cells[rowIndex][columnIndex],
                strokeBottomColor: color,
                strokeBottomDash: dash,
                strokeBottomWidth: thickness,
                lineCap,
              };
            }
            break;
        }
      }
    }
  }
  return cells;
};

/**
 * Split format after decimal
 * @param str
 */
export const splitDecimals = (str: string) => {
  const regex = /(\d+)(.*)/gm;
  let m;
  const matches: string[] = [];
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      if (groupIndex > 0) {
        matches.push(match);
      }
    });
  }
  return matches;
};

/**
 * Increase decimal places
 * @param format
 */
export const changeDecimals = (format?: string, step = 1) => {
  /* Decrease decimal, without any format */
  if (step < 0 && !format) return format;
  /* If no format */
  if (!format) return FORMAT_DEFAULT_DECIMAL;
  const DEFAULT_FORMAT = `${format}.0`;
  const decimalIndex = format.indexOf(".");
  if (decimalIndex === -1) {
    if (step < 0) return format;
    return DEFAULT_FORMAT;
  }
  const decimalPortion = format.substr(decimalIndex + 1);
  const [num, suffix] = splitDecimals(decimalPortion);
  /* No decimals */
  if (num === "") {
    return DEFAULT_FORMAT;
  }
  const len = num.length + step;
  /* Remove decimal */
  if (len <= 0) {
    return format.substr(0, decimalIndex);
  }
  return (
    format.substr(0, decimalIndex) +
    "." +
    Array.from({ length: len })
      .map((_) => "0")
      .join("") +
    suffix
  );
};

export const getEditorType = (type?: DataValidationType): EditorType => {
  switch (type) {
    case "list":
      return "list";
    default:
      return "text";
  }
};

export const DEFAULT_CHECKBOX_VALUES = ["TRUE", "FALSE"];

export const getMinMax = (o: Object) => {
  const keys = Object.keys(o ?? {}).map(Number);
  const len = keys.length;
  if (len === 0) {
    return [0, 0];
  }
  return [Math.min(...keys), Math.max(...keys)];
};

/* Create custom validation */
export const createCustomValidation = (): DataValidation => {
  return {
    type: "custom",
  };
};

/* Clone a cell config excluding text, result */
export const cloneCellConfig = (config: CellConfig): Partial<CellConfig> => {
  const { text, result, datatype, resultType, ...rest } = config;
  return rest;
};

/* Clone a row */
export const cloneRow = (
  cells: Record<string, CellConfig>
): Record<string, CellConfig> => {
  for (const columnIndex in cells) {
    cells[columnIndex] = cloneCellConfig(cells[columnIndex]);
  }
  return cells;
};

/**
 * Formatting type keys
 */
export const formattingTypeKeys = ([] as string[])
  .concat(Object.values(FORMATTING_TYPE), Object.values(STROKE_FORMATTING))
  .reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<string, boolean>);

/* Sanitize sheet names */
export const sanitizeSheetName = (name: React.ReactText | undefined) => {
  if (name === void 0) return void 0;
  if (typeof name === "number") return name;
  if (name.split(/\s/gi).length > 1) return `'${name}'`;
  return name;
};

/**
 * Remove single quotes from sheet name
 */
export const desanitizeSheetName = (name: React.ReactText | undefined) => {
  if (name === void 0) return void 0;
  if (typeof name === "number") return name;
  return name.replace(new RegExp(/\'/, "gi"), "");
};

/**
 * Check if a string is a formula
 * @param value
 */
export const isAFormula = (value: React.ReactText) => {
  return castToString(value)?.startsWith("=");
};

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @see escape, escapeRegExp, unescape
 * @example
 *
 * escapeRegExp('[lodash](https://lodash.com/)')
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
export const escapeRegExp = (string: string) => {
  return string && reHasRegExpChar.test(string)
    ? string.replace(reRegExpChar, "\\$&")
    : string || "";
};
