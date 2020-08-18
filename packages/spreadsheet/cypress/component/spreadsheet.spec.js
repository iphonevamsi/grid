import React from "react";
import { mount } from "cypress-react-unit-test";
import SpreadSheet from "./../../src/SpreadSheet";

describe("Spreadsheet", () => {
  it("mounts", () => {
    mount(<SpreadSheet onChange={cy.stub().as("handleChange")} />);
    cy.get("@handleChange").should(stub => {
      expect(stub).to.have.been.called;
    });
  });
});
