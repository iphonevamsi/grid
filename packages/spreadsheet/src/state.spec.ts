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
    expect(newState.sheets[0].cells[1][1].valid).toBeTruthy();
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
    const changes: CellsBySheet = {
      [sheetName]: {
        1: {
          1: {
            text: '=HYPERLINK("Google", www.google.com)',
            datatype: "formula",
            resultType: "hyperlink",
          },
        },
      },
    };
    /* 1: Calculation update a group of cells */
    const newState = reducer(initialState, {
      type: ACTION_TYPE.UPDATE_CELLS,
      changes,
    });
    expect(newState.sheets[0].cells[1][1].resultType).toEqual("hyperlink");
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
    const state = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              2: {
                text: "Hello",
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

    expect(newState.sheets[0].cells[6][2].text).toBe("Hello");
    expect(newState.sheets[0].cells[7][2].text).toBe("Hello");
    expect(newState.sheets[0].cells[8][2].text).toBe("Hello");
  });

  it("can handle cell filling - Direction UP", () => {
    const state = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              2: {
                text: "Hello",
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

    expect(newState.sheets[0].cells[3][2].text).toBe("Hello");
    expect(newState.sheets[0].cells[4][2].text).toBe("Hello");
  });

  it("can handle cell filling - Direction LEFT", () => {
    const state = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              5: {
                text: "Hello",
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

    expect(newState.sheets[0].cells[5][2].text).toBe("Hello");
    expect(newState.sheets[0].cells[5][3].text).toBe("Hello");
  });

  it("can handle cell filling - Direction RIGHT", () => {
    const state = {
      ...initialState,
      sheets: initialState.sheets.map((sheet) => {
        return {
          ...sheet,
          cells: {
            5: {
              5: {
                text: "Hello",
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

    expect(newState.sheets[0].cells[5][6].text).toBe("Hello");
    expect(newState.sheets[0].cells[5][7].text).toBe("Hello");
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
      ],
    };
    let newState = reducer(state, {
      type: ACTION_TYPE.CLEAR_FORMATTING,
      id: 1,
    });
    expect(newState.sheets[0].cells[1][1].bold).toBeUndefined();
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
    newState = reducer(newState, {
      type: ACTION_TYPE.MERGE_CELLS,
      id: 1,
    });

    expect(newState.sheets[0].mergedCells?.length).toBe(0);
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

    newState = reducer(state, {
      type: ACTION_TYPE.FROZEN_COLUMN_CHANGE,
      id: 1,
      count: 2,
    });
    expect(newState.sheets[0].frozenColumns).toBe(2);
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
    const newState = reducer(state, {
      type: ACTION_TYPE.SET_BORDER,
      id: 1,
      color: "blue",
      variant: "all",
      borderStyle: "thin",
    });

    expect(newState.sheets[0].cells[1][1].strokeTopWidth).toBe(1);
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
    const newState = reducer(state, {
      type: ACTION_TYPE.UPDATE_SCROLL,
      id: 1,
      scrollState: {
        scrollLeft: 1,
        scrollTop: 1,
      },
    });

    expect(newState.sheets[0].scrollState?.scrollTop).toBe(1);
    expect(newState.sheets[0].scrollState?.scrollLeft).toBe(1);
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
    const newState = reducer(state, {
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
  });
});
