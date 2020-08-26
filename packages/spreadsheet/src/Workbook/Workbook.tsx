import React, { useCallback, useRef, useEffect, memo, forwardRef } from "react";
import { ResizeObserver } from "@juggle/resize-observer";
import useMeasure from "react-use-measure";
import Grid from "./../Grid";
import { Flex, useColorMode } from "@chakra-ui/core";
import { BottomPanel, ThemeType } from "./../styled";
import Tabs from "./../Tabs";
import {
  SpreadSheetProps,
  Sheet,
  SizeType,
  SheetID,
  FormulaChangeProps,
} from "../Spreadsheet";
import {
  CellInterface,
  SelectionArea,
  ScrollCoords,
  isNull,
  FilterDefinition,
  NewSelectionMode,
} from "@rowsncolumns/grid";
import { WorkbookGridRef } from "../Grid/Grid";
import { AXIS } from "../types";
import {
  DARK_MODE_COLOR_LIGHT,
  EMPTY_ARRAY,
  DEFAULT_COLUMN_COUNT,
  DEFAULT_ROW_COUNT,
} from "../constants";

export interface WorkbookProps
  extends Omit<
    SpreadSheetProps,
    | "onChange"
    | "onCopy"
    | "onCut"
    | "onKeyDown"
    | "onScroll"
    | "StatusBar"
    | "onInsertRow"
    | "onDuplicateSheet"
    | "onInsertColumn"
    | "onDeleteRow"
    | "onDeleteColumn"
  > {
  currentSheet: Sheet;
  theme: ThemeType;
  sheets: Sheet[];
  selectedSheet: React.ReactText;
  onFill?: (
    id: SheetID,
    activeCell: CellInterface,
    currentSelection: SelectionArea | null,
    selections: SelectionArea[]
  ) => void;
  onDelete?: (
    id: SheetID,
    activeCell: CellInterface,
    selections: SelectionArea[]
  ) => void;
  onChangeSelectedSheet?: (id: SheetID) => void;
  onNewSheet?: () => void;
  onSheetChange?: (id: SheetID, props: any) => void;
  onScroll?: (id: SheetID, scrollState: ScrollCoords) => void;
  onChangeSheetName?: (id: SheetID, value: string) => void;
  onDeleteSheet?: (id: SheetID) => void;
  onDuplicateSheet?: (id: SheetID) => void;
  onResize?: (
    id: SheetID,
    axis: AXIS,
    index: number,
    dimension: number
  ) => void;
  onActiveCellValueChange?: (
    id: SheetID,
    activeCell: CellInterface | null,
    value: React.ReactText | undefined
  ) => void;
  rowSizes?: SizeType;
  columnSizes?: SizeType;
  onKeyDown?: (
    id: SheetID,
    e: React.KeyboardEvent<HTMLDivElement>,
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  hiddenRows?: number[];
  hiddenColumns?: number[];
  onChange?: (id: SheetID, value: React.ReactText, cell: CellInterface) => void;
  onPaste?: (
    id: SheetID,
    rows: (string | null)[][],
    activeCell: CellInterface | null,
    selections: SelectionArea[],
    cutSelections?: SelectionArea
  ) => void;
  onCut?: (id: SheetID, selection: SelectionArea) => void;
  onCopy?: (id: SheetID, selections: SelectionArea[]) => void;
  onInsertRow?: (
    id: SheetID,
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onDeleteRow?: (
    id: SheetID,
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onInsertColumn?: (
    id: SheetID,
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onDeleteColumn?: (
    id: SheetID,
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onChangeFilter?: (
    id: SheetID,
    index: number,
    columnIndex: number,
    filter?: FilterDefinition
  ) => void;
  onHideSheet?: (id: SheetID) => void;
  onShowSheet?: (id: SheetID) => void;
  onProtectSheet?: (id: SheetID) => void;
  onUnProtectSheet?: (id: SheetID) => void;
  onChangeTabColor?: (id: SheetID, color?: string) => void;
  StatusBar: React.ReactType;
  scale?: number;
  isFormulaMode?: boolean;
  setFormulaMode?: (value: boolean) => void;
  isFormulaInputActive?: boolean;
  supportedFormulas?: string[];
  onEditorKeyDown?: (e: React.KeyboardEvent<any>) => void;
  formulaState?: FormulaChangeProps;
  onChangeFormulaState?: (props: FormulaChangeProps) => void;
  onCellEditorFocus?: () => void;
  onFormulaBarUpdateSelections?: (
    sheetName: React.ReactText | undefined,
    selection: SelectionArea | undefined,
    newSelectionMode: NewSelectionMode
  ) => void;
  focusFormulaBar?: () => void;
}

export type WorkBookRefAttribute = {
  ref?: React.Ref<WorkbookGridRef>;
};

/**
 * Workbook displays a list of sheets
 * @param props
 */
const Workbook: React.FC<WorkbookProps & WorkBookRefAttribute> = memo(
  forwardRef((props, forwardedRef) => {
    const {
      selectedSheet,
      onChangeSelectedSheet,
      sheets,
      onChange,
      minColumnWidth,
      minRowHeight,
      CellRenderer,
      HeaderCellRenderer,
      onNewSheet,
      onSheetChange,
      theme,
      onChangeSheetName,
      onDeleteSheet,
      onDuplicateSheet,
      currentSheet,
      onActiveCellChange,
      onActiveCellValueChange,
      onFill,
      onDelete,
      formatter,
      onResize,
      onScroll,
      onKeyDown,
      onPaste,
      onCut,
      onInsertRow,
      onInsertColumn,
      onDeleteColumn,
      onDeleteRow,
      CellEditor,
      selectionPolicy,
      onSelectionChange,
      selectionMode,
      onChangeFilter,
      showTabStrip,
      isTabEditable,
      allowNewSheet,
      StatusBar,
      showStatusBar,
      scale = 1,
      ContextMenu,
      Tooltip,
      snap,
      onHideSheet,
      onShowSheet,
      onProtectSheet,
      onUnProtectSheet,
      onChangeTabColor,
      rowHeaderWidth,
      columnHeaderHeight,
      gridLineColor,
      gridBackgroundColor,
      onCopy,
      isFormulaMode,
      setFormulaMode,
      isFormulaInputActive,
      supportedFormulas,
      onEditorKeyDown,
      formulaState,
      onChangeFormulaState,
      onCellEditorFocus,
      onFormulaBarUpdateSelections,
      focusFormulaBar,
      ...rest
    } = props;

    const { colorMode } = useColorMode();
    const isLight = colorMode === "light";
    const [containerRef, { width, height }] = useMeasure({
      polyfill: ResizeObserver,
    });

    const {
      cells,
      activeCell,
      selections,
      scrollState,
      columnSizes = {},
      rowSizes = {},
      mergedCells,
      frozenRows,
      frozenColumns,
      hiddenColumns = EMPTY_ARRAY,
      hiddenRows = EMPTY_ARRAY,
      showGridLines = true,
      filterViews,
      rowCount = DEFAULT_ROW_COUNT,
      columnCount = DEFAULT_COLUMN_COUNT,
      locked,
      name: sheetName,
    } = currentSheet;

    /* Current sheet ref */
    const selectedSheetRef = useRef(selectedSheet);
    useEffect(() => {
      selectedSheetRef.current = selectedSheet;
    });
    const handleFill = useCallback(
      (
        cell: CellInterface,
        currentSelection: SelectionArea | null,
        selections: SelectionArea[]
      ) => {
        onFill?.(selectedSheetRef.current, cell, currentSelection, selections);
      },
      []
    );
    const handleSheetChange = useCallback((args: any) => {
      if (isNull(selectedSheetRef.current)) return;
      onSheetChange?.(selectedSheetRef.current, args);
    }, []);
    const handleScroll = useCallback((scrollState: ScrollCoords) => {
      if (isNull(selectedSheetRef.current)) return;
      onScroll?.(selectedSheetRef.current, scrollState);
    }, []);
    const handleDelete = useCallback(
      (activeCell: CellInterface, selections: SelectionArea[]) => {
        if (isNull(selectedSheetRef.current)) return;
        onDelete?.(selectedSheetRef.current, activeCell, selections);
      },
      []
    );

    const handleResize = useCallback(
      (axis: AXIS, index: number, dimension: number) => {
        if (isNull(selectedSheetRef.current)) return;
        onResize?.(selectedSheetRef.current, axis, index, dimension);
      },
      []
    );

    const handlePaste = useCallback(
      (rows, activeCell, selections, cutSelections) => {
        onPaste?.(
          selectedSheetRef.current,
          rows,
          activeCell,
          selections,
          cutSelections
        );
      },
      []
    );

    const handleCopy = useCallback((selections) => {
      onCopy?.(selectedSheetRef.current, selections);
    }, []);

    const handleCut = useCallback((selection: SelectionArea) => {
      onCut?.(selectedSheetRef.current, selection);
    }, []);

    const handleInsertRow = useCallback(
      (cell: CellInterface | null, selections: SelectionArea[]) => {
        onInsertRow?.(selectedSheetRef.current, cell, selections);
      },
      []
    );

    const handleInsertColumn = useCallback(
      (cell: CellInterface | null, selections: SelectionArea[]) => {
        onInsertColumn?.(selectedSheetRef.current, cell, selections);
      },
      []
    );

    const handleDeleteRow = useCallback(
      (cell: CellInterface | null, selections: SelectionArea[]) => {
        onDeleteRow?.(selectedSheetRef.current, cell, selections);
      },
      []
    );

    const handleDeleteColumn = useCallback(
      (cell: CellInterface | null, selections: SelectionArea[]) => {
        onDeleteColumn?.(selectedSheetRef.current, cell, selections);
      },
      []
    );

    const handleActiveCellChange = useCallback(
      (cell: CellInterface | null, value: React.ReactText | undefined) => {
        if (isNull(selectedSheetRef.current)) return;
        onActiveCellChange?.(selectedSheetRef.current, cell, value);
      },
      []
    );

    const handleActiveCellValueChange = useCallback(
      (value: React.ReactText | undefined, cell: CellInterface | null) => {
        if (isNull(selectedSheetRef.current)) return;
        onActiveCellValueChange?.(selectedSheetRef.current, cell, value);
      },
      []
    );

    const handleSelectionChange = useCallback(
      (cell: CellInterface | null, selections: SelectionArea[]) => {
        if (isNull(selectedSheetRef.current)) return;
        onSelectionChange?.(selectedSheetRef.current, cell, selections);
      },
      []
    );

    const handleChangeFilter = useCallback(
      (filterIndex: number, columnIndex: number, filter: FilterDefinition) => {
        if (isNull(selectedSheetRef.current)) return;
        onChangeFilter?.(
          selectedSheetRef.current,
          filterIndex,
          columnIndex,
          filter
        );
      },
      []
    );

    const handleKeyDown = useCallback(
      (
        e: React.KeyboardEvent<HTMLDivElement>,
        activeCell: CellInterface | null,
        selections: SelectionArea[]
      ) => {
        if (isNull(selectedSheetRef.current)) return;
        onKeyDown?.(selectedSheetRef.current, e, activeCell, selections);
      },
      [currentSheet]
    );
    const finalGridBackground =
      gridBackgroundColor || (isLight ? "white" : DARK_MODE_COLOR_LIGHT);

    return (
      <>
        <Flex
          minHeight={0}
          flex={1}
          ref={containerRef}
          background={finalGridBackground}
        >
          <Grid
            {...rest}
            scale={scale}
            isLightMode={isLight}
            ref={forwardedRef}
            onResize={handleResize}
            onDelete={handleDelete}
            onActiveCellValueChange={handleActiveCellValueChange}
            onActiveCellChange={handleActiveCellChange}
            onSelectionChange={handleSelectionChange}
            selectedSheet={selectedSheet}
            activeCell={activeCell}
            selections={selections}
            scrollState={scrollState}
            width={width}
            height={height}
            cells={cells}
            onChange={onChange}
            onFill={handleFill}
            minColumnWidth={minColumnWidth}
            minRowHeight={minRowHeight}
            CellRenderer={CellRenderer}
            HeaderCellRenderer={HeaderCellRenderer}
            onSheetChange={handleSheetChange}
            onScroll={handleScroll}
            formatter={formatter}
            columnSizes={columnSizes}
            rowSizes={rowSizes}
            mergedCells={mergedCells}
            frozenRows={frozenRows}
            frozenColumns={frozenColumns}
            onKeyDown={handleKeyDown}
            hiddenRows={hiddenRows}
            hiddenColumns={hiddenColumns}
            onPaste={handlePaste}
            onCut={handleCut}
            onCopy={handleCopy}
            onInsertRow={handleInsertRow}
            onInsertColumn={handleInsertColumn}
            onDeleteRow={handleDeleteRow}
            onDeleteColumn={handleDeleteColumn}
            theme={theme}
            rowCount={rowCount}
            columnCount={columnCount}
            showGridLines={showGridLines}
            CellEditor={CellEditor}
            selectionPolicy={selectionPolicy}
            selectionMode={selectionMode}
            filterViews={filterViews}
            onChangeFilter={handleChangeFilter}
            ContextMenu={ContextMenu}
            Tooltip={Tooltip}
            snap={snap}
            locked={locked}
            rowHeaderWidth={rowHeaderWidth}
            columnHeaderHeight={columnHeaderHeight}
            gridLineColor={gridLineColor}
            gridBackgroundColor={gridBackgroundColor}
            sheetName={sheetName}
            onChangeSelectedSheet={onChangeSelectedSheet}
            isFormulaMode={isFormulaMode}
            setFormulaMode={setFormulaMode}
            isFormulaInputActive={isFormulaInputActive}
            supportedFormulas={supportedFormulas}
            onEditorKeyDown={onEditorKeyDown}
            formulaState={formulaState}
            onChangeFormulaState={onChangeFormulaState}
            onCellEditorFocus={onCellEditorFocus}
            onFormulaBarUpdateSelections={onFormulaBarUpdateSelections}
            focusFormulaBar={focusFormulaBar}
          />
        </Flex>
        {showTabStrip || showStatusBar ? (
          <Flex>
            <BottomPanel
              background={isLight ? "#f1f3f4" : theme.colors.gray[800]}
              borderTopColor={isLight ? "#e8eaed" : theme?.colors.gray[600]}
              borderTopWidth={1}
              borderTopStyle="solid"
            >
              {showTabStrip && (
                <Tabs
                  sheets={sheets}
                  selectedSheet={selectedSheet}
                  onNewSheet={onNewSheet}
                  onSelect={onChangeSelectedSheet}
                  onChangeSheetName={onChangeSheetName}
                  onDeleteSheet={onDeleteSheet}
                  onHideSheet={onHideSheet}
                  onShowSheet={onShowSheet}
                  onProtectSheet={onProtectSheet}
                  onUnProtectSheet={onUnProtectSheet}
                  onDuplicateSheet={onDuplicateSheet}
                  onChangeTabColor={onChangeTabColor}
                  isTabEditable={isTabEditable}
                  allowNewSheet={allowNewSheet}
                  leftSpacing={rowHeaderWidth}
                />
              )}
              {showStatusBar && (
                <StatusBar selections={selections} cells={cells} />
              )}
            </BottomPanel>
          </Flex>
        ) : null}
      </>
    );
  })
);

export default Workbook;
