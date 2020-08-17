import React from "react";
import { domRenderer, cleanup } from "./../utils/test-utils";
import TextEditor from "./TextEditor";
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE } from "../constants";

global.document.execCommand = jest.fn();

describe("TextEditor", () => {
  afterEach(cleanup);
  const position = { x: 0, y: 0, width: 200, height: 20 };
  const cell = { rowIndex: 1, columnIndex: 1 };
  const activeCell = { rowIndex: 1, columnIndex: 1 };
  const editorType = "text";
  const value = 'hello world'
  it("renders an editor", () => {    
    const renderGrid = () =>
      domRenderer(
        <TextEditor
          value={value}
          fontFamily={DEFAULT_FONT_FAMILY}
          fontSize={DEFAULT_FONT_SIZE}
          scale={1}
          color='black'
          wrapping
          horizontalAlign='left'
        />
      );
    expect(renderGrid).not.toThrow();
  });

  it("matches snapshot", () => {
    const { asFragment } = domRenderer(
      <TextEditor
          value={value}
          fontFamily={DEFAULT_FONT_FAMILY}
          fontSize={DEFAULT_FONT_SIZE}
          scale={1}
          color='black'
          wrapping
          horizontalAlign='left'
        />
    );
    expect(asFragment()).toMatchSnapshot();
  });
})