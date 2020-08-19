import React from "react";
import { mount, unmount } from "cypress-react-unit-test";
import SpreadSheet, { defaultSheets } from "./../../src/SpreadSheet";

describe("Spreadsheet", () => {
  it("mounts", () => {    
    mount(<SpreadSheet onChange={cy.stub().as("handleChange")} />, {
      alias: "SpreadSheet"
    });
    cy.get("@handleChange").should(stub => {
      expect(stub).to.have.been.called;
    });
  });

  it("will trigger onChangeCells", () => {    
    const gridRef = React.createRef()
    mount(<SpreadSheet ref={gridRef} onChangeCells={cy.stub().as("onChangeCells")} />, {
      alias: "SpreadSheet"
    });

    cy
    .wait(100)
    .enterText('Hello world', { rowIndex: 2, columnIndex: 1}, gridRef)
    .get("@onChangeCells").should(stub => {
      expect(stub).to.have.been.called;
      expect(stub).to.have.been.calledWith(defaultSheets[0].id);
    });
  });

  it("will set datatype for formulas and calculate", async () => { 
    const gridRef = React.createRef()
    mount(<SpreadSheet ref={gridRef} onChangeCells={cy.stub().as("onChangeCells")} onCalculateSuccess={cy.stub().as('onCalculateSuccess')} />, {
      alias: "SpreadSheet"
    });
    cy
    .wait(100)
    .enterText('=SUM(2,2)', { rowIndex: 3, columnIndex: 3 }, gridRef)
    .get("@onChangeCells").should(stub => {
      const changes = {
        3: {
          3: {
            text: '=SUM(2,2)',
            datatype: 'formula'
          }
        }
      }
      expect(stub).to.have.been.called;
      expect(stub).to.have.been.calledWith(defaultSheets[0].id, changes);
    });

    cy.get('@onCalculateSuccess').should(stub => {
      const values = {
        [defaultSheets[0].name]: {
          3: {
            3: {
              result: 4,
              resultType: 'number'
            }
          }
        }
      }
      expect(stub).to.have.been.called;
      expect(stub).to.have.been.calledWith(values);
    })

  })
});
