import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  memo,
  HTMLAttributes,
} from "react";
import Toolbar from "./Toolbar";
import Formulabar from "./Formulabar";
import Workbook from "./Workbook";
import {
  theme,
  ThemeProvider,
  ColorModeProvider,
  Flex,
  useToast,
} from "@chakra-ui/core";
import { Global, css } from "@emotion/core";
import {
  CellInterface,
  SelectionArea,
  ScrollCoords,
  AreaProps,
  FilterView,
  FilterDefinition,
  useUndo,
  SelectionPolicy,
  NewSelectionMode,
} from "@rowsncolumns/grid";
import {
  createNewSheet,
  uuid,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  SYSTEM_FONT,
  format as defaultFormat,
  FONT_FAMILIES,
  detectDataType,
  COLUMN_HEADER_HEIGHT,
  ROW_HEADER_WIDTH,
  DEFAULT_ROW_COUNT,
  DEFAULT_COLUMN_COUNT,
  DEFAULT_FORMULABAR_HEIGHT,
  isAFormula,
} from "./constants";
import {
  FORMATTING_TYPE,
  CellFormatting,
  AXIS,
  BORDER_VARIANT,
  BORDER_STYLE,
  Formatter,
  SelectionMode,
} from "./types";
import { WorkbookGridRef } from "./Grid/Grid";
import { KeyCodes, Direction } from "@rowsncolumns/grid/dist/types";
import invariant from "tiny-invariant";
import { ThemeType } from "./styled";
import Editor, { CustomEditorProps } from "./Editor/Editor";
import StatusBarComponent from "./StatusBar";
import { StatusBarProps } from "./StatusBar/StatusBar";
import useFonts from "./hooks/useFonts";
import { createStateReducer, ACTION_TYPE, ActionTypes } from "./state";
import { Patch } from "immer";
import { ContextMenuComponentProps } from "./ContextMenu/ContextMenu";
import ContextMenuComponent from "./ContextMenu";
import TooltipComponent, { TooltipProps } from "./Tooltip";
import validate, { ValidationResponse } from "./validation";
import useCalc from "./hooks/useCalc";
import { formulaToRelativeReference } from "./formulas/helpers";
import { EditableRef } from "./Editor/TextEditor";

export interface SpreadSheetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onPaste"> {
  /**
   * Minimum column width of the grid
   */
  minColumnWidth?: number;
  /**
   * Minimum row height of the grid
   */
  minRowHeight?: number;
  /**
   * Column header height
   */
  columnHeaderHeight?: number;
  /**
   * Row header width
   */
  rowHeaderWidth?: number;
  /**
   * Customize cell rendering
   */
  CellRenderer?: React.ReactType;
  /**
   * Custom header cell
   */
  HeaderCellRenderer?: React.ReactType;
  /**
   * Array of sheets to render
   */
  sheets?: Sheet[];
  /**
   * Uncontrolled sheets
   */
  initialSheets?: Sheet[];
  /**
   * Active  sheet on the workbook
   */
  initialActiveSheet?: string;
  /**
   * Callback fired when cells are modified
   */
  onChangeCell?: (
    id: SheetID,
    value: React.ReactText,
    cell: CellInterface
  ) => void;
  /**
   * Callback when multiple cells change
   * Eg: Delete action
   */
  onChangeCells?: (id: SheetID, changes: Cells) => void;
  /**
   * Get the new selected sheet
   */
  onChangeSelectedSheet?: (id: SheetID) => void;
  /**
   * Listen to changes to all the sheets
   */
  onChange?: (sheets: Sheet[]) => void;
  /**
   * Show formula bar
   */
  showFormulabar?: boolean;
  /**
   * Show hide toolbar
   */
  showToolbar?: boolean;
  /**
   * Conditionally format cell text
   */
  formatter?: Formatter;
  /**
   * Enabled or disable dark mode
   */
  enableDarkMode?: true;
  /**
   * Font family
   */
  fontFamily?: string;
  /**
   * Min Height of the grid
   */
  minHeight?: number;
  /**
   * Custom Cell Editor
   */
  CellEditor?: React.ReactType<CustomEditorProps>;
  /**
   * Allow user to customize single, multiple or range selection
   */
  selectionPolicy?: SelectionPolicy;
  /**
   * Callback when active cell changes
   */
  onActiveCellChange?: (
    /* Sheet id */
    id: SheetID,
    /* Cell coords */
    cell: CellInterface | null,
    /* Value of the active cell */
    value?: React.ReactText
  ) => void;

  /**
   * Callback When active cell values changes
   */
  onActiveCellValueChange?: (
    /* Sheet id */
    id: SheetID,
    /* Cell coords  */
    cell: CellInterface | null,
    /* Value of the active cell */
    value?: React.ReactText
  ) => void;
  /**
   * Callback fired when selection changes
   */
  onSelectionChange?: (
    id: SheetID,
    activeCell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  /**
   * Select mode
   */
  selectionMode?: SelectionMode;
  /**
   * Show or hide tab strip
   */
  showTabStrip?: boolean;
  /**
   * Make tab editable
   */
  isTabEditable?: boolean;
  /**
   * Allow user to add new sheet
   */
  allowNewSheet?: boolean;
  /**
   * Show or hide status bar
   */
  showStatusBar?: boolean;
  /**
   * Status bar component
   */
  StatusBar?: React.ReactType<StatusBarProps>;
  /**
   * Context menu component
   */
  ContextMenu?: React.ReactType<ContextMenuComponentProps>;
  /**
   * Tooltip component
   */
  Tooltip?: React.ReactType<TooltipProps>;
  /**
   * Scale
   */
  initialScale?: number;
  /**
   * When scale changes
   */
  onScaleChange?: (scale: number) => void;
  /**
   * Web font loader config
   */
  fontLoaderConfig?: WebFont.Config;
  /**
   * Visible font families
   */
  fontList?: string[];
  /**
   * Snap to row and column as user scrolls
   */
  snap?: boolean;
  /**
   * Add your own state interface
   */
  stateReducer?: (state: StateInterface, action: ActionTypes) => StateInterface;
  /**
   * Custom onvalidator
   */
  onValidate?: (
    value: React.ReactText,
    id: SheetID,
    cell: CellInterface,
    cellConfig: CellConfig | undefined
  ) => Promise<ValidationResponse>;
  /**
   * By default, all keydown listeners are bound to the grid.
   * If you want to bind listeners to `document` for events such as undo/redo,
   * Toggle this to true
   */
  enableGlobalKeyHandlers?: boolean;
  /**
   * Pass custom functions to calculation engine
   */
  formulas?: FormulaMap;
  /**
   * When user fill a cell
   */
  onFill?: (
    id: SheetID,
    activeCell: CellInterface,
    fillSelection: SelectionArea | null,
    selections: SelectionArea[]
  ) => void;
  /**
   * When user adds a new sheet
   */
  onAddNewSheet?: (sheet: Sheet) => void;
  /**
   * When sheet name changes
   */
  onSheetNameChange?: (id: SheetID, name: string) => void;
  /**
   * When a sheet is deleted
   */
  onDeleteSheet?: (id: SheetID) => void;
  /**
   * When a sheet is duplicated. Index is insertion index
   */
  onDuplicateSheet?: (sheet: Sheet, index: number) => void;
  /**
   * When a column or row is resized
   */
  onResize?: (
    id: SheetID,
    axis: AXIS,
    index: number,
    dimension: number
  ) => void;
  /**
   * When a row is inserted
   */
  onInsertRow?: (id: SheetID, activeCell: CellInterface) => void;
  /**
   * When a column is inserted
   */
  onInsertColumn?: (id: SheetID, activeCell: CellInterface) => void;
  /**
   * When a row is deleted
   */
  onDeleteRow?: (id: SheetID, activeCell: CellInterface) => void;
  /**
   * When a columnb is dleted
   */
  onDeleteColumn?: (id: SheetID, activeCell: CellInterface) => void;
  /**
   * When sheet is visible from hidden state
   */
  onShowSheet?: (id: SheetID) => void;
  /**
   * When sheet is hidden
   */
  onHideSheet?: (id: SheetID) => void;
  /**
   * When sheet is protected
   */
  onProtectSheet?: (id: SheetID) => void;
  /**
   * When sheet is unprotected
   */
  onUnProtectSheet?: (id: SheetID) => void;
  /**
   * When sheet color changes
   */
  onSheetColorChange?: (id: SheetID, color?: string) => void;
  /**
   * When user changes formatting of a cell/selections
   */
  onFormattingChange?: (
    id: SheetID,
    key: keyof CellFormatting,
    value: any
  ) => void;
  /**
   * Callback when users deletes cells
   */
  onDeleteCells?: (
    id: SheetID,
    activeCell: CellInterface,
    selections: SelectionArea[]
  ) => void;
  /**
   * Callback when user changes frozen columns
   */
  onFrozenColumnsChange?: (id: SheetID, count: number) => void;
  /**
   * Callback when user changes frozen columns
   */
  onFrozenRowsChange?: (id: SheetID, count: number) => void;
  /**
   * Clear formatting
   */
  onClearFormatting?: (id: SheetID) => void;
  /**
   * Disable formula calculation
   */
  disableFormula?: boolean;
  /**
   * Color of the grid lines
   */
  gridLineColor?: string;
  /**
   * Background color of grid
   */
  gridBackgroundColor?: string;
  /**
   * called when calculation is successfull
   */
  onCalculateSuccess?: (changes: CellsBySheet) => void;
  /**
   * Autofocus the grid on initial mount
   */
  autoFocus?: boolean;
  /**
   * Height of formula bar
   */
  initialFormulaBarHeight?: number;
  /**
   * Callback when formulaBar height changes
   */
  onChangeFormulaBarHeight?: (value: number) => void;
}

