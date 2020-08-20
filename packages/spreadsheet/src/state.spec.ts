import {
  createStateReducer,
  ACTION_TYPE,
  ActionTypes,
  clearCellKeepFormatting,
} from "./state";
import { initialState, StateInterface, CellConfig } from "./Spreadsheet";
import { createNewSheet } from ".";
import { CellsBySheet } from "@rowsncolumns/calc/dist/calc";
import { SelectionArea, CellInterface } from "@rowsncolumns/grid";
import { AXIS } from "./types";
import { act } from "@testing-library/react";

type StateReducer = (
  state: StateInterface,
  action: ActionTypes
) => StateInterface;

describe("state reducers", () => {
  let reducer: StateReducer;
  let undoCallback = jest.fn();
  let getCellBounds = () => ({
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
  });
  beforeEach(() => {
    reducer = createStateReducer({ addUndoPatch: undoCallback, getCellBounds });
  });

  it("can clear preserve cell formatting when a cell is deleted", () => {
    const cellConfig: CellConfig = {
      text: "hello world",
      bold: true,
    };
    clearCellKeepFormatting(cellConfig);
    expect(cellConfig.bold).toBe(true);
    expect(cellConfig.text).toBeUndefined();
  });

  it("creates a reducer", () => {
    expect(reducer).toBeDefined();
  });

  it("can change sheet", () => {
    const newState = reducer(initialState, {
      type: ACTION_TYPE.SELECT_SHEET,
      id: "sheet_id",
    });

    expect(newState.selectedSheet).toBe("sheet_id");
  });

  it("can switch to next and previous sheet", () => {
    const state = {
      ...initialState,
      sheets: [
        {
          name: "1",
          id: 1,
          cells: {},
          activeCell: null,
          selections: [],
        },
        {
          name: "2",
          id: 2,
          cells: {},
          activeCell: null,
          selections: [],
        },
      ],
      selectedSheet: 1,
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.SELECT_NEXT_SHEET,
    });
    expect(newState.selectedSheet).toBe(2);
    newState = reducer(newState, {
      type: ACTION_TYPE.SELECT_PREV_SHEET,
    });
    expect(newState.selectedSheet).toBe(1);
  });

  it("can update activecell and selections of a sheet", () => {
    const state = {
      ...initialState,
      sheets: [
        {
          name: "1",
          id: 1,
          cells: {},
          activeCell: null,
          selections: [],
        },
      ],
      selectedSheet: 1,
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.SHEET_SELECTION_CHANGE,
      id: 1,
      activeCell: { rowIndex: 2, columnIndex: 1 },
      selections: [],
    });
    expect(newState.sheets[0].activeCell).toStrictEqual({
      rowIndex: 2,
      columnIndex: 1,
    });

    // Does not update sheet if id is invalid
    newState = reducer(newState, {
      type: ACTION_TYPE.SHEET_SELECTION_CHANGE,
      id: 10,
      activeCell: { rowIndex: 2, columnIndex: 1 },
      selections: [],
    });
    expect(newState.sheets[0].activeCell).toStrictEqual({
      rowIndex: 2,
      columnIndex: 1,
    });
  });

  it("can change sheet name", () => {
    const id = initialState.sheets[0].id;
    const newState = reducer(initialState, {
      type: ACTION_TYPE.CHANGE_SHEET_NAME,
      id,
      name: "Hello world",
    });

    expect(newState.sheets.find((sheet) => sheet.id === id)?.name).toBe(
      "Hello world"
    );
  });

  it("can add new sheet", () => {
    const newState = reducer(initialState, {
      type: ACTION_TYPE.NEW_SHEET,
      sheet: createNewSheet({ count: 2 }),
    });

    expect(newState.sheets.length).toBe(2);
    expect(newState.sheets[1].name).toBe("Sheet2");
  });

  it("can add new sheet at a index", () => {
    const state = {
      ...initialState,
      sheets: [...initialState.sheets, createNewSheet({ count: 1 })],
    };
    const newState = reducer(initialState, {
      type: ACTION_TYPE.NEW_SHEET,
      sheet: createNewSheet({ count: 2 }),
      index: 0,
    });

    expect(newState.sheets.length).toBe(2);
    expect(newState.sheets[1].name).toBe("Sheet2");
  });

  it("can change a cell", () => {
    const newState = reducer(initialState, {
      type: ACTION_TYPE.CHANGE_SHEET_CELL,
      id: initialState.sheets[0].id,
      cell: { rowIndex: 1, columnIndex: 1 },
      value: "Hello",
      datatype: "string",
    });

    expect(newState.sheets[0].cells[1]).toBeDefined();
    expect(newState.sheets[0].cells[1][1].text).toBe("Hello");
    expect(newState.sheets[0].cells[1][1].datatype).toBe("string");
    expect(newState.sheets[0].cells[1][1].valid).toBeUndefined();
  });

  it("cant change a cell if its locked", () => {
    const state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          activeCell: null,
          selections: [],
          cells: {
            1: {
              1: {
                text: "hello world",
                locked: true,
              },
            },
          },
        },
      ],
    };
    const newState = reducer(state, {
      type: ACTION_TYPE.CHANGE_SHEET_CELL,
      id: state.sheets[0].id,
      cell: { rowIndex: 1, columnIndex: 1 },
      value: "Hello",
      datatype: "string",
    });

    expect(newState.sheets[0].cells[1]).toBeDefined();
    expect(newState.sheets[0].cells[1][1].text).toBe("hello world");
    expect(newState.sheets[0].cells[1][1].datatype).toBeUndefined();
  });

  it("can delete formula references on cell change", () => {
    const sheetName = "Sheet1";
    const changes: CellsBySheet = {
      [sheetName]: {
        1: {
          1: {
            text: "=A1:B2",
            datatype: "formula",
            resultType: "array",
            formulaRange: [2, 2], // [spans 2 cells horizontally, span 2 cells vertically]
          },
          2: {
            text: "2",
            result: 2,
            resultType: "number",
            parentCell: "A1",
          },
        },
      },
    };
    /* 1: Calculation update a group of cells */
    const newState = reducer(initialState, {
      type: ACTION_TYPE.UPDATE_CELLS,
      changes,
    });
    expect(newState.sheets[0].cells[1][1].text).toBe("=A1:B2");
    expect(newState.sheets[0].cells[1][1].formulaRange).toEqual([2, 2]);

    /* User now updates a cell */
    const stateAfterUpdate = reducer(newState, {
      type: ACTION_TYPE.CHANGE_SHEET_CELL,
      id: newState.sheets[0].id,
      cell: { rowIndex: 1, columnIndex: 1 },
      value: "Hello",
      datatype: "string",
    });

    expect(stateAfterUpdate.sheets[0].cells[1][1].text).toBe("Hello");
    expect(stateAfterUpdate.sheets[0].cells[1][1].formulaRange).toBeUndefined();
    // Deletes the formularange
    expect(stateAfterUpdate.sheets[0].cells[1][2]).toBeUndefined();
  });

  it("can batch updates cells", () => {
    const sheetName = "Sheet1";
    let state = {
      ...initialState,
      sheets: [
        {
          name: sheetName,
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                result: 4,
                color: "red",
              },
            },
          },
          activeCell: null,
          selections: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
              },
            },
          ],
        },
      ],
    };
    const changes: CellsBySheet = {
      [sheetName]: {
        1: {
          1: {
            text: '=HYPERLINK("Google", www.google.com)',
            datatype: "formula",
            resultType: "hyperlink",
            result: void 0,
            color: "blue",
          },
        },
      },
    };
    /* 1: Calculation update a group of cells */
    const newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_CELLS,
      changes,
    });
    expect(newState.sheets[0].cells[1][1].resultType).toEqual("hyperlink");
    expect(newState.sheets[0].cells[1][1].result).toBeUndefined();
    expect(newState.sheets[0].cells[1][1].color).toBe("red");
  });

  it("batch update skips locked cells ", () => {
    const state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          activeCell: null,
          selections: [],
          cells: {
            1: {
              1: {
                locked: true,
              },
            },
          },
        },
      ],
    };
    /* 1: Calculation update a group of cells */
    const newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_CELLS,
      changes: {
        Sheet1: {
          1: {
            1: {
              result: 10,
            },
          },
        },
      },
    });
    expect(newState.sheets[0].cells[1][1].text).toBeUndefined();
  });

  it("can update cells after validation", () => {
    const id = initialState.sheets[0].id;
    const newState = reducer(initialState, {
      type: ACTION_TYPE.VALIDATION_SUCCESS,
      id,
      cell: { rowIndex: 1, columnIndex: 1 },
      valid: false,
      prompt: "Please enter your name",
    });

    expect(newState.sheets[0].cells[1][1].valid).toBeFalsy();
    expect(newState.sheets[0].cells[1][1].dataValidation?.prompt).toBe(
      "Please enter your name"
    );

    // Skips locked cells
  });

  it("can handle cell filling Direction - BOTTOM", () => {
    const state: StateInterface = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              2: {
                text: "=SUM(A1,A2)",
                datatype: "formula",
              },
            },
          },
        };
      }),
    };
    const id = state.sheets[0].id;
    let newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_FILL,
      id,
      activeCell: {
        rowIndex: 5,
        columnIndex: 2,
      },
      // Extended selection
      fillSelection: {
        bounds: {
          top: 5,
          bottom: 8,
          left: 2,
          right: 5,
        },
      },
      // Original selection
      selections: [
        {
          bounds: {
            top: 5,
            left: 2,
            right: 5,
            bottom: 5,
          },
        },
      ],
    });

    expect(newState.sheets[0].cells[6][2].text).toBe("=SUM(A2,A3)");
    expect(newState.sheets[0].cells[7][2].text).toBe("=SUM(A3,A4)");
    expect(newState.sheets[0].cells[8][2].text).toBe("=SUM(A4,A5)");
  });

  it("can handle cell filling - Direction UP", () => {
    const state: StateInterface = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              2: {
                text: "=SUM(A4, A5)",
                datatype: "formula",
              },
            },
          },
        };
      }),
    };
    const id = state.sheets[0].id;
    const newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_FILL,
      id,
      activeCell: {
        rowIndex: 5,
        columnIndex: 2,
      },
      // Extended selection
      fillSelection: {
        bounds: {
          top: 3,
          bottom: 5,
          left: 2,
          right: 5,
        },
      },
      // Original selection
      selections: [
        {
          bounds: {
            top: 5,
            left: 2,
            right: 5,
            bottom: 5,
          },
        },
      ],
    });

    expect(newState.sheets[0].cells[3][2].text).toBe("=SUM(A2, A3)");
    expect(newState.sheets[0].cells[4][2].text).toBe("=SUM(A3, A4)");
  });

  it("can handle cell filling - Direction LEFT", () => {
    const state: StateInterface = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              5: {
                text: "=SUM(F10, F11)",
                datatype: "formula",
              },
            },
          },
        };
      }),
    };
    const id = state.sheets[0].id;
    const newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_FILL,
      id,
      activeCell: {
        rowIndex: 5,
        columnIndex: 5,
      },
      // Extended selection
      fillSelection: {
        bounds: {
          top: 5,
          bottom: 5,
          left: 2,
          right: 5,
        },
      },
      // Original selection
      selections: [
        {
          bounds: {
            top: 5,
            left: 5,
            right: 5,
            bottom: 5,
          },
        },
      ],
    });

    expect(newState.sheets[0].cells[5][2].text).toBe("=SUM(C10, C11)");
    expect(newState.sheets[0].cells[5][3].text).toBe("=SUM(D10, D11)");
  });

  it("can handle cell filling - Direction RIGHT", () => {
    const state: StateInterface = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              5: {
                text: "=SUM(F10, F11)",
                datatype: "formula",
              },
            },
          },
        };
      }),
    };
    const id = state.sheets[0].id;
    const newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_FILL,
      id,
      activeCell: {
        rowIndex: 5,
        columnIndex: 5,
      },
      // Extended selection
      fillSelection: {
        bounds: {
          top: 5,
          bottom: 5,
          left: 5,
          right: 10,
        },
      },
      // Original selection
      selections: [
        {
          bounds: {
            top: 5,
            left: 5,
            right: 5,
            bottom: 5,
          },
        },
      ],
    });

    expect(newState.sheets[0].cells[5][6].text).toBe("=SUM(G10, G11)");
    expect(newState.sheets[0].cells[5][7].text).toBe("=SUM(H10, H11)");
  });

  it("can delete sheets", () => {
    let newState = reducer(initialState, {
      type: ACTION_TYPE.DELETE_SHEET,
      id: initialState.sheets[0].id,
    });

    expect(newState.sheets.length).toBe(0);

    // Skips locked sheet
    let lockedState = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => ({ ...sheet, locked: true })),
    };
    newState = reducer(lockedState, {
      type: ACTION_TYPE.DELETE_SHEET,
      id: initialState.sheets[0].id,
    });
    expect(newState.sheets.length).toBe(1);
  });

  it("Change selected to previous sheet if selected sheet is deleted", () => {
    const state = {
      ...initialState,
      selectedSheet: 2,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: null,
          selections: [],
        },
        {
          name: "Sheet2",
          id: 2,
          cells: {},
          activeCell: null,
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.DELETE_SHEET,
      id: 2,
    });

    expect(newState.selectedSheet).toBe(1);
  });

  it("can change formatting to auto", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                plaintext: true,
              },
            },
          },
          activeCell: null,
          selections: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
              },
            },
          ],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE_AUTO,
      id: 1,
    });

    expect(newState.sheets[0].cells[1][1].plaintext).toBeUndefined();

    // With activecell
    let stateWithActivecell = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                plaintext: true,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    newState = reducer(stateWithActivecell, {
      type: ACTION_TYPE.FORMATTING_CHANGE_AUTO,
      id: 1,
    });

    expect(newState.sheets[0].cells[1][1].plaintext).toBeUndefined();
  });

  it("can change formatting to plaintext", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: null,
          selections: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
              },
            },
          ],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE_PLAIN,
      id: 1,
    });

    expect(newState.sheets[0].cells[1][1].plaintext).toBeTruthy();

    // With activecell
    let stateWithActivecell = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    newState = reducer(stateWithActivecell, {
      type: ACTION_TYPE.FORMATTING_CHANGE_PLAIN,
      id: 1,
    });

    expect(newState.sheets[0].cells[1][1].plaintext).toBeTruthy();
  });

  it("formatting skips locked cells", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                locked: true,
                plaintext: true,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE_AUTO,
      id: 1,
    });
    expect(newState.sheets[0].cells[1][1].plaintext).toBeTruthy();

    newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE_PLAIN,
      id: 1,
    });
    expect(newState.sheets[0].cells[1][1].plaintext).toBeTruthy();

    newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE,
      id: 1,
      key: "bold",
      value: true,
    });

    expect(newState.sheets[0].cells[1][1].bold).toBeUndefined();

    newState = reducer(state, {
      type: ACTION_TYPE.DELETE_CELLS,
      id: 1,
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[1][1].text).toBe("1");

    newState = reducer(state, {
      type: ACTION_TYPE.REMOVE_CELLS,
      id: 1,
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[1][1].text).toBe("1");
  });

  it("can update formatting of cells", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE,
      id: 1,
      key: "bold",
      value: true,
    });
    expect(newState.sheets[0].cells[1][1].bold).toBeTruthy();

    let stateWithSelection = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: null,
          selections: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
              },
            },
          ],
        },
      ],
    };
    newState = reducer(stateWithSelection, {
      type: ACTION_TYPE.FORMATTING_CHANGE,
      id: 1,
      key: "bold",
      value: true,
    });
    expect(newState.sheets[0].cells[1][1].bold).toBeTruthy();
  });

  it("will remove plaintext if user applies format", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                plaintext: true,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.FORMATTING_CHANGE,
      id: 1,
      key: "format",
      value: "##.00",
    });
    expect(newState.sheets[0].cells[1][1].plaintext).toBeUndefined();
  });

  it("will delete cells", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                plaintext: true,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.DELETE_CELLS,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
      selections: [],
    });
    expect(newState.sheets[0].cells[1][1].text).toBeUndefined();
  });

  it("will delete cells within formulaRange", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "=SUM(A2,A3)",
                formulaRange: [2, 2],
              },
              2: {
                text: "100",
              },
            },
            2: {
              1: {
                text: "100",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.DELETE_CELLS,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
      selections: [],
    });
    expect(newState.sheets[0].cells[1][2].text).toBeUndefined();
  });

  it("can remove cells", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.REMOVE_CELLS,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
      selections: [],
    });
    expect(newState.sheets[0].cells[1][1]).toBeUndefined();

    let stateWithSelection = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: null,
          selections: [],
        },
      ],
    };

    newState = reducer(stateWithSelection, {
      type: ACTION_TYPE.REMOVE_CELLS,
      id: 1,
      activeCell: null,
      selections: [
        {
          bounds: {
            top: 1,
            left: 1,
            right: 1,
            bottom: 1,
          },
        },
      ],
    });
    expect(newState.sheets[0].cells[1][1]).toBeUndefined();
  });

  it("can clear formatting", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                bold: true,
                fill: "blue",
              },
            },
          },
          activeCell: {
            rowIndex: 1,
            columnIndex: 1,
          },
          selections: [],
        },
        {
          name: "Sheet2",
          id: 2,
          cells: {
            1: {
              1: {
                text: "1",
                bold: true,
                fill: "blue",
                locked: true,
              },
            },
          },
          activeCell: {
            rowIndex: 1,
            columnIndex: 1,
          },
          selections: [],
          locked: true,
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.CLEAR_FORMATTING,
      id: 1,
    });
    expect(newState.sheets[0].cells[1][1].bold).toBeUndefined();

    // Skip locked sheet
    newState = reducer(state, {
      type: ACTION_TYPE.CLEAR_FORMATTING,
      id: 2,
    });
    expect(newState).toEqual(state);

    // Skips if activeCell is null
    const stateWithNoActiveCell = {
      ...state,
      sheets: state.sheets.map((sheet) => ({ ...sheet, activeCell: null })),
    };
    newState = reducer(stateWithNoActiveCell, {
      type: ACTION_TYPE.CLEAR_FORMATTING,
      id: 1,
    });
    expect(newState).toEqual(stateWithNoActiveCell);

    // Skips if cell does not exists
    const stateWithInvalidCells = {
      ...state,
      sheets: state.sheets.map((sheet) => ({
        ...sheet,
        activeCell: null,
        selections: [{ bounds: { top: 3, left: 1, right: 3, bottom: 3 } }],
      })),
    };
    newState = reducer(stateWithInvalidCells, {
      type: ACTION_TYPE.CLEAR_FORMATTING,
      id: 1,
    });
    expect(newState).toEqual(stateWithInvalidCells);
  });

  it("can resize rows and columns", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                bold: true,
                fill: "blue",
              },
            },
          },
          activeCell: null,
          selections: [],
          columnSizes: {},
          rowSizes: {},
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.RESIZE,
      id: 1,
      axis: "x",
      index: 1,
      dimension: 10,
    });

    expect(newState.sheets[0].columnSizes?.[1]).toBe(10);

    newState = reducer(state, {
      type: ACTION_TYPE.RESIZE,
      id: 1,
      axis: "y",
      index: 1,
      dimension: 10,
    });

    expect(newState.sheets[0].rowSizes?.[1]).toBe(10);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.RESIZE,
      id: 10,
      axis: "y",
      index: 1,
      dimension: 10,
    });

    expect(newState).toEqual(state);
  });

  it("can merge cells", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                bold: true,
                fill: "blue",
              },
            },
          },
          activeCell: null,
          selections: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 2,
                bottom: 2,
              },
            },
          ],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.MERGE_CELLS,
      id: 1,
    });

    expect(newState.sheets[0].mergedCells?.length).toBe(1);

    // Can unmerge cells
    let unmergedState = reducer(newState, {
      type: ACTION_TYPE.MERGE_CELLS,
      id: 1,
    });

    expect(unmergedState.sheets[0].mergedCells?.length).toBe(0);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.MERGE_CELLS,
      id: 10,
    });

    expect(newState).toEqual(state);
  });

  it("prevent merging single cells", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "foo",
              },
            },
          },
          activeCell: null,
          selections: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 1,
                bottom: 1,
              },
            },
          ],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.MERGE_CELLS,
      id: 1,
    });

    expect(newState).toEqual(state);

    // Handle undefined bounds
    const stateWithNoActiveCell = {
      ...state,
      sheets: state.sheets.map((sheet) => {
        return {
          ...sheet,
          activeCell: null,
          selections: [],
        };
      }),
    };
    newState = reducer(stateWithNoActiveCell, {
      type: ACTION_TYPE.MERGE_CELLS,
      id: 1,
    });

    expect(newState).toEqual(stateWithNoActiveCell);
  });

  it("can update frozen rows and columns", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: null,
          selections: [],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.FROZEN_ROW_CHANGE,
      id: 1,
      count: 2,
    });
    expect(newState.sheets[0].frozenRows).toBe(2);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.FROZEN_ROW_CHANGE,
      id: 10,
      count: 2,
    });

    expect(newState).toEqual(state);

    newState = reducer(state, {
      type: ACTION_TYPE.FROZEN_COLUMN_CHANGE,
      id: 1,
      count: 2,
    });
    expect(newState.sheets[0].frozenColumns).toBe(2);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.FROZEN_COLUMN_CHANGE,
      id: 10,
      count: 2,
    });

    expect(newState).toEqual(state);
  });

  it("can update border styles", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.SET_BORDER,
      id: 1,
      color: "blue",
      variant: "all",
      borderStyle: "thin",
    });

    expect(newState.sheets[0].cells[1][1].strokeTopWidth).toBe(1);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.SET_BORDER,
      id: 10,
      color: "blue",
      variant: "all",
      borderStyle: "thin",
    });

    expect(newState).toEqual(state);
  });

  it("can reset border styles", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "1",
                strokeTopWidth: 1,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.SET_BORDER,
      id: 1,
      color: "blue",
      variant: "none",
      borderStyle: "thin",
    });

    expect(newState.sheets[0].cells[1][1].strokeTopWidth).toBe(undefined);
  });

  it("can update scroll position", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_SCROLL,
      id: 1,
      scrollState: {
        scrollLeft: 1,
        scrollTop: 1,
      },
    });

    expect(newState.sheets[0].scrollState?.scrollTop).toBe(1);
    expect(newState.sheets[0].scrollState?.scrollLeft).toBe(1);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_SCROLL,
      id: 10,
      scrollState: {
        scrollLeft: 1,
        scrollTop: 1,
      },
    });

    expect(newState).toEqual(state);
  });

  it("can update change filters", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.CHANGE_FILTER,
      id: 1,
      columnIndex: 1,
      filterViewIndex: 0,
      filter: {
        operator: "containsText",
        values: ["s"],
      },
    });

    expect(newState.sheets[0].filterViews?.length).toBe(1);

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.CHANGE_FILTER,
      id: 10,
      columnIndex: 1,
      filterViewIndex: 0,
      filter: {
        operator: "containsText",
        values: ["s"],
      },
    });

    expect(newState).toEqual(state);
  });

  it("can delete existing filters", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
          filterViews: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 10,
                bottom: 10,
              },
              filters: {
                2: {
                  operator: "containsText",
                  values: ["s"],
                },
              },
            },
          ],
        },
      ],
    };
    const newState = reducer(state, {
      type: ACTION_TYPE.CHANGE_FILTER,
      id: 1,
      columnIndex: 2,
      filterViewIndex: 0,
    });

    expect(newState.sheets[0].filterViews?.[0]?.filters?.[2]).toBe(undefined);
  });

  it("can update existing filters", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
          filterViews: [
            {
              bounds: {
                top: 1,
                left: 1,
                right: 10,
                bottom: 10,
              },
              filters: {
                2: {
                  operator: "containsText",
                  values: ["s"],
                },
              },
            },
          ],
        },
      ],
    };
    const newState = reducer(state, {
      type: ACTION_TYPE.CHANGE_FILTER,
      id: 1,
      columnIndex: 3,
      filterViewIndex: 0,
      filter: {
        operator: "containsText",
        values: ["d"],
      },
    });

    expect(newState.sheets[0].filterViews?.[0]?.filters?.[3]).toBeDefined();
  });

  it("can update delete column", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "hello",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.DELETE_COLUMN,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState.sheets[0].cells[1]?.[1]).toBeUndefined();

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.DELETE_COLUMN,
      id: 10,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState).toEqual(state);
  });

  it("can update delete row", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "hello",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.DELETE_ROW,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState.sheets[0].cells[1]?.[1]).toBeUndefined();

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.DELETE_ROW,
      id: 10,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });
    expect(newState).toEqual(state);
  });

  it("can insert column", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "hello",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.INSERT_COLUMN,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState.sheets[0].cells[1]?.[1]).toBeDefined();
    expect(newState.sheets[0].cells[1][2].text).toBe("hello");

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.INSERT_COLUMN,
      id: 10,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState).toEqual(state);
  });

  it("can insert row", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "hello",
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };

    let newState = reducer(state, {
      type: ACTION_TYPE.INSERT_ROW,
      id: 1,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState.sheets[0].cells[1]?.[1]).toBeDefined();
    expect(newState.sheets[0].cells[2][1].text).toBe("hello");

    // Sheet does not exist
    newState = reducer(state, {
      type: ACTION_TYPE.INSERT_ROW,
      id: 10,
      activeCell: {
        rowIndex: 1,
        columnIndex: 1,
      },
    });

    expect(newState).toEqual(state);
  });

  it("can set selections, activecell on copy", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.COPY,
      id: 1,
    });

    expect(newState.currentActiveCell).toBe(newState.sheets[0].activeCell);

    newState = reducer(state, {
      type: ACTION_TYPE.COPY,
      id: 10,
    });

    expect(newState).toEqual(state);
  });

  it("can set loading for cell awaiting formula calculations", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.SET_LOADING,
      id: 1,
      cell: {
        rowIndex: 1,
        columnIndex: 1,
      },
      value: true,
    });

    expect(newState.sheets[0].cells[1][1].loading).toBeTruthy();

    // Sheet does not exists
    newState = reducer(state, {
      type: ACTION_TYPE.SET_LOADING,
      id: 10,
      cell: {
        rowIndex: 1,
        columnIndex: 1,
      },
      value: true,
    });

    expect(newState).toEqual(state);
  });

  it("can set hide sheet", () => {
    let state: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.HIDE_SHEET,
      id: 1,
    });
    // Cannot hide the only visible sheet
    expect(newState.sheets[0].hidden).toBeUndefined();

    let stateWithMultipleSheets: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
        {
          id: 2,
          name: "Sheet2",
          activeCell: null,
          selections: [],
          cells: {},
        },
      ],
    };

    newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.HIDE_SHEET,
      id: 2,
    });

    expect(newState.sheets[1].hidden).toBeTruthy();

    // Sheet does not exists
    newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.HIDE_SHEET,
      id: 20,
    });

    expect(newState).toEqual(stateWithMultipleSheets);
  });

  it("can set show  sheet", () => {
    let stateWithMultipleSheets: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
        {
          id: 2,
          hidden: true,
          name: "Sheet2",
          activeCell: null,
          selections: [],
          cells: {},
        },
      ],
    };

    let newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.SHOW_SHEET,
      id: 2,
    });

    expect(newState.sheets[1].hidden).toBeFalsy();

    newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.SHOW_SHEET,
      id: 20,
    });

    expect(newState).toEqual(stateWithMultipleSheets);
  });

  it("can set protect sheet", () => {
    let stateWithMultipleSheets: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
        {
          id: 2,
          name: "Sheet2",
          activeCell: null,
          selections: [],
          cells: {},
        },
      ],
    };

    let newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.PROTECT_SHEET,
      id: 2,
    });

    expect(newState.sheets[1].locked).toBeTruthy();

    newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.PROTECT_SHEET,
      id: 20,
    });

    expect(newState).toEqual(stateWithMultipleSheets);
  });

  it("can set unprotect sheet", () => {
    let stateWithMultipleSheets: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
        {
          id: 2,
          locked: true,
          name: "Sheet2",
          activeCell: null,
          selections: [],
          cells: {},
        },
      ],
    };

    let newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.UNPROTECT_SHEET,
      id: 2,
    });

    expect(newState.sheets[1].locked).toBeFalsy();

    // Does not do modify state if sheet does not exist
    newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.UNPROTECT_SHEET,
      id: 20,
    });

    expect(newState).toEqual(stateWithMultipleSheets);
  });

  it("can set unprotect sheet", () => {
    let stateWithMultipleSheets: StateInterface = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
        {
          id: 2,
          name: "Sheet2",
          activeCell: null,
          selections: [],
          cells: {},
        },
      ],
    };

    let newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.CHANGE_TAB_COLOR,
      id: 2,
      color: "green",
    });

    expect(newState.sheets[1].tabColor).toBe("green");

    newState = reducer(stateWithMultipleSheets, {
      type: ACTION_TYPE.CHANGE_TAB_COLOR,
      id: 20,
      color: "green",
    });

    expect(newState).toEqual(stateWithMultipleSheets);
  });

  it("can paste", () => {
    const state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "Hello",
              },
            },
            3: {
              1: {
                locked: true,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    // Invalid sheet
    let newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 10,
      rows: [],
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
    });

    expect(newState).toEqual(state);

    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [
        [
          {
            text: "hello world",
          },
        ],
      ],
      activeCell: { rowIndex: 2, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[2][1].text).toBe("hello world");

    // Skips locked cells
    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [
        [
          {
            text: "hello",
          },
        ],
      ],
      activeCell: { rowIndex: 3, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[3][1].text).toBeUndefined();

    // Skips empty cells
    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [[null]],
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[1][1].text).toBe("Hello");

    // Can handle strings
    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [["foobar"]],
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[1][1].text).toBe("foobar");

    // Can handle formulas
    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [
        [
          {
            text: "=SUM(A1,2)",
            datatype: "formula",
            sourceCell: {
              rowIndex: 1,
              columnIndex: 2,
            },
          },
        ],
      ],
      activeCell: { rowIndex: 5, columnIndex: 5 },
      selections: [],
    });

    expect(newState.sheets[0].cells[5][5].text).toBe("=SUM(D5,2)");

    // Can handle formulas
    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [
        [
          {
            text: "=SUM(A1,2)",
            datatype: "formula",
            sourceCell: {
              rowIndex: 1,
              columnIndex: 2,
            },
          },
        ],
      ],
      activeCell: { rowIndex: 2, columnIndex: 1 },
      selections: [],
    });

    expect(newState.sheets[0].cells[2][1].error).toBe("#REF!");
  });

  it("can cut and paste", () => {
    const state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet1",
          id: 1,
          cells: {
            1: {
              1: {
                text: "Hello",
              },
            },
            3: {
              1: {
                text: "foobar",
              },
              2: {
                text: "foo",
                locked: true,
              },
            },
          },
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [
        [
          {
            text: "foobar",
          },
        ],
      ],
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
      cutSelection: {
        bounds: {
          top: 3,
          left: 1,
          right: 1,
          bottom: 3,
        },
      },
    });

    expect(newState.sheets[0].cells[3]?.[1]).toBeUndefined();

    // Skip locked cells
    newState = reducer(state, {
      type: ACTION_TYPE.PASTE,
      id: 1,
      rows: [
        [
          {
            text: "foobar",
          },
        ],
      ],
      activeCell: { rowIndex: 1, columnIndex: 1 },
      selections: [],
      cutSelection: {
        bounds: {
          top: 3,
          left: 2,
          right: 2,
          bottom: 3,
        },
      },
    });

    expect(newState.sheets[0].cells[3]?.[2].text).toBe("foo");
  });

  it("undo/redo gets called", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet 1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
          locked: true,
        },
      ],
    };

    act(() => {
      let newState = reducer(state, {
        type: ACTION_TYPE.CHANGE_SHEET_NAME,
        id: 2,
        name: "Sheet 2",
      });
    });

    expect(undoCallback).toBeCalled();

    // Undo callback will be called if undoable is false
    const callback = jest.fn();
    const noUndoReducer = createStateReducer({
      addUndoPatch: callback,
      getCellBounds,
    });
    act(() => {
      let newState = noUndoReducer(state, {
        type: ACTION_TYPE.CHANGE_SHEET_NAME,
        id: 2,
        undoable: false,
        name: "Sheet 2",
      });
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("can apply patches", () => {
    let state = {
      ...initialState,
      sheets: [
        {
          name: "Sheet 1",
          id: 1,
          cells: {},
          activeCell: { rowIndex: 1, columnIndex: 1 },
          selections: [],
          locked: true,
        },
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.APPLY_PATCHES,
      patches: [
        {
          op: "replace",
          path: ["sheets", 0, "name"],
          value: "Sheet1",
        },
      ],
    });

    expect(newState.sheets[0].name).toBe("Sheet1");
  });

  describe("Locked sheets and cells", () => {
    it("will not change sheet name if locked", () => {
      let state = {
        ...initialState,
        sheets: [
          {
            name: "Sheet 1",
            id: 1,
            cells: {},
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
            locked: true,
          },
        ],
      };

      let newState = reducer(state, {
        type: ACTION_TYPE.CHANGE_SHEET_NAME,
        id: 2,
        name: "Sheet 2",
      });

      expect(newState.sheets[0].name).toBe("Sheet 1");
    });

    it("will not update cells from calculation engine for locked sheet", () => {
      let state = {
        ...initialState,
        sheets: [
          {
            name: "Sheet 1",
            id: 1,
            cells: {},
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
            locked: true,
          },
        ],
      };

      let newState = reducer(state, {
        type: ACTION_TYPE.UPDATE_CELLS,
        changes: {
          "Sheet 1": {
            1: {
              1: {
                result: 100,
              },
            },
          },
        },
      });

      expect(newState.sheets[0].cells[1]).toBeUndefined();
    });

    it("will not trigger validation for locked cells", () => {
      let state: StateInterface = {
        ...initialState,
        sheets: [
          {
            name: "Sheet 1",
            id: 1,
            cells: {},
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
            locked: true,
          },
          {
            name: "Sheet 2",
            id: 2,
            cells: {
              1: {
                1: {
                  locked: true,
                  valid: false,
                },
              },
            },
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
            locked: false,
          },
        ],
      };

      let newState = reducer(state, {
        type: ACTION_TYPE.VALIDATION_SUCCESS,
        id: 1,
        valid: true,
        cell: {
          rowIndex: 1,
          columnIndex: 1,
        },
        prompt: "Please enter",
      });

      expect(newState.sheets[0].cells[1]).toBeFalsy();

      newState = reducer(state, {
        type: ACTION_TYPE.VALIDATION_SUCCESS,
        id: 2,
        valid: true,
        cell: {
          rowIndex: 1,
          columnIndex: 1,
        },
        prompt: "Please enter",
      });

      expect(newState.sheets[1].cells[1][1].valid).toBeFalsy();
    });

    it("will not change formatting if sheet is locked", () => {
      let state = {
        ...initialState,
        sheets: [
          {
            name: "Sheet 1",
            id: 1,
            cells: {},
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
            locked: true,
          },
        ],
      };

      let newState = reducer(state, {
        type: ACTION_TYPE.FORMATTING_CHANGE_PLAIN,
        id: 2,
      });

      expect(newState.sheets[0].cells[1]).toBeUndefined();
    });

    it("will not clear formatting if cell is locked", () => {
      let state = {
        ...initialState,
        sheets: [
          {
            name: "Sheet 1",
            id: 1,
            cells: {
              1: {
                1: {
                  locked: true,
                  bold: true,
                },
              },
            },
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
          },
        ],
      };

      let newState = reducer(state, {
        type: ACTION_TYPE.CLEAR_FORMATTING,
        id: 1,
      });

      expect(newState).toEqual(state);
    });

    it("skip locked sheet when cells are removed", () => {
      let state = {
        ...initialState,
        sheets: [
          {
            name: "Sheet1",
            id: 1,
            locked: true,
            cells: {
              1: {
                1: {
                  text: "1",
                },
              },
            },
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
          },
        ],
      };
      let newState = reducer(state, {
        type: ACTION_TYPE.REMOVE_CELLS,
        id: 1,
        activeCell: {
          rowIndex: 1,
          columnIndex: 1,
        },
        selections: [],
      });
      expect(newState).toEqual(state);
    });

    it("skip locked cells when cell changes", () => {
      let state = {
        ...initialState,
        sheets: [
          {
            name: "Sheet1",
            id: 1,
            locked: true,
            cells: {
              1: {
                1: {
                  text: "1",
                },
              },
            },
            activeCell: { rowIndex: 1, columnIndex: 1 },
            selections: [],
          },
        ],
      };
      const newState = reducer(state, {
        type: ACTION_TYPE.CHANGE_SHEET_CELL,
        id: initialState.sheets[0].id,
        cell: { rowIndex: 1, columnIndex: 1 },
        value: "Hello",
        datatype: "string",
      });

      expect(newState).toEqual(state);
    });
  });
});
