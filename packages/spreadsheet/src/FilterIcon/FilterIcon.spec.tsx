import React from "react";
import { konvaRenderer, cleanup } from "./../utils/test-utils";
import FilterIcon from "./FilterIcon";

describe("Filter Icon", () => {
  afterEach(cleanup);
  it("renders a filter icon", () => {
    const renderCell = () =>
      konvaRenderer(
        <FilterIcon key="1:1" isActive rowIndex={1} columnIndex={1} fill='red' />
      );
    expect(renderCell).not.toThrow();
  });

  it("matches snapshot", () => {
    const { asFragment } = konvaRenderer(
      <FilterIcon key="1:1" isActive rowIndex={1} columnIndex={1} fill='red' />
    );
    expect(asFragment()).toMatchSnapshot();
  });
})