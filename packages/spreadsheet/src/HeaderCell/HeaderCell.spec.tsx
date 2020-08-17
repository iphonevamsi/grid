import React from "react";
import { konvaRenderer, cleanup } from "./../utils/test-utils";
import HeaderCell from "./HeaderCell";
import { theme } from "@chakra-ui/core";

describe("HeaderCell", () => {
  afterEach(cleanup);
  it("renders header cell", () => {
    const renderCell = () =>
      konvaRenderer(
        <HeaderCell
          key="1:1"
          text="hello world"
          rowIndex={0}
          columnIndex={1}
          theme={theme}
        />
      );
    expect(renderCell).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = konvaRenderer(
      <HeaderCell
        key="1:1"
        text="hello world"
        rowIndex={0}
        columnIndex={1}
        theme={theme}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
