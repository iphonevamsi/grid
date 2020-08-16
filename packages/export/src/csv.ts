import { Sheet, createNewSheet } from "@rowsncolumns/spreadsheet";
import { ParseProps, ParseResults } from "./excel";

const DELIMITER = ",";

/**
 * Create csv string from sheets
 * @param sheets
 */
export const createCSVFromSheets = async (sheets: Sheet[]): Promise<string> => {
  if (sheets.length === 0) return "";
  const { cells } = sheets[0];
  const rowCount = Math.max(0, ...Object.keys(cells ?? {}).map(Number));
  let csv = "";
  for (let i = 1; i <= rowCount; i++) {
    const row = cells[i];
    const cellCount = Math.max(0, ...Object.keys(row ?? {}).map(Number));
    const rowCells = [];
    for (let j = 1; j <= cellCount; j++) {
      const cell = row?.[j];
      rowCells.push(cell === void 0 ? "" : cell.text);
    }
    csv += rowCells.join(DELIMITER) + "\n";
  }
  return csv;
};

/**
 * Parses a csv file
 */
export const parseCSV = ({ file }: ParseProps): Promise<ParseResults> => {
  let resolver: (value: ParseResults) => void | null;
  const sheetPromise: Promise<ParseResults> = new Promise(
    (resolve) => (resolver = resolve)
  );
  const reader = new FileReader();
  const sheet = createNewSheet({ count: 1 });
  reader.onload = async () => {
    const text = reader.result as String;
    const rows = text.split("\n");
    const rowCount = rows.length;
    for (let i = 0; i < rowCount; i++) {
      const rowIndex = i + 1;
      sheet.cells[rowIndex] = {};
      const row = rows[i];
      if (row === void 0) continue;
      const columns = row.split(DELIMITER);
      const columnCount = columns.length;
      for (let j = 0; j < columnCount; j++) {
        const columnIndex = j + 1;
        const text = columns[j];
        if (text === void 0) continue;
        sheet.cells[rowIndex][columnIndex] = {
          text: columns[j],
        };
      }
    }

    resolver({
      sheets: [sheet],
    });
  };
  /* Start reading the file */
  reader.readAsText(file);

  return sheetPromise;
};
