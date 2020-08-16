import React, { useRef, useEffect, useCallback, useMemo } from "react";
import CalcEngine, {
  CellConfigGetter as CalcCellConfigGetter,
} from "@rowsncolumns/calc";
import { CellInterface, castToString } from "@rowsncolumns/grid";
import {
  SheetID,
  CellsBySheet,
  CellConfig,
  FormulaMap,
  CellConfigBySheetNameGetter,
} from "./../Spreadsheet";
import { formulas as defaultFormulas } from "../formulas";

export interface SheetConfig {
  rowCount: number;
  columnCount: number;
}

export interface UseCalcOptions {
  formulas?: FormulaMap;
  getCellConfig: React.MutableRefObject<
    CellConfigBySheetNameGetter | undefined
  >;
  getSheetRange: (name: SheetID) => SheetConfig;
}

const useCalc = ({
  formulas,
  getCellConfig,
  getSheetRange,
}: UseCalcOptions) => {
  const engine = useRef<CalcEngine>();
  useEffect(() => {
    engine.current = new CalcEngine({
      functions: {
        ...defaultFormulas,
        ...formulas,
      },
      getSheetRange,
    });
  }, []);

  useEffect(() => {
    if (!engine.current) {
      return;
    }
    engine.current.parser.getSheetRange = getSheetRange;
  }, [getSheetRange]);

  const onCalculate = useCallback(
    (
      value: React.ReactText,
      sheet: SheetID,
      cell: CellInterface
    ): Promise<CellsBySheet | undefined> | undefined => {
      const sheetId = castToString(sheet);
      if (!sheetId || !getCellConfig.current) return;
      return engine.current?.calculate(
        castToString(value) || "",
        sheetId,
        cell,
        getCellConfig.current as CalcCellConfigGetter
      );
    },
    []
  );

  const onCalculateBatch = useCallback((changes: CellsBySheet):
    | Promise<CellsBySheet | undefined>
    | undefined => {
    if (!getCellConfig?.current) return;
    return engine.current?.calculateBatch(
      changes as Partial<CellConfig>,
      getCellConfig.current as CalcCellConfigGetter
    );
  }, []);

  const initializeEngine = useCallback((changes: CellsBySheet):
    | Promise<CellsBySheet | undefined>
    | undefined => {
    if (!getCellConfig?.current) return;
    return engine.current?.initialize(
      changes as Partial<CellConfig>,
      getCellConfig.current as CalcCellConfigGetter
    );
  }, []);

  const supportedFormulas: string[] = useMemo(() => {
    return engine.current?.parser.formulaParser.supportedFunctions() ?? [];
  }, [engine.current]);

  const getDepedencies = useCallback((text: string) => {
    return engine.current?.parser.getDependencies(text);
  }, []);

  return {
    onCalculate,
    onCalculateBatch,
    initializeEngine,
    supportedFormulas,
    getDepedencies,
  };
};

export default useCalc;
