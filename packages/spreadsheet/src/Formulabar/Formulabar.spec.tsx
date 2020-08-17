import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import Formulabar from "./Formulabar";

global.document.execCommand = jest.fn();

describe("FormulaBar", () => {
  afterEach(cleanup);
  it("renders spreadsheet", () => {
    const renderGrid = () => domRenderer(<Formulabar />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(<Formulabar />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("can trigger onchange", () => {
    const onChange = jest.fn();
    const { getByLabelText } = domRenderer(<Formulabar onChange={onChange} />);
    const input = getByLabelText("value-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toBeCalled();
    expect(onChange).toBeCalledWith("hello");
  });
});
