import React, { useState } from "react";
import { domRenderer, cleanup, act, fireEvent } from "./../utils/test-utils";
import TextEditor, { EditableRef } from "./TextEditor";
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE } from "../constants";
import { Transforms } from "slate";
import { ReactEditor } from "slate-react";

global.document.execCommand = jest.fn();

describe("TextEditor", () => {
  afterEach(cleanup);
  const position = { x: 0, y: 0, width: 200, height: 20 };
  const cell = { rowIndex: 1, columnIndex: 1 };
  const activeCell = { rowIndex: 1, columnIndex: 1 };
  const editorType = "text";
  const value = "hello world";
  it("renders an editor", () => {
    const renderGrid = () =>
      domRenderer(
        <TextEditor
          value={value}
          fontFamily={DEFAULT_FONT_FAMILY}
          fontSize={DEFAULT_FONT_SIZE}
          scale={1}
          color="black"
          wrapping
          horizontalAlign="left"
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
        color="black"
        wrapping
        horizontalAlign="left"
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("calls onChange", async () => {
    const onChange = jest.fn();
    let element;
    let editorRef = React.createRef<EditableRef>();
    const App = () => {
      return (
        <>
          <TextEditor
            ref={editorRef}
            value={value}
            fontFamily={DEFAULT_FONT_FAMILY}
            fontSize={DEFAULT_FONT_SIZE}
            scale={1}
            color="black"
            wrapping
            horizontalAlign="left"
            onChange={onChange}
          />
        </>
      );
    };
    act(() => {
      element = domRenderer(<App />);
    });
    await act(async () => {
      ReactEditor.focus(editorRef.current.editor);
      Transforms.insertNodes(editorRef.current.editor, [{ text: "=SUM(2,2)" }]);
    });
    expect(onChange).toHaveBeenCalled();
  });
});
