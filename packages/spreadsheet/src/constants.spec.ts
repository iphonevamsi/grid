import {
  format,
  detectDataType,
  splitDecimals,
  changeDecimals,
  getEditorType,
  getMinMax,
  sanitizeSheetName,
  escapeRegExp,
  FORMAT_DEFAULT_DECIMAL,
  cellsInSelectionVariant,
  removeStaleFormulas,
} from "./constants";
import { CellInterface } from "@rowsncolumns/grid";
import { Patch } from "immer";

describe("Helper functions", () => {
  it("can format number", () => {
    const value = format(12, "number", {
      format: "#.00",
    });
    expect(value).toBe("12.00");
  });

  it("can format percent", () => {
    const value = format(12, "number", {
      format: "0.00%",
    });
    expect(value).toBe("1200.00%");
  });

  it("can format currency", () => {
    const value = format(12, "number", {
      format: "$#.00",
    });
    expect(value).toBe("$12.00");
  });
});

describe("datatype", () => {
  it("can detect datatype", () => {
    expect(detectDataType("hello")).toBe(void 0);
    expect(detectDataType("")).toBe(void 0);
  });

  it("can detect number", () => {
    expect(detectDataType("12")).toBe("number");
  });

  it("can detect formula", () => {
    expect(detectDataType("=SUM(2,2)")).toBe("formula");
  });
});

describe("splitDecimals", () => {
  it("can split decimals", () => {
    expect(splitDecimals("12.00")).toStrictEqual(["12", ".00"]);
  });
});

describe("changeDecimals", () => {
  it("can increase decimal places", () => {
    expect(changeDecimals("##.00")).toBe("##.000");
    expect(changeDecimals("##")).toBe("##.0");
    expect(changeDecimals("")).toBe(FORMAT_DEFAULT_DECIMAL);
  });
  it("can decrease decimal places", () => {
    expect(changeDecimals("##.00", -1)).toBe("##.0");
    expect(changeDecimals("##", -1)).toBe("##");
  });
});

describe("getEditorType", () => {
  it("can get the right editor type", () => {
    expect(getEditorType).toBeDefined();
    expect(getEditorType("list")).toBe("list");
    expect(getEditorType()).toBe("text");
  });
});

describe("getMinMax of object keys", () => {
  it("can get min and max of values", () => {
    const o = {
      1: {},
      2: {},
      3: {},
      4: {},
    };
    expect(getMinMax(o)).toStrictEqual([1, 4]);
  });

  it("can get min and max of empty object", () => {
    const o = {};
    expect(getMinMax(o)).toStrictEqual([0, 0]);
  });
});

describe("sanitizeSheetName", () => {
  it("quote sheet names with spaces", () => {
    expect(sanitizeSheetName("sheet name")).toBe("'sheet name'");
    expect(sanitizeSheetName(void 0)).toBe(void 0);
    expect(sanitizeSheetName(2)).toBe(2);
    expect(sanitizeSheetName("sheet1")).toBe("sheet1");
  });
});

describe("escapeRegExp", () => {
  it("can escape regex", () => {
    expect(escapeRegExp("s")).toBe("s");
    expect(escapeRegExp("$s")).toBe("\\$s");
    expect(escapeRegExp("")).toBe("");
  });
});

describe("cellsInSelectionVariant", () => {
  it("can generate styles for cells", () => {
    const sel = [
      {
        bounds: {
          top: 1,
          left: 1,
          right: 5,
          bottom: 5,
        },
      },
    ];
    const boundGetter = (cell: CellInterface | null) => {
      return void 0;
    };
    const cells = cellsInSelectionVariant(
      sel,
      "all",
      "thick",
      "black",
      boundGetter
    );
    const [min, max] = getMinMax(cells);
    expect(min).toBe(1);
    expect(max).toBe(5);
  });
});

describe("removeStaleFormulas", () => {
  it("removes formulas that are not executed from undo/redo patches", () => {
    const patches: Patch[] = [
      {
        op: "replace",
        path: ["sheets", "Sheet 1", "cells", "4"],
        value: {
          1: {
            datatype: "formula",
            timestamp: void 0,
            text: "=SUM(2,2)",
          },
        },
      },
    ];

    expect(removeStaleFormulas(patches).length).toBe(1);
    expect(removeStaleFormulas(patches)[0].value).toEqual({});
  });
});
