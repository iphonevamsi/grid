import React from "react";
import { mount } from "cypress-react-unit-test";
import SpreadSheet, { defaultSheets } from "./../../src/SpreadSheet";

describe("Spreadsheet", () => {
  afterEach(() => {
    cy.wait(1000);
  });
  it("mounts", () => {
    mount(<SpreadSheet onChange={cy.stub().as("handleChange")} />, {
      alias: "SpreadSheet"
    });
    cy.get("@handleChange").should(stub => {
      expect(stub).to.have.been.called;
    });
  });

  it("will trigger onChangeCells", () => {
    mount(<SpreadSheet onChangeCells={cy.stub().as("onChangeCells")} />, {
      alias: "SpreadSheet"
    });
    cy.get(".rowsncolumns-grid-container")
      .dblclick(60, 60)
      .get("[data-gramm='false']")
      .typeInSlate("hello")
      .wait(100)
      .type("{enter}");
    cy.get("@onChangeCells").should(stub => {
      expect(stub).to.have.been.called;
      expect(stub).to.have.been.calledWith(defaultSheets[0].id);
    });
  });
});
