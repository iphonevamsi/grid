import React from "react";
import { konvaRenderer, cleanup } from "./../utils/test-utils";
import Cell from "./Cell";

describe("Cell", () => {
  afterEach(cleanup);
  it("renders a cell", () => {
    const renderCell = () =>
      konvaRenderer(
        <Cell
          key="1:1"
          text="hello world"
          rowIndex={1}
          columnIndex={1}
          fill="red"
        />
      );
    expect(renderCell).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = konvaRenderer(
      <Cell
        key="1:1"
        text="hello world"
        rowIndex={1}
        columnIndex={1}
        showFilter
        image="http://google.com"
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("can show checkbox", () => {
    const { asFragment } = konvaRenderer(
      <Cell
        key="1:1"
        text="hello world"
        rowIndex={1}
        columnIndex={1}
        dataValidation={{
          type: "boolean",
        }}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("can show list arrow", () => {
    const { asFragment } = konvaRenderer(
      <Cell
        key="1:1"
        text="hello world"
        rowIndex={1}
        columnIndex={1}
        dataValidation={{
          type: "list",
        }}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("can show invalid tag", () => {
    const { asFragment } = konvaRenderer(
      <Cell
        key="1:1"
        text="hello world"
        rowIndex={1}
        columnIndex={1}
        valid={false}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
