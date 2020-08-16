import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useMemo,
} from "react";
import {
  autoSizerCanvas,
  Direction,
  EditorProps,
  SelectionArea,
  NewSelectionMode,
} from "@rowsncolumns/grid";
import TextEditor from "./TextEditor";
import { useColorMode } from "@chakra-ui/core";
import {
  DARK_MODE_COLOR_LIGHT,
  DEFAULT_FONT_FAMILY,
  DEFAULT_CELL_PADDING,
  sanitizeSheetName,
  FORMULA_FONT,
  FORMULA_FONT_SIZE,
} from "../constants";
import { EditorType, FONT_WEIGHT } from "../types";
import { ExtraEditorProps } from "../Grid/Grid";
import { SheetID } from "../Spreadsheet";

export interface CustomEditorProps extends EditorProps, ExtraEditorProps {
  background?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  wrap?: any;
  horizontalAlign?: any;
  scale?: number;
  editorType?: EditorType;
  options?: string[];
  underline?: boolean;
  sheetName?: string;
  address?: string | null;
  isFormulaMode?: boolean;
  onKeyDown?: (
    e: React.KeyboardEvent<
      HTMLTextAreaElement | HTMLInputElement | HTMLDivElement
    >
  ) => void;
}

export type RefAttribute = {
  ref?: React.Ref<EditableRef>;
};

export type EditableRef = {
  focus: () => void;
  updateSelection?: (
    sheetName: SheetID | undefined,
    sel: SelectionArea | undefined,
    mode: NewSelectionMode
  ) => void;
};

/**
 * Default cell editor
 * @param props
 */
const Editor: React.FC<CustomEditorProps & RefAttribute> = forwardRef(
  (props, forwardedRef) => {
    const {
      onChange,
      onSubmit,
      onCancel,
      position,
      cell,
      nextFocusableCell,
      value = "",
      activeCell,
      autoFocus = true,
      background,
      color,
      fontSize = 12,
      fontFamily = DEFAULT_FONT_FAMILY,
      bold,
      wrap: cellWrap = "nowrap",
      selections,
      scrollPosition,
      horizontalAlign,
      underline,
      scale = 1,
      editorType = "text",
      options,
      sheetName,
      address,
      selectedSheetName,
      onKeyDown,
      isFormulaMode,
      supportedFormulas,
      onFormulaChange,
    } = props;
    const wrapping: any = cellWrap === "wrap" ? "wrap" : "nowrap";
    const { colorMode } = useColorMode();
    const isLight = colorMode === "light";
    const backgroundColor =
      background !== void 0
        ? background
        : isLight
        ? "white"
        : DARK_MODE_COLOR_LIGHT;
    const textColor =
      color !== void 0 ? color : isLight ? DARK_MODE_COLOR_LIGHT : "white";
    const borderWidth = 2;
    const padding = 10; /* 2x (border) + 2x (left/right spacing) + 2 (buffer) */
    const hasScrollPositionChanged = useRef(false);
    const hasSheetChanged = useRef(false);
    const isMounted = useRef(false);
    const textSizer = useRef(autoSizerCanvas);
    const { x = 0, y = 0, width = 0, height = 0 } = position;
    const getInputDims = useCallback(
      (text) => {
        /*  Set font */
        textSizer.current.setFont({
          fontSize: isFormulaMode ? FORMULA_FONT_SIZE : fontSize,
          fontFamily: isFormulaMode ? FORMULA_FONT : fontFamily,
          fontWeight: bold ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL,
          scale,
        });

        const {
          width: measuredWidth,
          height: measuredHeight,
        } = textSizer.current.measureText(text);

        return [
          Math.max(
            measuredWidth +
              (isFormulaMode
                ? padding + 8 /* Letter spacing for inconsolata */
                : padding),
            width + borderWidth / 2
          ),
          Math.max(
            measuredHeight +
              DEFAULT_CELL_PADDING +
              (isFormulaMode ? 0 : borderWidth),
            height
          ),
        ];
      },
      [
        width,
        height,
        fontSize,
        fontFamily,
        bold,
        wrapping,
        scale,
        isFormulaMode,
      ]
    );

    /* Width of the input  */
    const [inputDims, setInputDims] = useState(() => getInputDims(value));
    const [inputWidth, inputHeight] = inputDims;

    /* Keep updating value of input */
    useEffect(() => {
      setInputDims(getInputDims(value));
    }, [value]);

    /* Tracks scroll position: To show address token */
    useEffect(() => {
      if (!isMounted.current) return;
      hasScrollPositionChanged.current = true;
    }, [scrollPosition]);

    useEffect(() => {
      if (hasSheetChanged.current) return;
      if (selectedSheetName !== sheetName) hasSheetChanged.current = true;
    }, [selectedSheetName]);

    /* Set mounted state */
    useEffect(() => {
      /* Set mounted ref */
      isMounted.current = true;
    }, []);
    const showAddress =
      hasScrollPositionChanged.current || hasSheetChanged.current;
    /* Change */
    const handleChange = useCallback(
      (value) => {
        onChange?.(value, cell);
      },
      [cell]
    );
    /* Submit */
    const handleSubmit = (value: React.ReactText, direction?: Direction) => {
      const nextCell = direction ? nextFocusableCell?.(cell, direction) : cell;
      onSubmit?.(value, cell, nextCell);
    };
    /* Cancel */
    const handleCancel = (e?: React.KeyboardEvent<any>) => {
      onCancel?.(e);
    };
    const dropdownOptions = useMemo(() => {
      if (editorType === "list") return options;
      return [];
    }, [editorType, options]);
    return (
      <div
        style={{
          top: y,
          left: x,
          position: "absolute",
          width: inputWidth,
          height: inputHeight + borderWidth / 2,
          padding: borderWidth,
          boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
          border: "2px #1a73e8 solid",
          background: backgroundColor,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {showAddress ? (
          <div
            style={{
              position: "absolute",
              left: -2,
              marginBottom: 4,
              fontSize: 12,
              lineHeight: "14px",
              padding: 6,
              paddingTop: 4,
              paddingBottom: 4,
              boxShadow: "0px 1px 2px rgba(0,0,0,0.5)",
              bottom: "100%",
              background: "#4589eb",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            {hasSheetChanged.current ? sanitizeSheetName(sheetName) + "!" : ""}
            {address}
          </div>
        ) : null}
        <TextEditor
          ref={forwardedRef}
          value={value}
          fontFamily={fontFamily}
          fontSize={fontSize}
          bold={bold}
          scale={scale}
          color={textColor}
          wrapping={wrapping}
          horizontalAlign={horizontalAlign}
          underline={underline}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onKeyDown={onKeyDown}
          options={dropdownOptions}
          isFormulaMode={isFormulaMode}
          autoFocus={autoFocus}
          supportedFormulas={supportedFormulas}
          onFormulaChange={onFormulaChange}
        />
      </div>
    );
  }
);

export default Editor;
