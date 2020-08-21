import React, { useState, useRef } from "react";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import SpreadSheet, { defaultSheets, SheetGridRef } from "./../src/Spreadsheet";
import { ACTION_TYPE } from "./state";

global.document.execCommand = jest.fn();

describe("SpreadSheet", () => {
  afterEach(cleanup);
  it("renders spreadsheet", () => {
    const renderGrid = () => render(<SpreadSheet />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = render(<SpreadSheet />);
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("Copy paste", () => {
  afterEach(cleanup);
  let grid;
  let gridRef = React.createRef<SheetGridRef>();
  const onChangeCells = jest.fn();
  const App = () => {
    return (
      <SpreadSheet
        ref={gridRef}
        initialSheets={defaultSheets}
        enableGlobalKeyHandlers
        onChangeCells={onChangeCells}
        autoFocus
      />
    );
  };
  beforeEach(async () => {
    await act(async () => {
      grid = render(<App />);
    });
  });
  it("triggers onChangeCells when paste is called", async () => {
    await act(async () => {
      fireEvent.paste(document, {
        clipboardData: {
          getData: () =>
            JSON.stringify([
              [
                {
                  text: "hello",
                },
              ],
            ]),
          items: [],
        },
      });
    });
    // Activecell = {rowIndex: 1, columnIndex: 1}

    expect(onChangeCells).toBeCalled();
    expect(onChangeCells).toBeCalledWith(defaultSheets[0].id, {
      "1": { "1": { text: "hello" } },
    });
  });
});

describe("Cut paste", () => {
  afterEach(cleanup);
  let grid;
  let gridRef = React.createRef<SheetGridRef>();
  const onChangeCells = jest.fn();
  const App = () => {
    return (
      <SpreadSheet
        ref={gridRef}
        initialSheets={defaultSheets}
        enableGlobalKeyHandlers
        onChangeCells={onChangeCells}
        autoFocus
      />
    );
  };
  beforeEach(async () => {
    await act(async () => {
      grid = render(<App />);
    });
  });

  it("triggers onChangeCells when cut/paste is called", async () => {
    await act(async () => {
      fireEvent.cut(document);
    });
    await act(async () => {
      gridRef.current?.grid?.setActiveCell({ rowIndex: 2, columnIndex: 2 });
    });
    await act(async () => {
      fireEvent.paste(document, {
        clipboardData: {
          getData: () =>
            JSON.stringify([
              [
                {
                  text: "hello",
                },
              ],
            ]),
          items: [],
        },
      });
    });
    // Activecell = {rowIndex: 1, columnIndex: 1}

    expect(onChangeCells).toBeCalled();
    expect(onChangeCells).toBeCalledWith(defaultSheets[0].id, {
      1: {
        1: {},
      },
      2: {
        2: {
          text: "hello",
        },
      },
    });
  });
});

describe("Undo/redo", () => {
  let grid;
  let gridRef = React.createRef<SheetGridRef>();
  const onChangeCells = jest.fn();
  const App = () => {
    return (
      <SpreadSheet
        ref={gridRef}
        initialSheets={defaultSheets}
        enableGlobalKeyHandlers
        onChangeCells={onChangeCells}
        autoFocus
      />
    );
  };
  beforeEach(async () => {
    await act(async () => {
      grid = render(<App />);
    });
  });
  afterEach(cleanup);

  it("onChangeCells when undo is performed ", async () => {
    await act(async () => {
      gridRef.current?.dispatch({
        type: ACTION_TYPE.CHANGE_SHEET_CELL,
        id: defaultSheets[0].id,
        value: "hello",
        cell: {
          rowIndex: 1,
          columnIndex: 1,
        },
      });
    });
    await act(async () => {
      gridRef.current?.undo();
    });
    expect(onChangeCells).toBeCalled();
    expect(onChangeCells).toBeCalledWith(defaultSheets[0].id, { 1: { 1: {} } });
  });

  it("onChangeCells when undo is performed after paste ", async () => {
    await act(async () => {
      fireEvent.paste(document, {
        clipboardData: {
          getData: () =>
            JSON.stringify([
              [
                {
                  text: "hello",
                },
                {
                  text: "hello 2",
                },
              ],
              [
                {
                  text: "hello",
                },
                {
                  text: "hello 2",
                },
              ],
            ]),
          items: [],
        },
      });
    });
    await act(async () => {
      gridRef.current?.undo();
    });
    const changes = {
      1: {
        1: {},
        2: {},
      },
      2: {
        1: {},
        2: {},
      },
    };
    expect(onChangeCells).toBeCalled();
    expect(onChangeCells).toBeCalledWith(defaultSheets[0].id, changes);
  });
});
