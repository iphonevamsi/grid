import React, { memo, forwardRef } from "react";
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
  DEFAULT_FONT_COLOR,
} from "./../constants";
import Resizer from "../Resizer";
import TextEditor from "./../Editor/TextEditor";

interface FormulabarProps {
  onChange?: (value: string) => void;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>
  ) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLDivElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLDivElement>) => void;
  value?: string;
  isFormulaMode?: boolean;
  locked?: boolean;
  height?: number;
  onChangeHeight?: (value: number) => void;
  supportedFormulas?: string[];
}

export type FormulaRef = {
  ref?: React.MutableRefObject<HTMLInputElement | null>;
};

const Formulabar: React.FC<FormulabarProps & FormulaRef> = memo(
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
      supportedFormulas,
    } = props;
    const isFormula = isAFormula(value) || isFormulaMode;
    const { colorMode } = useColorMode();
    const theme = useTheme();
    const isLightMode = colorMode === "light";
    const backgroundColor = isLightMode ? "white" : DARK_MODE_COLOR;
    const color = isLightMode ? DARK_MODE_COLOR : "white";
    const borderColor = isLightMode
      ? theme.colors.gray[300]
      : theme.colors.gray[600];
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
          <TextEditor
            isFormulaMode={isFormula}
            value={value}
            fontFamily={isFormula ? FORMULA_FONT : SYSTEM_FONT}
            fontSize={pointToPixel(DEFAULT_FONT_SIZE) as number}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={false}
            onKeyDown={onKeyDown}
            tearDown
            scale={1}
            color={DEFAULT_FONT_COLOR}
            wrapping
            horizontalAlign="left"
            disabled={locked}
            supportedFormulas={supportedFormulas}
            suggestionsWidth="340px"
            suggestionsLeftPadding={`${FORMULABAR_LEFT_CORNER_WIDTH}px`}
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
