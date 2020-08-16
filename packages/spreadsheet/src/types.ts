export enum FORMATTING_TYPE {
  BOLD = "bold",
  ITALIC = "italic",
  HORIZONTAL_ALIGN = "horizontalAlign",
  VERTICAL_ALIGN = "verticalAlign",
  STRIKE = "strike",
  UNDERLINE = "underline",
  FILL = "fill",
  COLOR = "color",
  PERCENT = "percent",
  DECIMALS = "decimals",
  CURRENCY_SYMBOL = "currencySymbol",
  FONT_SIZE = "fontSize",
  FONT_FAMILY = "fontFamily",
  CUSTOM_FORMAT = "format",
  WRAP = "wrap",
  ROTATION = "rotation",
}

export enum FONT_WEIGHT {
  BOLD = "bold",
  NORMAL = "normal",
}

export enum FONT_STYLE {
  ITALIC = "italic",
  NORMAL = "normal",
}

export enum TEXT_DECORATION {
  STRIKE = "line-through",
  NONE = "",
  UNDERLINE = "underline",
}

export type VERTICAL_ALIGNMENT =
  | "top"
  | "middle"
  | "bottom"
  | "justify"
  | "distributed";
export type HORIZONTAL_ALIGNMENT =
  | "left"
  | "center"
  | "right"
  | "fill"
  | "centerContinuous"
  | "justify"
  | "distributed";

export type DATATYPES =
  | "null"
  | "number"
  | "string"
  | "date"
  | "formula"
  | "richtext"
  | "boolean"
  | "error"
  | "hyperlink"
  | "array";

export enum STROKE_FORMATTING {
  STROKE = "stroke",
  STROKE_TOP_COLOR = "strokeTopColor",
  STROKE_RIGHT_COLOR = "strokeRightColor",
  STROKE_BOTTOM_COLOR = "strokeBottomColor",
  STROKE_LEFT_COLOR = "strokeLeftColor",
  STROKE_WIDTH = "strokeWidth",
  STROKE_TOP_WIDTH = "strokeTopWidth",
  STROKE_RIGHT_WIDTH = "strokeRightWidth",
  STROKE_BOTTOM_WIDTH = "strokeBottomWidth",
  STROKE_LEFT_WIDTH = "strokeLeftWidth",
  STROKE_DASH = "strokeDash",
  STROKE_TOP_DASH = "strokeTopDash",
  STROKE_RIGHT_DASH = "strokeRightDash",
  STROKE_BOTTOM_DASH = "strokeBottomDash",
  STROKE_LEFT_DASH = "strokeLeftDash",
}

export interface CellFormatting extends CellDataFormatting {
  datatype?: DATATYPES;
  /**
   * Used for formulas to indicate datatype of result
   */
  resultType?: DATATYPES;
  // formulatype?: DATATYPES; // Can be used for None, Master or Shared formula
  /**
   * Formulas can extend range of a cell
   * When a cell with `range` is deleted, all cells within that range will be cleared
   */
  formulaRange?: number[];
  /**
   * Address of parent cell. For Array formula
   */
  parentCell?: string;

  /**
   * Indicate a process
   */
  loading?: boolean;
  loadingText?: string;

  plaintext?: boolean;
  [FORMATTING_TYPE.BOLD]?: boolean;
  [FORMATTING_TYPE.COLOR]?: string;
  [FORMATTING_TYPE.ITALIC]?: boolean;
  [FORMATTING_TYPE.HORIZONTAL_ALIGN]?: HORIZONTAL_ALIGNMENT;
  [FORMATTING_TYPE.VERTICAL_ALIGN]?: VERTICAL_ALIGNMENT;
  [FORMATTING_TYPE.UNDERLINE]?: boolean;
  [FORMATTING_TYPE.STRIKE]?: boolean;
  [FORMATTING_TYPE.FILL]?: string;

  stroke?: string;
  strokeTopColor?: string;
  strokeRightColor?: string;
  strokeBottomColor?: string;
  strokeLeftColor?: string;
  strokeWidth?: number;
  strokeTopWidth?: number;
  strokeRightWidth?: number;
  strokeBottomWidth?: number;
  strokeLeftWidth?: number;
  strokeDash?: number[];
  strokeTopDash?: number[];
  strokeRightDash?: number[];
  strokeBottomDash?: number[];
  strokeLeftDash?: number[];
  lineCap?: string;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  /**
   * Protection: Lock a cell from being edited
   */
  locked?: boolean;
  /**
   * Protection: Hide a cell value
   */
  hidden?: boolean;
  /**
   * Enable text wrapping
   */
  wrap?: Wrap;
  rotation?: number;
  dataValidation?: DataValidation;
  hyperlink?: string;
  image?: string;
  /* Allow any arbitrary values */
  [key: string]: any;
}

export type Wrap = "wrap" | "clip" | "overflow";

export interface CellDataFormatting {
  [FORMATTING_TYPE.PERCENT]?: boolean;
  [FORMATTING_TYPE.CURRENCY_SYMBOL]?: string;
  format?: string;
}

export enum AXIS {
  X = "x",
  Y = "y",
}

export enum BORDER_VARIANT {
  ALL = "all",
  INNER = "inner",
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
  OUTER = "outer",
  LEFT = "left",
  RIGHT = "right",
  BOTTOM = "bottom",
  TOP = "top",
  NONE = "none",
}

export enum OPERATION_TYPE {
  CELL_ATTRIBUTE = "cell_attribute",
  CHANGE_SHEET_NAME = "change_sheet_name",
  SHEET_ADD = "sheet_add",
  SHEET_REMOVE = "sheet_remove",
}

export enum RESOURCE_TYPE {
  SHEET = "sheet",
  CELL = "cell",
  SELECTION = "selection",
}

export enum BORDER_STYLE {
  "THIN" = "thin",
  "MEDIUM" = "medium",
  "THICK" = "thick",
  "DASHED" = "dashed",
  "DOTTED" = "dotted",
  "DOUBLE" = "double",
}

export type Formatter = (
  value: FormatInputValue,
  datatype?: DATATYPES,
  formatting?: CellDataFormatting
) => string | undefined;

export type FormatInputValue = React.ReactText | undefined | boolean | Date;

export enum SELECTION_MODE {
  CELL = "cell",
  ROW = "row",
  COLUMN = "column",
  BOTH = "both",
}
export type DataValidationOperator =
  | "between"
  | "notBetween"
  | "equal"
  | "notEqual"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

export type DataValidationType =
  | "list"
  | "whole"
  | "decimal"
  | "date"
  | "textLength"
  | "custom"
  | "boolean";

export type CellErrorValue =
  | "#N/A"
  | "#REF!"
  | "#NAME?"
  | "#DIV/0!"
  | "#NULL!"
  | "#VALUE!"
  | "#NUM!";

export enum ErrorValue {
  NotApplicable = "#N/A",
  Ref = "#REF!",
  Name = "#NAME?",
  DivZero = "#DIV/0!",
  Null = "#NULL!",
  Value = "#VALUE!",
  Num = "#NUM!",
}

export interface DataValidation {
  type: DataValidationType;
  formulae?: any[];
  allowBlank?: boolean;
  operator?: DataValidationOperator;
  error?: string;
  errorTitle?: string;
  errorStyle?: string;
  prompt?: string;
  promptTitle?: string;
  showErrorMessage?: boolean;
  showInputMessage?: boolean;
}

export type EditorType = "text" | "date" | "list" | "boolean" | "formula";

export type ResultType = string | number | boolean | Date;