export type FormulaMap = Record<string, (...args: any[]) => any>;

export type CellConfigGetter = (
  id: SheetID,
  cell: CellInterface | null
) => CellConfig | undefined;

export type CellConfigBySheetName = (
  name: string,
  cell: CellInterface | null
) => CellConfig | undefined;

export interface Sheet {
  id: SheetID;
  name: string;
  cells: Cells;
  activeCell: CellInterface | null;
  selections: SelectionArea[];
  scrollState?: ScrollCoords;
  columnSizes?: SizeType;
  rowSizes?: SizeType;
  mergedCells?: AreaProps[];
  frozenRows?: number;
  frozenColumns?: number;
  hiddenRows?: number[];
  hiddenColumns?: number[];
  showGridLines?: boolean;
  filterViews?: FilterView[];
  rowCount?: number;
  columnCount?: number;
  locked?: boolean;
  hidden?: boolean;
  tabColor?: string;
}

export type SheetID = React.ReactText;
export type CellsBySheet = Record<string, Cells>;

export type SizeType = {
  [key: number]: number;
};

export type Cells = Record<string, Cell>;
export type Cell = Record<string, CellConfig>;
export interface CellConfig extends CellFormatting {
  /**
   * Text that will be displayed in the cell.
   * For formulas, result will be displayed instead
   */
  text?: string | number;
  /**
   * Add tooltip
   */
  tooltip?: string;
  /**
   * Result from formula calculation
   */
  result?: string | number | boolean | Date;
  /**
   * Formula errors
   */
  error?: string;
  /**
   * Last update timestamp of a cell.
   * Can come from formula parser
   */
  timestamp?: number;
  /**
   * Error message to be displayed in tooltips
   */
  errorMessage?: string;
  /**
   * Validation errors
   */
  valid?: boolean;
}

const defaultActiveSheet = uuid();
export const defaultSheets: Sheet[] = [
  {
    id: defaultActiveSheet,
    name: "Sheet1",
    rowCount: 1000,
    columnCount: 26,
    frozenColumns: 0,
    frozenRows: 0,
    activeCell: {
      rowIndex: 1,
      columnIndex: 1,
    },
    mergedCells: [],
    selections: [],
    cells: {},
    scrollState: { scrollTop: 0, scrollLeft: 0 },
    filterViews: [],
  },
];

export type RefAttributeSheetGrid = {
  ref?: React.Ref<SheetGridRef>;
};

export type SheetGridRef = {
  grid: WorkbookGridRef | null;
  resize: (id: SheetID, axis: AXIS, index: number, dimension: number) => void;
  redo: () => void;
  undo: () => void;
  dispatch: (action: ActionTypes) => void;
  addUndoPatch: (patches: PatchInterface) => void;
  onCalculate: (
    changes: CellsBySheet
  ) => Promise<CellsBySheet | undefined> | undefined;
};

export interface FormulaChangeProps {
  showCellSuggestion?: boolean;
  newSelectionMode: NewSelectionMode;
}

export interface PatchInterface {
  patches: Patch[];
  inversePatches: Patch[];
}

export interface StateInterface {
  selectedSheet: React.ReactText | undefined;
  sheets: Sheet[];
  currentActiveCell?: CellInterface | null;
  currentSelections?: SelectionArea[] | null;
}

export const initialState: StateInterface = {
  selectedSheet: 0,
  sheets: defaultSheets,
  currentActiveCell: null,
  currentSelections: null,
};

/**
 * Spreadsheet component
 * TODO
 * 1. Undo/redo on formula cells does not clear old formula cos of async nature
 * @param props
 */
