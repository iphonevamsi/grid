import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import Tooltip from "./Tooltip";

describe("Tooltip", () => {
  afterEach(cleanup);
  it("renders select tooltip", () => {
    const renderGrid = () => domRenderer(<Tooltip  />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(<Tooltip />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("renders hyperlink", () => {
    const { asFragment } = domRenderer(<Tooltip datatype='hyperlink' result='Google' hyperlink='http://google.com' />);
    expect(asFragment()).toMatchSnapshot();
  });
});