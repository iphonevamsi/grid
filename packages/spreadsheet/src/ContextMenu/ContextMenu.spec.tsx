import React from "react";
import { domRenderer, cleanup } from "./../utils/test-utils";
import ContextMenu from "./ContextMenu";

describe("ContextMenu", () => {
  afterEach(cleanup);
  it("renders a contextmenu", () => {
    const renderGrid = () =>
      domRenderer(
        <ContextMenu
          activeCell={{
            rowIndex: 1,
            columnIndex: 1,
          }}
          selections={[]}
          left={0}
          top={0}
        />
      );
    expect(renderGrid).not.toThrow();
  });

  it("matches snapshot", () => {
    const { asFragment } = domRenderer(
      <ContextMenu
          activeCell={{
            rowIndex: 1,
            columnIndex: 1,
          }}
          selections={[]}
          left={0}
          top={0}
        />
    );
    expect(asFragment()).toMatchSnapshot();
  });
})