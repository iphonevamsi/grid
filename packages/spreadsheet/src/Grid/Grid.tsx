import React, {
  useCallback,
  useRef,
  useMemo,
  useEffect,
  memo,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import Grid, {
  RendererProps,
  useSelection,
  GridRef,
  useEditable,
  useCopyPaste,
  CellInterface,
  SelectionArea,
  ScrollCoords,
  AreaProps,
  useSizer as useAutoSizer,
  CellOverlayRenderer as cellOverlayRenderer,
  useTouch,
  useFilter,
  FilterView,
  FilterDefinition,
  OptionalCellInterface,
  CellPosition,
  SelectionPolicy,
  useTooltip,
  StylingProps,
  DefaultTooltipProps,
  castToString,
  isArrowKey,
  KeyCodes,
  SelectionProps,
  Selection,
  NewSelectionMode,
  throttle,
} from "@rowsncolumns/grid";
import { debounce, cellIdentifier } from "@rowsncolumns/grid";
import { ThemeProvider, ColorModeProvider, usePrevious } from "@chakra-ui/core";
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  DARK_MODE_COLOR_LIGHT,
  HEADER_BORDER_COLOR,
  CELL_BORDER_COLOR,
  number2Alpha,
  getEditorType,
  DEFAULT_CHECKBOX_VALUES,
  ROW_HEADER_WIDTH,
  COLUMN_HEADER_HEIGHT,
  DEFAULT_CELL_PADDING,
  cellToAddress,
  isAFormula,
  sanitizeSheetName,
  pointToPixel,
  DEFAULT_FONT_SIZE,
} from "./../constants";
import HeaderCell from "./../HeaderCell";
import Cell from "./../Cell";
import { GridWrapper, ThemeType } from "./../styled";
import { Cells, CellConfig, SizeType, SheetID } from "../Spreadsheet";
import { Direction } from "@rowsncolumns/grid";
import { AXIS, Formatter, SelectionMode } from "../types";
import Editor from "./../Editor";
import { EditorProps } from "@rowsncolumns/grid";
import { CustomEditorProps } from "../Editor/Editor";
import { EditableRef } from "../Editor/TextEditor";
import FilterComponent from "./../FilterComponent";
import { FILTER_ICON_DIM } from "../FilterIcon/FilterIcon";
import { ContextMenuComponentProps } from "../ContextMenu/ContextMenu";
import { LIST_ICON_DIM } from "../ListArrow/ListArrow";
import TooltipComponent, { TooltipProps } from "./../Tooltip";
import {
  getSelectionColorAtIndex,
  getSelectionsFromInput,
  tokenize,
} from "./../formulas/helpers";

const EMPTY_ARRAY: any = [];
const EMPTY_OBJECT: any = {};

export interface GridProps {
  theme: ThemeType;
  minColumnWidth?: number;
  minRowHeight?: number;
  rowCount?: number;
  columnCount?: number;
  CellRenderer?: React.ReactType;
  HeaderCellRenderer?: React.ReactType;
  width?: number;
  height?: number;
  cells: Cells;
  onChange?: (id: SheetID, value: React.ReactText, cell: CellInterface) => void;
  onFill?: (
    activeCell: CellInterface,
    currentSelection: SelectionArea | null,
    selections: SelectionArea[]
  ) => void;
  activeCell: CellInterface | null;
  selections: SelectionArea[];
  onSheetChange?: (props: any) => void;
  selectedSheet: SheetID;
  onScroll?: (state: ScrollCoords) => void;
  scrollState?: ScrollCoords;
  onActiveCellChange?: (
    cell: CellInterface | null,
    value?: React.ReactText
  ) => void;
  onSelectionChange?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onActiveCellValueChange?: (
    value: React.ReactText | undefined,
    activeCell: CellInterface | null
  ) => void;
  onDelete?: (activeCell: CellInterface, selections: SelectionArea[]) => void;
  formatter?: Formatter;
  onResize?: (axis: AXIS, index: number, dimension: number) => void;
  columnSizes?: SizeType;
  rowSizes?: SizeType;
  mergedCells?: AreaProps[];
  frozenRows?: number;
  frozenColumns?: number;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLDivElement>,
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  hiddenRows?: number[];
  hiddenColumns?: number[];
  onPaste?: (
    rows: (string | null)[][],
    activeCell: CellInterface | null,
    selections: SelectionArea[],
    cutSelection?: SelectionArea
  ) => void;
  onCut?: (selection: SelectionArea) => void;
  onInsertRow?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onDeleteRow?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onInsertColumn?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onDeleteColumn?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  showGridLines?: boolean;
  CellEditor?: React.ReactType<CustomEditorProps>;
  selectionPolicy?: SelectionPolicy;
  selectionMode?: SelectionMode;
  isLightMode?: boolean;
  filterViews?: FilterView[];
  onChangeFilter?: (
    filterIndex: number,
    columnIndex: number,
    filter: FilterDefinition
  ) => void;
  scale?: number;
  selectionTopBound?: number;
  selectionLeftBound?: number;
  ContextMenu?: React.ReactType<ContextMenuComponentProps>;
  Tooltip?: React.ReactType<TooltipProps>;
  snap?: boolean;
  locked?: boolean;
  /**
   * Column header height
   */
  columnHeaderHeight?: number;
  /**
   * Row header width
   */
  rowHeaderWidth?: number;
  /**
   * Color of the grid lines
   */
  gridLineColor?: string;
  /**
   * Background color of grid
   */
  gridBackgroundColor?: string;
  /**
   * Active sheet name
   */
  sheetName?: string;
  /**
   * Change selected sheet
   */
  onChangeSelectedSheet?: (id: SheetID) => void;
  onCopy?: (selections: SelectionArea[]) => void;
  selectionBackgroundColor?: string;
  selectionBorderColor?: string;
  isFormulaMode?: boolean;
  setFormulaMode?: (value: boolean) => void;
  isFormulaInputActive?: boolean;
  supportedFormulas?: string[];
  onEditorKeyDown?: (e: React.KeyboardEvent<any>) => void;
}

export interface RowColSelection {
  rows: number[];
  cols: number[];
}

export type RefAttributeGrid = {
  ref?: React.Ref<WorkbookGridRef>;
};

export interface ExtraEditorProps {
  selectedSheetName?: string;
  isFormulaMode?: boolean;
  supportedFormulas?: string[];
  onFormulaChange?: (props: FormulaChangeProps) => void;
}

