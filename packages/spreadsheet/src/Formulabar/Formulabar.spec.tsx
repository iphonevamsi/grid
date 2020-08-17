import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import FormulaBar from "./FormulaBar";

global.document.execCommand = jest.fn();

describe("FormulaBar", () => {
  afterEach(cleanup);
  it("renders spreadsheet", () => {
    const renderGrid = () => domRenderer(<FormulaBar />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(<FormulaBar />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("can trigger onchange", () => {
    const onChange = jest.fn()
    const { getByLabelText } = domRenderer(<FormulaBar onChange={onChange} />);
    const input = getByLabelText('value-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(onChange).toBeCalled()
    expect(onChange).toBeCalledWith('hello')

  });
});