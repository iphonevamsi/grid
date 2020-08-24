import React, { memo, forwardRef } from "react";
import {
  InputGroup,
  InputLeftAddon,
  Input,
  useColorMode,
  useTheme,
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
} from "./../constants";

interface FormulabarProps {
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  value?: string;
  isFormulaMode?: boolean;
  locked?: boolean;
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
      isFormulaMode,
      locked,
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
    const height = "24px";
    return (
      <InputGroup
        size="sm"
        borderTopWidth={1}
        borderTopStyle="solid"
        borderTopColor={borderColor}
        height={height}
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
          ref={forwardedRef}
          transition="none"
          _focus={{
            boxShadow: "none",
          }}
          fontFamily={isFormula ? FORMULA_FONT : SYSTEM_FONT}
        />
      </InputGroup>
    );
  })
);

export default Formulabar;
