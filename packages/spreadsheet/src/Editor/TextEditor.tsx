import React, {
  memo,
  forwardRef,
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  createEditor,
  Node,
  Transforms,
  NodeEntry,
  Editor,
  Point,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  ReactEditor,
  RenderLeafProps,
} from "slate-react";
import { withHistory, HistoryEditor } from "slate-history";
import {
  Direction,
  KeyCodes,
  SelectionArea,
  castToString,
  NewSelectionMode,
} from "@rowsncolumns/grid";
import useShiftDown from "../hooks/useShiftDown";
import { useColorMode, useTheme, Box } from "@chakra-ui/core";
import {
  DARK_MODE_COLOR,
  FORMULA_FONT,
  FORMULA_FONT_SIZE,
  isAFormula,
} from "../constants";
import {
  normalizeTokens,
  getSelectionColorAtIndex,
  selectionToAddress,
  getCurrentCursorOffset,
  functionSuggestion,
  getCurrentToken,
  showCellSuggestions,
  isCurrentPositionACell,
  cleanFunctionToken,
  isTokenACell,
} from "./../formulas/helpers";
import { Token } from "fast-formula-parser/grammar/lexing";
import { FormulaChangeProps } from "../Grid/Grid";
import { SheetID } from "../Spreadsheet";
import { FONT_WEIGHT } from "../types";

export interface EditableProps {
  value?: React.ReactText;
  onChange?: (value: string) => void;
  onSubmit?: (value: string, direction?: Direction) => void;
  onCancel?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  fontFamily: string;
  fontSize: number;
  bold?: boolean;
  scale: number;
  color: string;
  wrapping: any;
  horizontalAlign: any;
  underline?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  options?: string[];
  isFormulaMode?: boolean;
  autoFocus?: boolean;
  supportedFormulas?: string[];
  onFormulaChange?: (props: FormulaChangeProps) => void;
}

export type RefAttribute = {
  ref?: React.Ref<EditableRef | null>;
};

export type EditableRef = {
  focus: () => void;
  updateSelection?: (
    sheetName: SheetID | undefined,
    sel: SelectionArea | undefined,
    mode: NewSelectionMode
  ) => void;
  editor: Editor & ReactEditor & HistoryEditor;
};

/**
 * Slate leaf renderer
 * @param param0
 */
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  return (
    <span
      {...attributes}
      className={leaf.cursor ? "insert-range-indicator" : void 0}
      style={{
        color: leaf.color as string,
      }}
    >
      {children}
    </span>
  );
};

