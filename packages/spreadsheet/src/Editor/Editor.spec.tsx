import React from "react";
import { domRenderer, cleanup } from "./../utils/test-utils";
import Editor from "./Editor";

global.document.execCommand = jest.fn();

describe("Editor", () => {
  afterEach(cleanup);
  const position = { x: 0, y: 0, width: 200, height: 20 };
  const cell = { rowIndex: 1, columnIndex: 1 };
  const activeCell = { rowIndex: 1, columnIndex: 1 };
  const editorType = "text";
  const value = 'hello world'
  it("renders an editor", () => {    
    const renderGrid = () =>
      domRenderer(
        <Editor
          position={position}
          value={value}
          cell={cell}
          activeCell={activeCell}
          editorType={editorType}
        />
      );
    expect(renderGrid).not.toThrow();
  });

  it("matches snapshot", () => {
    const { asFragment } = domRenderer(
      <Editor
        position={position}
        value={value}
        cell={cell}
        activeCell={activeCell}
        editorType={editorType}
      />

    );
    expect(asFragment()).toMatchSnapshot();
  });
})