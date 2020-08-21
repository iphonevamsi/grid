import ExcelJS, {
  FillPattern,
  CellFormulaValue,
  WorksheetViewFrozen,
  Buffer,
  ValueType,
  Borders,
  CellHyperlinkValue,
  CellRichTextValue,
  ErrorValue,
  CellSharedFormulaValue,
} from "exceljs";
import {
  Sheet,
  addressToCell,
  CellConfig,
  cellToAddress,
  uuid,
  HORIZONTAL_ALIGNMENT,
  VERTICAL_ALIGNMENT,
  DEFAULT_ROW_COUNT,
  DEFAULT_COLUMN_COUNT,
  dotArray,
} from "@rowsncolumns/spreadsheet";
import {
  CellInterface,
  getBoundedCells,
  cellIdentifier,
} from "@rowsncolumns/grid";
import { DATATYPES } from "@rowsncolumns/spreadsheet";

export interface ParseProps {
  file: File;
}

export interface ParseResults {
  sheets: Sheet[];
  rowCount?: number;
  columnCount?: number;
}

/**
 * 
 * @param type 
 * 
export declare enum ValueType {
	Null = 0,
	Merge = 1,
	Number = 2,
	String = 3,
	Date = 4,
	Hyperlink = 5,
	Formula = 6,
	SharedString = 7,
	RichText = 8,
	Boolean = 9,
	Error = 10
}
 */
export const getDataTypeFromType = (type: number): DATATYPES => {
  switch (type) {
    case ValueType.Number:
      return "number";
    case ValueType.Date:
      return "date";
    case ValueType.Formula:
      return "formula";
    case ValueType.Hyperlink:
      return "hyperlink";
    case ValueType.Null:
      return "null";
    default:
      return "string";
  }
};

export const getTypeFromDataType = (datatype: DATATYPES): number => {
  switch (datatype) {
    case "number":
      return ValueType.Number;
    case "date":
      return ValueType.Date;
    default:
      return ValueType.String;
  }
};

/* Get text from cell */
const getCellText = (
  cell: ExcelJS.Cell,
  sheet: ExcelJS.Worksheet
): string | undefined => {
  switch (cell.type) {
    case ValueType.Null:
      return "";
    case ValueType.Formula:
      const isSharedFormula = (cell.value as CellSharedFormulaValue)
        .sharedFormula;
      if (isSharedFormula) {
        return `=${sheet.getCell(isSharedFormula).formula}`;
      }
      return `=${(cell.value as CellFormulaValue).formula}`;
    case ValueType.Hyperlink: {
      const text = (cell.value as CellHyperlinkValue).text;
      return typeof text === "string" ? text : "Unable to parse";
    }
    case ValueType.RichText:
      return (cell.value as CellRichTextValue).richText
        .map((value) => value.text)
        .join(" ");
    default:
      return cell.value?.toString();
  }
};

const parseFormulaError = (cell: ExcelJS.Cell): string | undefined => {
  const values = Object.values(ErrorValue);
  return values.find((val) => {
    return val === (cell.value as CellFormulaValue).result;
  });
};

/* Get attributes from cell */
const getCellAttributes = (cell: ExcelJS.Cell) => {
  const attrs: Record<string, any> = {};
  switch (cell.type) {
    case ValueType.Formula:
      attrs.result = (cell.value as CellFormulaValue).result;
      attrs.error = parseFormulaError(cell);
      break;
    case ValueType.Hyperlink:
      attrs.hyperlink = (cell.value as CellHyperlinkValue).hyperlink;
      break;
  }
  return attrs;
};

/* Remove hex from colors */
export const removeHex = (str: string) => str.replace("#", "");
export const hasBorder = (cell: CellConfig) =>
  cell.strokeTopWidth ||
  cell.strokeBottomWidth ||
  cell.strokeLeftWidth ||
  cell.strokeRightWidth;
/**
 * Convert excel file to Spreadsheet format
 * @param param0
 */