const Spreadsheet: React.FC<SpreadSheetProps & RefAttributeSheetGrid> = memo(
  forwardRef((props, forwardedRef) => {
    const {
      /* Controlled, to persist the state, always provide onChange */
      sheets: sheetsProp,
      /* Uncontrolled, to persist provide onChange */
      initialSheets = defaultSheets,
      showFormulabar = true,
      minColumnWidth = DEFAULT_COLUMN_WIDTH,
      columnHeaderHeight = COLUMN_HEADER_HEIGHT,
      rowHeaderWidth = ROW_HEADER_WIDTH,
      minRowHeight = DEFAULT_ROW_HEIGHT,
      CellRenderer,
      HeaderCellRenderer,
      initialActiveSheet,
      onChangeSelectedSheet,
      onChange,
      onChangeCell,
      onChangeCells,
      showToolbar = true,
      formatter = defaultFormat,
      enableDarkMode = true,
      fontFamily = SYSTEM_FONT,
      minHeight = 400,
      CellEditor = Editor,
      onActiveCellChange,
      onActiveCellValueChange,
      onSelectionChange,
      selectionMode,
      showTabStrip = true,
      isTabEditable = true,
      allowNewSheet = true,
      showStatusBar = true,
      StatusBar = StatusBarComponent,
      ContextMenu = ContextMenuComponent,
      Tooltip = TooltipComponent,
      initialScale = 1,
      onScaleChange,
      fontLoaderConfig,
      fontList = FONT_FAMILIES,
      selectionPolicy,
      snap = false,
      stateReducer,
      onValidate = validate,
      enableGlobalKeyHandlers = false,
      formulas,
      onFill,
      onAddNewSheet,
      onSheetNameChange,
      onDeleteSheet,
      onDuplicateSheet,
      onResize,
      onInsertRow,
      onInsertColumn,
      onDeleteRow,
      onDeleteColumn,
      onShowSheet,
      onHideSheet,
      onProtectSheet,
      onUnProtectSheet,
      onSheetColorChange,
      onFormattingChange,
      onDeleteCells,
      onFrozenRowsChange,
      onFrozenColumnsChange,
      onClearFormatting,
      disableFormula,
      gridLineColor,
      gridBackgroundColor,
      onCalculateSuccess,
      autoFocus = true,
      initialFormulaBarHeight = DEFAULT_FORMULABAR_HEIGHT,
      onChangeFormulaBarHeight,
      ...rest
    } = props;

    /* Last active cells: for undo, redo */
    const lastActiveCellRef = useRef<CellInterface | null>(null);
    const lastSelectionsRef = useRef<SelectionArea[] | null>([]);
    const formulaBarInputRef = useRef<EditableRef>(null);
    const [scale, setScale] = useState(initialScale);
    const currentGrid = useRef<WorkbookGridRef>(null);
    const [formulaBarHeight, setFormulaBarHeight] = useState(
      initialFormulaBarHeight
    );
    const [formulaInput, setFormulaInput] = useState("");
    const [isFormulaInputActive, setIsFormulaInputActive] = useState(false);
    const { current: isControlled } = useRef<boolean>(sheetsProp !== void 0);
    /* Add it to ref to prevent closures */
    const getCellConfigRef = useRef<CellConfigGetter>();
    const getCellConfigBySheetNameRef = useRef<CellConfigBySheetName>();
    const getSheetRef = useRef<(id: SheetID) => Sheet | undefined>();
    const [isFormulaMode, setFormulaMode] = useState(false);
    const [valueState, setValueState] = useState<StateInterface>(() => {
      return {
        currentSelections: null,
        currentActiveCell: null,
        sheets: initialSheets,
        selectedSheet: isControlled
          ? sheetsProp?.[0].id
          : initialActiveSheet ?? initialSheets[0].id ?? sheetsProp?.[0].id,
      };
    });
    const [formulaState, setFormulaState] = useState<FormulaChangeProps>(() => {
      return {
        newSelectionMode: "modify",
        showCellSuggestion: false,
      };
    });
    /* Useful for tests to handle debounced state updates */
    const isMounted = useRef<boolean>(false);
    const currentStateRef = useRef<StateInterface>();
    const state: StateInterface = useMemo(() => {
      return isControlled
        ? { ...valueState, sheets: sheetsProp as Sheet[] }
        : valueState;
    }, [isControlled, valueState, sheetsProp]);
    const { sheets, currentActiveCell, currentSelections } = state;

    const [sheetsById, sheetsByName] = useMemo(() => {
      const initial: [Record<string, Sheet>, Record<string, Sheet>] = [{}, {}];
      return sheets.reduce((acc, sheet) => {
        acc[0][sheet.id] = sheet;
        acc[1][sheet.name] = sheet;
        return acc;
      }, initial);
    }, [sheets]);

    /* Make sure selected sheet is present in the sheets */
    const selectedSheet =
      (state.selectedSheet ?? "") in sheetsById
        ? state.selectedSheet
        : sheets[0].id;
    const selectedSheetRef = useRef<SheetID>();

    /**
     * Exit early if selected sheet is invalid
     */
    invariant(
      selectedSheet !== void 0 && selectedSheet !== null,
      "Exception, selectedSheet is empty, Please specify a selected sheet using `selectedSheet` prop"
    );

    useEffect(() => {
      isMounted.current = true;
      /* Focus on the grid */
      if (autoFocus) {
        focusGrid();
      }
      return () => {
        isMounted.current = false;
      };
    }, []);

    /* So we can access sheet in closures */
    useEffect(() => {
      selectedSheetRef.current = selectedSheet;
    }, [selectedSheet]);

    /* Keep a reference to previous state */
    useEffect(() => {
      if (!isControlled) {
        onChange?.(state.sheets);
      }
    }, [state, isControlled]);

    /* Keep controlled state in sync */
    if (isControlled) {
      currentStateRef.current = state;
    }

    /**
     * State reducer
     */
    const currentStateReducer = useCallback(() => {
      return createStateReducer({
        addUndoPatch,
        replaceUndoPatch,
        getCellBounds,
        stateReducer,
      });
    }, []);
    const dispatch = useCallback(
      (action: ActionTypes) => {
        if (!isMounted.current) {
          return;
        }
        /**
         * Previous state of controlled component is saved in ref
         * currentStateRef.current is kept in sync with  newState
         */
        if (isControlled) {
          if (!currentStateRef.current) return;
          const newState = currentStateReducer()(
            currentStateRef.current,
            action
          );

          /* Callbacks */
          updateState(newState);
        } else {
          /**
           * Use local state
           */
          setValueState((prevState) => {
            return currentStateReducer()(prevState, action);
          });
        }
      },
      [isControlled]
    );

    /**
     * Warn users when they switch from controlled to uncontrolled
     */
    useEffect(() => {
      const nextIsControlled = sheetsProp !== void 0;
      const nextMode = nextIsControlled ? "a controlled" : "an uncontrolled";
      const mode = isControlled ? "a controlled" : "an uncontrolled";
      if (isControlled !== nextIsControlled) {
        console.warn(
          `Your component is changing from ${mode} to ${nextMode}.Components should not switch from controlled to uncontrolled (or vice versa).` +
            `Use initialSheets for uncontrolled and sheets and onChange for controlled SpreadSheet`
        );
      }
    }, [isControlled]);

    /**
     * Update local state or triggers callback
     */
    const updateState = useCallback(
      (newState: StateInterface) => {
        if (newState.selectedSheet !== currentStateRef.current?.selectedSheet) {
          setValueState((prev) => {
            return {
              ...prev,
              selectedSheet: newState.selectedSheet,
            };
          });
        }

        /**
         * If active cell changes
         * For undo/redo
         */
        if (
          newState.currentActiveCell !==
            currentStateRef.current?.currentActiveCell ||
          newState.currentSelections !==
            currentStateRef.current?.currentSelections
        ) {
          setValueState((prev) => {
            return {
              ...prev,
              currentActiveCell:
                newState.currentActiveCell || prev.currentActiveCell,
              currentSelections:
                newState.currentSelections || prev.currentSelections,
            };
          });
        }

        if (newState.selectedSheet !== state.selectedSheet) {
          onChangeSelectedSheet?.(newState.selectedSheet as React.ReactText);
        }

        /* Update local references */
        currentStateRef.current = newState;

        /* Call back */
        onChange?.(newState.sheets);
      },
      [isControlled]
    );

    /* Current sheet */
    const currentSheet = sheetsById[selectedSheet];

    /**
     * Get cell config
     */
    const getCellConfig = useCallback(
      (id: SheetID, cell: CellInterface | null): CellConfig | undefined => {
        if (!cell) return void 0;
        return sheetsById?.[id]?.cells?.[cell.rowIndex]?.[cell.columnIndex];
      },
      [sheetsById]
    );

    /**
     * Get cell config
     */
    const getCellConfigBySheetName = useCallback(
      (name: string, cell: CellInterface | null): CellConfig | undefined => {
        if (!cell) return void 0;
        return sheetsByName?.[name]?.cells?.[cell.rowIndex]?.[cell.columnIndex];
      },
      [sheetsByName]
    );

    /* Get sheet by id */
    const getSheet = useCallback(
      (id: SheetID) => {
        return sheetsById?.[id];
      },
      [sheetsById]
    );

    /* Keep sheet references in-sync */

    getCellConfigRef.current = getCellConfig;
    getCellConfigBySheetNameRef.current = getCellConfigBySheetName;
    getSheetRef.current = getSheet;

    /**
     * Get all cells by sheet name
     */
    const getCellsBySheet = useCallback(() => {
      const initial: CellsBySheet = {};
      return sheets.reduce((acc, sheet) => {
        acc[sheet.name] = getSheetRef.current?.(sheet.id)?.cells ?? {};
        return acc;
      }, initial);
    }, [sheets]);

    /**
     * Get properties of a sheet
     */
    const getSheetRange = useCallback(
      (name: SheetID) => {
        const sheet = sheetsByName[name];
        return {
          rowCount: sheet?.rowCount ?? DEFAULT_ROW_COUNT,
          columnCount: sheet?.columnCount ?? DEFAULT_COLUMN_COUNT,
        };
      },
      [sheetsByName]
    );

    /**
     * Calculation
     */

    const { initializeEngine, onCalculateBatch, supportedFormulas } = useCalc({
      formulas,
      getCellConfig: getCellConfigBySheetNameRef.current,
      getSheetRange,
    });

    /**
     * Some grid side-effects during undo/redo
     */
    const beforeUndoRedo = useCallback((patches: Patch[]) => {
      const hasFilterViews = patches.some((item) =>
        item.path.includes("filterViews")
      );
      if (hasFilterViews) {
        currentGrid.current?.resetAfterIndices?.({ rowIndex: 0 }, false);
      }
    }, []);

    /**
     *
     */
    const patchHasCellChanges = useCallback((patches: Patch[]) => {
      return patches.some((patch) => {
        return patch.path[0] === "sheets" && patch.path?.[2] === "cells";
      });
    }, []);

    /**
     * Undo hook
     */
    const {
      add: addUndoPatch,
      replace: replaceUndoPatch,
      canRedo,
      canUndo,
      undo,
      redo,
      onKeyDown: onUndoKeyDown,
    } = useUndo<Patch>({
      identifier: (patch: Patch) => JSON.stringify(patch.path),
      enableGlobalKeyHandlers,
      onUndo: (patches: Patch[]) => {
        /* Side-effects */
        beforeUndoRedo(patches);

        dispatch({
          type: ACTION_TYPE.APPLY_PATCHES,
          patches,
          undoable: false,
        });

        if (lastActiveCellRef.current) {
          setActiveCell(lastActiveCellRef.current);
        }
        if (lastSelectionsRef.current) {
          setSelections(lastSelectionsRef.current);
        }
        /* Focus on the grid */
        if (enableGlobalKeyHandlers) focusGrid();

        /* Trigger cell change */
        if (
          patchHasCellChanges(patches) &&
          selectedSheetRef.current !== void 0
        ) {
          cellChangeCallback(
            selectedSheetRef.current,
            lastActiveCellRef.current,
            lastSelectionsRef.current,
            true
          );
        }
      },
      onRedo: (patches: Patch[]) => {
        /* Side-effects */
        beforeUndoRedo(patches);

        dispatch({
          type: ACTION_TYPE.APPLY_PATCHES,
          patches,
          undoable: false,
        });

        const activeCellPatch = patches.find((item: Patch) =>
          item.path.includes("currentActiveCell")
        );

        const selectionsPatch = patches.find((item: Patch) =>
          item.path.includes("currentSelections")
        );

        if (activeCellPatch) {
          setActiveCell(activeCellPatch.value);
        }
        if (selectionsPatch) {
          setSelections(selectionsPatch.value);
        }

        /* Focus on the grid */
        if (enableGlobalKeyHandlers) focusGrid();

        /* Trigger cell change */
        if (
          patchHasCellChanges(patches) &&
          selectedSheetRef.current !== void 0
        ) {
          cellChangeCallback(
            selectedSheetRef.current,
            activeCellPatch?.value,
            selectionsPatch?.value,
            true
          );
        }
      },
    });

    /**
     * Toast notifications
     */
    const toast = useToast();

    /* Update active cell: Imperatively */
    const setActiveCell = useCallback((cell: CellInterface | null) => {
      if (!cell) return;
      /**
       * Simple to trigger activecell change if its the same cell
       */
      currentGrid.current?.setActiveCell({ ...cell });
    }, []);

    /* Update active selections: Imperatively */
    const setSelections = useCallback((selections: SelectionArea[] | null) => {
      if (!selections) return;
      currentGrid.current?.setSelections(selections);
    }, []);

    /* Keep focus on the grid, so it can listen to keydown events */
    const focusGrid = useCallback(() => {
      return currentGrid.current?.focus();
    }, []);

    /**
     * Get cell bounds
     */
    const getCellBounds = useCallback((cell: CellInterface | null) => {
      if (!cell) return void 0;
      return currentGrid.current?.getCellBounds?.(cell);
    }, []);

    /* Last */
    useEffect(() => {
      lastActiveCellRef.current = currentActiveCell ?? null;
      lastSelectionsRef.current = currentSelections ?? null;
    }, [currentActiveCell, currentSelections]);

    /* Selected sheet */
    const setSelectedSheet = useCallback(
      (id: React.ReactText) => {
        if (id === selectedSheetRef.current) {
          return;
        }
        dispatch({
          type: ACTION_TYPE.SELECT_SHEET,
          id,
        });
      },
      [selectedSheet]
    );

    /* Fonts */
    const { isFontActive } = useFonts(fontLoaderConfig);

    /* Callback fired when fonts are loaded */
    useEffect(() => {
      if (isFontActive) {
        currentGrid.current?.resetAfterIndices?.({
          rowIndex: 0,
          columnIndex: 0,
        });
      }
    }, [isFontActive]);

    /* Callback fired when scale changes */
    useEffect(() => {
      onScaleChange?.(scale);
    }, [scale]);

    /* Callback fired when formulaBar height changes */
    useEffect(() => {
      onChangeFormulaBarHeight?.(formulaBarHeight);
    }, [formulaBarHeight]);

    useImperativeHandle(
      forwardedRef,
      () => {
        return {
          grid: currentGrid.current,
          resize: handleResize,
          addUndoPatch,
          undo,
          redo,
          dispatch,
          onCalculate: onCalculateBatch,
        };
      },
      []
    );

    /**
     * Handle add new sheet
     */
    const handleNewSheet = useCallback(() => {
      const count = sheets.length;
      const newSheet = createNewSheet({ count: count + 1 });
      dispatch({
        type: ACTION_TYPE.NEW_SHEET,
        sheet: newSheet,
      });

      /* Focus on the new grid */
      focusGrid();

      /* Callback */
      onAddNewSheet?.(newSheet);
    }, [sheets, selectedSheet]);

    /**
     * Trigger batch calculation
     * @param changes
     */
    const triggerBatchCalculation = useCallback(
      async (
        sheet: string,
        id: SheetID,
        cell: CellInterface | null,
        changes: CellsBySheet
      ) => {
        /**
         * Simple trick to delay showing loading indicator
         * If async results come too soon.
         */
        let receivedResponse = false;
        let loadingShown = false;
        const LOADING_INDICATOR_DELAY = 100;

        if (cell) {
          setTimeout(() => {
            if (receivedResponse) {
              return;
            }
            dispatch({
              type: ACTION_TYPE.SET_LOADING,
              id,
              cell,
              value: true,
              undoable: false,
            });

            loadingShown = true;
          }, LOADING_INDICATOR_DELAY);
        }
        const values = await onCalculateBatch?.(changes);

        /* Set flag to true so dont show loading indicator */
        receivedResponse = true;

        if (cell && loadingShown) {
          dispatch({
            type: ACTION_TYPE.SET_LOADING,
            id,
            cell,
            value: false,
            undoable: false,
          });
        }

        if (values !== void 0) {
          dispatch({
            type: ACTION_TYPE.UPDATE_CELLS,
            changes: values,
            replace: true,
            undoable: false,
          });

          /* Callback */
          onCalculateSuccess?.(values);
        }
      },
      []
    );

    /**
     * Trigger batch calciulation
     * @param changes
     */
    const triggerBatchInitialization = useCallback(
      async (changes: CellsBySheet) => {
        const values = await initializeEngine?.(changes);
        if (values !== void 0) {
          dispatch({
            type: ACTION_TYPE.UPDATE_CELLS,
            changes: values,
            undoable: false,
          });
        }
      },
      []
    );

    useEffect(() => {
      /* Trigger batch calculation */
      triggerBatchInitialization(getCellsBySheet());
    }, []);

    /**
     * Active cell + Active cell config.
     * Used in toolbars
     */
    const [activeCellConfig, activeCell] = useMemo(() => {
      const sheet = getSheet(selectedSheet);
      return [getCellConfig(selectedSheet, sheet.activeCell), sheet.activeCell];
    }, [getSheet, selectedSheet, getCellConfig]);

    /**
     * Cell changes on user input
     * General purpos changes
     */
    const handleChange = useCallback(
      async (id: SheetID, value: React.ReactText, cell: CellInterface) => {
        const config = getCellConfigRef.current?.(id, cell);
        let datatype = detectDataType(value);
        const isFormula = datatype === "formula";
        /* If user has disabled */
        if (disableFormula && isFormula) {
          datatype = "string";
        }

        /**
         * Catch errors early on
         * Validate circular dependency
         */
        if (isFormula) {
          try {
            formulaToRelativeReference(value, cell, cell);
          } catch (err) {
            dispatch({
              type: ACTION_TYPE.SET_CELL_ERROR,
              id,
              cell,
              value,
              datatype,
              error: err.toString(),
              errorMessage: err.message,
            });
            return;
          }
        }

        dispatch({
          type: ACTION_TYPE.CHANGE_SHEET_CELL,
          value,
          datatype,
          id,
          cell,
        });

        /* Trigger onChange cell callback */
        onChangeCell?.(id, value, cell);

        /* Validate */
        const validationResponse = await onValidate(value, id, cell, config);

        /* If validations service fails, lets not update the store */
        if (validationResponse !== void 0) {
          /**
           * Extract valid: boolean response and message
           */
          const { valid, message } = validationResponse as ValidationResponse;

          /**
           * Update the state
           */
          dispatch({
            type: ACTION_TYPE.VALIDATION_SUCCESS,
            cell,
            id,
            valid,
            prompt: message,
            undoable: false,
            replace: true,
          });
        }

        cellChangeCallback(id, cell);
      },
      [disableFormula]
    );

    const handleSheetAttributesChange = useCallback(
      (
        id: SheetID,
        {
          activeCell,
          selections,
        }: { activeCell: CellInterface | null; selections: SelectionArea[] }
      ) => {
        dispatch({
          type: ACTION_TYPE.SHEET_SELECTION_CHANGE,
          id,
          activeCell,
          selections,
          undoable: false,
        });
      },
      []
    );

    /**
     * Handle sheet name
     */
    const handleChangeSheetName = useCallback(
      (id: SheetID, name: string) => {
        /**
         * Validate sheet name
         */
        if (name in sheetsByName && sheetsByName[name].id !== id) {
          return toast({
            title: "There was a problem",
            description: `Sheet with the name ${name} exists. Please enter another name`,
            status: "error",
            isClosable: true,
            duration: 90000,
          });
        }
        dispatch({
          type: ACTION_TYPE.CHANGE_SHEET_NAME,
          id,
          name,
        });

        onSheetNameChange?.(id, name);
      },
      [sheetsByName]
    );

    const handleDeleteSheet = useCallback(
      (id: SheetID) => {
        if (sheets.length === 1) return;

        dispatch({
          type: ACTION_TYPE.DELETE_SHEET,
          id,
        });

        onDeleteSheet?.(id);

        /* Focus on the new grid */
        focusGrid();
      },
      [sheets, selectedSheet]
    );

    const handleDuplicateSheet = useCallback(
      (id: SheetID) => {
        const newSheetId = uuid();
        const index = sheets.findIndex((sheet) => sheet.id === id);
        if (index === -1) return;
        const newSheet = {
          ...sheets[index],
          locked: false,
          id: newSheetId,
          name: `Copy of ${currentSheet.name}`,
        };

        dispatch({
          type: ACTION_TYPE.NEW_SHEET,
          sheet: newSheet,
          index,
        });

        onDuplicateSheet?.(newSheet, index);
      },
      [sheets, selectedSheet]
    );

    /**
     * Change formatting to auto
     */
    const handleFormattingChangeAuto = useCallback(() => {
      dispatch({
        type: ACTION_TYPE.FORMATTING_CHANGE_AUTO,
        id: selectedSheet,
      });

      const sheet = getSheetRef.current?.(selectedSheet);
      if (sheet) {
        cellChangeCallback(
          selectedSheet,
          sheet.activeCell,
          sheet.selections,
          true
        );
      }
    }, [selectedSheet]);

    /**
     * Change formatting to plain
     */
    const handleFormattingChangePlain = useCallback(() => {
      dispatch({
        type: ACTION_TYPE.FORMATTING_CHANGE_PLAIN,
        id: selectedSheet,
      });

      const sheet = getSheetRef.current?.(selectedSheet);
      if (sheet) {
        cellChangeCallback(
          selectedSheet,
          sheet.activeCell,
          sheet.selections,
          true
        );
      }
    }, [selectedSheet]);

    /**
     * When cell or selection formatting change
     */
    const handleFormattingChange = useCallback(
      (key, value) => {
        dispatch({
          type: ACTION_TYPE.FORMATTING_CHANGE,
          id: selectedSheet,
          key,
          value,
        });

        onFormattingChange?.(selectedSheet, key, value);

        const sheet = getSheetRef.current?.(selectedSheet);
        if (sheet) {
          cellChangeCallback(
            selectedSheet,
            sheet.activeCell,
            sheet.selections,
            true
          );
        }
      },
      [selectedSheet]
    );

    const handleActiveCellChange = useCallback(
      (id: SheetID, cell: CellInterface | null, value) => {
        if (!cell) return;
        setFormulaInput(value || "");
        onActiveCellChange?.(id, cell, value);
      },
      []
    );

    const handleActiveCellValueChange = useCallback(
      (id: SheetID, activeCell: CellInterface | null, value) => {
        setFormulaInput(value);
        onActiveCellValueChange?.(id, activeCell, value);
      },
      []
    );

    /**
     * Formula bar focus event
     */
    const handleFormulabarFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement | HTMLDivElement>) => {
        if (isFormulaMode) {
          return;
        }
        if (activeCell) {
          currentGrid.current?.makeEditable(activeCell, void 0, false);
          setIsFormulaInputActive(true);
        }
      },
      [activeCell, isFormulaMode]
    );

    const handleCellEditorFocus = useCallback(() => {
      setIsFormulaInputActive(false);
    }, []);

    /**
     * When formula input changes
     */
    const handleFormulabarChange = useCallback(
      (value: string) => {
        if (!activeCell) return;
        const currentlyEditingCell = currentGrid.current?.getEditingCell();
        if (!currentlyEditingCell) {
          return;
        }
        setFormulaInput(value);
        const isFormula = isAFormula(value);
        setFormulaMode?.(!!isFormula);
        currentGrid.current?.setEditorValue(value, currentlyEditingCell);
      },
      [activeCell, selectedSheet]
    );

    /**
     * Imperatively submits the editor
     * @param value
     * @param activeCell
     */
    const submitEditor = (
      value: string,
      activeCell: CellInterface,
      direction: Direction = Direction.Down
    ) => {
      const nextActiveCell = currentGrid.current?.getNextFocusableCell(
        activeCell,
        direction
      );
      currentGrid.current?.submitEditor(value, activeCell, nextActiveCell);
    };

    const handleFormulabarSubmit = useCallback(
      (text, direction?: Direction) => {
        const currentlyEditingCell = currentGrid.current?.getEditingCell();
        const currentlyEditingSheetId = currentGrid.current?.getEditingSheetId();
        if (
          currentlyEditingCell === void 0 ||
          currentlyEditingSheetId === void 0
        ) {
          return;
        }
        submitEditor(text, currentlyEditingCell, direction);
      },
      []
    );

    const handleFormulabarCancel = useCallback(() => {
      const currentlyEditingCell = currentGrid.current?.getEditingCell();
      const currentlyEditingSheetId = currentGrid.current?.getEditingSheetId();
      if (
        currentlyEditingCell === void 0 ||
        currentlyEditingSheetId === void 0
      ) {
        return;
      }
      currentGrid.current?.cancelEditor();
      setFormulaInput(activeCellConfig?.text?.toString() || "");
      /**
       * Switch to editing sheet and cell if
       * user has navigated to a different sheet
       */
      setSelectedSheet(currentlyEditingSheetId);
      /* Focus on the new active cell */
      currentGrid.current?.setActiveCell(currentlyEditingCell);
    }, []);

    /**
     * Handle fill
     */
    const handleFill = useCallback(
      (
        id: SheetID,
        activeCell: CellInterface,
        fillSelection: SelectionArea | null,
        selections: SelectionArea[]
      ) => {
        if (!fillSelection) return;

        dispatch({
          type: ACTION_TYPE.UPDATE_FILL,
          id,
          activeCell,
          fillSelection,
          selections,
        });

        /* Callback */
        onFill?.(id, activeCell, fillSelection, selections);

        /* Focus on the new grid */
        focusGrid();

        /* Trigger Formula */
        cellChangeCallback(id, activeCell, [fillSelection]);
      },
      [sheets]
    );

    /**
     * Trigger after change handler
     * @param id Trigg
     * @param activeCell
     * @param selections
     */
    const cellChangeCallback = useCallback(
      (
        id: SheetID,
        activeCell: CellInterface | null,
        selections?: SelectionArea[] | null,
        skipFormula: boolean = false
      ) => {
        const sheetName = getSheetRef.current?.(id)?.name;
        const shouldRecalc = !disableFormula && !skipFormula;
        if (!sheetName) return;
        /**
         * If formula mode onChangeCells callback is empty, Skip
         */
        if (!onChangeCells && !shouldRecalc) {
          return;
        }
        const sel =
          selections && selections.length
            ? selections
            : [{ bounds: getCellBounds(activeCell) as AreaProps }];

        const changes: CellsBySheet = {
          [sheetName]: {},
        };
        const cellChanges: Cells = {};

        requestAnimationFrame(() => {
          for (let i = 0; i < sel.length; i++) {
            const { bounds } = sel[i];
            for (
              let rowIndex = bounds?.top;
              rowIndex <= bounds?.bottom;
              rowIndex++
            ) {
              for (
                let columnIndex = bounds?.left;
                columnIndex <= bounds?.right;
                columnIndex++
              ) {
                const cellConfig =
                  getCellConfigRef.current?.(id, { rowIndex, columnIndex }) ??
                  {};
                cellChanges[rowIndex] = cellChanges[rowIndex] ?? {};
                cellChanges[rowIndex][columnIndex] = cellConfig;
                // Prevent unnecessary objects
                if (shouldRecalc) {
                  changes[sheetName][rowIndex] =
                    changes[sheetName][rowIndex] ?? {};
                  changes[sheetName][rowIndex][columnIndex] = cellConfig;
                }
              }
            }
          }

          /* Trigger Batch Calculation */
          if (shouldRecalc) {
            triggerBatchCalculation(sheetName, id, activeCell, changes);
          }

          /* OnChange cell */
          onChangeCells?.(id, cellChanges);
        });
      },
      [disableFormula]
    );

    /**
     * Delete cell values
     */
    const handleDelete = useCallback(
      (id: SheetID, activeCell: CellInterface, selections: SelectionArea[]) => {
        dispatch({
          type: ACTION_TYPE.DELETE_CELLS,
          id,
          activeCell,
          selections,
        });

        setFormulaInput("");

        onDeleteCells?.(id, activeCell, selections);

        cellChangeCallback(id, activeCell, selections);
      },
      []
    );

    /**
     * Clear formatting of selected area
     */
    const handleClearFormatting = useCallback(() => {
      dispatch({
        type: ACTION_TYPE.CLEAR_FORMATTING,
        id: selectedSheet,
      });

      onClearFormatting?.(selectedSheet);
    }, [selectedSheet]);

    /**
     * Trigger row or column resize
     */
    const handleResize = useCallback(
      (id: SheetID, axis: AXIS, index: number, dimension: number) => {
        dispatch({
          type: ACTION_TYPE.RESIZE,
          id,
          index,
          dimension,
          axis,
          undoable: false,
        });

        axis === "x"
          ? currentGrid.current?.resizeColumns?.([index])
          : currentGrid.current?.resizeRows?.([index]);

        onResize?.(id, axis, index, dimension);
      },
      []
    );

    /**
     * Handle toggle cell merges
     */
    const handleMergeCells = useCallback(() => {
      dispatch({
        type: ACTION_TYPE.MERGE_CELLS,
        id: selectedSheet,
      });
    }, [selectedSheet]);

    const handleFrozenRowChange = useCallback(
      (count) => {
        dispatch({
          type: ACTION_TYPE.FROZEN_ROW_CHANGE,
          id: selectedSheet,
          count,
        });

        onFrozenRowsChange?.(selectedSheet, count);
      },
      [selectedSheet]
    );

    const handleFrozenColumnChange = useCallback(
      (count) => {
        dispatch({
          type: ACTION_TYPE.FROZEN_COLUMN_CHANGE,
          id: selectedSheet,
          count,
        });

        onFrozenColumnsChange?.(selectedSheet, count);
      },
      [selectedSheet]
    );

    const handleBorderChange = useCallback(
      (
        color: string | undefined,
        borderStyle: BORDER_STYLE,
        variant?: BORDER_VARIANT
      ) => {
        dispatch({
          type: ACTION_TYPE.SET_BORDER,
          id: selectedSheet,
          color,
          borderStyle,
          variant,
        });
      },
      [selectedSheet]
    );

    /**
     * Handle sheet scroll
     */
    const handleScroll = useCallback(
      (id: SheetID, scrollState: ScrollCoords) => {
        dispatch({
          type: ACTION_TYPE.UPDATE_SCROLL,
          id,
          scrollState,
          undoable: false,
        });
      },
      []
    );

    /**.
     * On Paste
     */
    const handlePaste = useCallback((
      id: SheetID,
      rows,
      activeCell: CellInterface | null,
      selections: SelectionArea[],
      /* Selections that needs to be removed: When user does cut + paste */
      cutSelection?: SelectionArea
    ) => {
      if (!activeCell) return;
      const { rowIndex, columnIndex } = activeCell;
      const endRowIndex = Math.max(rowIndex, rowIndex + rows.length - 1);
      const endColumnIndex = Math.max(
        columnIndex,
        columnIndex + (rows.length && rows[0].length - 1)
      );
      const sel = selections.length
        ? selections[selections.length - 1].bounds
        : (getCellBounds(activeCell) as AreaProps);

      const newSelection = [
        {
          bounds: {
            top: sel.top,
            left: sel.left,
            bottom: Math.max(sel.bottom, endRowIndex),
            right: Math.max(sel.right, endColumnIndex),
          },
        },
      ];

      /* Should we update selections in state */
      const isSingleCellSelection =
        rowIndex === endRowIndex && columnIndex === endColumnIndex;

      dispatch({
        type: ACTION_TYPE.PASTE,
        id,
        rows,
        activeCell,
        cutSelection,
        selections: isSingleCellSelection ? void 0 : newSelection,
      });

      if (!isSingleCellSelection) {
        setSelections(newSelection);
      }

      /* Update formula bar input */
      const value = getCellConfigRef.current?.(id, activeCell)?.text;
      handleActiveCellValueChange(id, activeCell, value);

      /* Trigger callback and calculation */
      cellChangeCallback(
        id,
        activeCell,
        newSelection.concat(cutSelection ?? [])
      );
    }, []);

    const handleCopy = useCallback(
      (id: SheetID, selections: SelectionArea[]) => {
        dispatch({
          type: ACTION_TYPE.COPY,
          id,
          undoable: false,
        });
      },
      []
    );

    /**
     * Handle cut event
     */
    const handleCut = useCallback((id: SheetID, selection: SelectionArea) => {
      dispatch({
        type: ACTION_TYPE.REMOVE_CELLS,
        id,
        activeCell: null,
        selections: [selection],
      });
    }, []);

    /**
     * Insert new row
     */
    const handleInsertRow = useCallback(
      (id: SheetID, activeCell: CellInterface | null) => {
        if (activeCell === null) return;
        dispatch({
          type: ACTION_TYPE.INSERT_ROW,
          id,
          activeCell,
        });

        onInsertRow?.(id, activeCell);

        /* Trigger batch calculation */
        requestAnimationFrame(() =>
          triggerBatchInitialization(getCellsBySheet())
        );
      },
      []
    );

    /**
     * Insert new row
     */
    const handleInsertColumn = useCallback(
      (id: SheetID, activeCell: CellInterface | null) => {
        if (activeCell === null) return;
        dispatch({
          type: ACTION_TYPE.INSERT_COLUMN,
          id,
          activeCell,
        });

        onInsertColumn?.(id, activeCell);

        /* Trigger batch calculation */
        requestAnimationFrame(() =>
          triggerBatchInitialization(getCellsBySheet())
        );
      },
      []
    );

    /* Handle delete row */
    const handleDeleteRow = useCallback(
      (id: SheetID, activeCell: CellInterface | null) => {
        if (activeCell === null) return;
        dispatch({
          type: ACTION_TYPE.DELETE_ROW,
          id,
          activeCell,
        });

        onDeleteRow?.(id, activeCell);

        /* Trigger batch calculation */
        requestAnimationFrame(() =>
          triggerBatchInitialization(getCellsBySheet())
        );
      },
      []
    );

    /* Handle delete row */
    const handleDeleteColumn = useCallback(
      (id: SheetID, activeCell: CellInterface | null) => {
        if (activeCell === null) return;
        dispatch({
          type: ACTION_TYPE.DELETE_COLUMN,
          id,
          activeCell,
        });

        onDeleteColumn?.(id, activeCell);

        /* Trigger batch calculation */
        requestAnimationFrame(() =>
          triggerBatchInitialization(getCellsBySheet())
        );
      },
      []
    );

    /* Switch to next sheet */
    const handleMoveToNextSheet = useCallback(() => {
      dispatch({
        type: ACTION_TYPE.SELECT_NEXT_SHEET,
      });
      /* Focus grid */
      focusGrid();
    }, []);

    /* Switch to previos sheet */
    const handleMoveToPrevSheet = useCallback(() => {
      dispatch({
        type: ACTION_TYPE.SELECT_PREV_SHEET,
      });
      /* Focus grid */
      focusGrid();
    }, []);

    const handleEditorKeyDown = useCallback(
      (event: React.KeyboardEvent<any>) => {
        const keyCode = event.which;
        const isAlt = event.altKey;
        switch (keyCode) {
          case KeyCodes.Up:
            if (isAlt) {
              handleMoveToPrevSheet();
              event?.preventDefault();
            }
            break;

          case KeyCodes.Down:
            if (isAlt) {
              handleMoveToNextSheet();
              event?.preventDefault();
            }
            break;
        }
      },
      []
    );

    /**
     * Handle keydown events
     */
    const handleKeyDown = useCallback(
      (
        id: SheetID,
        event: React.KeyboardEvent<HTMLDivElement>,
        activeCell: CellInterface | null
      ) => {
        if (!activeCell) return;
        const isMeta = event.metaKey || event.ctrlKey;
        const isShift = event.shiftKey;
        const keyCode = event.which;
        const isAlt = event.altKey;
        switch (keyCode) {
          case KeyCodes.KEY_B:
            if (!isMeta) return;
            handleFormattingChange(
              FORMATTING_TYPE.BOLD,
              !getCellConfig(id, activeCell)?.bold
            );
            break;

          case KeyCodes.KEY_I:
            if (!isMeta) return;
            handleFormattingChange(
              FORMATTING_TYPE.ITALIC,
              !getCellConfig(id, activeCell)?.italic
            );
            break;

          case KeyCodes.KEY_U:
            if (!isMeta) return;
            handleFormattingChange(
              FORMATTING_TYPE.UNDERLINE,
              !getCellConfig(id, activeCell)?.underline
            );
            break;

          case KeyCodes.KEY_X:
            if (!isMeta || !isShift) return;
            handleFormattingChange(
              FORMATTING_TYPE.STRIKE,
              !getCellConfig(id, activeCell)?.strike
            );
            break;

          case KeyCodes.BACK_SLASH:
            if (!isMeta) return;
            handleClearFormatting();
            event?.preventDefault();
            break;

          case KeyCodes.KEY_L:
          case KeyCodes.KEY_E:
          case KeyCodes.KEY_R:
            if (!isMeta || !isShift) return;
            const align =
              keyCode === KeyCodes.KEY_L
                ? "left"
                : keyCode === KeyCodes.KEY_E
                ? "center"
                : "right";
            handleFormattingChange(FORMATTING_TYPE.HORIZONTAL_ALIGN, align);
            event?.preventDefault();
            break;

          case KeyCodes.Up:
            if (isAlt) {
              handleMoveToPrevSheet();
              event?.preventDefault();
            }
            break;

          case KeyCodes.Down:
            if (isAlt) {
              handleMoveToNextSheet();
              event?.preventDefault();
            }
            break;
        }

        /* Pass it on to undo hook */
        onUndoKeyDown?.(event);
      },
      [getCellConfig]
    );

    /**
     * Update filters views
     */
    const handleChangeFilter = useCallback(
      (
        id: SheetID,
        filterViewIndex: number,
        columnIndex: number,
        filter?: FilterDefinition
      ) => {
        /* Todo, find rowIndex based on filterViewIndex */
        currentGrid.current?.resetAfterIndices?.({ rowIndex: 0 }, false);

        dispatch({
          type: ACTION_TYPE.CHANGE_FILTER,
          id,
          filterViewIndex,
          columnIndex,
          filter,
        });
      },
      []
    );

    /**
     * Callback when scale changes
     */
    const handleScaleChange = useCallback(
      (value) => {
        /* Update grid dimensions */
        currentGrid.current?.resetAfterIndices?.(
          { rowIndex: 0, columnIndex: 0 },
          false
        );
        /* Set scale */
        setScale(value);
      },
      [selectedSheet]
    );

    const handleShowSheet = useCallback((id: SheetID) => {
      dispatch({
        type: ACTION_TYPE.SHOW_SHEET,
        id,
      });

      onShowSheet?.(id);
    }, []);

    const handleHideSheet = useCallback((id: SheetID) => {
      dispatch({
        type: ACTION_TYPE.HIDE_SHEET,
        id,
      });

      onHideSheet?.(id);
    }, []);

    const handleProtectSheet = useCallback((id: SheetID) => {
      dispatch({
        type: ACTION_TYPE.PROTECT_SHEET,
        id,
      });

      onProtectSheet?.(id);
    }, []);

    const handleUnProtectSheet = useCallback((id: SheetID) => {
      dispatch({
        type: ACTION_TYPE.UNPROTECT_SHEET,
        id,
      });

      onUnProtectSheet?.(id);
    }, []);

    const handleChangeTabColor = useCallback((id: SheetID, color?: string) => {
      dispatch({
        type: ACTION_TYPE.CHANGE_TAB_COLOR,
        id,
        color,
      });

      onSheetColorChange?.(id);
    }, []);

    const handleChangeFormulaState = useCallback(
      (props: FormulaChangeProps) => {
        setFormulaState((prev) => {
          return {
            ...prev,
            ...props,
          };
        });
      },
      []
    );

    const handleFormulaBarUpdateSelections = useCallback(
      (name, sel, newSelectionMode) => {
        if (!formulaBarInputRef.current) {
          return;
        }
        formulaBarInputRef.current.updateSelection?.(
          name,
          sel,
          newSelectionMode
        );
      },
      []
    );

    const handleFormulaBarFocus = useCallback(() => {
      formulaBarInputRef.current?.focus();
    }, []);

    return (
      <>
        <Global
          styles={css`
            .rowsncolumns-spreadsheet {
              font-family: ${fontFamily};
            }
            .Toaster {
              font-family: ${fontFamily};
              font-size: 0.875rem;
            }
            .Toaster button {
              background: none;
              border: none;
              color: white;
              cursor: pointer;
            }
            .rowsncolumns-spreadsheet *,
            .rowsncolumns-spreadsheet *:before,
            .rowsncolumns-spreadsheet *:after {
              box-sizing: border-box;
            }
            .rowsncolumns-grid-container:focus {
              outline: none;
            }
            .insert-range-indicator {
              background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjMiIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNjY2MiPjxwYXRoIGQ9Ik0wLjUgMEwwLjUgM00wIDIuNUw4IDIuNU03LjUgM0w3LjUgMCIvPjwvc3ZnPg==)
                bottom no-repeat;
              background-size: contain;
              width: 8px;
              cursor: default;
              display: inline-block;
              line-height: 12px;
            }
          `}
        />

        <Flex
          flexDirection="column"
          flex={1}
          minWidth={0}
          minHeight={minHeight}
          className="rowsncolumns-spreadsheet"
        >
          {showToolbar ? (
            <Toolbar
              wrap={activeCellConfig?.wrap}
              datatype={activeCellConfig?.datatype}
              plaintext={activeCellConfig?.plaintext}
              format={activeCellConfig?.format}
              fontSize={activeCellConfig?.fontSize}
              fontFamily={activeCellConfig?.fontFamily}
              fill={activeCellConfig?.fill}
              bold={activeCellConfig?.bold}
              italic={activeCellConfig?.italic}
              strike={activeCellConfig?.strike}
              underline={activeCellConfig?.underline}
              color={activeCellConfig?.color}
              percent={activeCellConfig?.percent}
              currency={activeCellConfig?.currency}
              verticalAlign={activeCellConfig?.verticalAlign}
              horizontalAlign={activeCellConfig?.horizontalAlign}
              onFormattingChange={handleFormattingChange}
              onFormattingChangeAuto={handleFormattingChangeAuto}
              onFormattingChangePlain={handleFormattingChangePlain}
              onClearFormatting={handleClearFormatting}
              onMergeCells={handleMergeCells}
              frozenRows={currentSheet.frozenRows}
              frozenColumns={currentSheet.frozenColumns}
              onFrozenRowChange={handleFrozenRowChange}
              onFrozenColumnChange={handleFrozenColumnChange}
              onBorderChange={handleBorderChange}
              onRedo={redo}
              onUndo={undo}
              canRedo={canRedo}
              canUndo={canUndo}
              enableDarkMode={enableDarkMode}
              scale={scale}
              onScaleChange={handleScaleChange}
              fontList={fontList}
            />
          ) : null}
          {showFormulabar ? (
            <Formulabar
              ref={formulaBarInputRef}
              value={formulaInput}
              onChange={handleFormulabarChange}
              onSubmit={handleFormulabarSubmit}
              onCancel={handleFormulabarCancel}
              onFocus={handleFormulabarFocus}
              isFormulaMode={isFormulaMode}
              height={formulaBarHeight}
              onChangeHeight={setFormulaBarHeight}
              locked={activeCellConfig?.locked}
              supportedFormulas={supportedFormulas}
              onFormulaChange={handleChangeFormulaState}
            />
          ) : null}
          <Workbook
            {...rest}
            scale={scale}
            StatusBar={StatusBar}
            showTabStrip={showTabStrip}
            isTabEditable={isTabEditable}
            allowNewSheet={allowNewSheet}
            onResize={handleResize}
            formatter={formatter}
            ref={currentGrid}
            onDelete={handleDelete}
            onFill={handleFill}
            onActiveCellValueChange={handleActiveCellValueChange}
            onActiveCellChange={handleActiveCellChange}
            currentSheet={currentSheet}
            selectedSheet={selectedSheet}
            onChangeSelectedSheet={setSelectedSheet}
            onNewSheet={handleNewSheet}
            theme={theme}
            sheets={sheets}
            onChange={handleChange}
            onSheetChange={handleSheetAttributesChange}
            minColumnWidth={minColumnWidth}
            minRowHeight={minRowHeight}
            CellRenderer={CellRenderer}
            HeaderCellRenderer={HeaderCellRenderer}
            onChangeSheetName={handleChangeSheetName}
            onEditorKeyDown={handleEditorKeyDown}
            onDeleteSheet={handleDeleteSheet}
            onDuplicateSheet={handleDuplicateSheet}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCut={handleCut}
            onCopy={handleCopy}
            onInsertRow={handleInsertRow}
            onInsertColumn={handleInsertColumn}
            onDeleteRow={handleDeleteRow}
            onDeleteColumn={handleDeleteColumn}
            CellEditor={CellEditor}
            onSelectionChange={onSelectionChange}
            selectionMode={selectionMode}
            onChangeFilter={handleChangeFilter}
            showStatusBar={showStatusBar}
            selectionPolicy={selectionPolicy}
            ContextMenu={ContextMenu}
            snap={snap}
            Tooltip={Tooltip}
            onHideSheet={handleHideSheet}
            onShowSheet={handleShowSheet}
            onProtectSheet={handleProtectSheet}
            onUnProtectSheet={handleUnProtectSheet}
            onChangeTabColor={handleChangeTabColor}
            rowHeaderWidth={rowHeaderWidth}
            columnHeaderHeight={columnHeaderHeight}
            gridLineColor={gridLineColor}
            gridBackgroundColor={gridBackgroundColor}
            isFormulaMode={isFormulaMode}
            setFormulaMode={setFormulaMode}
            isFormulaInputActive={isFormulaInputActive}
            supportedFormulas={supportedFormulas}
            formulaState={formulaState}
            onChangeFormulaState={handleChangeFormulaState}
            onCellEditorFocus={handleCellEditorFocus}
            onFormulaBarUpdateSelections={handleFormulaBarUpdateSelections}
            focusFormulaBar={handleFormulaBarFocus}
          />
        </Flex>
      </>
    );
  })
);

export interface SpreadSheetPropsWithTheme extends SpreadSheetProps {
  theme?: ThemeType;
  initialColorMode?: "light" | "dark";
}
const ThemeWrapper: React.FC<
  SpreadSheetPropsWithTheme & RefAttributeSheetGrid
> = forwardRef((props, forwardedRef) => {
  const {
    theme: defaultTheme = theme,
    initialColorMode = "light",
    ...rest
  } = props;
  return (
    <ThemeProvider theme={defaultTheme}>
      <ColorModeProvider value={initialColorMode}>
        <Spreadsheet {...rest} ref={forwardedRef} />
      </ColorModeProvider>
    </ThemeProvider>
  );
});

export default ThemeWrapper;
