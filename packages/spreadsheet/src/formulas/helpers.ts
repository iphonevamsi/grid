import {
  lex,
  tokenVocabulary,
  Token,
} from "fast-formula-parser/grammar/lexing";
import {
  addressToCell,
  cellToAddress,
  desanitizeSheetName,
} from "./../constants";
import { CellInterface, SelectionArea, AreaProps } from "@rowsncolumns/grid";
import { FormulaSelection } from "../Grid/Grid";
import { SheetID } from "../Spreadsheet";
import { Direction } from "@rowsncolumns/grid";
import { Editor, Range } from "slate";

export const TOKEN_TYPE_CELL = "Cell";
export const getSelectionColorAtIndex = (key: number) => {
  var hash = 0;
  var colors = [
    "#11a9cc",
    "#a61d4c",
    "#4285f4",
    "#f4b400",
    "#65b045",
    "#e51c23",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#5677fc",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#259b24",
    "#8bc34a",
    "#afb42b",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
    "#880e4f",
    "#827717",
    "#f7981d", // orange
    "#7e3794",
  ];
  var str = key.toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = ((hash % colors.length) + colors.length) % colors.length;
  return colors[hash];
};

export const selectionFromCells = (
  start: CellInterface,
  end: CellInterface | null = start,
  sheetName: SheetID | undefined
): FormulaSelection => {
  if (!end) end = start;
  return {
    bounds: {
      top: Math.min(start.rowIndex, end.rowIndex),
      left: start.columnIndex,
      right: end.columnIndex,
      bottom: Math.max(start.rowIndex, end.rowIndex),
    },
    sheet: desanitizeSheetName(sheetName),
  };
};

export const selectionToAddress = (
  sel: SelectionArea | undefined
): string | null => {
  if (!sel) return null;
  const { top, left, right, bottom } = sel.bounds;
  const from = cellToAddress({ rowIndex: top, columnIndex: left });
  const to = cellToAddress({ rowIndex: bottom, columnIndex: right });
  return from === to ? from : `${from}:${to || ""}`;
};

export const getSelectionsFromInput = (
  text: string,
  sheet: SheetID | undefined
) => {
  const selections = [];
  try {
    const { tokens } = tokenize(text);
    let len = tokens.length;
    let i = 0;
    let activeSheet = null;
    while (i < len) {
      const token = tokens[i];
      const { image, tokenType } = token;
      if (
        tokenType.name === tokenVocabulary.Sheet.name ||
        tokenType.name === tokenVocabulary.SheetQuoted.name
      ) {
        activeSheet = token;
        i++;
        continue;
      }
      if (tokenType.name === tokenVocabulary.Cell.name) {
        let startCell = addressToCell(image);
        if (!startCell) {
          i++;
          continue;
        }
        let endCell;
        // Check if its a range
        const isRange =
          tokens[i + 1]?.tokenType.name === tokenVocabulary.Colon.name;
        if (isRange) {
          const toImage = tokens[i + 2]?.image;
          endCell = addressToCell(toImage);
        }
        const sheetName = activeSheet?.image.slice(0, -1) || sheet;
        const sel = selectionFromCells(startCell, endCell, sheetName);
        selections.push(sel);
        if (isRange) {
          i = i + 3;
          continue;
        }
      }
      activeSheet = null;
      i++;
    }
    return selections;
  } catch (err) {
    return selections;
  }
};

export const normalizeTokens = (text: string | undefined): Token[] => {
  const normalizedTokens: Token[] = [];
  if (text === void 0) return normalizedTokens;
  try {
    const { tokens } = tokenize(text);
    let len = tokens.length;
    let i = 0;
    let selIndex = -1;
    let activeSheet: Token | null = null;
    while (i < len) {
      const token = tokens[i];
      const { image, tokenType } = token;
      let toImage;
      if (
        tokenType.name === tokenVocabulary.Sheet.name ||
        tokenType.name === tokenVocabulary.SheetQuoted.name
      ) {
        activeSheet = token;
        i++;
        continue;
      }
      if (tokenType.name === tokenVocabulary.Cell.name) {
        let startCell = addressToCell(image);
        if (!startCell) {
          i++;
          continue;
        }
        let endCell;
        // Check if its a range
        const isRange =
          tokens[i + 1]?.tokenType.name === tokenVocabulary.Colon.name;
        if (isRange) {
          toImage = tokens[i + 2]?.image;
          endCell = addressToCell(toImage);
        }
        const sheetName = activeSheet?.image;
        const sel = selectionFromCells(startCell, endCell, sheetName);
        normalizedTokens.push({
          ...token,
          image:
            (activeSheet ? activeSheet.image : "") +
            (isRange ? `${image}:${toImage || ""}` : image),
          endColumn: isRange
            ? token.endColumn + `:${toImage || ""}`.length
            : token.endColumn,
          endOffset: isRange
            ? token.endOffset + `:${toImage || ""}`.length
            : token.endOffset,
          startOffset: activeSheet
            ? activeSheet.startOffset
            : token.startOffset,
          index: ++selIndex,
          sheetName,
          range: isRange,
          sel: sel,
        });

        if (isRange) {
          i = i + 3;
          continue;
        }
      } else {
        normalizedTokens.push(token);
      }
      activeSheet = null;
      i++;
    }

    return normalizedTokens;
  } catch (err) {
    return normalizedTokens;
  }
};

