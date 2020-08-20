import React from "react";
import {
  konvaRenderer,
  cleanup,
  stageRef,
  fireEvent,
} from "./../utils/test-utils";
import ListArrow from "./ListArrow";

describe("ListArrow", () => {
  afterEach(cleanup);
  it("renders header cell", () => {
    const renderCell = () =>
      konvaRenderer(
        <ListArrow key="1:1" text="hello world" rowIndex={0} columnIndex={1} />
      );
    expect(renderCell).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = konvaRenderer(
      <ListArrow
        key="1:1"
        text="hello world"
        rowIndex={0}
        columnIndex={1}
        x={0}
        y={0}
        width={100}
        height={100}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
