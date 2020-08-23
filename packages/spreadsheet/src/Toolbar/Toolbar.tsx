import React, { useState, memo } from "react";
import {
  MdUndo,
  MdRedo,
  MdAttachMoney,
  MdFormatBold,
  MdFormatItalic,
  MdStrikethroughS,
  MdBorderAll,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdVerticalAlignBottom,
  MdWbSunny,
  MdFormatUnderlined,
  MdTextFields,
  MdFormatClear,
  MdVerticalAlignCenter,
  MdVerticalAlignTop,
  MdBorderInner,
  MdBorderHorizontal,
  MdBorderBottom,
  MdBorderVertical,
  MdBorderOuter,
  MdBorderLeft,
  MdBorderRight,
  MdBorderTop,
  MdBorderClear,
  MdEdit,
  MdFormatColorReset,
  MdLineStyle,
} from "react-icons/md";
import { BsColumns } from "react-icons/bs";
import { IoMdColorFill, IoMdMoon } from "react-icons/io";
import {
  Flex,
  useColorMode,
  useTheme,
  Popover,
  PopoverTrigger,
  PopoverBody,
  PopoverArrow,
  Box,
  Select,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  Icon,
  MenuDivider,
} from "@chakra-ui/core";
import {
  StyledToolbar,
  IconButton,
  Button,
  Tooltip,
  Rect,
  Separator,
  PercentIcon,
  PopoverContent,
  MenuItem,
  DecreaseDecimalIcon,
  IncreaseDecimalIcon,
  WrapClipIcon,
  WrapIcon,
  MergeCellsIcon,
} from "./../styled";
import {
  DARK_MODE_COLOR,
  FONT_SIZES,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  AVAILABLE_FORMATS,
  AVAILABLE_CURRENCY_FORMATS,
  FORMAT_PERCENT,
  FORMAT_CURRENCY,
  changeDecimals,
  SCALE_VALUES,
} from "./../constants";
import {
  FORMATTING_TYPE,
  CellFormatting,
  BORDER_VARIANT,
  BORDER_STYLE,
} from "./../types";
import { translations } from "../translations";
import { CellConfig } from "../Spreadsheet";
import { CirclePicker, ColorResult } from "react-color";
import { Global, css } from "@emotion/core";
import SelectDropdown from "./../Select";

export interface ToolbarProps extends CellConfig {
  onFormattingChange?: (
    type: keyof CellFormatting,
    value: any,
    options?: Record<string, any>
  ) => void;
  onFormattingChangeAuto?: () => void;
  onFormattingChangePlain?: () => void;
  onClearFormatting?: () => void;
  onMergeCells?: () => void;
  onFrozenColumnChange?: (num: number) => void;
  onFrozenRowChange?: (num: number) => void;
  frozenRows?: number;
  frozenColumns?: number;
  onBorderChange?: (
    color: string | undefined,
    borderStyle: BORDER_STYLE,
    variant?: BORDER_VARIANT
  ) => void;
  canRedo?: boolean;
  canUndo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  enableDarkMode?: boolean;
  scale?: number;
  onScaleChange?: (value: number) => void;
  fontList?: string[];
}
interface ColorPickerProps {
  resetLabel?: string;
  color?: string;
  onChange: (value: string | undefined) => void;
}
const BUTTON_HEIGHT = "28px";
export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  resetLabel = "Reset",
}) => {
  return (
    <Box pb={2}>
      <Global
        styles={css`
          .circle-picker div[title="#efefef"],
          .circle-picker div[title="#f3f3f3"],
          .circle-picker div[title="#ffffff"] {
            border: 1px solid #dadce0;
            border-radius: 50%;
          }
        `}
      />
      <Button
        variant="ghost"
        isFullWidth
        justifyContent="left"
        size="sm"
        mb={2}
        onClick={() => onChange(undefined)}
        background="none"
      >
        <Box mr={2}>
          <MdFormatColorReset />
        </Box>
        {resetLabel}
      </Button>
      <CirclePicker
        color={color}
        onChangeComplete={(e: ColorResult) => onChange(e.hex)}
        circleSpacing={5}
        circleSize={20}
        width="260px"
        colors={[
          "#000000",
          "#434343",
          "#666666",
          "#999999",
          "#b7b7b7",
          "#cccccc",
          "#d9d9d9",
          "#efefef",
          "#f3f3f3",
          "#ffffff",
          "#980000",
          "#ff0000",
          "#ff9900",
          "#ffff00",
          "#00ff00",
          "#00ffff",
          "#4a86e8",
          "#0000ff",
          "#9900ff",
          "#ff00ff",
          "#e6b8af",
          "#f4cccc",
          "#fce5cd",
          "#fff2cc",
          "#d9ead3",
          "#d0e0e3",
          "#c9daf8",
          "#cfe2f3",
          "#d9d2e9",
          "#ead1dc",
          "#dd7e6b",
          "#ea9999",
          "#f9cb9c",
          "#ffe599",
          "#b6d7a8",
          "#a2c4c9",
          "#a4c2f4",
          "#9fc5e8",
          "#b4a7d6",
          "#d5a6bd",
          "#cc4125",
          "#e06666",
          "#f6b26b",
          "#ffd966",
          "#93c47d",
          "#76a5af",
          "#6d9eeb",
          "#6fa8dc",
          "#8e7cc3",
          "#c27ba0",
          "#a61c00",
          "#cc0000",
          "#e69138",
          "#f1c232",
          "#6aa84f",
          "#45818e",
          "#3c78d8",
          "#3d85c6",
          "#674ea7",
          "#a64d79",
          "#85200c",
          "#990000",
          "#b45f06",
          "#bf9000",
          "#38761d",
          "#134f5c",
          "#1155cc",
          "#0b5394",
          "#351c75",
          "#741b47",
          "#5b0f00",
          "#660000",
          "#783f04",
          "#7f6000",
          "#274e13",
          "#0c343d",
          "#1c4587",
          "#073763",
          "#20124d",
          "#4c1130",
        ]}
      />
    </Box>
  );
};

