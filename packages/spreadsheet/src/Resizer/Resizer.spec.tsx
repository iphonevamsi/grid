import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import Resizer from "./Resizer";

global.document.execCommand = jest.fn();

describe("Resizer", () => {
  afterEach(cleanup);
  it("renders spreadsheet", () => {
    const renderGrid = () => domRenderer(<Resizer initialTop={30} />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(<Resizer initialTop={30} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