export interface FormulaChangeProps {
  showCellSuggestion?: boolean;
  newSelectionMode: NewSelectionMode;
}

export interface FormulaSelection {
  sheet?: SheetID;
  bounds: AreaProps;
}

export type WorkbookGridRef = {
  getNextFocusableCell: (
    cell: CellInterface,
    direction: Direction
  ) => CellInterface | null;
  setActiveCell: (cell: CellInterface | null) => void;
  setSelections: (selection: SelectionArea[]) => void;
  resetAfterIndices?: (
    coords: OptionalCellInterface,
    shouldForceUpdate?: boolean
  ) => void;
  focus: () => void;
  makeEditable: (cell: CellInterface, value?: string, focus?: boolean) => void;
  setEditorValue: (value: string, activeCell: CellInterface) => void;
  hideEditor: () => void;
  submitEditor: (
    value: string,
    activeCell: CellInterface,
    nextActiveCell?: CellInterface | null
  ) => void;
  cancelEditor: () => void;
  resizeColumns?: (indices: number[]) => void;
  resizeRows?: (indices: number[]) => void;
  getCellBounds?: (coords: CellInterface) => AreaProps;
  getScrollPosition?: () => ScrollCoords;
  getCellCoordsFromOffset?: (x: number, y: number) => CellInterface | null;
  getCellOffsetFromCoords?: (coords: CellInterface) => CellPosition;
  getEditingCell: () => CellInterface | undefined;
  getEditingSheetId: () => SheetID | undefined;
};

export interface ContextMenuProps {
  left: number;
  top: number;
}

interface InternalRef {
  rowCount: number;
  columnCount: number;
}

/**
 * Grid component
 * @param props
 */
