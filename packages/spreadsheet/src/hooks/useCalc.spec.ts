import { renderHook, act } from "@testing-library/react-hooks";
import useCalc from "./useCalc";

describe("useSelection", () => {
  it("is a function", () => {
    expect(typeof useCalc).toBe("function");
  });

  it("has onCalculate handler", () => {
    // const configGetter = createRef<CellConfigBySheetNameGetter>()
    const { result } = renderHook(() =>
      useCalc({
        getCellConfig: () => {
          return {};
        },
        getSheetRange: (name) => {
          return {
            rowCount: 100,
            columnCount: 100,
          };
        },
      })
    );

    expect(result.current.onCalculate).toBeDefined();
    expect(result.current.onCalculateBatch).toBeDefined();
  });

  it("can retrieve results for calculation engine", async () => {
    const { result } = renderHook(() =>
      useCalc({
        getCellConfig: () => {
          return {
            text: "=SUM(2,2)",
            datatype: "formula",
          };
        },
        getSheetRange: (name) => {
          return {
            rowCount: 100,
            columnCount: 100,
          };
        },
      })
    );

    const results = await result.current.onCalculate("=SUM(2,2)", "Sheet1", {
      rowIndex: 1,
      columnIndex: 1,
    });
    expect(results["Sheet1"][1][1].result).toBe(4);
  });

  it("can do batch calcultion", async () => {
    const { result } = renderHook(() =>
      useCalc({
        getCellConfig: () => {
          return {
            text: "=SUM(2,2)",
            datatype: "formula",
          };
        },
        getSheetRange: (name) => {
          return {
            rowCount: 100,
            columnCount: 100,
          };
        },
      })
    );
    const changes = {
      Sheet1: {
        1: {
          1: {
            text: "=SUM(2,2)",
          },
        },
      },
      Sheet3: {
        1: {
          2: {
            text: "=SUM(4,4)",
          },
        },
      },
    };
    const results = await result.current.onCalculateBatch(changes);
    expect(results["Sheet1"][1][1].result).toBe(4);
    expect(results["Sheet3"][1][2].result).toBe(4);
  });
});
