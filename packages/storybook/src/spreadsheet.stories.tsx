// @ts-nocheck
import React, { useState, useCallback, useEffect } from "react";
import Spreadsheet, {
  Sheet,
  defaultSheets,
  DATATYPES,
} from "@rowsncolumns/spreadsheet";
import { parse, download } from "@rowsncolumns/export";
import CalcEngine, { FormulaParser } from "@rowsncolumns/calc";
import { produce, applyPatches } from "immer";

export default {
  title: "Spreadsheet",
  component: Spreadsheet,
};

export const Default = () => {
  const App = () => {
    const [sheets, setSheets] = useState(defaultSheets);
    return (
      <div
        style={{
          margin: 10,
          display: "flex",
          flexDirection: "column",
          minHeight: 800,
        }}
      >
        <Spreadsheet
          sheets={sheets}
          onChangeCells={console.log}
          onChange={setSheets}
        />
      </div>
    );
  };
  return <App />;
};

export const Import = () => {
  const App = () => {
    const [sheets, setSheets] = useState(defaultSheets);
    const handleChangeFile = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const getSheets = async (file) => {
          const newSheets = await parse({ file });
          setSheets(newSheets.sheets);
        };
        getSheets(e.target.files[0]);
      },
      []
    );
    return (
      <div
        style={{
          margin: 10,
          display: "flex",
          flexDirection: "column",
          minHeight: 800,
        }}
      >
        <div>
          <form id="testForm">
            <input
              type="file"
              name="test"
              id="testFile"
              onChange={handleChangeFile}
            />
          </form>
          <button onClick={() => download({ sheets, filename: "Hello" })}>
            Download Excel
          </button>
          <button
            onClick={() => download({ sheets, filename: "Hello", type: "csv" })}
          >
            Download CSV
          </button>
        </div>
        <Spreadsheet sheets={sheets} onChange={setSheets} />
      </div>
    );
  };
  return <App />;
};

Import.story = {
  name: "Import excel file",
};

export const ExportToExcel = () => {
  const App = () => {
    const [sheets, setSheets] = useState(defaultSheets);
    const handleExport = useCallback(({ sheets }) => {
      download({
        sheets,
        filename: "Report",
      });
    }, []);
    return (
      <>
        <br />
        <button onClick={() => handleExport({ sheets })}>
          Export to excel
        </button>
        <div
          style={{
            margin: 10,
            display: "flex",
            flexDirection: "column",
            minHeight: 600,
          }}
        >
          <Spreadsheet sheets={sheets} onChange={setSheets} />
        </div>
      </>
    );
  };
  return <App />;
};

ExportToExcel.story = {
  name: "Export excel file",
};

export const FilterViews = () => {
  const App = () => {
    const initialSheets = [
      {
        name: "Sheet 1",
        id: 0,
        frozenRows: 1,
        frozenColumns: 1,
        hiddenRows: [],
        activeCell: null,
        selections: [],
        cells: {
          1: {
            1: {
              text: "First Name",
            },
            2: {
              text: "Last Name",
            },
            3: {
              text: "Gender",
            },
          },
          2: {
            1: {
              text: "Dulce",
            },
            2: {
              text: "Abril",
            },
            3: {
              text: "Female",
            },
          },
          3: {
            1: {
              text: "Mara",
            },
            2: {
              text: "Hashimoto",
            },
            3: {
              text: "Male",
            },
          },
          4: {
            1: {
              text: "EMara",
            },
            2: {
              text: "Hashimoto",
            },
            3: {
              text: "Male",
            },
          },
          5: {
            5: {
              text: "First name",
            },
            6: {
              text: "Last name",
            },
            7: {
              text: "Gender",
            },
          },
          6: {
            5: {
              text: "EMara",
            },
            6: {
              text: "Hashimoto",
            },
            7: {
              text: "Male",
            },
          },
        },
        filterViews: [
          {
            bounds: {
              top: 1,
              bottom: 5,
              left: 1,
              right: 3,
            },
          },
          {
            bounds: {
              top: 5,
              bottom: 8,
              left: 5,
              right: 7,
            },
          },
        ],
      },
    ];
    return <Spreadsheet initialSheets={initialSheets} />;
  };

  return <App />;
};

