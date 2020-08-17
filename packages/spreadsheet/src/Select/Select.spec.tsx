import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import Select from "./Select";

describe("Select", () => {
  afterEach(cleanup);
  const options = [
    {
      label: "A",
      value: 0,
    },
    {
      label: "B",
      value: 1,
    },
  ];
  it("renders select dropdown", () => {
    const renderGrid = () => domRenderer(<Select options={options} />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(<Select options={options} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("can trigger onchange", () => {
    const onChange = jest.fn();
    const { getByLabelText } = domRenderer(<Select options={options} onChange={onChange} />);
    const input = getByLabelText("select-input") as HTMLInputElement;
    act(() => {
      fireEvent.focus(input)      
    })
    const list = getByLabelText('list')    
    expect(list.childNodes.length).toBe(2);
    act(() => {
      fireEvent.change(input, { target: { value: 'A'}})
      fireEvent.click(list.firstChild)
    })
    expect(onChange).toBeCalled()
  });
});