export const parseExcel = async ({
  file,
}: ParseProps): Promise<ParseResults> => {
  let resolver: (value: ParseResults) => void | null;
  const sheetPromise: Promise<ParseResults> = new Promise(
    (resolve) => (resolver = resolve)
  );
  const wb = new ExcelJS.Workbook();
  const reader = new FileReader();
  const sheets: Sheet[] = [];
  reader.onload = async () => {
    const buffer = reader.result;
    if (!buffer || typeof buffer === "string") {
      console.warn("Invalid file", buffer);
      return;
    }
    const workbook = await wb.xlsx.load(buffer);

    /* Walk each sheet */
    workbook.eachSheet((sheet) => {
      if (sheet.state === "hidden") {
        return;
      }

      const _sheet: Sheet = {
        id: uuid(),
        name: sheet.name,
        cells: {},
        activeCell: null,
        selections: [],
        mergedCells: [],
        hiddenRows: [],
        hiddenColumns: [],
        filterViews: [],
        rowCount: Math.max(DEFAULT_ROW_COUNT, sheet.rowCount),
        columnCount: Math.max(DEFAULT_COLUMN_COUNT, sheet.columns?.length ?? 0),
      };
      const mergedCellMap = new Map();
      if (sheet.hasMerges) {
        // @ts-ignore
        for (const address in sheet._merges) {
          // @ts-ignore
          const { model: bounds } = sheet._merges[address];
          const { top, bottom, left, right } = bounds;
          for (const cell of getBoundedCells(bounds)) {
            mergedCellMap.set(cell, bounds);
          }
          _sheet.mergedCells?.push({ top, bottom, left, right });
        }
      }
      /* Support autofilter */
      if (sheet.autoFilter) {
        const [from, to] = (sheet.autoFilter as string)
          .replace(/\$/gi, "")
          .split(":");
        const topBound = addressToCell(from);
        const bottomBound = addressToCell(to);
        if (topBound && bottomBound) {
          _sheet.filterViews?.push({
            bounds: {
              top: topBound?.rowIndex,
              left: topBound?.columnIndex,
              right: bottomBound?.columnIndex,
              bottom: bottomBound?.rowIndex,
            },
          });
        }
      }

      /* Check if a cell is part of a merged cell */
      const isMergedCell = ({ rowIndex, columnIndex }: CellInterface) => {
        return mergedCellMap.has(cellIdentifier(rowIndex, columnIndex));
      };

      /* Views */
      const { views } = sheet;
      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const { activeCell } = view;
        if (activeCell) {
          _sheet.activeCell = addressToCell(activeCell);
        }
        const { xSplit, ySplit } = view as WorksheetViewFrozen;
        if (xSplit !== void 0) {
          _sheet.frozenColumns = xSplit;
        }
        if (ySplit !== void 0) {
          _sheet.frozenRows = ySplit;
        }
      }

      /* Walk each row */
      const rowCount = sheet.rowCount;
      for (let i = 1; i <= rowCount; i++) {
        const row = sheet.getRow(i);
        const rowId = row.number;
        const columnCount = row.cellCount;

        if (row.hidden) {
          _sheet.hiddenRows?.push(rowId);
        }

        _sheet.cells[rowId] = {};
        for (let j = 1; j <= columnCount; j++) {
          const cell = row.getCell(j);

          const currentCell: CellInterface = {
            rowIndex: rowId,
            columnIndex: j,
          };
          /* Check if its a merged cell */
          const isMerged = isMergedCell(currentCell);
          if (isMerged) {
            const mergedBounds = mergedCellMap.get(
              cellIdentifier(currentCell.rowIndex, currentCell.columnIndex)
            );
            if (
              mergedBounds.top !== currentCell.rowIndex ||
              mergedBounds.left !== currentCell.columnIndex
            ) {
              continue;
            }
          }

          // Format
          const format = cell.style.numFmt ?? void 0;

          let fill = undefined;
          let color = undefined;
          let strokes: CellConfig = {};
          let fontConfig: Partial<CellConfig> = {};

          /* Fill */
          const fillType = cell.style.fill;
          const datatype = getDataTypeFromType(cell.type);
          const resultType =
            datatype === "formula"
              ? getDataTypeFromType(cell.effectiveType)
              : void 0;
          const border = cell.style.border;
          if (fillType !== void 0 && cell.style.fill?.type === "pattern") {
            const fillValue = (cell.style
              .fill as FillPattern).bgColor?.argb?.slice(2);
            if (fillValue) fill = "#" + fillValue;
          }

          if (cell.font?.size) {
            /**
             * Excel font sizes are in `pt`
             * 10pt = 13px
             */
            fontConfig.fontSize = cell.font.size;
          }

          if (cell.font?.color) {
            const colorValue = cell.font.color.argb?.slice(2);
            if (colorValue) color = "#" + colorValue;
          }

          if (cell.font?.bold) {
            fontConfig.bold = cell.font.bold;
          }
          if (cell.font?.italic) {
            fontConfig.italic = cell.font.italic;
          }
          if (cell.font?.underline) {
            fontConfig.underline = !!cell.font.underline;
          }
          if (cell.font?.name) {
            fontConfig.fontFamily = cell.font.name;
          }
          if (cell.alignment?.horizontal) {
            fontConfig.horizontalAlign = cell.alignment
              .horizontal as HORIZONTAL_ALIGNMENT;
          }
          if (cell.alignment?.vertical) {
            fontConfig.verticalAlign = cell.alignment
              .vertical as VERTICAL_ALIGNMENT;
          }

          if (border) {
            for (const key in border) {
              if (key === "bottom") {
                strokes.strokeBottomDash =
                  border[key]?.style === "dotted" ||
                  border[key]?.style === "hair"
                    ? dotArray
                    : [];
                strokes.strokeBottomWidth = 1;
                strokes.strokeBottomColor =
                  "#" + (border[key]?.color?.argb?.slice(2) ?? "black");
              }
              if (key === "top") {
                strokes.strokeTopDash =
                  border[key]?.style === "dotted" ||
                  border[key]?.style === "hair"
                    ? dotArray
                    : [];
                strokes.strokeTopWidth = 1;
                strokes.strokeTopColor =
                  "#" + (border[key]?.color?.argb?.slice(2) ?? "black");
              }
              if (key === "left") {
                strokes.strokeLeftDash =
                  border[key]?.style === "dotted" ||
                  border[key]?.style === "hair"
                    ? dotArray
                    : [];
                strokes.strokeLeftWidth = 1;
                strokes.strokeLeftColor =
                  "#" + (border[key]?.color?.argb?.slice(2) ?? "black");
              }
              if (key === "right") {
                strokes.strokeRightDash =
                  border[key]?.style === "dotted" ||
                  border[key]?.style === "hair"
                    ? dotArray
                    : [];
                strokes.strokeRightWidth = 1;
                strokes.strokeRightColor =
                  "#" + (border[key]?.color?.argb?.slice(2) ?? "black");
              }
            }
          }

          let result;
          if (datatype === "formula") {
            result = (cell.value as CellFormulaValue).result as
              | string
              | number
              | boolean
              | Date
              | undefined;
          }
          const text = getCellText(cell, sheet);
          const attributes = getCellAttributes(cell);

          _sheet.cells[rowId][j] = {
            text,
            fill,
            color,
            datatype,
            resultType,
            result,
            format,
            ...strokes,
            ...fontConfig,
            ...attributes,
          };
        }
      }

      sheets.push(_sheet);
    });

    resolver({
      sheets,
    });
  };
  /* Start reading the file */
  reader.readAsArrayBuffer(file);

  return sheetPromise;
};