const initialValidationSheet: Sheet[] = [
  {
    name: "Sheet 1",
    id: 0,
    activeCell: { rowIndex: 1, columnIndex: 1 },
    selections: [],
    cells: {
      2: {
        2: {
          text: "",
          valid: false,
          dataValidation: {
            prompt: "Enter a country",
            type: "list",
            formulae: ["Singapore", "Japan", "China"],
          },
        },
      },
      3: {
        2: {
          text: "",
          valid: false,
          dataValidation: {
            prompt: "Something went wrong",
            allowBlank: true,
            formulae: [10, 100],
            operator: "between",
            type: "decimal",
          },
        },
      },
      4: {
        2: {
          text: "TRUE",
          datatype: "boolean",
          dataValidation: {
            allowBlank: true,
            type: "boolean",
            prompt: "Invalid entry",
            formulae: ["TRUE", "FALSE"],
          },
        },
      },
      5: {
        2: {
          datatype: "hyperlink",
          text: "Hello world",
          color: "#1155CC",
          underline: true,
          hyperlink: "http://google.com",
        },
      },
      6: {
        2: {
          datatype: "formula",
          text: "=SUM(A1,A2)",
          result: "4",
          error: "#VALUE!",
        },
      },
      7: {
        2: {
          text: "tooltip",
          tooltip: "hello world",
        },
        3: {
          text: "12",
          dataValidation: {
            type: "decimal",
            operator: "between",
            formulae: [0, 10],
            prompt: "Please enter a valid number between 0 and 10",
          },
        },
      },
    },
  },
  {
    name: "Sheet 2",
    id: 2,
    activeCell: { rowIndex: 1, columnIndex: 1 },
    selections: [],
    cells: {},
  },
];
export const DataValidation = () => {
  const App = () => {
    const [sheets, setSheets] = useState<Sheet[]>(initialValidationSheet);
    return (
      <>
        <div
          style={{
            margin: 10,
            display: "flex",
            flexDirection: "column",
            minHeight: 800,
          }}
        >
          <Spreadsheet sheets={sheets} onChange={setSheets} />
        </div>
      </>
    );
  };
  return <App />;
};

export const UsingStateReducer = () => {
  const App = () => {
    const [sheets, setSheets] = useState<Sheet[]>();
    const stateReducer = useCallback((state, action) => {
      console.log(state, action);
      return state;
    }, []);
    return (
      <>
        <div
          style={{
            margin: 10,
            display: "flex",
            flexDirection: "column",
            minHeight: 800,
          }}
        >
          <Spreadsheet sheets={sheets} stateReducer={stateReducer} />
        </div>
      </>
    );
  };
  return <App />;
};

export const CustomDataType = () => {
  const App = () => {
    const sheets: Sheet[] = [
      {
        name: "Sheet 1",
        id: 1,
        activeCell: null,
        selections: [],
        cells: {
          1: {
            2: {
              datatype: "boolean",
              type: "hello",
            },
          },
        },
      },
    ];
    return <Spreadsheet sheets={sheets} />;
  };
  return <App />;
};

export const ProtectedSheet = () => {
  const App = () => {
    const sheets: Sheet[] = [
      {
        name: "Protected sheet",
        id: 1,
        activeCell: null,
        selections: [],
        locked: true,
        cells: {
          1: {
            2: {
              datatype: "boolean",
              type: "hello",
            },
          },
        },
      },
      {
        name: "Hidden sheet",
        id: 2,
        activeCell: null,
        selections: [],
        hidden: true,
        cells: {
          1: {
            2: {
              datatype: "boolean",
              type: "hello",
            },
          },
        },
      },
    ];
    return <Spreadsheet minHeight={600} initialSheets={sheets} />;
  };
  return <App />;
};

export const TabColors = () => {
  const App = () => {
    const sheets: Sheet[] = [
      {
        name: "Sheet 1",
        id: 1,
        activeCell: null,
        selections: [],
        tabColor: "red",
        cells: {
          1: {
            2: {
              datatype: "boolean",
              type: "hello",
            },
          },
        },
      },
    ];
    return <Spreadsheet minHeight={600} sheets={sheets} />;
  };
  return <App />;
};

