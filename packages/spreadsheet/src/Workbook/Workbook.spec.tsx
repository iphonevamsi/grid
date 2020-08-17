import React, { useState, useRef } from "react";
import { domRenderer, cleanup, fireEvent, act } from "./../utils/test-utils";
import Workbook from "./Workbook";
import { defaultSheets } from "../Spreadsheet";
import { theme } from "@chakra-ui/core";
import StatusBarComponent from "./../StatusBar";

describe("Workbook", () => {
  afterEach(cleanup);
  const currentSheet = defaultSheets[0];
  it("renders select tooltip", () => {
    const renderGrid = () =>
      domRenderer(
        <Workbook
          StatusBar={StatusBarComponent}
          selectedSheet={defaultSheets[0].id}
          sheets={defaultSheets}
          theme={theme}
          currentSheet={currentSheet}
        />
      );
    expect(renderGrid).not.toThrow();
  });
  it("matches snapshot", () => {
    const { asFragment } = domRenderer(
      <Workbook
        selectedSheet={defaultSheets[0].id}
        sheets={defaultSheets}
        StatusBar={StatusBarComponent}
        theme={theme}
        currentSheet={currentSheet}
        showFormulabar
        showTabStrip
        showStatusBar
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
