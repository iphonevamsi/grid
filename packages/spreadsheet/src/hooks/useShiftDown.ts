import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { KeyCodes, castToString } from "@rowsncolumns/grid";
import { escapeRegExp } from "../constants";

export interface ShiftDownProps {
  initialInputValue?: React.ReactText;
  initialIsOpen?: boolean;
  initialSelectedItem?: Item | React.ReactText;
  selectedItem?: Item | string;
  options?: Item[] | string[];
  filterOnInitialOpen?: boolean;
  itemToString?: (item: Item | string) => string;
  onChange?: (item: Item | React.ReactText | undefined) => void;
  filter?: (item: Item | string) => boolean;
  defaultHighlightedIndex?: number | null;
  showAllIfEmpty?: boolean;
  limit?: number;
}

export interface ShiftDownResults {
  highlightedIndex: number | null;
  onKeyDown: (e: React.KeyboardEvent<any>) => void;
  inputValue: string;
  setInputValue: (text: string) => void;
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  menuRef: React.Ref<HTMLElement>;
  inputRef: React.Ref<HTMLElement | HTMLInputElement>;
  selectedItem: Item | React.ReactText | undefined;
  setSelectedItem: (item: Item | string) => void;
  items: Item[] | string[];
  onMouseMove: (index: number) => void;
  onMouseDown: (e: React.MouseEvent<any>) => void;
  onClick: (item: Item | string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export interface Item {
  label: React.ReactText;
  value: any;
}

const defaultItemToString = (text: Item | string) => text as string;

/**
 * Simple DownShift replacement. With types.
 * Using this due to lack of good typing in Downshift
 * @param props
 */
const useShiftDown = (props: ShiftDownProps): ShiftDownResults => {
  const {
    initialInputValue = "",
    initialIsOpen = false,
    initialSelectedItem,
    showAllIfEmpty = true,
    options = [],
    filterOnInitialOpen = false,
    itemToString = defaultItemToString,
    onChange,
    filter,
    defaultHighlightedIndex = null,
    selectedItem: controlledSelecteditem,
    limit = 10,
  } = props;
  const { current: isControlled } = useRef(controlledSelecteditem !== void 0);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(
    defaultHighlightedIndex
  );
  const [isOpen, setIsOpen] = useState<boolean>(initialIsOpen);
  const [inputValue, setInputValue] = useState<string>(
    castToString(initialInputValue) ?? ""
  );
  const [selectedItem, setSelectedItem] = useState<
    Item | React.ReactText | undefined
  >(initialSelectedItem);
  const menuRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLElement | HTMLInputElement>(null);
  const isDirty = useRef<boolean>(false);

  const handleSetSelectedItem = (item: Item | string | undefined) => {
    onChange?.(item);
    setSelectedItem(item);
    handleSetInputValue(itemToString(item ?? ""));
  };

  useEffect(() => {
    if (!isControlled) return;
    if (controlledSelecteditem === selectedItem) {
      return;
    }
    handleSetInputValue(itemToString(controlledSelecteditem ?? ""));
  }, [isControlled, controlledSelecteditem, selectedItem]);

  const filteredItems: Item[] | string[] = useMemo(() => {
    if (!inputValue && !showAllIfEmpty) {
      return [];
    }
    return (options as any[])
      .filter((item) => {
        if (!inputValue || (!isDirty.current && !filterOnInitialOpen))
          return true;
        if (filter) return filter(item);
        const key = typeof item === "object" ? item.value || item.label : item;
        return new RegExp("^" + escapeRegExp(inputValue), "gi").test(key);
      })
      .slice(0, limit);
  }, [inputValue, options, filter, showAllIfEmpty]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<any>) => {
      const keyCode = e.nativeEvent.which;
      if (keyCode === KeyCodes.Up || keyCode === KeyCodes.Down) {
        if (!isOpen) {
          return openMenu();
        }
      }
      if (keyCode === KeyCodes.Up) {
        setHighlightedIndex((prev) => {
          const next = prev === null ? filteredItems.length - 1 : prev - 1;
          if (next < 0) return filteredItems.length - 1;
          return next;
        });
        e?.preventDefault?.();
      } else if (keyCode === KeyCodes.Down) {
        setHighlightedIndex((prev) => {
          const next = prev === null ? 0 : prev + 1;
          if (next > filteredItems.length - 1) return 0;
          return next;
        });
        e?.preventDefault?.();
      }
      if (keyCode === KeyCodes.Escape) {
        closeMenu();
      }
      if (keyCode === KeyCodes.Enter || keyCode === KeyCodes.Tab) {
        if (highlightedIndex !== null) {
          handleSetSelectedItem(filteredItems[highlightedIndex]);
        }
      }
    },
    [filteredItems, highlightedIndex, isOpen]
  );

  useEffect(() => {
    const listener = (event: globalThis.MouseEvent) => {
      if (
        !menuRef ||
        !menuRef.current ||
        menuRef.current.contains(event.target as Node)
      ) {
        return;
      }
      closeMenu();
    };
    document.addEventListener("mouseup", listener);
    return () => {
      document.removeEventListener("mouseup", listener);
    };
  }, [menuRef]);

  const handleMouseMove = useCallback(
    (index) => {
      if (index === highlightedIndex) {
        return;
      }
      setHighlightedIndex(index);
    },
    [highlightedIndex]
  );

  const handleMouseDown = useCallback((event: React.MouseEvent<any>) => {
    event.preventDefault();
  }, []);

  const handleSetInputValue = useCallback(
    (value: string) => {
      setInputValue(value);
      setHighlightedIndex(defaultHighlightedIndex);
      isDirty.current = true;
    },
    [defaultHighlightedIndex]
  );

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleFocus = useCallback(() => {
    openMenu();
  }, []);

  const handleBlur = useCallback(() => {
    closeMenu();
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    // isDirty.current && openMenu()
  }, [inputValue]);

  return {
    highlightedIndex,
    onKeyDown: handleKeyDown,
    inputValue,
    setInputValue: handleSetInputValue,
    isOpen,
    openMenu,
    closeMenu,
    toggleMenu,
    menuRef,
    inputRef,
    selectedItem,
    setSelectedItem: handleSetSelectedItem,
    items: filteredItems,
    onMouseMove: handleMouseMove,
    onMouseDown: handleMouseDown,
    onClick: handleSetSelectedItem,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};

export default useShiftDown;