/**
 * Tokenize a text
 * @param text
 */
export const tokenize = (text: string) => {
  return lex(text);
};

/**
 * Converts tokens to string
 * @param tokens
 */
export const detokenize = (tokens: Token[]) => {
  let prevOffset;
  let str = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    str +=
      (prevOffset && prevOffset !== token.startOffset ? " " : "") + token.image;
    prevOffset = token.endColumn;
  }
  return str;
};

type ReferenceMode = "row" | "column";
type SheetOperation =
  | "column-insert"
  | "column-remove"
  | "row-insert"
  | "row-remove";
/**
 * Convert formula to relative values based on source cell
 * @param formula
 * @param sourceCell
 * @param activeCell
 *
 * Any cells less than the insertionIndex will be untouched
 * Eg:
 * B3 => 4
 * B5 => =B3
 *
 * User inserts a row in B4
 * B5 will be untouched as it references a cell above B4 => B3
 */
export const formulaToRelativeReference = (
  formula: React.ReactText | undefined,
  sourceCell: CellInterface,
  destinationCell: CellInterface,
  mode?: ReferenceMode,
  insertionIndex?: number
): string | undefined => {
  if (formula === void 0) {
    return formula;
  }
  const { tokens } = tokenize(formula as string);
  let newTokens = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.tokenType.name === tokenVocabulary.Cell.name) {
      const cell = addressToCell(token.image);
      if (cell) {
        if (mode !== void 0 && insertionIndex !== void 0) {
          if (mode === "row" && cell.rowIndex < insertionIndex) {
            /* Do not change the token */
            newTokens.push(token);
            continue;
          }
          if (mode === "column" && cell.columnIndex < insertionIndex) {
            /* Do not change the token */
            newTokens.push(token);
            continue;
          }
        }
        const rowDelta = sourceCell.rowIndex - cell.rowIndex;
        const columnDelta = sourceCell.columnIndex - cell.columnIndex;
        cell.rowIndex = destinationCell.rowIndex - rowDelta;
        cell.columnIndex = destinationCell.columnIndex - columnDelta;
        /**
         * If there is a cyclic dependency return undefined
         */

        if (
          cell.columnIndex === destinationCell.columnIndex &&
          cell.rowIndex === destinationCell.rowIndex
        ) {
          return void 0;
        }

        const address = cellToAddress(cell);
        if (address === null) {
          return void 0;
        }
        token.image = address;
      }
    }
    newTokens.push(token);
  }
  return detokenize(newTokens);
};

/**
 * Cleanup function token to remove parentheses
 * @param text
 */
export const cleanFunctionToken = (text: string) => {
  return text.replace(new RegExp(/\(|\)/, "gi"), "");
};

/**
 * Move merged cells when user is inserts, deletes row and columns
 * @param mergedCells
 * @param mode
 * @param referenceIndex
 */
export const moveMergedCells = (
  mergedCells: AreaProps[] | undefined,
  op: SheetOperation,
  referenceIndex: number
) => {
  switch (op) {
    case "column-insert": {
      return mergedCells?.map((area) => {
        if (area.left >= referenceIndex) {
          return {
            ...area,
            left: area.left + 1,
            right: area.right + 1,
          };
        }
        return area;
      });
    }
    case "row-insert": {
      return mergedCells?.map((area) => {
        if (area.top >= referenceIndex) {
          return {
            ...area,
            top: area.top + 1,
            bottom: area.bottom + 1,
          };
        }
        return area;
      });
    }

    case "column-remove": {
      return mergedCells?.map((area) => {
        if (area.left >= referenceIndex) {
          return {
            ...area,
            left: area.left - 1,
            right: area.right - 1,
          };
        }
        return area;
      });
    }

    case "row-remove": {
      return mergedCells?.map((area) => {
        if (area.top >= referenceIndex) {
          return {
            ...area,
            top: area.top - 1,
            bottom: area.bottom - 1,
          };
        }
        return area;
      });
    }
  }
  return mergedCells;
};

/**
 * Check if editor should suggest function
 * @param tokens
 * @param editor
 */