const SheetGrid: React.FC<GridProps & RefAttributeGrid> = memo(
  forwardRef<WorkbookGridRef, GridProps>((props, forwardedRef) => {
    const {
      theme,
      minColumnWidth = DEFAULT_COLUMN_WIDTH,
      minRowHeight = DEFAULT_ROW_HEIGHT,
      rowCount: initialRowCount = 1000,
      columnCount: initialColumnCount = 1000,
      width,
      height,
      CellRenderer = Cell,
      HeaderCellRenderer = HeaderCell,
      cells,
      onChange,
      onFill,
      onSheetChange,
      activeCell: initialActiveCell,
      selections: initialSelections = EMPTY_ARRAY as SelectionArea[],
      selectedSheet,
      onScroll,
      scrollState,
      onActiveCellChange,
      onActiveCellValueChange,
      onDelete,
      formatter,
      onResize,
      columnSizes = EMPTY_OBJECT as SizeType,
      rowSizes = EMPTY_OBJECT as SizeType,
      mergedCells,
      frozenRows: userFrozenRows = 0,
      frozenColumns: userFrozenColumns = 0,
      onKeyDown,
      hiddenColumns: userHiddenColumns = EMPTY_ARRAY as number[],
      hiddenRows: userHiddenRows = EMPTY_ARRAY as number[],
      filterViews = EMPTY_ARRAY as FilterView[],
      onPaste,
      onCut,
      onInsertRow,
      onInsertColumn,
      onDeleteColumn,
      onDeleteRow,
      showGridLines,
      CellEditor = Editor,
      selectionPolicy,
      onSelectionChange,
      selectionMode,
      isLightMode,
      onChangeFilter,
      scale = 1,
      selectionTopBound = 1,
      selectionLeftBound = 1,
      ContextMenu,
      Tooltip = TooltipComponent,
      snap,
      locked,
      rowHeaderWidth = ROW_HEADER_WIDTH,
      columnHeaderHeight = COLUMN_HEADER_HEIGHT,
      gridLineColor,
      sheetName,
      onChangeSelectedSheet,
      onCopy,
      selectionBackgroundColor = "rgb(14, 101, 235, 0.1)",
      selectionBorderColor = "#1a73e8",
      isFormulaMode = false,
      setFormulaMode,
      supportedFormulas = EMPTY_ARRAY,
      onEditorKeyDown,
    } = props;
    const gridRef = useRef<GridRef | null>(null);
    const isLockedRef = useRef<boolean | undefined>(false);
    const rowCount = initialRowCount + 1;
    const columnCount = initialColumnCount + 1;
    const currentlyEditingSheetId = useRef<SheetID>();
    const currentlyEditingSheetName = useRef<SheetID>();
    const editorRef = useRef<EditableRef>(null);
    const editingCellRef = useRef<CellInterface>();
    const isFormulaModeRef = useRef<boolean>(false);
    const [formulaState, setFormulaState] = useState<FormulaChangeProps>(() => {
      return {
        newSelectionMode: "modify",
        showCellSuggestion: false,
      };
    });
    const [formulaSelections, setFormulaSelections] = useState<
      FormulaSelection[]
    >([]);
    const { newSelectionMode, showCellSuggestion } = formulaState;
    const previousSelectedSheet = usePrevious(selectedSheet);

    useEffect(() => {
      isFormulaModeRef.current = isFormulaMode;
    }, [isFormulaMode]);

    /**
     * Keep track of variables in `refs` cos we bound events to `document`
     * : mousemove, mouseup
     */
    const internalRefs = useRef<InternalRef>({ rowCount, columnCount });
    const frozenRows = Math.max(1, userFrozenRows + 1);
    const frozenColumns = Math.max(1, userFrozenColumns + 1);
    const debounceScroll = useRef<(pos: ScrollCoords) => void>();
    const [
      contextMenuProps,
      setContextMenuProps,
    ] = useState<ContextMenuProps | null>(null);
    const borderStyles = useMemo((): StylingProps => {
      return filterViews.map((filter) => {
        return {
          bounds: filter.bounds,
          style: {
            strokeWidth: 1,
            stroke: "green",
          },
        };
      });
    }, [filterViews]);

    useEffect(() => {
      debounceScroll.current = onScroll ? debounce(onScroll, 500) : void 0;

      return () => {
        debounceScroll.current = void 0;
      };
    }, []);

    /* Update locked ref */
    useEffect(() => {
      isLockedRef.current = locked;
    }, [locked]);

    /* Update internal refs */
    useEffect(() => {
      internalRefs.current = {
        rowCount,
        columnCount,
      };
    }, [rowCount, columnCount]);

    const isCellRowHeader = useCallback((rowIndex: number) => {
      return rowIndex === 0;
    }, []);
    const isCellColumnHeader = useCallback((columnIndex: number) => {
      return columnIndex === 0;
    }, []);

    /* Cell where filter icon will appear */
    const filterHeaderCells = useMemo(() => {
      const initialValue: Record<string, number> = {};
      return filterViews.reduce((acc, filter, index) => {
        const { bounds } = filter;
        for (let i = bounds.left; i <= bounds.right; i++) {
          acc[cellIdentifier(bounds.top, i)] = index;
        }
        return acc;
      }, initialValue);
    }, [filterViews]);

    /* Filter columns */
    const columnsWithFilter = useMemo(() => {
      const initialValue: number[] = [];
      return filterViews.reduce((acc, filter) => {
        const { bounds } = filter;
        for (let i = bounds.left; i <= bounds.right; i++) {
          acc.push(i);
        }
        return acc;
      }, initialValue);
    }, [filterViews]);

    /* Filter row range */
    const rowFilterRange = useMemo(() => {
      const initialValue: Record<string, number[]> = {};
      return filterViews.reduce((acc, { bounds }, index) => {
        acc[index] = [bounds.top, bounds.bottom];
        return acc;
      }, initialValue);
    }, [filterViews]);

    /* Has filter */
    const columnHasFilter = useCallback(
      (columnIndex) => {
        return columnsWithFilter.includes(columnIndex);
      },
      [columnsWithFilter]
    );

    const rowHasFilter = useCallback(
      (rowIndex) => {
        for (const i in rowFilterRange) {
          const [min, max] = rowFilterRange[i];
          if (rowIndex >= min && rowIndex <= max) return true;
        }
        return false;
      },
      [rowFilterRange]
    );

    useImperativeHandle(forwardedRef, () => {
      return {
        getNextFocusableCell,
        setActiveCell,
        setSelections,
        focus: () => gridRef.current?.focus(),
        getEditingCell: () => editingCellRef.current,
        getEditingSheetId: () => currentlyEditingSheetId.current,
        resetAfterIndices: gridRef.current?.resetAfterIndices,
        makeEditable,
        setEditorValue: setValue,
        hideEditor,
        submitEditor,
        cancelEditor,
        resizeColumns: gridRef.current?.resizeColumns,
        resizeRows: gridRef.current?.resizeRows,
        getCellBounds: gridRef.current?.getCellBounds,
        getScrollPosition: gridRef.current?.getScrollPosition,
        getCellCoordsFromOffset: gridRef.current?.getCellCoordsFromOffset,
        getCellOffsetFromCoords: gridRef.current?.getCellOffsetFromCoords,
      };
    });

    /**
     * Get cell value or text
     */
    const getValue = useCallback(
      (cell: CellInterface | null): CellConfig | undefined => {
        if (!cell) return void 0;
        const { rowIndex, columnIndex } = cell;
        /* Check if its header cell */
        const isRowHeader = isCellRowHeader(rowIndex);
        const isColumnHeader = isCellColumnHeader(columnIndex);
        const cellId = cellIdentifier(rowIndex, columnIndex);
        const isFilterHeader = filterHeaderCells[cellId] !== void 0;

        if (isRowHeader) {
          return { text: number2Alpha(columnIndex - 1), fontSize: 10 };
        }

        if (isColumnHeader) {
          return { text: rowIndex, fontSize: 10 };
        }

        const cellConfig = isFilterHeader
          ? { ...cells[rowIndex]?.[columnIndex], bold: true }
          : cells[rowIndex]?.[columnIndex];

        return cellConfig;
      },
      [cells, filterHeaderCells]
    );

    /**
     * To bypass closures
     */
    const getValueRef = useRef(getValue);
    useEffect(() => {
      getValueRef.current = getValue;
    }, [getValue]);

    /**
     * Get text of a cell
     */
    const getValueText = useCallback(
      (cell) => {
        return getValue(cell)?.text;
      },
      [getValue]
    );
    /**
     * Get display text of a cell. Applicable to visible text display in the cell
     */
    const getDisplayText = useCallback((cellConfig: CellConfig) => {
      const datatype = cellConfig?.datatype;
      const isFormula = datatype === "formula";
      const textValue = isFormula
        ? cellConfig?.error ?? cellConfig?.result
        : cellConfig?.text;
      const effectiveType = isFormula ? cellConfig?.resultType : datatype;
      const formattedValue = formatter
        ? formatter(textValue, effectiveType, cellConfig)
        : textValue;

      return formattedValue !== void 0
        ? castToString(formattedValue)
        : formattedValue;
    }, []);

    /**
     * Apply filter on the cells
     */
    const hiddenFilterRows = useMemo(() => {
      const rows: Record<string, true> = {};
      for (let i = 0; i < filterViews.length; i++) {
        const filterView = filterViews[i];
        const { bounds, filters } = filterView;
        for (const columnIndex in filters) {
          const { values } = filters[columnIndex];
          for (let k = bounds.top + 1; k <= bounds.bottom; k++) {
            const cell = { rowIndex: k, columnIndex: parseInt(columnIndex) };
            const cellConfig = getValue(cell);
            const value = cellConfig?.text ?? "";
            if (!values.includes(value)) {
              rows[k] = true;
            }
          }
        }
      }
      return rows;
    }, [filterViews]);

    const hiddenRows = useMemo(() => {
      return userHiddenRows.reduce((acc, item) => {
        acc[item] = true;
        return acc;
      }, hiddenFilterRows);
    }, [hiddenFilterRows, userHiddenRows]);

    const hiddenColumns = useMemo(() => {
      const initialValue: Record<string, boolean> = {};
      return userHiddenColumns.reduce((acc, item) => {
        acc[item] = true;
        return acc;
      }, initialValue);
    }, [userHiddenColumns]);

    const isHiddenRow = useCallback(
      (rowIndex: number) => {
        return hiddenRows[rowIndex];
      },
      [hiddenRows, selectionMode]
    );
    const isHiddenColumn = useCallback(
      (columnIndex: number) => {
        return hiddenColumns[columnIndex];
      },
      [hiddenColumns]
    );

    /* Enable touch */
    const {
      isTouchDevice,
      scrollTo: scrollToTouch,
      scrollToTop: scrollToTopTouch,
    } = useTouch({
      gridRef,
    });

    /**
     * Column resizer
     */
    const { getColumnWidth, onViewChange, getTextMetrics } = useAutoSizer({
      gridRef,
      frozenRows,
      scale,
      minColumnWidth: 10,
      isHiddenRow,
      isHiddenColumn,
      getValue: (cell: CellInterface) => {
        const cellConfig = getValue(cell);
        const iconPadding = 5;
        const spacing =
          cellConfig?.dataValidation?.type === "list"
            ? LIST_ICON_DIM + iconPadding
            : 0;
        const fontSize = pointToPixel(
          cellConfig?.fontSize ?? DEFAULT_FONT_SIZE
        );
        return { ...cellConfig, fontSize, spacing };
      },
      getText: getDisplayText,
      columnSizes,
      autoResize: false,
      resizeOnScroll: false,
    });

    /* Mouse down seelction */
    const handleMouseDownSelection = useCallback(
      (
        e: React.MouseEvent<HTMLDivElement>,
        coords: CellInterface,
        startRef,
        endRef
      ) => {
        if (!gridRef.current) return;
        const { rowCount, columnCount } = internalRefs.current;
        const isShiftKey = e.nativeEvent.shiftKey;
        const isMetaKey = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;
        const isRowHeader = isCellRowHeader(coords.rowIndex);
        const isColumnHeader = isCellColumnHeader(coords.columnIndex);
        if (isRowHeader && isColumnHeader) {
          selectAll();
          return false;
        }
        if (isRowHeader || isColumnHeader) {
          const actualFrozenRows = frozenRows - 1;
          const actualFrozenColumns = frozenColumns - 1;
          const start = isColumnHeader
            ? { ...coords, columnIndex: selectionLeftBound }
            : { ...coords, rowIndex: selectionTopBound };
          const end = isColumnHeader
            ? { ...coords, columnIndex: columnCount - 1 }
            : { ...coords, rowIndex: rowCount - 1 };
          const {
            visibleRowStartIndex,
            visibleColumnStartIndex,
          } = gridRef.current.getViewPort();
          const activeCell = isColumnHeader
            ? {
                ...coords,
                columnIndex:
                  actualFrozenColumns >= selectionLeftBound
                    ? selectionLeftBound
                    : visibleColumnStartIndex,
              }
            : {
                ...coords,
                rowIndex:
                  actualFrozenRows >= selectionTopBound
                    ? selectionTopBound
                    : visibleRowStartIndex,
              };

          if (isShiftKey) {
            modifySelection(end);
          } else if (isMetaKey) {
            appendSelection(start, end);
            setActiveCellState(activeCell);
            /* Scroll to the new active cell */
            gridRef.current.scrollToItem(activeCell);
          } else {
            /* Clear all selections */
            clearSelections();
            startRef.current = start;
            endRef.current = start;
            modifySelection(end);
            setActiveCellState(activeCell);
            /* Scroll to the new active cell */
            gridRef.current.scrollToItem(activeCell);
          }
          return false;
        }
      },
      [frozenRows, frozenColumns, mergedCells]
    );

    /* Mouse move */
    const handleMouseMoveSelection = useCallback(
      (_, coords: CellInterface, startRef, endRef) => {
        const { rowCount, columnCount } = internalRefs.current;
        const isRowHeader =
          startRef.current?.rowIndex === selectionTopBound &&
          endRef.current?.rowIndex === rowCount - 1;
        const isColumnHeader =
          startRef.current?.columnIndex === selectionLeftBound &&
          endRef.current?.columnIndex === columnCount - 1;

        if (isRowHeader && isColumnHeader) return false;
        if (isRowHeader || isColumnHeader) {
          const end = isRowHeader
            ? { ...coords, rowIndex: rowCount - 1 }
            : { ...coords, columnIndex: columnCount - 1 };
          modifySelection(end);
          gridRef.current?.scrollToItem({
            rowIndex: isRowHeader ? void 0 : coords.rowIndex,
            columnIndex: isColumnHeader ? void 0 : coords.columnIndex,
          });
          return false;
        }
      },
      []
    );

    /**
     * Selection
     */
    const {
      selections: gridSelections,
      activeCell,
      setActiveCell,
      setActiveCellState,
      setSelections,
      modifySelection,
      newSelection,
      clearLastSelection,
      appendSelection,
      selectAll,
      clearSelections,
      ...selectionProps
    } = useSelection({
      newSelectionMode: isFormulaMode ? newSelectionMode : "clear",
      selectionPolicy,
      selectionTopBound,
      selectionLeftBound,
      initialActiveCell,
      initialSelections,
      gridRef,
      rowCount,
      columnCount,
      onFill,
      isHiddenRow,
      isHiddenColumn,
      mergedCells,
      getValue: getValueText,
      mouseDownInterceptor: handleMouseDownSelection,
      mouseMoveInterceptor: handleMouseMoveSelection,
      canSelectionSpanMergedCells: (
        start: CellInterface,
        end: CellInterface
      ) => {
        const { rowCount, columnCount } = internalRefs.current;
        if (
          start.rowIndex === selectionTopBound &&
          end.rowIndex === rowCount - 1
        ) {
          return false;
        }
        if (
          start.columnIndex === selectionLeftBound &&
          end.columnIndex === columnCount - 1
        ) {
          return false;
        }
        return true;
      },
    });

    /* Focus on the editor */
    const focusEditor = useCallback(() => {
      requestAnimationFrame(() => editorRef.current?.focus());
    }, []);

    /* Focus on the editor */
    const updateFormulaEditor = useCallback(
      (sel: SelectionArea | undefined, newSelectionMode: NewSelectionMode) => {
        const name = sanitizeSheetName(
          selectedSheet !== currentlyEditingSheetId.current ? sheetName : void 0
        );
        editorRef.current?.updateSelection?.(name, sel, newSelectionMode);
      },
      [selectedSheet, sheetName]
    );
    /* Throttler */
    const updateFormulaEditorThrottle = useRef<(...a: any[]) => void>();

    useEffect(() => {
      updateFormulaEditorThrottle.current = throttle(updateFormulaEditor, 60);
    }, [updateFormulaEditor, selectedSheet, sheetName]);

    /**
     * TOOD
     * Check dependency array
     */
    useEffect(() => {
      if (isFormulaMode) {
        updateFormulaEditorThrottle.current?.(
          gridSelections[gridSelections.length - 1],
          formulaState.newSelectionMode
        );
      }
    }, [gridSelections]);

    /**
     * Switch selections to formula selections
     * If user is in formula mode
     */
    const selections = isFormulaMode ? formulaSelections : gridSelections;

    /**
     * Copy paste
     */
    const { copy, paste, cut } = useCopyPaste({
      gridRef,
      selections,
      activeCell,
      getValue: getValue,
      getText: getDisplayText,
      onPaste,
      onCut,
      onCopy,
    });

    const handleChangeFilter = useCallback(
      (filterIndex: number, columnIndex: number, filter: FilterDefinition) => {
        onChangeFilter?.(filterIndex, columnIndex, filter);
        hideFilter();
      },
      []
    );

    const headerSelections = useMemo(() => {
      const sel: Record<string, Record<string, boolean>> = {
        rows: {},
        cols: {},
      };
      for (let i = 0; i < selections.length; i++) {
        const { bounds } = selections[i];
        const isFullColSelected =
          bounds.top === selectionTopBound && bounds.bottom === rowCount - 1;
        const isFullRowSelected =
          bounds.left === selectionLeftBound &&
          bounds.right === columnCount - 1;
        if (isFullColSelected) {
          for (let j = bounds.left; j <= bounds.right; j++) {
            sel.cols[j] = true;
          }
        }
        if (isFullRowSelected) {
          for (let j = bounds.top; j <= bounds.bottom; j++) {
            sel.rows[j] = true;
          }
        }
      }
      return sel;
    }, [
      selections,
      rowCount,
      selectionTopBound,
      selectionLeftBound,
      columnCount,
    ]);

    const isHeaderSelected = useCallback(
      (index: number, type: string) => {
        return headerSelections[type][index];
      },
      [headerSelections]
    );

    /**
     * Filter
     */
    const { filterComponent, showFilter, hideFilter } = useFilter({
      frozenRows,
      frozenColumns,
      gridRef,
      getFilterComponent: () => {
        return (props) => {
          return (
            <FilterComponent
              {...props}
              onChange={handleChangeFilter}
              onCancel={hideFilter}
            />
          );
        };
      },
      getValue: getValueText,
    });

    const handleFilterClick = useCallback(
      (cell: CellInterface) => {
        const filterIndex = filterViews.findIndex(
          (views) => views.bounds.top === cell.rowIndex
        );
        const filterView = filterViews[filterIndex];
        const currentFilter = filterView?.filters?.[cell.columnIndex];
        if (!filterView) return;
        showFilter(cell, filterIndex, filterView, currentFilter);
      },
      [filterViews, frozenRows, frozenColumns]
    );

    /**
     * Adjusts a column
     */
    const handleAdjustColumn = useCallback(
      (columnIndex: number) => {
        const width =
          getColumnWidth(columnIndex) +
          (columnHasFilter(columnIndex) ? FILTER_ICON_DIM : 0);
        onResize?.("x", columnIndex, width);
      },
      [getValue, hiddenRows, frozenRows, hiddenColumns, scale]
    );

    /**
     * Check if selections are in
     */
    useEffect(() => {
      /* Row and column headers */
      if (activeCell?.rowIndex === 0 || activeCell?.columnIndex === 0) {
        return;
      }
      /* Lets not change formula bar input if user is in formula mode */
      if (isFormulaMode) {
        return;
      }

      onActiveCellChange?.(activeCell, getValue(activeCell)?.text);
    }, [activeCell]);

    /**
     * Save it back to sheet
     */
    useEffect(() => {
      /* Skip if formula mode */
      if (isFormulaMode) {
        return;
      }
      /* Batch this cos of debounce */
      onSheetChange?.({ activeCell, selections });

      /* Callback */
      onSelectionChange?.(activeCell, selections);
    }, [selections, activeCell, isFormulaMode]);

    /**
     * If grid changes, lets restore the state
     */
    useEffect(() => {
      /* Ignore for first mount */
      if (!previousSelectedSheet || previousSelectedSheet === selectedSheet) {
        return;
      }
      if (scrollState) {
        isTouchDevice
          ? scrollToTouch(scrollState)
          : gridRef.current?.scrollTo(scrollState);
      } else {
        isTouchDevice ? scrollToTopTouch() : gridRef.current?.scrollToTop();
      }
      /* Reset last measures cell */
      gridRef.current?.resetAfterIndices(
        {
          rowIndex: 0,
          columnIndex: 0,
        },
        false
      );
      setActiveCell(initialActiveCell, false);
      setSelections(initialSelections);
      /* Hide filter */
      hideFilter();

      /* Focus on the grid */
      gridRef.current?.focus();

      /* Hide editor */

      if (isFormulaMode) {
        focusEditor();
      } else {
        hideEditor();
      }
    }, [selectedSheet]);

    /**
     * Remove forula selections from original grid selections
     */
    const restoreSelections = useCallback(() => {
      const len = formulaSelections.length;
      /* Clear selections */
      setSelections((prev) => {
        const newLen = prev.length - len;
        return prev.filter((_, idx) => idx < newLen);
      });
    }, [formulaSelections]);

    /**
     * When user submits the cell editor
     */
    const handleSubmit = useCallback(
      (
        value: React.ReactText,
        cell: CellInterface,
        nextActiveCell?: CellInterface | null
      ) => {
        if (currentlyEditingSheetId.current === void 0) {
          return;
        }

        /* Switch to new sheet */
        if (isFormulaMode) {
          onChangeSelectedSheet?.(currentlyEditingSheetId.current);
        }

        /* Trigger onChange */
        onChange?.(currentlyEditingSheetId.current, value, cell);

        /* Focus on next active cell */
        if (nextActiveCell) {
          setActiveCell(nextActiveCell, true);
        }

        /**
         * Resize if height has changed: Skip merged cells
         * Skip for formula cell too
         */
        const isMergedCell = gridRef.current?.isMergedCell(cell);
        if (!isMergedCell && !isFormulaMode) {
          const { rowIndex } = cell;
          const height =
            rowSizes[rowIndex] ??
            Math.max(
              minRowHeight,
              (getTextMetrics(value).height + DEFAULT_CELL_PADDING) / scale
            );
          if (height !== minRowHeight) {
            onResize?.("y", rowIndex, height);
          }
        }

        /* Switch off formula mode */
        setFormulaMode?.(false);

        /* Restore previous selections */
        if (isFormulaMode) {
          restoreSelections();
        }

        /* Reset edit ref */
        editingCellRef.current = undefined;
      },
      [selectedSheet, scale, rowSizes, isFormulaMode, formulaSelections]
    );

    const handleEditorCancel = useCallback(
      (e?: React.KeyboardEvent<any>) => {
        if (isFormulaModeRef.current) {
          /* Switch to new sheet */
          if (currentlyEditingSheetId.current !== void 0) {
            onChangeSelectedSheet?.(currentlyEditingSheetId.current);
          }

          if (
            editingCellRef.current &&
            e?.nativeEvent.keyCode === KeyCodes.Escape
          ) {
            setActiveCell(editingCellRef.current);
          }

          /* Switch off formula mode */
          setFormulaMode?.(false);

          /* Restore previous selections */
          restoreSelections();
        }

        /* Reset ref */
        editingCellRef.current = undefined;
      },
      [isFormulaMode, formulaSelections]
    );

    const { tooltipComponent, ...tooltipProps } = useTooltip({
      getTooltip: (cell) => {
        const cellConfig = getValue(cell);
        const isValid = cellConfig?.valid ?? true;
        const datatype = cellConfig?.datatype;
        const resultType = cellConfig?.resultType;
        const hasError = !!cellConfig?.error;
        const hasTooltip = cellConfig?.tooltip;
        const isHyperLink =
          datatype === "hyperlink" || resultType === "hyperlink";
        const showTooltip =
          isValid === false || hasError === true || isHyperLink || hasTooltip;
        if (!showTooltip) return null;
        let content: string | undefined;
        if (isValid === false) {
          const validation = cellConfig?.dataValidation;
          content = validation?.prompt;
        } else if (hasError) {
          content = cellConfig?.errorMessage || cellConfig?.error;
        }
        if (hasTooltip) {
          content = cellConfig?.tooltip;
        }
        const variant =
          isValid === false ? "invalid" : hasError ? "error" : void 0;
        const position = isHyperLink ? "bottom" : "right";
        return (props: DefaultTooltipProps) => {
          return (
            <Tooltip
              {...props}
              {...cellConfig}
              position={position}
              content={content}
              variant={variant}
            />
          );
        };
      },
      gridRef,
    });

    /**
     * When active cell changes
     */
    const handleActiveCellValueChange = useCallback(
      (value: string, cell: CellInterface) => {
        onActiveCellValueChange?.(value, cell);
        const isFormula = isAFormula(value);
        setFormulaMode?.(!!isFormula);
        if (isFormula) {
          const sel = getSelectionsFromInput(
            value,
            currentlyEditingSheetName.current
          );
          setFormulaSelections(sel);
        }
      },
      [sheetName]
    );

    const handleFormulaChange = useCallback((props: FormulaChangeProps) => {
      setFormulaState(props);
    }, []);

    /**
     * Editable
     */
    const {
      editorComponent,
      isEditInProgress,
      nextFocusableCell,
      makeEditable,
      setValue,
      hideEditor,
      submitEditor,
      cancelEditor,
      showEditor,
      editingCell,
      ...editableProps
    } = useEditable({
      onBeforeEdit: (cell: CellInterface) => {
        if (editingCellRef.current) {
          if (
            editingCellRef.current.rowIndex !== cell.rowIndex &&
            editingCellRef.current.columnIndex !== cell.columnIndex
          ) {
            clearSelections();
          }
        }
        /* Update active sheet */
        currentlyEditingSheetName.current = sheetName;
        currentlyEditingSheetId.current = selectedSheet;
        editingCellRef.current = cell;
      },
      hideOnBlur: isFormulaMode ? !formulaState.showCellSuggestion : true,
      onKeyDown: (e) => {
        const isAltKey = e.altKey;
        /* Pass it on */
        onEditorKeyDown?.(e);

        if (
          isFormulaMode &&
          showCellSuggestion &&
          isArrowKey(e.nativeEvent.which) &&
          !isAltKey
        ) {
          selectionProps.onKeyDown(e);
        }
      },
      editorProps: (): ExtraEditorProps => {
        return {
          selectedSheetName: sheetName,
          isFormulaMode,
          supportedFormulas,
          onFormulaChange: handleFormulaChange,
        };
      },
      getEditor: (cell: CellInterface | null) => {
        const config = getValue(cell);
        const type = getEditorType(config?.dataValidation?.type);
        const options = config?.dataValidation?.formulae;
        const horizontalAlign =
          config?.horizontalAlign ??
          (config?.datatype === "number" && !config?.plaintext && "right");
        const address = cellToAddress(cell);

        return (props: EditorProps) => (
          <CellEditor
            {...props}
            ref={editorRef}
            background={config?.fill}
            color={config?.color}
            fontSize={config?.fontSize}
            fontFamily={config?.fontFamily}
            bold={config?.bold}
            underline={config?.underline}
            horizontalAlign={horizontalAlign}
            scale={scale}
            wrap={config?.wrap}
            editorType={type}
            options={options}
            sheetName={sheetName}
            address={address}
          />
        );
      },
      frozenRows,
      frozenColumns,
      isHiddenRow,
      isHiddenColumn,
      gridRef,
      selections,
      activeCell,
      rowCount,
      columnCount,
      selectionTopBound,
      selectionLeftBound,
      onSubmit: handleSubmit,
      onCancel: handleEditorCancel,
      getValue: getValueText,
      onChange: handleActiveCellValueChange,
      canEdit: (cell: CellInterface) => {
        /* If sheet is locked */
        if (isLockedRef.current === true) return false;
        if (cell.rowIndex === 0 || cell.columnIndex === 0) return false;
        const isLocked = getValue(cell)?.locked;
        if (isLocked) return false;
        return true;
      },
      onDelete: onDelete,
    });

    /* Ref to store event references for editable and selection. This prevents re-rendering grid */
    const eventRefs = useRef({
      selectionProps: {
        onMouseDown: selectionProps.onMouseDown,
        onKeyDown: selectionProps.onKeyDown,
      },
      editableProps: {
        onMouseDown: editableProps.onMouseDown,
        onKeyDown: editableProps.onKeyDown,
      },
    });

    useEffect(() => {
      eventRefs.current = {
        selectionProps: {
          onMouseDown: selectionProps.onMouseDown,
          onKeyDown: selectionProps.onKeyDown,
        },
        editableProps: {
          onMouseDown: editableProps.onMouseDown,
          onKeyDown: editableProps.onKeyDown,
        },
      };
    });

    const getNextFocusableCell = useCallback(
      (cell: CellInterface, direction: Direction): CellInterface | null => {
        return nextFocusableCell(cell, direction);
      },
      [hiddenRows, hiddenColumns]
    );

    /* Width calculator */
    const columnWidth = useCallback(
      (columnIndex: number) => {
        if (hiddenColumns[columnIndex]) return 0;
        if (columnIndex === 0) return rowHeaderWidth;
        return columnSizes[columnIndex] ?? minColumnWidth;
      },
      [minColumnWidth, columnSizes, selectedSheet, rowHeaderWidth]
    );
    const rowHeight = useCallback(
      (rowIndex: number) => {
        if (hiddenRows[rowIndex]) return 0;
        if (rowIndex === 0) return columnHeaderHeight;
        return rowSizes[rowIndex] ?? minRowHeight;
      },
      [minRowHeight, hiddenRows, rowSizes, selectedSheet, columnHeaderHeight]
    );
    const contextWrapper = useCallback(
      (children) => {
        return (
          <ThemeProvider theme={theme}>
            <ColorModeProvider>{children}</ColorModeProvider>
          </ThemeProvider>
        );
      },
      [theme]
    );
    const selectedRowsAndCols: RowColSelection = useMemo(() => {
      const activeCellBounds: SelectionArea[] =
        activeCell && gridRef.current
          ? [{ bounds: gridRef.current?.getCellBounds?.(activeCell) }]
          : [];
      const initial: SelectionArea[] = [];
      return initial.concat(selections, activeCellBounds).reduce(
        (acc, { bounds }) => {
          for (let i = bounds.left; i <= bounds.right; i++) {
            acc.cols.push(i);
          }
          for (let i = bounds.top; i <= bounds.bottom; i++) {
            acc.rows.push(i);
          }
          return acc;
        },
        { rows: [], cols: [] } as RowColSelection
      );
    }, [selections, activeCell, gridRef.current?.getCellBounds]);

    /**
     * Check if a row is selected
     */
    const isRowSelected = useCallback(
      (rowIndex) => {
        if (selectionMode === "cell") return false;
        return selectionMode === "row" || selectionMode === "both"
          ? activeCell?.rowIndex === rowIndex ||
              selectedRowsAndCols.rows.includes(rowIndex)
          : false;
      },
      [selectedRowsAndCols, activeCell, selectionMode]
    );

    /**
     * Check if a column is selected
     */
    const isColumnSelected = useCallback(
      (columnIndex) => {
        if (selectionMode === "cell") return false;
        return selectionMode === "column" || selectionMode === "both"
          ? activeCell?.columnIndex === columnIndex ||
              selectedRowsAndCols.cols.includes(columnIndex)
          : false;
      },
      [selectedRowsAndCols, activeCell, selectionMode]
    );

    /**
     * Check if a cell should be hidden
     */
    const isHiddenCell = useCallback(
      (rowIndex: number, columnIndex: number) => {
        const rowSelected = isRowSelected(rowIndex);
        const columnSelected = isColumnSelected(columnIndex);
        if (rowSelected || columnSelected) return false;

        const isRowHeader = isCellRowHeader(rowIndex);
        const isColumnHeader = isCellColumnHeader(columnIndex);
        if (isRowHeader || isColumnHeader) return false;
        return getValue({ rowIndex, columnIndex }) === void 0;
      },
      [getValue, selectionMode, selectedRowsAndCols]
    );

    /**
     * Switch cell to edit mode
     */
    const handleEdit = useCallback(
      (cell: CellInterface) => {
        makeEditable(cell);
      },
      [frozenRows, frozenColumns, selectedSheet]
    );

    /**
     * Called when checkbox is checked/unchecked
     */
    const handleCheck = useCallback(
      (cell: CellInterface, checked: boolean) => {
        const cellConfig = getValueRef.current(cell);
        const type = cellConfig?.dataValidation?.type;
        const formulae: string[] =
          cellConfig?.dataValidation?.formulae ?? DEFAULT_CHECKBOX_VALUES;
        if (!type) {
          console.error(
            "Type is not specified. Cell Config should contain a dataValidation object",
            cellConfig
          );
          return;
        }
        const text = formulae[checked ? 0 : 1];
        onChange?.(selectedSheet, text, cell);
        onActiveCellValueChange?.(text, cell);
      },
      [selectedSheet]
    );

    const itemRenderer = useCallback(
      (props: RendererProps) => {
        const { rowIndex, columnIndex } = props;
        const cell = { rowIndex, columnIndex };
        const isRowHeader = isCellRowHeader(rowIndex);
        const isColumnHeader = isCellColumnHeader(columnIndex);
        if (isRowHeader || isColumnHeader) {
          const isHeaderActive =
            isRowHeader || isColumnHeader
              ? isRowHeader
                ? selectedRowsAndCols.cols.includes(columnIndex)
                : selectedRowsAndCols.rows.includes(rowIndex)
              : false;
          const isFilteredColumn = columnHasFilter(columnIndex);
          const isFilteredRow = rowHasFilter(rowIndex);
          const isSelected = isHeaderSelected(
            isRowHeader ? columnIndex : rowIndex,
            isRowHeader ? "cols" : "rows"
          );
          return (
            <HeaderCellRenderer
              {...props}
              isLightMode={isLightMode}
              isActive={isHeaderActive}
              onResize={onResize}
              onAdjustColumn={handleAdjustColumn}
              theme={theme}
              scale={scale}
              isFiltered={isFilteredColumn || isFilteredRow}
              isSelected={isSelected}
            />
          );
        }
        /* Row, cell column selection modes */
        const rowSelected = isRowSelected(rowIndex);
        const columnSelected = isColumnSelected(columnIndex);
        const isSelected = rowSelected || columnSelected;
        const filterIndex =
          filterHeaderCells[cellIdentifier(rowIndex, columnIndex)];
        const showFilter = filterIndex !== void 0;
        const cellConfig = getValue(cell);
        const isFilterActive =
          filterIndex === void 0
            ? false
            : !!filterViews?.[filterIndex]?.filters?.[columnIndex];
        return (
          <CellRenderer
            {...props}
            {...cellConfig}
            cellConfig={cellConfig}
            isLightMode={isLightMode}
            formatter={formatter}
            showStrokeOnFill={showGridLines}
            isSelected={isSelected}
            showFilter={showFilter}
            isFilterActive={isFilterActive}
            onFilterClick={handleFilterClick}
            scale={scale}
            onEdit={handleEdit}
            onCheck={handleCheck}
          />
        );
      },
      [
        getValue,
        selectedRowsAndCols,
        activeCell,
        showGridLines,
        selectionMode,
        isLightMode,
        theme,
        scale,
        filterHeaderCells,
        CellRenderer,
        HeaderCellRenderer,
      ]
    );

    const overlayRenderer = useCallback(
      (props: RendererProps) => {
        const { rowIndex, columnIndex } = props;
        const cell = { rowIndex, columnIndex };
        const cellConfig = getValue(cell);
        return cellOverlayRenderer({
          ...props,
          ...cellConfig,
        });
      },
      [getValue, selectedRowsAndCols, activeCell, hiddenRows, hiddenColumns]
    );

    const handleScroll = useCallback(
      (scrollState: ScrollCoords) => {
        editableProps.onScroll?.(scrollState);
        // Save scroll state in sheet
        debounceScroll.current?.(scrollState);
      },
      [selectedSheet]
    );

    /**
     * Show context menu
     */
    const showContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const left = e.clientX;
        const top = e.clientY;
        const pos = gridRef.current?.getRelativePositionFromOffset(left, top);
        if (!pos) return;
        const { x, y } = pos;
        setContextMenuProps({
          left: x,
          top: y,
        });
      },
      []
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const isMetaKey = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;
        /**
         * Enable append selection mode for formula
         */
        if (isFormulaMode && isMetaKey) {
          setFormulaState((prev) => {
            return {
              ...prev,
              newSelectionMode: "append",
            };
          });
        }
        eventRefs.current.selectionProps.onMouseDown(e);
        eventRefs.current.editableProps.onMouseDown(e);
        hideContextMenu();
        hideFilter();
      },
      [getValue, selectedSheet, activeCell, selections, isFormulaMode]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e, activeCell, selections);
        if (e.isDefaultPrevented()) {
          return;
        }
        eventRefs.current.selectionProps.onKeyDown(e);
        eventRefs.current.editableProps.onKeyDown(e);
      },
      [getValue, selectedSheet, activeCell, selections]
    );

    const selectionRenderer = useCallback(
      (props: SelectionProps) => {
        const { type, key } = props;
        const isFill = type === "fill";
        const isActiveCell = type === "activeCell";
        const isSelection = type === "selection";

        /* if the selection does not belong in this sheet */

        if (
          isFormulaMode &&
          isSelection &&
          (selections[key] as FormulaSelection).sheet !== sheetName
        ) {
          return null;
        }

        const stroke = isFill
          ? "gray"
          : isFormulaMode
          ? isActiveCell
            ? selections.length > 0
              ? "transparent"
              : selectionBorderColor
            : getSelectionColorAtIndex(key)
          : selectionBorderColor;

        const fillOpacity = isFill ? 0 : isFormulaMode ? 0.1 : 1;
        const fill = isFill
          ? "transparent"
          : isActiveCell
          ? "transparent"
          : isFormulaMode
          ? getSelectionColorAtIndex(key)
          : selectionBackgroundColor;

        const strokeWidth = isFill ? 1 : isFormulaMode || isActiveCell ? 2 : 1;
        const strokeStyle = isFill
          ? "dashed"
          : isFormulaMode
          ? isActiveCell && selections.length === 0
            ? "solid"
            : "dashed"
          : "solid";

        return (
          <Selection
            {...props}
            stroke={stroke}
            fill={fill}
            strokeWidth={strokeWidth}
            strokeStyle={strokeStyle}
            fillOpacity={fillOpacity}
          />
        );
      },
      [
        sheetName,
        isFormulaMode,
        selections,
        selectionBorderColor,
        selectionBackgroundColor,
      ]
    );

    /**
     * Hides context menu
     */
    const hideContextMenu = useCallback(() => {
      setContextMenuProps(null);
      gridRef.current?.focus();
    }, []);
    const fillhandleBorderColor = isLightMode ? "white" : DARK_MODE_COLOR_LIGHT;
    const finalGridLineColor =
      gridLineColor ||
      (isLightMode ? CELL_BORDER_COLOR : theme?.colors.gray[600]);
    const shadowStroke = isLightMode
      ? HEADER_BORDER_COLOR
      : theme?.colors.gray[600];
    const shadowSettings = useMemo(() => {
      return {
        stroke: shadowStroke,
      };
    }, [shadowStroke]);

    return (
      <GridWrapper>
        <Grid
          snap={snap}
          scale={scale}
          isHiddenRow={isHiddenRow}
          isHiddenCell={isHiddenCell}
          enableCellOverlay
          shadowSettings={shadowSettings}
          showFrozenShadow
          gridLineColor={finalGridLineColor}
          showGridLines={showGridLines}
          ref={gridRef}
          rowCount={rowCount}
          columnCount={columnCount}
          columnWidth={columnWidth}
          rowHeight={rowHeight}
          width={width}
          height={height}
          itemRenderer={itemRenderer}
          overlayRenderer={overlayRenderer}
          wrapper={contextWrapper}
          selections={selections}
          activeCell={activeCell}
          fillhandleBorderColor={fillhandleBorderColor}
          showFillHandle={!isEditInProgress}
          mergedCells={mergedCells}
          borderStyles={borderStyles}
          frozenRows={frozenRows}
          frozenColumns={frozenColumns}
          {...selectionProps}
          {...editableProps}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onContextMenu={showContextMenu}
          onViewChange={onViewChange}
          {...tooltipProps}
          selectionRenderer={selectionRenderer}
        />
        {editorComponent}
        {ContextMenu !== void 0 && contextMenuProps && (
          <ContextMenu
            onRequestClose={hideContextMenu}
            activeCell={activeCell}
            selections={selections}
            onCopy={copy}
            onPaste={paste}
            onCut={cut}
            onInsertRow={onInsertRow}
            onInsertColumn={onInsertColumn}
            onDeleteColumn={onDeleteColumn}
            onDeleteRow={onDeleteRow}
            {...contextMenuProps}
          />
        )}
        {filterComponent}
        {tooltipComponent}
      </GridWrapper>
    );
  })
);

export default SheetGrid;