const Toolbar: React.FC<ToolbarProps> = memo((props) => {
  const {
    bold,
    italic,
    fill,
    underline,
    strike,
    color,
    verticalAlign = "bottom",
    horizontalAlign,
    onFormattingChange,
    onClearFormatting,
    onMergeCells,
    onFrozenColumnChange,
    onFrozenRowChange,
    frozenRows = 0,
    frozenColumns = 0,
    onBorderChange,
    canUndo,
    canRedo,
    onRedo,
    onUndo,
    enableDarkMode,
    fontSize = DEFAULT_FONT_SIZE,
    fontFamily = DEFAULT_FONT_FAMILY,
    format,
    onFormattingChangeAuto,
    onFormattingChangePlain,
    plaintext,
    scale = 1,
    onScaleChange,
    fontList = [],
    wrap = "clip",
  } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const isLight = colorMode === "light";
  const activeIconColor = theme.colors.teal[500];
  const iconColor = isLight ? theme.colors.gray[600] : theme.colors.gray[50];
  const borderColor = isLight ? theme.colors.gray[300] : theme.colors.gray[600];
  const backgroundColor = isLight ? "white" : DARK_MODE_COLOR;
  const foregroundColor = isLight ? DARK_MODE_COLOR : "white";
  return (
    <StyledToolbar
      pr={2}
      pl={2}
      pt={1}
      pb={1}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      color={foregroundColor}
    >
      <Flex flex={1} alignItems="center" flexWrap="wrap" minWidth={1}>
        <Tooltip
          hasArrow
          aria-label={translations.undo}
          label={translations.undo}
          placement="bottom-start"
        >
          <IconButton
            aria-label={translations.undo}
            variant="ghost"
            color={iconColor}
            icon={MdUndo}
            size="sm"
            height={BUTTON_HEIGHT}
            isDisabled={!canUndo}
            onClick={onUndo}
          />
        </Tooltip>

        <Tooltip
          hasArrow
          aria-label={translations.redo}
          label={translations.redo}
          placement="bottom-start"
        >
          <IconButton
            aria-label={translations.redo}
            variant="ghost"
            color={iconColor}
            icon={MdRedo}
            size="sm"
            height={BUTTON_HEIGHT}
            isDisabled={!canRedo}
            onClick={onRedo}
          />
        </Tooltip>

        {/* <Tooltip
          hasArrow
          aria-label={translations.print}
          label={translations.print}
        >
          <IconButton
            aria-label={translations.print}
            variant="ghost"
            color={iconColor}
            icon={MdPrint}
            size="sm"
          />
        </Tooltip> */}

        <Tooltip
          hasArrow
          aria-label={translations.clear_formatting}
          label={translations.clear_formatting}
        >
          <IconButton
            aria-label={translations.clear_formatting}
            variant="ghost"
            color={iconColor}
            icon={MdFormatClear}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() => onClearFormatting?.()}
          />
        </Tooltip>

        <Separator borderColor={borderColor} />
        <Menu>
          <Tooltip
            hasArrow
            aria-label={translations.zoom}
            label={translations.zoom}
          >
            <MenuButton
              color={foregroundColor}
              as={Button}
              size="sm"
              flexShrink={0}
              paddingLeft={1}
              paddingRight={1}
              background="none"
              fontSize={12}
              height={BUTTON_HEIGHT}
            >
              {`${scale * 100}%`}
              <Icon name="chevron-down" ml={1} fontSize={16} />
            </MenuButton>
          </Tooltip>
          <MenuList
            placement="top-start"
            minWidth={100}
            borderColor={borderColor}
            borderStyle="solid"
            fontSize={14}
          >
            {SCALE_VALUES.map(({ label, value }) => {
              return (
                <MenuItem
                  key={value}
                  onClick={() => {
                    onScaleChange?.(value);
                  }}
                >
                  <Box width="24px">
                    {value === scale && <Icon name="check" mr={1} />}
                  </Box>
                  {label}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
        <Separator borderColor={borderColor} />

        <Tooltip
          hasArrow
          aria-label={translations.format_as_currency}
          label={translations.format_as_currency}
        >
          <IconButton
            aria-label={translations.format_as_currency}
            variant={format === FORMAT_CURRENCY ? "solid" : "ghost"}
            color={format === FORMAT_CURRENCY ? activeIconColor : iconColor}
            icon={MdAttachMoney}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(
                FORMATTING_TYPE.CUSTOM_FORMAT,
                FORMAT_CURRENCY
              )
            }
          />
        </Tooltip>

        <Tooltip
          hasArrow
          aria-label={translations.format_as_percent}
          label={translations.format_as_percent}
        >
          <IconButton
            aria-label={translations.format_as_percent}
            variant={format === FORMAT_PERCENT ? "solid" : "ghost"}
            color={format === FORMAT_PERCENT ? activeIconColor : iconColor}
            fontSize={10}
            icon={PercentIcon}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(
                FORMATTING_TYPE.CUSTOM_FORMAT,
                FORMAT_PERCENT
              )
            }
          />
        </Tooltip>

        <Tooltip
          hasArrow
          aria-label={translations.decrease_decimal}
          label={translations.decrease_decimal}
        >
          <IconButton
            aria-label={translations.decrease_decimal}
            fontSize={20}
            color={iconColor}
            icon={DecreaseDecimalIcon}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(
                FORMATTING_TYPE.CUSTOM_FORMAT,
                changeDecimals(format, -1)
              )
            }
          />
        </Tooltip>
        <Tooltip
          hasArrow
          aria-label={translations.increase_decimal}
          label={translations.increase_decimal}
        >
          <IconButton
            aria-label={translations.increase_decimal}
            fontSize={20}
            color={iconColor}
            icon={IncreaseDecimalIcon}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(
                FORMATTING_TYPE.CUSTOM_FORMAT,
                changeDecimals(format)
              )
            }
          />
        </Tooltip>

        <Menu>
          <Tooltip
            hasArrow
            aria-label={translations.more_formats}
            label={translations.more_formats}
          >
            <MenuButton
              color={foregroundColor}
              as={Button}
              size="sm"
              flexShrink={0}
              paddingLeft={1}
              paddingRight={1}
              background="none"
              height={BUTTON_HEIGHT}
            >
              <Box fontSize={12}>123</Box>
              <Icon name="chevron-down" fontSize={16} />
            </MenuButton>
          </Tooltip>
          <MenuList
            placement="top-start"
            minWidth={250}
            borderColor={borderColor}
            borderStyle="solid"
            fontSize={14}
          >
            <MenuItem
              onClick={() => {
                onFormattingChangeAuto?.();
                onFormattingChange?.(FORMATTING_TYPE.CUSTOM_FORMAT, undefined);
              }}
            >
              <Box width="24px">
                {format === void 0 && !plaintext && (
                  <Icon name="check" mr={1} />
                )}
              </Box>
              Automatic
            </MenuItem>
            <MenuItem
              onClick={() => {
                onFormattingChangePlain?.();
              }}
            >
              <Box width="24px">
                {plaintext && <Icon name="check" mr={1} />}
              </Box>
              Plain
            </MenuItem>
            <MenuDivider borderColor={borderColor} />
            {AVAILABLE_FORMATS.map((item, idx) => {
              return (
                <MenuItem
                  display="flex"
                  onClick={() => {
                    onFormattingChange?.(
                      FORMATTING_TYPE.CUSTOM_FORMAT,
                      item.value
                    );
                  }}
                  key={idx}
                >
                  <Box width="24px">
                    {format === item.value && !plaintext && (
                      <Icon name="check" mr={1} />
                    )}
                  </Box>
                  <Box flex={1}>{item.label}</Box>
                  <Box textAlign="right" color="gray.500">
                    {item.sample}
                  </Box>
                </MenuItem>
              );
            })}
            <MenuDivider borderColor={borderColor} />
            {AVAILABLE_CURRENCY_FORMATS.map((item, idx) => {
              return (
                <MenuItem
                  display="flex"
                  onClick={() => {
                    onFormattingChange?.(
                      FORMATTING_TYPE.CUSTOM_FORMAT,
                      item.value
                    );
                  }}
                  key={idx}
                >
                  <Box width="24px">
                    {format === item.value && !plaintext && (
                      <Icon name="check" mr={1} />
                    )}
                  </Box>
                  <Box flex={1}>{item.label}</Box>
                  <Box textAlign="right" color="gray.500">
                    {item.sample}
                  </Box>
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>

        <Separator borderColor={borderColor} />

        <Menu>
          <Tooltip
            hasArrow
            aria-label={translations.font}
            label={translations.font}
          >
            <MenuButton
              paddingLeft={1}
              paddingRight={1}
              as={Button}
              background="none"
              fontSize={12}
              fontWeight="normal"
              size="sm"
              width={100}
              textAlign="left"
              display="flex"
              whiteSpace="nowrap"
              minWidth={0}
              flexShrink={0}
              height={BUTTON_HEIGHT}
              color={foregroundColor}
            >
              <Box
                whiteSpace="nowrap"
                overflow="hidden"
                flex={1}
                // @ts-ignore
                textOverflow="ellipsis"
              >
                {fontFamily}
              </Box>
              <Icon name="chevron-down" fontSize={16} />
            </MenuButton>
          </Tooltip>
          <MenuList
            placement="top-start"
            borderColor={borderColor}
            borderStyle="solid"
            fontSize={14}
          >
            {fontList.map((font, idx) => {
              return (
                <MenuItem
                  onClick={() => {
                    onFormattingChange?.(FORMATTING_TYPE.FONT_FAMILY, font);
                  }}
                  key={idx}
                >
                  <Box width="24px">
                    {font === fontFamily && <Icon name="check" mr={1} />}
                  </Box>
                  {font}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>

        <Separator borderColor={borderColor} />

        <SelectDropdown
          id="font-size"
          options={FONT_SIZES.map((size) => ({ label: size, value: size }))}
          onChange={(item) => {
            onFormattingChange?.(FORMATTING_TYPE.FONT_SIZE, item?.value);
          }}
          value={{ value: fontSize, label: fontSize }}
          format={(value) => parseInt(value)}
        />

        <Separator borderColor={borderColor} />

        <Tooltip
          hasArrow
          aria-label={translations.bold}
          label={translations.bold}
        >
          <IconButton
            aria-label={translations.bold}
            variant={bold ? "solid" : "ghost"}
            color={bold ? activeIconColor : iconColor}
            icon={MdFormatBold}
            fontSize={20}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() => onFormattingChange?.(FORMATTING_TYPE.BOLD, !bold)}
          />
        </Tooltip>

        <Tooltip
          hasArrow
          aria-label={translations.italic}
          label={translations.italic}
        >
          <IconButton
            aria-label={translations.italic}
            variant={italic ? "solid" : "ghost"}
            color={italic ? activeIconColor : iconColor}
            icon={MdFormatItalic}
            fontSize={20}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(FORMATTING_TYPE.ITALIC, !italic)
            }
          />
        </Tooltip>

        <Tooltip
          hasArrow
          aria-label={translations.underline}
          label={translations.underline}
        >
          <IconButton
            aria-label={translations.underline}
            variant={underline ? "solid" : "ghost"}
            color={underline ? activeIconColor : iconColor}
            icon={MdFormatUnderlined}
            fontSize={20}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(FORMATTING_TYPE.UNDERLINE, !underline)
            }
          />
        </Tooltip>

        <Tooltip
          hasArrow
          aria-label={translations.strikethrough}
          label={translations.strikethrough}
        >
          <IconButton
            aria-label={translations.strikethrough}
            variant={strike ? "solid" : "ghost"}
            color={strike ? activeIconColor : iconColor}
            icon={MdStrikethroughS}
            fontSize={20}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() =>
              onFormattingChange?.(FORMATTING_TYPE.STRIKE, !strike)
            }
          />
        </Tooltip>

        <Popover usePortal placement="top-start">
          {({ onClose }) => {
            return (
              <>
                <PopoverTrigger>
                  <Box>
                    <Tooltip
                      hasArrow
                      aria-label={translations.text_color}
                      label={translations.text_color}
                    >
                      <Button
                        size="sm"
                        color={iconColor}
                        variant="ghost"
                        p={0}
                        w={8}
                        flexDirection="column"
                        aria-label={translations.text_color}
                        background="none"
                        height={BUTTON_HEIGHT}
                      >
                        <MdTextFields />
                        <Rect color={color} />
                      </Button>
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  width={280}
                  borderColor={borderColor}
                  borderStyle="solid"
                >
                  <PopoverArrow />
                  <PopoverBody>
                    <ColorPicker
                      color={color}
                      onChange={(value: string | undefined) => {
                        onFormattingChange?.(FORMATTING_TYPE.COLOR, value);
                        onClose?.();
                      }}
                    />
                  </PopoverBody>
                </PopoverContent>
              </>
            );
          }}
        </Popover>

        <Separator borderColor={borderColor} />

        <Popover usePortal placement="top-start">
          {({ onClose }) => {
            return (
              <>
                <PopoverTrigger>
                  <Box>
                    <Tooltip
                      hasArrow
                      aria-label={translations.fill_color}
                      label={translations.fill_color}
                    >
                      <Button
                        size="sm"
                        color={iconColor}
                        variant="ghost"
                        p={0}
                        w={8}
                        flexDirection="column"
                        aria-label={translations.fill_color}
                        background="none"
                        height={BUTTON_HEIGHT}
                      >
                        <IoMdColorFill />
                        <Rect color={fill} />
                      </Button>
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  width={280}
                  borderColor={borderColor}
                  borderStyle="solid"
                >
                  <PopoverArrow />
                  <PopoverBody>
                    <ColorPicker
                      color={fill}
                      onChange={(value: string | undefined) => {
                        onFormattingChange?.(FORMATTING_TYPE.FILL, value);
                        onClose?.();
                      }}
                    />
                  </PopoverBody>
                </PopoverContent>
              </>
            );
          }}
        </Popover>

        <BorderSelection
          onBorderChange={onBorderChange}
          iconColor={iconColor}
          activeIconColor={activeIconColor}
          isLight={isLight}
        />

        <Tooltip
          hasArrow
          aria-label={translations.merge_cells}
          label={translations.merge_cells}
        >
          <IconButton
            aria-label={translations.merge_cells}
            variant="ghost"
            color={iconColor}
            icon={MergeCellsIcon}
            fontSize={20}
            size="sm"
            height={BUTTON_HEIGHT}
            onClick={() => onMergeCells?.()}
          />
        </Tooltip>

        <Popover usePortal placement="top-start">
          {() => {
            return (
              <>
                <PopoverTrigger>
                  <Box>
                    <Tooltip
                      hasArrow
                      aria-label={translations.freeze}
                      label={translations.freeze}
                    >
                      <IconButton
                        aria-label={translations.freeze}
                        variant="ghost"
                        color={iconColor}
                        icon={BsColumns}
                        fontSize={20}
                        size="sm"
                        height={BUTTON_HEIGHT}
                      />
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  width={220}
                  borderColor={borderColor}
                  borderStyle="solid"
                >
                  <PopoverArrow />
                  <PopoverBody color={foregroundColor}>
                    <FormControl mb={1}>
                      <FormLabel fontSize={14}>
                        {translations.freeze_rows}
                      </FormLabel>
                      <Select
                        size="sm"
                        value={frozenRows}
                        onChange={(e) =>
                          onFrozenRowChange?.(Number(e.target.value))
                        }
                        borderColor={
                          isLight
                            ? theme.colors.gray[300]
                            : "rgba(255,255,255,0.04)"
                        }
                      >
                        {Array.from({ length: 11 }).map((_, idx) => {
                          return (
                            <option value={idx} key={idx}>
                              {idx}
                            </option>
                          );
                        })}
                      </Select>
                    </FormControl>

                    <FormControl mb={1}>
                      <FormLabel fontSize={14}>
                        {translations.freeze_columns}
                      </FormLabel>
                      <Select
                        size="sm"
                        value={frozenColumns}
                        onChange={(e) =>
                          onFrozenColumnChange?.(Number(e.target.value))
                        }
                        borderColor={
                          isLight
                            ? theme.colors.gray[300]
                            : "rgba(255,255,255,0.04)"
                        }
                      >
                        {Array.from({ length: 11 }).map((_, idx) => {
                          return (
                            <option value={idx} key={idx}>
                              {idx}
                            </option>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </PopoverBody>
                </PopoverContent>
              </>
            );
          }}
        </Popover>

        <Separator borderColor={borderColor} />

        <Popover usePortal placement="top-start">
          {() => {
            return (
              <>
                <PopoverTrigger>
                  <Box>
                    <Tooltip
                      hasArrow
                      aria-label={translations.horizontal_align}
                      label={translations.horizontal_align}
                    >
                      <IconButton
                        aria-label={translations.horizontal_align}
                        variant="ghost"
                        color={iconColor}
                        icon={MdFormatAlignLeft}
                        fontSize={20}
                        size="sm"
                        height={BUTTON_HEIGHT}
                      />
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  width="auto"
                  borderColor={borderColor}
                  borderStyle="solid"
                  placement="bottom-start"
                >
                  <PopoverArrow />
                  <Box display="flex">
                    <IconButton
                      aria-label={translations.horizontal_align}
                      variant={horizontalAlign === "left" ? "solid" : "ghost"}
                      color={
                        horizontalAlign === "left" ? activeIconColor : iconColor
                      }
                      onClick={() =>
                        onFormattingChange?.(
                          FORMATTING_TYPE.HORIZONTAL_ALIGN,
                          "left"
                        )
                      }
                      icon={MdFormatAlignLeft}
                      fontSize={20}
                      size="sm"
                    />
                    <IconButton
                      aria-label={translations.horizontal_align}
                      variant={horizontalAlign === "center" ? "solid" : "ghost"}
                      color={
                        horizontalAlign === "center"
                          ? activeIconColor
                          : iconColor
                      }
                      onClick={() =>
                        onFormattingChange?.(
                          FORMATTING_TYPE.HORIZONTAL_ALIGN,
                          "center"
                        )
                      }
                      icon={MdFormatAlignCenter}
                      fontSize={20}
                      size="sm"
                    />
                    <IconButton
                      aria-label={translations.horizontal_align}
                      variant={horizontalAlign === "right" ? "solid" : "ghost"}
                      color={
                        horizontalAlign === "right"
                          ? activeIconColor
                          : iconColor
                      }
                      onClick={() =>
                        onFormattingChange?.(
                          FORMATTING_TYPE.HORIZONTAL_ALIGN,
                          "right"
                        )
                      }
                      icon={MdFormatAlignRight}
                      fontSize={20}
                      size="sm"
                    />
                  </Box>
                </PopoverContent>
              </>
            );
          }}
        </Popover>

        <Popover usePortal placement="top-start">
          {() => {
            return (
              <>
                <PopoverTrigger>
                  <Box>
                    <Tooltip
                      hasArrow
                      aria-label={translations.vertical_align}
                      label={translations.vertical_align}
                    >
                      <IconButton
                        aria-label={translations.vertical_align}
                        variant="ghost"
                        color={iconColor}
                        icon={MdVerticalAlignBottom}
                        fontSize={20}
                        size="sm"
                        height={BUTTON_HEIGHT}
                      />
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  width="auto"
                  borderColor={borderColor}
                  borderStyle="solid"
                  placement="bottom-start"
                >
                  <PopoverArrow />
                  <Box display="flex">
                    <IconButton
                      aria-label={translations.horizontal_align}
                      variant={verticalAlign === "top" ? "solid" : "ghost"}
                      color={
                        verticalAlign === "top" ? activeIconColor : iconColor
                      }
                      icon={MdVerticalAlignTop}
                      fontSize={20}
                      size="sm"
                      onClick={() =>
                        onFormattingChange?.(
                          FORMATTING_TYPE.VERTICAL_ALIGN,
                          "top"
                        )
                      }
                    />
                    <IconButton
                      aria-label={translations.horizontal_align}
                      variant={verticalAlign === "middle" ? "solid" : "ghost"}
                      color={
                        verticalAlign === "middle" ? activeIconColor : iconColor
                      }
                      icon={MdVerticalAlignCenter}
                      fontSize={20}
                      size="sm"
                      onClick={() =>
                        onFormattingChange?.(
                          FORMATTING_TYPE.VERTICAL_ALIGN,
                          "middle"
                        )
                      }
                    />
                    <IconButton
                      aria-label={translations.horizontal_align}
                      variant={verticalAlign === "bottom" ? "solid" : "ghost"}
                      color={
                        verticalAlign === "bottom" ? activeIconColor : iconColor
                      }
                      icon={MdVerticalAlignBottom}
                      fontSize={20}
                      size="sm"
                      onClick={() =>
                        onFormattingChange?.(
                          FORMATTING_TYPE.VERTICAL_ALIGN,
                          "bottom"
                        )
                      }
                    />
                  </Box>
                </PopoverContent>
              </>
            );
          }}
        </Popover>
        <Popover usePortal placement="top-start">
          {({ onClose }) => {
            return (
              <>
                <PopoverTrigger>
                  <Box>
                    <Tooltip
                      hasArrow
                      aria-label={translations.text_wrapping}
                      label={translations.text_wrapping}
                    >
                      <IconButton
                        aria-label={translations.text_wrapping}
                        variant="ghost"
                        color={iconColor}
                        icon={wrap === "clip" ? WrapClipIcon : WrapIcon}
                        fontSize={20}
                        size="sm"
                        height={BUTTON_HEIGHT}
                      />
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  width="auto"
                  borderColor={borderColor}
                  borderStyle="solid"
                  placement="bottom-start"
                >
                  <PopoverArrow />
                  <Box display="flex">
                    <Tooltip
                      hasArrow
                      aria-label={translations.text_clip}
                      label={translations.text_clip}
                    >
                      <Box>
                        <IconButton
                          aria-label={translations.text_clip}
                          variant={wrap === "clip" ? "solid" : "ghost"}
                          color={wrap === "clip" ? activeIconColor : iconColor}
                          icon={WrapClipIcon}
                          fontSize={20}
                          size="sm"
                          onClick={() => {
                            onFormattingChange?.(FORMATTING_TYPE.WRAP, "clip");
                            onClose?.();
                          }}
                        />
                      </Box>
                    </Tooltip>
                    <Tooltip
                      hasArrow
                      aria-label={translations.text_wrap}
                      label={translations.text_wrap}
                    >
                      <Box>
                        <IconButton
                          aria-label={translations.text_wrap}
                          variant={wrap === "wrap" ? "solid" : "ghost"}
                          color={wrap === "wrap" ? activeIconColor : iconColor}
                          icon={WrapIcon}
                          fontSize={20}
                          size="sm"
                          onClick={() => {
                            onFormattingChange?.(FORMATTING_TYPE.WRAP, "wrap");
                            onClose?.();
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Box>
                </PopoverContent>
              </>
            );
          }}
        </Popover>
      </Flex>
      <Flex alignItems="flex-end">
        {enableDarkMode && (
          <Tooltip
            hasArrow
            aria-label={
              isLight
                ? translations.switch_dark_mode
                : translations.switch_light_mode
            }
            label={
              isLight
                ? translations.switch_dark_mode
                : translations.switch_light_mode
            }
          >
            <IconButton
              aria-label={
                isLight
                  ? translations.switch_dark_mode
                  : translations.switch_light_mode
              }
              variant="ghost"
              color={iconColor}
              icon={isLight ? IoMdMoon : MdWbSunny}
              fontSize={20}
              size="sm"
              onClick={toggleColorMode}
            />
          </Tooltip>
        )}
      </Flex>
    </StyledToolbar>
  );
});

export interface BorderProps {
  iconColor: string;
  activeIconColor: string;
  onBorderChange?: (
    color: string | undefined,
    borderStyle: BORDER_STYLE,
    variant?: BORDER_VARIANT
  ) => void;
  isLight?: boolean;
}
const BorderSelection: React.FC<BorderProps> = ({
  iconColor,
  activeIconColor,
  onBorderChange,
  isLight,
}) => {
  const [borderColor, setBorderColor] = useState<string | undefined>("#000000");
  const [borderVariant, setBorderVariant] = useState<BORDER_VARIANT>();
  const [borderStyle, setBorderStyle] = useState<BORDER_STYLE>("thin");
  const theme = useTheme();
  const handleChangeColor = (value: string | undefined) => {
    setBorderColor(value);
  };
  const handleChangeVariant = (value: BORDER_VARIANT) => {
    setBorderVariant(value);
    onBorderChange?.(borderColor, borderStyle, value);
  };
  const handleChangeBorderStyle = (value: BORDER_STYLE) => {
    setBorderStyle(value);
  };
  const bgColor = isLight ? theme.colors.gray[100] : theme.colors.gray[600];
  const contentBorderColor = isLight
    ? theme.colors.gray[300]
    : theme.colors.gray[600];
  return (
    <Popover
      usePortal
      placement="auto-start"
      onClose={() => {
        setBorderVariant(undefined);
      }}
    >
      <PopoverTrigger>
        <Box>
          <Tooltip
            hasArrow
            aria-label={translations.borders}
            label={translations.borders}
            placement="bottom-start"
          >
            <IconButton
              aria-label={translations.borders}
              variant="ghost"
              color={iconColor}
              icon={MdBorderAll}
              fontSize={20}
              size="sm"
            />
          </Tooltip>
        </Box>
      </PopoverTrigger>
      <PopoverContent
        width={230}
        borderColor={contentBorderColor}
        borderStyle="solid"
      >
        <PopoverArrow />
        <Box display="flex">
          <Box flex={1} display="flex" p={2} flexWrap="wrap" width={180}>
            <IconButton
              aria-label={translations.border_all}
              background={borderVariant === "all" ? bgColor : "none"}
              variant={borderVariant === "all" ? "solid" : "ghost"}
              color={borderVariant === "all" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("all")}
              icon={MdBorderAll}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_inner}
              background={borderVariant === "inner" ? bgColor : "none"}
              variant={borderVariant === "inner" ? "solid" : "ghost"}
              color={borderVariant === "inner" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("inner")}
              icon={MdBorderInner}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_horizontal}
              background={borderVariant === "horizontal" ? bgColor : "none"}
              variant={borderVariant === "horizontal" ? "solid" : "ghost"}
              color={
                borderVariant === "horizontal" ? activeIconColor : iconColor
              }
              onClick={() => handleChangeVariant("horizontal")}
              icon={MdBorderHorizontal}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_vertical}
              background={borderVariant === "vertical" ? bgColor : "none"}
              variant={borderVariant === "vertical" ? "solid" : "ghost"}
              color={borderVariant === "vertical" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("vertical")}
              icon={MdBorderVertical}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_outer}
              background={borderVariant === "outer" ? bgColor : "none"}
              variant={borderVariant === "outer" ? "solid" : "ghost"}
              color={borderVariant === "outer" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("outer")}
              icon={MdBorderOuter}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_left}
              background={borderVariant === "left" ? bgColor : "none"}
              variant={borderVariant === "left" ? "solid" : "ghost"}
              color={borderVariant === "left" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("left")}
              icon={MdBorderLeft}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_right}
              background={borderVariant === "right" ? bgColor : "none"}
              variant={borderVariant === "right" ? "solid" : "ghost"}
              color={borderVariant === "right" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("right")}
              icon={MdBorderRight}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_top}
              background={borderVariant === "top" ? bgColor : "none"}
              variant={borderVariant === "top" ? "solid" : "ghost"}
              color={borderVariant === "top" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("top")}
              icon={MdBorderTop}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_bottom}
              background={borderVariant === "bottom" ? bgColor : "none"}
              variant={borderVariant === "bottom" ? "solid" : "ghost"}
              color={borderVariant === "bottom" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("bottom")}
              icon={MdBorderBottom}
              fontSize={20}
              size="sm"
            />
            <IconButton
              aria-label={translations.border_none}
              background={borderVariant === "none" ? bgColor : "none"}
              variant={borderVariant === "none" ? "solid" : "ghost"}
              color={borderVariant === "none" ? activeIconColor : iconColor}
              onClick={() => handleChangeVariant("none")}
              icon={MdBorderClear}
              fontSize={20}
              size="sm"
            />
          </Box>
          <Box
            p={2}
            borderLeft={bgColor}
            borderLeftWidth={1}
            borderLeftStyle="solid"
            flexDirection="column"
            display="flex"
          >
            <Popover placement="top-start">
              {({ onClose }) => {
                return (
                  <>
                    <PopoverTrigger>
                      <Box>
                        <Tooltip
                          hasArrow
                          aria-label={translations.border_color}
                          label={translations.border_color}
                        >
                          <Button
                            size="sm"
                            color={iconColor}
                            variant="ghost"
                            pl={0}
                            pr={0}
                            flexDirection="column"
                            aria-label={translations.border_color}
                            background="none"
                          >
                            <MdEdit />
                            <Rect color={borderColor} />
                          </Button>
                        </Tooltip>
                      </Box>
                    </PopoverTrigger>
                    <PopoverContent
                      zIndex={1}
                      width={280}
                      borderColor={contentBorderColor}
                      borderStyle="solid"
                    >
                      <PopoverArrow />
                      <PopoverBody>
                        <ColorPicker
                          color={borderColor}
                          onChange={(value) => {
                            handleChangeColor(value);
                            onClose?.();
                          }}
                          resetLabel="No borders"
                        />
                      </PopoverBody>
                    </PopoverContent>
                  </>
                );
              }}
            </Popover>
            <Popover placement="top-start">
              {({ onClose }) => {
                return (
                  <>
                    <PopoverTrigger>
                      <Box>
                        <Tooltip
                          hasArrow
                          aria-label={translations.border_style}
                          label={translations.border_style}
                        >
                          <IconButton
                            aria-label={translations.border_style}
                            variant="ghost"
                            color={iconColor}
                            icon={MdLineStyle}
                            fontSize={20}
                            size="sm"
                          />
                        </Tooltip>
                      </Box>
                    </PopoverTrigger>
                    <PopoverContent
                      width={100}
                      borderColor={contentBorderColor}
                      borderStyle="solid"
                    >
                      <PopoverArrow />
                      <PopoverBody>
                        <Button
                          background={borderStyle === "thin" ? bgColor : "none"}
                          variant={borderStyle === "thin" ? "solid" : "ghost"}
                          color={
                            borderStyle === "thin" ? activeIconColor : iconColor
                          }
                          size="sm"
                          onClick={() => {
                            handleChangeBorderStyle("thin");
                            onClose?.();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="1"
                            style={{ userSelect: "none" }}
                          >
                            <line
                              x1="0"
                              y1="0.5"
                              x2="50"
                              y2="0.5"
                              strokeWidth="1"
                              stroke="black"
                              style={{ userSelect: "none" }}
                            ></line>
                          </svg>
                        </Button>
                        <Button
                          background={
                            borderStyle === "medium" ? bgColor : "none"
                          }
                          variant={borderStyle === "medium" ? "solid" : "ghost"}
                          color={
                            borderStyle === "medium"
                              ? activeIconColor
                              : iconColor
                          }
                          size="sm"
                          onClick={() => {
                            handleChangeBorderStyle("medium");
                            onClose?.();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="2"
                            style={{ userSelect: "none" }}
                          >
                            <line
                              x1="0"
                              y1="1.0"
                              x2="50"
                              y2="1.0"
                              strokeWidth="2"
                              stroke="black"
                              style={{ userSelect: "none" }}
                            ></line>
                          </svg>
                        </Button>
                        <Button
                          background={
                            borderStyle === "thick" ? bgColor : "none"
                          }
                          variant={borderStyle === "thick" ? "solid" : "ghost"}
                          color={
                            borderStyle === "thick"
                              ? activeIconColor
                              : iconColor
                          }
                          size="sm"
                          onClick={() => {
                            handleChangeBorderStyle("thick");
                            onClose?.();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="3"
                            style={{ userSelect: "none" }}
                          >
                            <line
                              x1="0"
                              y1="1.5"
                              x2="50"
                              y2="1.5"
                              strokeWidth="3"
                              stroke="black"
                              style={{ userSelect: "none" }}
                            ></line>
                          </svg>
                        </Button>
                        <Button
                          background={
                            borderStyle === "dashed" ? bgColor : "none"
                          }
                          variant={borderStyle === "dashed" ? "solid" : "ghost"}
                          color={
                            borderStyle === "dashed"
                              ? activeIconColor
                              : iconColor
                          }
                          size="sm"
                          onClick={() => {
                            handleChangeBorderStyle("dashed");
                            onClose?.();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="1"
                            style={{ userSelect: "none" }}
                          >
                            <line
                              x1="0"
                              y1="0.5"
                              x2="50"
                              y2="0.5"
                              strokeWidth="1"
                              stroke="black"
                              strokeDasharray="2"
                              style={{ userSelect: "none" }}
                            ></line>
                          </svg>
                        </Button>
                        <Button
                          background={
                            borderStyle === "dotted" ? bgColor : "none"
                          }
                          variant={borderStyle === "dotted" ? "solid" : "ghost"}
                          color={
                            borderStyle === "dotted"
                              ? activeIconColor
                              : iconColor
                          }
                          size="sm"
                          onClick={() => {
                            handleChangeBorderStyle("dotted");
                            onClose?.();
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="50"
                            height="1"
                            style={{ userSelect: "none" }}
                          >
                            <line
                              x1="0"
                              y1="0.5"
                              x2="50"
                              y2="0.5"
                              strokeWidth="1"
                              stroke="black"
                              strokeDasharray="1"
                              style={{ userSelect: "none" }}
                            ></line>
                          </svg>
                        </Button>
                      </PopoverBody>
                    </PopoverContent>
                  </>
                );
              }}
            </Popover>
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  );
};

export default Toolbar;
