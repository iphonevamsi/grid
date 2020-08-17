import validate from "./validation";
import { CellConfig } from "./Spreadsheet";

describe("validation", () => {
  it("exists", () => {
    expect(validate).toBeDefined();
  });

  it("can validate lists", async () => {
    const sheet = "a";
    const value = "A";
    const cell = {
      rowIndex: 1,
      columnIndex: 1,
    };
    const cellConfig: CellConfig = {
      dataValidation: {
        type: "list",
        formulae: ["A", "B", "C"],
      },
    };
    const response = await validate(value, sheet, cell, cellConfig);
    expect(response?.valid).toBeTruthy();
  });

  it("can validate booleans", async () => {
    const sheet = "a";
    const value = "A";
    const cell = {
      rowIndex: 1,
      columnIndex: 1,
    };
    const cellConfig: CellConfig = {
      dataValidation: {
        type: "boolean",
        formulae: ["A", "B"],
      },
    };
    const response = await validate(value, sheet, cell, cellConfig);
    expect(response?.valid).toBeTruthy();
  });

  it("returns undefined if validation is not defined", async () => {
    const response = await validate(
      "b",
      "B",
      { rowIndex: 1, columnIndex: 1 },
      undefined
    );
    expect(response?.valid).toBeUndefined();
  });

  it('can validate decimals', async () => {
    const sheet = "a";
    const value = "A";
    const cell = {
      rowIndex: 1,
      columnIndex: 1,
    };
    const cellConfig: CellConfig = {
      dataValidation: {
        type: "decimal"
      },
    };
    let response = await validate(1, sheet, cell, cellConfig);
    expect(response?.valid).toBeTruthy();

    response = await validate('hello', sheet, cell, { dataValidation: { type: "decimal", operator: 'between', formulae: [0, 10] }});
    expect(response?.valid).toBeFalsy();

    response = await validate(1, sheet, cell, { dataValidation: { type: "decimal", operator: 'between', formulae: [0, 10] }});
    expect(response?.valid).toBeTruthy();

    response = await validate(1, sheet, cell, { dataValidation: { type: "decimal", operator: 'notBetween', formulae: [0, 10] }});
    expect(response?.valid).toBeFalsy();

    response = await validate(10, sheet, cell, { dataValidation: { type: "decimal", operator: 'equal', formulae: [10] }});
    expect(response?.valid).toBeTruthy();

    response = await validate(11, sheet, cell, { dataValidation: { type: "decimal", operator: 'notEqual', formulae: [10] }});
    expect(response?.valid).toBeTruthy();

    response = await validate(11, sheet, cell, { dataValidation: { type: "decimal", operator: 'greaterThan', formulae: [10] }});
    expect(response?.valid).toBeTruthy();

    response = await validate(5, sheet, cell, { dataValidation: { type: "decimal", operator: 'lessThan', formulae: [10] }});
    expect(response?.valid).toBeTruthy();

    response = await validate(10, sheet, cell, { dataValidation: { type: "decimal", operator: 'greaterThanOrEqual', formulae: [10] }});
    expect(response?.valid).toBeTruthy();

    response = await validate(10, sheet, cell, { dataValidation: { type: "decimal", operator: 'lessThanOrEqual', formulae: [10] }});
    expect(response?.valid).toBeTruthy();
  })
});