export const functionSuggestion = (
  tokens: Token[],
  editor: Editor
): Token | undefined => {
  const start = getCurrentCursorOffset(editor);
  if (start) {
    const charBefore = Editor.before(editor, start, { unit: "character" });
    const range = Editor.range(editor, start, charBefore);
    const str = Editor.string(editor, range);
    const token = tokens.find(
      (token) =>
        start.offset >= token.startOffset && start.offset <= token.endColumn
    );

    return token &&
      str !== "(" &&
      (token.tokenType.name === "Column" ||
        token.tokenType.name === "Name" ||
        token.tokenType.name === "Function" ||
        token.tokenType.name === "ExcelRefFunction" ||
        token.tokenType.name === "ExcelConditionalRefFunction")
      ? token
      : void 0;
  }
  return void 0;
};

export const isTokenACell = (token?: Token | null) => {
  return token && token.tokenType.name === "Cell";
};

export const getCurrentCursorOffset = (editor: Editor) => {
  const { selection } = editor;
  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    return start;
  }
  return void 0;
};

export const showCellSuggestions = (editor: Editor, tokens: Token[]) => {
  const [prev, cur, next] = getSurroundingTokens(tokens, editor);
  const start = getCurrentCursorOffset(editor);
  const ops = [
    ...operators,
    "Comma",
    "Function",
    "ExcelRefFunction",
    "ExcelConditionalRefFunction",
    "QuoteS",
  ];
  const parens = [
    "CloseParen",
    "CloseSquareParen",
    "CloseCurlyParen",
    "QuoteS",
  ];
  const nextOps = ["Comma", ...parens];
  // console.log('d', start, prevToken, curToken, nextToken)
  if (next && next.tokenType.name === "Cell") {
    return false;
  }
  const curTokenIsFn =
    cur &&
    (cur.tokenType.name === "Function" ||
      cur.tokenType.name === "ExcelRefFunction");

  if (start && cur && curTokenIsFn && start.offset < cur.endColumn) {
    return false;
  }

  if (
    start &&
    cur &&
    cur.tokenType.name === "Cell" &&
    start.offset < cur.endColumn
  ) {
    return false;
  }
  if (
    next &&
    nextOps.includes(next.tokenType.name) &&
    cur &&
    cur.tokenType.name !== "Comma" &&
    cur.tokenType.name !== "Function" &&
    cur.tokenType.name !== next.tokenType.name // to remove spaces
  ) {
    return false;
  }

  if (
    next &&
    ["Cell", "Function", "ExcelRefFunction", "OpenParens", "Number"].includes(
      next.tokenType.name
    )
  ) {
    return false;
  }

  return (
    (start &&
      prev &&
      ops.includes(prev.tokenType.name) &&
      start.offset > prev.endOffset) ||
    (next && nextOps.includes(next.tokenType.name))
  );
};

export const isCurrentPositionACell = (editor: Editor, tokens: Token[]) => {
  const token = getCurrentToken(tokens, editor);
  return isTokenACell(token);
};

export const getSurroundingTokens = (tokens: Token[], editor: Editor) => {
  const previous = getPreviousToken(tokens, editor);
  const cur = getCurrentToken(tokens, editor);
  const next = getNextToken(tokens, editor);

  return [previous, cur, next];
};

export const getCurrentToken = (tokens: Token[], editor: Editor) => {
  const { selection } = editor;
  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    return tokens.find((token) => token.endColumn >= start.offset);
  }
  return void 0;
};

export const getPreviousToken = (
  tokens: Token[],
  editor: Editor
): Token | undefined => {
  const start = getCurrentCursorOffset(editor);
  let i = 0;
  let token;
  if (start) {
    while (i < tokens.length) {
      token = tokens[i];
      if (token.startColumn > start.offset) {
        token = tokens[i - 1];
        break;
      }
      i++;
    }
    return token;
  }
};

export const getNextToken = (
  tokens: Token[],
  editor: Editor
): Token | undefined => {
  const start = getCurrentCursorOffset(editor);
  if (!start) return void 0;
  return tokens.find((token) => {
    return token.startOffset >= start.offset;
  });
};

export const operators = [
  "MulOp",
  "PlusOp",
  "DivOp",
  "MinOp",
  "ConcatOp",
  "ExOp",
  "MulOp",
  "PercentOp",
  "NeqOp",
  "GteOp",
  "LteOp",
  "GtOp",
  "EqOp",
  "LtOp",
];

export const operatorTokenNames = [
  "At",
  "Comma",
  "Cell",
  "Function",
  "ExcelRefFunction",
  // "Colon",
  // "Semicolon",
  "OpenParen",
  // "CloseParen",
  // "OpenSquareParen",
  // "CloseSquareParen",
  // // ExclamationMark,
  // "OpenCurlyParen",
  // "CloseCurlyParen",
  // "QuoteS",
  ...operators,
];

export { tokenVocabulary };
