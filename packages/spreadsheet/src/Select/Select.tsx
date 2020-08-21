import React, { memo } from "react";
import { IconButton, Tooltip } from "./../styled";
import { Box, useTheme, useColorMode } from "@chakra-ui/core";
import { DARK_MODE_COLOR, DARK_MODE_COLOR_LIGHT } from "../constants";
import { KeyCodes } from "@rowsncolumns/grid/dist/types";
import useShiftDown, { Item } from "./../hooks/useShiftDown";

export interface SelectProps {
  showInput?: boolean;
  options: Option[];
  value?: Option;
  onChange?: (value: Option | null) => void;
  format?: (value: string) => any;
  inputWidth?: number;
  enableInput?: boolean;
  /* For SSR */
  id?: string;
}
export interface Option {
  value: string | number;
  label: string | number;
}

const Select: React.FC<SelectProps> = memo((props) => {
  const {
    options,
    value,
    onChange,
    format,
    inputWidth = 44,
    enableInput = true,
    id,
  } = props;
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const isLight = colorMode === "light";
  const borderColor = isLight ? theme.colors.gray[300] : theme.colors.gray[600];
  const inputBorderColor = isLight
    ? theme.colors.gray[300]
    : theme.colors.gray[600];
  const inputBgColor = isLight ? theme.colors.white : DARK_MODE_COLOR;
  const inputColor = isLight ? DARK_MODE_COLOR : theme.colors.white;
  const dropdownBgColor = isLight ? theme.colors.white : theme.colors.gray[700];
  const {
    menuRef,
    inputRef,
    inputValue,
    items,
    setInputValue,
    onKeyDown: onShiftDownKeyDown,
    setSelectedItem,
    isOpen,
    onFocus,
    onBlur,
    closeMenu,
    toggleMenu,
    highlightedIndex,
    selectedItem,
    onMouseDown,
    onMouseMove,
    onClick,
  } = useShiftDown({
    limit: 100,
    options,
    filter: () => true,
    selectedItem: value,
    onChange: (sel) => onChange?.(sel as Item),
    itemToString: (item) => (item as Item)?.value.toString() || "",
  });
  return (
    <Box position="relative" ref={menuRef}>
      <Box display="flex" alignItems="center">
        {enableInput ? (
          <input
            value={inputValue}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            style={{
              width: inputWidth,
              height: 24,
              paddingLeft: 4,
              paddingRight: 2,
              borderColor: inputBorderColor,
              background: inputBgColor,
              color: inputColor,
              borderStyle: "solid",
              borderWidth: 1,
              fontSize: 12,
            }}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (onShiftDownKeyDown) {
                onShiftDownKeyDown(e);
              }
              if (e.which === KeyCodes.Enter && highlightedIndex === null) {
                const value = format?.(e.currentTarget.value);
                setSelectedItem?.({ value, label: value });
                closeMenu();
              }
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-label="select-input"
          />
        ) : (
          <Tooltip
            hasArrow
            aria-label={inputValue || ""}
            label={inputValue || ""}
            placement="bottom-start"
          >
            <Box
              cursor="pointer"
              pl={2}
              pr={2}
              title={inputValue}
              whiteSpace="nowrap"
              overflow="hidden"
              // @ts-ignore
              textOverflow="ellipsis"
              fontSize={12}
              width={inputWidth}
            >
              {inputValue}
            </Box>
          </Tooltip>
        )}
        <IconButton
          color={inputColor}
          height={5}
          minWidth={5}
          aria-label="Open"
          icon="chevron-down"
          size="sm"
          fontSize={16}
          onClick={toggleMenu}
        />
      </Box>
      <Box
        background={dropdownBgColor}
        shadow="md"
        position="absolute"
        top="100%"
        zIndex={1}
        borderRadius={5}
        pb={1}
        pt={1}
        borderColor={borderColor}
        borderStyle="solid"
        borderWidth={1}
        display={isOpen ? "block" : "none"}
        aria-label="list"
      >
        {isOpen &&
          (items as Item[]).map((item, index) => {
            const { label, value } = item;
            return (
              <Box
                fontSize={12}
                padding={2}
                pl={3}
                pr={3}
                key={index}
                whiteSpace="nowrap"
                onMouseMove={() => onMouseMove?.(index)}
                onMouseDown={onMouseDown}
                onClick={() => {
                  onClick(item);
                  closeMenu();
                }}
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    highlightedIndex === index ||
                    (selectedItem as Item)?.value === item.value
                      ? isLight
                        ? theme.colors.gray[100]
                        : "rgba(255,255,255,0.06)"
                      : dropdownBgColor,
                  fontWeight:
                    (selectedItem as Item)?.value === item.value
                      ? "bold"
                      : "normal",
                }}
              >
                {label}
              </Box>
            );
          })}
      </Box>
    </Box>
  );
});

export default Select;