const TextEditor: React.FC<EditableProps & RefAttribute> = memo(
  forwardRef((props, forwardedRef) => {
    const {
      value: initialValue,
      onChange,
      onSubmit,
      onCancel,
      fontFamily,
      fontSize,
      bold,
      scale,
      color,
      horizontalAlign,
      underline,
      onKeyDown,
      options,
      isFormulaMode,
      autoFocus,
      supportedFormulas = [],
      onFormulaChange,
    } = props;
    const serialize = useCallback(
      (value?: React.ReactText): Node[] => {
        return (castToString(value) ?? "").split("\n").map((line: string) => {
          const children = [{ text: line }];
          return {
            children,
          };
        });
      },
      [isFormulaMode]
    );
    const deserialize = useCallback((value: Node[]) => {
      return value
        .map((element) => {
          // @ts-ignore
          return element.children.map((leaf) => leaf.text).join("");
        })
        .join("\n");
    }, []);
    const [suggestionToken, setSuggestionToken] = useState<Token>();
    const [cursorToken, setCursorSuggestionToken] = useState<
      Point | undefined
    >();
    const [value, setValue] = useState<Node[]>(() => serialize(initialValue));
    const [target, setTarget] = useState<Token | undefined>();

    const handleUpdateSelection = useCallback(
      (sheetName, sel: SelectionArea | undefined, mode: NewSelectionMode) => {
        const cellAddress = selectionToAddress(sel);
        if (!cellAddress) {
          return;
        }
        const address = `${sheetName ? sheetName + "!" : ""}${cellAddress}`;
        const start = getCurrentCursorOffset(editor);
        if (mode === "modify" && target && start) {
          Transforms.delete(editor, {
            at: start,
            distance: target.image.length,
            reverse: true,
          });
        }
        if (mode === "append" && isTokenACell(target)) {
          Transforms.insertNodes(editor, [{ text: "," }]);
        }
        if (address) {
          Transforms.insertNodes(editor, [{ text: address }]);
          ReactEditor.focus(editor);
        }
      },
      [target, cursorToken]
    );

    /**
     * Expose ref methods
     */
    useImperativeHandle(
      forwardedRef,
      () => {
        return {
          focus: () => {
            requestAnimationFrame(() => {
              ReactEditor.focus(editor);
            });
          },
          editor,
          updateSelection: handleUpdateSelection,
        };
      },
      [target, cursorToken]
    );
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);
    const moveToEnd = useCallback(() => {
      ReactEditor.focus(editor);
      document.execCommand("selectAll", false, undefined);
      // collapse selection to the end
      try {
        document.getSelection()?.collapseToEnd();
      } catch (err) {
        console.log("Failed to collapse selection", err);
      }
    }, []);

    useEffect(() => {
      if (autoFocus) {
        requestAnimationFrame(moveToEnd);
      }
    }, []);

    const {
      highlightedIndex,
      onKeyDown: onShiftDownKeyDown,
      setInputValue,
      menuRef,
      selectedItem,
      items,
      closeMenu,
      onMouseMove,
      onMouseDown,
      onClick,
      isOpen,
      openMenu,
    } = useShiftDown({
      showAllIfEmpty: !isFormulaMode,
      defaultHighlightedIndex: isFormulaMode ? 0 : null,
      initialInputValue: isFormulaMode ? "" : initialValue,
      initialIsOpen: isFormulaMode ? false : (options?.length ?? 0) > 0,
      initialSelectedItem: initialValue,
      options: isFormulaMode ? supportedFormulas : options,
      onChange: (item) => {
        if (isFormulaMode && item !== void 0) {
          const text = suggestionToken?.image;
          const start = getCurrentCursorOffset(editor);
          if (!start) {
            return;
          }
          const startToken = {
            ...start,
            offset: suggestionToken?.startOffset ?? 0,
          };
          if (start) {
            Transforms.delete(editor, {
              at: startToken,
              distance: text?.length,
            });

            Transforms.insertNodes(editor, [{ text: `${item as string}(` }]);
          }
          return;
        }
        onSubmit?.(item as string);
      },
    });

    useEffect(() => {
      items.length > 0 ? openMenu() : closeMenu();
    }, [items]);

    /**
     * Slate decorator
     */
    const decorate = useCallback(
      (entry: NodeEntry<Node>) => {
        if (!isFormulaMode) {
          return [];
        }

        const ranges: any = [];
        const [node, path] = entry;
        const { text } = node;
        let offset = 0;
        const tokens = normalizeTokens(text as string);
        if (cursorToken && tokens.length && cursorToken.path[0] === path[0]) {
          ranges.push({
            anchor: { path, offset: cursorToken.offset },
            focus: { path, offset: cursorToken.offset },
            cursor: true,
          });
        }
        let prevToken: Token;
        tokens.forEach((token) => {
          let add = token.startOffset - (prevToken?.endColumn ?? 0);
          ranges.push({
            anchor: { path, offset: offset + token.image.length + add },
            focus: { path, offset },
            selection: !!token.sel,
            color:
              token?.index !== void 0
                ? getSelectionColorAtIndex(token.index)
                : token.tokenType.name === "String"
                ? "green"
                : token.tokenType.name === "Number"
                ? "#15c"
                : void 0,
          });

          prevToken = token;

          offset = offset + token.image.length + add;
        });

        return ranges;
      },
      [isFormulaMode, cursorToken]
    );

    useEffect(() => {
      const normalizedValue = deserialize(value);
      if (!isFormulaMode) {
        setInputValue(normalizedValue);
      }
      /* If its the same value skip */
      if (normalizedValue === initialValue) {
        return;
      }

      onChange?.(normalizedValue);
    }, [value]);

    useEffect(() => {
      /* Update editor text if initialValue changes, when user enters text in formula bar */
      if (deserialize(value) !== initialValue) {
        setValue(serialize(initialValue));
      }
    }, [initialValue]);

    const theme = useTheme();
    const { colorMode } = useColorMode();
    const isLight = colorMode === "light";
    const borderColor = isLight
      ? theme.colors.gray[300]
      : theme.colors.gray[600];
    const inputColor = isLight ? DARK_MODE_COLOR : theme.colors.white;
    const dropdownBgColor = isLight
      ? theme.colors.white
      : theme.colors.gray[700];

    /**
     * Editor onChange
     */
    const handleChange = useCallback((value) => {
      setValue(value);
      const isFormula = isAFormula(deserialize(value));
      if (isFormula) {
        const start = getCurrentCursorOffset(editor);
        if (!start) {
          return;
        }
        const from = Editor.before(editor, start, { unit: "line" });
        const end = Editor.after(editor, start, { unit: "line" }) || start;
        if (!from) {
          return;
        }
        const range = Editor.range(editor, from, end);
        const line = Editor.string(editor, range);
        const tokens = normalizeTokens(line);
        const fnToken = functionSuggestion(tokens, editor);
        const curToken = getCurrentToken(tokens, editor);
        const showFnSuggestions = !!fnToken;
        const showCellSuggestion = showCellSuggestions(editor, tokens);
        const isCell = isCurrentPositionACell(editor, tokens);
        const isTokenAtEdgeofCell = curToken?.endColumn === start.offset;

        if (showFnSuggestions) {
          setSuggestionToken(fnToken);
          setInputValue(cleanFunctionToken(fnToken?.image ?? ""));
        } else {
          setSuggestionToken(void 0);
          setInputValue("");
        }

        setTarget(curToken);

        onFormulaChange?.({
          showCellSuggestion:
            !!showCellSuggestion || (!!isCell && isTokenAtEdgeofCell),
          newSelectionMode: showCellSuggestion ? "append" : "modify",
        });

        setCursorSuggestionToken(
          showCellSuggestion ? getCurrentCursorOffset(editor) : void 0
        );
      }
    }, []);

    /**
     * Editor keydown
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const isShiftKey = e.nativeEvent.shiftKey;
        const isMetaKey = e.nativeEvent.metaKey || e.nativeEvent.ctrlKey;
        const isFromSelection = highlightedIndex !== null && items.length > 0;
        const text = isFromSelection
          ? (items[highlightedIndex as number] as string)
          : deserialize(value);

        // Enter key
        if (e.which === KeyCodes.Enter) {
          if (isFormulaMode && isFromSelection) {
            setInputValue("");
            e.preventDefault();
          } else {
            /* Add a new line when Cmd/Ctrl key is pressed */
            if (isMetaKey) {
              editor.insertBreak();
              return;
            }
            onSubmit?.(text, isShiftKey ? Direction.Up : Direction.Down);

            e.preventDefault();

            return;
          }
        }

        if (e.which === KeyCodes.Escape) {
          onCancel && onCancel(e);
        }

        if (e.which === KeyCodes.Tab) {
          /* Trap focus inside the grid */
          e.preventDefault();

          if (isFormulaMode && isFromSelection) {
            setInputValue("");
          } else {
            onSubmit &&
              onSubmit(text, isShiftKey ? Direction.Left : Direction.Right);
            return;
          }
        }
        /* Global handler */
        onKeyDown?.(e);

        /* Pass callback to shiftdown hook */
        onShiftDownKeyDown(e);
      },
      [
        value,
        onKeyDown,
        onSubmit,
        onShiftDownKeyDown,
        items,
        isFormulaMode,
        highlightedIndex,
        isOpen,
      ]
    );

    return (
      <>
        <div
          style={{
            fontFamily: isFormulaMode ? FORMULA_FONT : fontFamily,
            fontSize: (isFormulaMode ? FORMULA_FONT_SIZE : fontSize) * scale,
            fontWeight:
              bold && !isFormulaMode ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL,
            width: "100%",
            height: "100%",
            padding: "0 1px",
            margin: 0,
            boxSizing: "border-box",
            borderWidth: 0,
            outline: "none",
            resize: "none",
            overflow: "hidden",
            verticalAlign: "top",
            background: "transparent",
            color: color,
            whiteSpace: "pre-wrap",
            textAlign: isFormulaMode ? "left" : horizontalAlign,
            lineHeight: "normal",
            textDecoration: underline ? "underline" : "none",
            cursor: "text",
            flex: 1,
          }}
        >
          <Slate editor={editor} value={value} onChange={handleChange}>
            <Editable
              decorate={decorate}
              renderLeaf={(props) => <Leaf {...props} />}
              onKeyDown={handleKeyDown}
            />
          </Slate>
        </div>
        {isOpen && items.length ? (
          <Box
            ref={menuRef}
            width="auto"
            left="-2px"
            shadow="md"
            background={dropdownBgColor}
            pb={1}
            pt={1}
            position="absolute"
            top="100%"
            mt="2px"
            borderColor={borderColor}
            borderStyle="solid"
            borderWidth={1}
            minWidth="calc(100% + 4px)"
            maxHeight={400}
            overflow="auto"
            zIndex={1}
          >
            {(items as string[]).map((item, index: number) => {
              return (
                <Box
                  padding={1}
                  pl={isFormulaMode ? "10px" : 1}
                  pr={1}
                  whiteSpace="nowrap"
                  color={inputColor}
                  cursor="pointer"
                  fontFamily={isFormulaMode ? FORMULA_FONT : fontFamily}
                  fontSize={`${
                    (isFormulaMode ? FORMULA_FONT_SIZE : 12) * scale
                  }px`}
                  onMouseMove={() => onMouseMove?.(index)}
                  onMouseDown={onMouseDown}
                  onClick={() => onClick?.(item)}
                  key={item}
                  style={{
                    fontWeight: selectedItem === item ? "bold" : "normal",
                    backgroundColor:
                      highlightedIndex === index
                        ? isLight
                          ? theme.colors.gray[100]
                          : "rgba(255,255,255,0.06)"
                        : dropdownBgColor,
                  }}
                >
                  {item}
                </Box>
              );
            })}
          </Box>
        ) : null}
      </>
    );
  })
);

export default TextEditor;