/**
 * Create an excel file blob from sheets
 * @param sheets
 */
export const createExcelFileFromSheets = async (
  sheets: Sheet[]
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const {
      name,
      cells,
      frozenColumns = 0,
      frozenRows = 0,
      mergedCells = [],
      hiddenRows = [],
      hiddenColumns = [],
    } = sheet;
    const rowCount = Math.max(0, ...Object.keys(cells ?? {}).map(Number));
    const workSheet = workbook.addWorksheet(name);
    const viewState = frozenColumns > 0 || frozenRows > 0 ? "frozen" : "normal";
    /* Create worksheet view */
    workSheet.views.push({
      state: viewState,
      xSplit: frozenColumns,
      ySplit: frozenRows,
    });

    // Merged cells
    if (mergedCells.length) {
      for (let i = 0; i < mergedCells.length; i++) {
        const cur = mergedCells[i];
        const topLeft = cellToAddress({
          rowIndex: cur.top,
          columnIndex: cur.left,
        });
        const bottomRight = cellToAddress({
          rowIndex: cur.bottom,
          columnIndex: cur.right,
        });
        workSheet.mergeCells(`${topLeft}:${bottomRight}`);
      }
    }
    // hidden rows
    if (hiddenRows.length) {
      hiddenRows.forEach((id) => (workSheet.getRow(id).hidden = true));
    }

    // hidden columns
    if (hiddenColumns.length) {
      hiddenColumns.forEach((id) => (workSheet.getColumn(id).hidden = true));
    }

    /* Create cells */
    for (let j = 1; j <= rowCount; j++) {
      const row = cells[j];
      const cellCount = Math.max(0, ...Object.keys(row ?? {}).map(Number));
      for (let k = 1; k <= cellCount; k++) {
        const cell = row[k];
        if (cell === void 0) continue;
        const address = cellToAddress({ rowIndex: j, columnIndex: k });
        if (address !== null) {
          const newCell = workSheet.getCell(address);
          const isNumber = cell.datatype === "number";
          const value =
            isNumber && cell.text !== void 0
              ? parseFloat(cell.text.toString())
              : cell.text;
          if (value !== void 0) {
            newCell.value = value;
          }

          // Format
          if (cell.format) {
            newCell.numFmt = cell.format;
          }

          // Font
          newCell.font = newCell.font ?? {};

          // font family
          if (cell.fontFamily) {
            newCell.font.name = cell.fontFamily;
          }

          // bold
          if (cell.bold) {
            newCell.font.bold = cell.bold;
          }

          // italic
          if (cell.italic) {
            newCell.font.italic = cell.italic;
          }

          // underline
          if (cell.underline) {
            newCell.font.underline = cell.underline;
          }

          // Alignment
          if (cell.horizontalAlign || cell.verticalAlign) {
            newCell.alignment = newCell.alignment ?? {};
            newCell.alignment.horizontal = cell.horizontalAlign;
            newCell.alignment.vertical = cell.verticalAlign;
          }

          // Color
          if (cell.color) {
            newCell.font.color = {
              argb: "FF" + removeHex(cell.color),
            };
          }

          // Fill
          if (cell.fill) {
            newCell.fill = {
              type: "pattern",
              pattern: "solid",
              bgColor: {
                argb: "FF" + removeHex(cell.fill),
              },
              fgColor: {
                argb: "FF" + removeHex(cell.fill),
              },
            };
          }
          // Border
          const cellHasBorder = hasBorder(cell);
          if (cellHasBorder) {
            newCell.border = newCell.border ?? {};
            if (cell.strokeTopWidth && cell.strokeTopColor) {
              newCell.border.top = {
                style: "thin",
                color: {
                  argb: "FF" + removeHex(cell.strokeTopColor),
                },
              };
            }
            if (cell.strokeBottomWidth && cell.strokeBottomColor) {
              newCell.border.bottom = {
                style: "thin",
                color: {
                  argb: "FF" + removeHex(cell.strokeBottomColor),
                },
              };
            }
            if (cell.strokeLeftWidth && cell.strokeLeftColor) {
              newCell.border.left = {
                style: "thin",
                color: {
                  argb: "FF" + removeHex(cell.strokeLeftColor),
                },
              };
            }
            if (cell.strokeRightWidth && cell.strokeRightColor) {
              newCell.border.right = {
                style: "thin",
                color: {
                  argb: "FF" + removeHex(cell.strokeRightColor),
                },
              };
            }
          }
          // / Border
        }
      }
    }
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
