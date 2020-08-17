import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import Toolbar from "./Toolbar";

describe("Toolbar", () => {
  afterEach(cleanup);
  it("renders select tooltip", () => {
    const renderGrid = () => domRenderer(<Toolbar  />);
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(<Toolbar />);
    expect(asFragment()).toMatchSnapshot();
  });
});