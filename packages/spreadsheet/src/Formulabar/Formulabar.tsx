import React, { memo, forwardRef, useImperativeHandle, useRef } from "react";
import {
  InputGroup,
  InputLeftAddon,
  Input,
  useColorMode,
  useTheme,
  Box,
} from "@chakra-ui/core";
import {
  DARK_MODE_COLOR,
  FORMULABAR_LEFT_CORNER_WIDTH,
  FORMULA_FONT,
  SYSTEM_FONT,
  isAFormula,
  FORMULA_FONT_SIZE,
  DEFAULT_FONT_SIZE,
  pointToPixel,
  DEFAULT_FORMULABAR_HEIGHT,
  DEFAULT_FONT_COLOR
} from "./../constants";
import Resizer from "../Resizer";
import TextEditor from './../Editor/TextEditor'

interface FormulabarProps {
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLDivElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLDivElement>) => void;
  value?: string;
  isFormulaMode?: boolean;
  locked?: boolean;
  height?: number;
  onChangeHeight?: (value: number) => void;
  supportedFormulas?: string[];
}

export type RefAttribute = {
  ref?: React.Ref<FormulaRef | null>;
};

export type FormulaRef = {
  focus: () => void;
};

const Formulabar: React.FC<FormulabarProps & RefAttribute> = memo(
  forwardRef((props, forwardedRef) => {
    const {
      value = "",
      onChange,
      onKeyDown,
      onFocus,
      onBlur,
      isFormulaMode = false,
      locked,
      height = DEFAULT_FORMULABAR_HEIGHT,
      onChangeHeight,
      supportedFormulas
    } = props;
    const inputRef = useRef<HTMLInputElement>(null);
    const isFormula = isAFormula(value) || isFormulaMode;
    const { colorMode } = useColorMode();
    const theme = useTheme();
    const isLightMode = colorMode === "light";
    const backgroundColor = isLightMode ? "white" : DARK_MODE_COLOR;
    const color = isLightMode ? DARK_MODE_COLOR : "white";
    const borderColor = isLightMode
      ? theme.colors.gray[300]
      : theme.colors.gray[600];

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => {
          inputRef.current?.focus();
        },
      }),
      []
    );
    return (
      <Box position="relative">
        <InputGroup
          size="sm"
          borderTopWidth={1}
          borderTopStyle="solid"
          borderTopColor={borderColor}
          height={`${height}px`}
        >
          <InputLeftAddon
            width={FORMULABAR_LEFT_CORNER_WIDTH}
            justifyContent="center"
            bg={backgroundColor}
            color={color}
            fontSize={12}
            fontStyle="italic"
            borderTopWidth={0}
            borderBottomWidth={0}
            size="sm"
            borderRadius={0}
            children="fx"
            height="auto"
            userSelect="none"
            borderLeftColor={borderColor}
          />
          <Input
            isDisabled={locked}
            borderTopWidth={0}
            borderBottomWidth={0}
            size="sm"
            borderRadius={0}
            pl={2}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            color={color}
            focusBorderColor={borderColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange?.(e.target.value)
            }
            aria-label="value-input"
            onBlur={onBlur}
            value={value}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            height={"100%"}
            lineHeight={1}
            fontSize={
              isFormula ? FORMULA_FONT_SIZE : pointToPixel(DEFAULT_FONT_SIZE)
            }
            ref={inputRef}
            transition="none"
            _focus={{
              boxShadow: "none",
            }}
            fontFamily={isFormula ? FORMULA_FONT : SYSTEM_FONT}
          />
        </InputGroup>

        <Resizer
          minTop={DEFAULT_FORMULABAR_HEIGHT}
          top={DEFAULT_FORMULABAR_HEIGHT}
          onDrag={onChangeHeight}
        />
      </Box>
    );
  })
);

export default Formulabar;