export const Formula = () => {
  const calcEngine = new CalcEngine({
    functions: {
      FETCH_CSV: async (arg) => {
        return fetch(arg.value)
          .then((r) => r.text())
          .then((response) => {
            const data = [];
            const rows = response.split("\n");
            for (const row of rows) {
              const cols = row.split(",");
              data.push(cols);
            }
            return data;
          });
      },
    },
  });
  const App = () => {
    const initialSheets: Sheet[] = [
      {
        name: "Sheet1",
        id: "1",
        activeCell: null,
        selections: [],
        tabColor: "red",
        cells: {
          1: {
            1: {
              text: "20",
              datatype: "number",
            },
            2: {
              datatype: "formula",
              text: "=SUM(B2, 20)",
              // text: '=HYPERLINK("Google", www.google.com)'
              // text: '=HYPERLINK("asdas")'
              // text: '=CONCAT(A1, "hello")',
              // text: "=SUM(A1:A3, Sheet1!A4)"
              // text: "=MMULT({1,5;2,3},{1,2;2,3})",
              // text: '=fetch_csv("https://raw.githubusercontent.com/tlemenestrel/GDP_and_Employment_Rates_Prediction/master/Employment_Rates_Prediction.csv")'
            },
          },
          2: {
            1: {
              text: "=SUM(B2, 100)",
              datatype: "formula",
            },
          },
          7: {
            3: {
              datatype: "formula",
              text: "=C6",
            },
          },
          // 2: {
          //   2: {
          //     datatype: "formula",
          //     text: "=HELLO()"
          //   }
          // }
        },
      },
    ];
    const [sheets, setSheets] = useState(initialSheets);
    return (
      <Spreadsheet
        minHeight={600}
        sheets={sheets}
        onChange={setSheets}
        onChangeCells={console.log}
        formulas={{
          FETCH_CSV: async (parser: FormulaParser, arg) => {
            return fetch(arg.value)
              .then((r) => r.text())
              .then((response) => {
                const data = [];
                const rows = response.split("\n");
                for (const row of rows) {
                  const cols = row.split(",");
                  data.push(cols);
                }
                return data;
              });
          },
        }}
      />
    );
  };
  return <App />;
};

interface TickInterface {
  row: number;
  col: number;
  sheet: string;
}

const generateRandomData = () => {
  return Array.from({ length: 5 }).map((_, i) => {
    return Array.from({ length: 5 }).map(
      (_, j) => Math.floor(Math.random() * 99) + 1
    );
  });
};

export const TickingFormula = () => {
  const App = () => {
    const gridRef = React.useRef(null);
    const [sheets, setSheets] = useState(defaultSheets);
    const [ticker, setTicker] = useState<TickInterface>(null);
    useEffect(() => {
      let interval;
      if (ticker) {
        interval = setInterval(() => {
          const newData = generateRandomData();
          const { row: parentRow, col: parentCol, sheet } = ticker;
          const changes = { [sheet]: {} };
          for (let i = 0; i < newData.length; i++) {
            changes[sheet][i + parentRow] = changes[sheet][i + parentRow] ?? {};
            for (let j = 0; j < newData[i].length; j++) {
              if (i === 0 && j === 0) {
                continue;
              }
              changes[sheet][i + parentRow][j + parentCol] =
                changes[sheet][i + parentRow][j + parentCol] ?? {};
            }
          }
          setSheets((sheets) => {
            return produce(sheets, (draft) => {
              const sheet = draft.find((sheet) => sheet.name === ticker.sheet);
              if (sheet) {
                for (let i = 0; i < newData.length; i++) {
                  const row = parentRow + i;
                  sheet.cells[row] = sheet.cells[row] ?? {};
                  for (let j = 0; j < newData[i].length; j++) {
                    const col = parentCol + j;
                    sheet.cells[row][col] = sheet.cells[row][col] ?? {};

                    if (row === parentRow && col === parentCol) {
                      /**
                       * User has deleted the parent cell
                       * Another way is to listen to onDeleteCells and disconnect
                       */
                      if (sheet.cells[row][col].text === void 0) {
                        return clearInterval(interval);
                      }
                      sheet.cells[row][col].result = newData[i][j];
                      sheet.cells[row][col].resultType = "number";
                      sheet.cells[row][col].formulaRange = [
                        newData[0].length,
                        newData.length,
                      ];
                    } else {
                      sheet.cells[row][col].text = newData[i][j];
                      sheet.cells[row][col].datatype = "number";
                    }
                  }
                }
              }
            });
          });
          gridRef.current.onCalculate?.(changes).then((results) => {
            gridRef.current.dispatch({
              type: "UPDATE_CELLS",
              changes: results,
            });
          });
        }, 1000);
      }
      return () => {
        interval && clearInterval(interval);
      };
    }, [ticker]);
    return (
      <Spreadsheet
        minHeight={600}
        sheets={sheets}
        ref={gridRef}
        onChange={setSheets}
        formulas={{
          TICK: async (context) => {
            setTicker(context.position);
            return "Connecting...";
          },
        }}
      />
    );
  };
  return <App />;
};
