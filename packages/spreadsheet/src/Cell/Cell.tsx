import React, { memo, useCallback, useMemo } from "react";
import {
  RendererProps,
  isNull,
  CellInterface,
  Image,
  castToString,
} from "@rowsncolumns/grid";
import {
  DARK_MODE_COLOR_LIGHT,
  luminance,
  DEFAULT_FONT_SIZE,
  INVALID_COLOR,
  ERROR_COLOR,
  pointToPixel,
} from "../constants";
import {
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_DECORATION,
  Formatter,
} from "./../types";
import { CellConfig } from "../Spreadsheet";
import { Shape, Text } from "react-konva";
import { ShapeConfig } from "konva/types/Shape";
import FilterIcon from "./../FilterIcon";
import ListArrow from "./../ListArrow";
import Checkbox from "./../Checkbox";
import { FILTER_ICON_DIM } from "../FilterIcon/FilterIcon";

export interface CellProps extends RendererProps, CellConfig {
  formatter?: Formatter;
  showStrokeOnFill?: boolean;
  isSelected?: boolean;
  isLightMode?: boolean;
  showFilter?: boolean;
  isFilterActive?: boolean;
  onFilterClick?: (cell: CellInterface) => void;
  onEdit?: (cell: CellInterface) => void;
  onCheck?: (cell: CellInterface, value: boolean) => void;
  cellConfig?: CellConfig;
}

export interface CellRenderProps extends Omit<CellProps, "text"> {
  text?: string;
  showStrokeOnFill?: boolean;
  isSelected?: boolean;
  selectionFill?: string;
}

const DEFAULT_WRAP = "none";
const ERROR_TAG_WIDTH = 6.5;

/**
 * Cell renderer
 * @param props
 */
const Cell: React.FC<CellProps> = memo((props) => {
  const { datatype, formatter, isLightMode } = props;
  const {
    stroke,
    strokeTopColor,
    strokeRightColor,
    strokeBottomColor,
    strokeLeftColor,
    strokeDash,
    strokeTopDash,
    strokeRightDash,
    strokeBottomDash,
    strokeLeftDash,
    strokeWidth,
    strokeTopWidth,
    strokeRightWidth,
    strokeBottomWidth,
    strokeLeftWidth,
    lineCap,
    format,
    currencySymbol,
    dataValidation,
    cellConfig,
    formulaRange,
    fontSize: fontSizePt = DEFAULT_FONT_SIZE,
    ...cellProps
  } = props;
  const fontSize = useMemo(() => pointToPixel(fontSizePt), [fontSizePt]);
  const validatorType = dataValidation?.type;
  const checked =
    validatorType === "boolean"
      ? props.text === dataValidation?.formulae?.[0]
      : false;
  const isFormula = datatype === "formula";
  const textValue = isFormula ? props.error ?? props.result : props.text;
  const text = formatter
    ? formatter(textValue, datatype ?? props.resultType, cellConfig)
    : castToString(textValue);
  return (
    <DefaultCell
      isLightMode={isLightMode}
      {...cellProps}
      fontSize={fontSize}
      text={text}
      type={validatorType}
      checked={checked}
    />
  );
});

/**
 * Default cell renderer
 */
const DefaultCell: React.FC<CellRenderProps> = memo((props) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    isMergedCell,
    fill,
    datatype,
    color: userColor,
    italic,
    bold,
    horizontalAlign,
    verticalAlign = "bottom",
    underline,
    strike,
    fontFamily,
    padding = 3,
    fontSize,
    wrap = DEFAULT_WRAP,
    lineHeight = 1,
    isLightMode,
    showStrokeOnFill = true,
    isSelected,
    selectionFill = "rgb(14, 101, 235, 0.1)",
    loadingText = "Loading",
    plaintext,
    showFilter,
    isFilterActive,
    onFilterClick,
    scale = 1,
    rotation,
    valid,
    type: validatorType,
    onEdit,
    checked,
    onCheck,
    error,
    image,
    resultType,
    loading,
  } = props;
  const text = loading ? loadingText : props.text;
  const isBoolean = validatorType === "boolean";
  const textWrap = wrap === "wrap" ? "word" : DEFAULT_WRAP;
  const textDecoration = `${underline ? TEXT_DECORATION.UNDERLINE + " " : ""}${
    strike ? TEXT_DECORATION.STRIKE : ""
  }`;
  const userFill = isSelected ? selectionFill : fill;
  const fontWeight = bold ? FONT_WEIGHT.BOLD : FONT_WEIGHT.NORMAL;
  const fontStyle = italic ? FONT_STYLE.ITALIC : FONT_STYLE.NORMAL;
  const textStyle = `${fontWeight} ${fontStyle}`;
  const vAlign = verticalAlign;
  const hasError = !!error;
  const hAlign =
    horizontalAlign === void 0
      ? hasError
        ? "center"
        : (datatype === "number" || resultType === "number") && !plaintext
        ? "right"
        : "left"
      : horizontalAlign;
  const defaultFill = isLightMode ? "white" : DARK_MODE_COLOR_LIGHT;
  const textColor = userColor ? userColor : isLightMode ? "black" : "white";
  const showRect = !isNull(userFill) || isMergedCell;
  const hasFill = !isNull(userFill) || isSelected;
  const hasText = !isNull(text);
  /* Because of 1px + 0.5px (gridline width + spacing )*/
  const cellSpacingY = 1.5;
  const cellSpacingX = 1;
  const showArrow = validatorType === "list";
  const isInValid = valid === false;
  const showTag = isInValid || hasError;
  const textWidth =
    showFilter || showArrow
      ? width - FILTER_ICON_DIM - cellSpacingX
      : width - cellSpacingX;
  /**
   * Fill function
   */
  const fillFunc = useCallback(
    (context, shape) => {
      context.beginPath();
      context.setAttr("fillStyle", userFill || defaultFill);
      context.fillRect(1, 1, shape.width() - 1, shape.height() - 1);
      if (hasFill) {
        context.setAttr(
          "strokeStyle",
          showStrokeOnFill ? luminance(userFill, -20) : userFill
        );
        context.strokeRect(0.5, 0.5, shape.width(), shape.height());
      }
    },
    [hasFill, userFill, isSelected, defaultFill]
  );
  return (
    <>
      {showRect ? (
        <Shape
          visible={showRect}
          x={x}
          y={y}
          width={width}
          height={height}
          sceneFunc={fillFunc}
        />
      ) : null}
      {isBoolean && !isInValid ? (
        <Checkbox
          x={x}
          y={y}
          width={width}
          height={height}
          checked={checked}
          onChange={onCheck}
          rowIndex={props.rowIndex}
          columnIndex={props.columnIndex}
        />
      ) : hasText ? (
        <Text
          visible={hasText}
          x={x + cellSpacingX}
          y={y + cellSpacingY}
          height={height}
          width={textWidth}
          text={text}
          fill={textColor}
          verticalAlign={vAlign}
          align={hAlign}
          fontFamily={fontFamily}
          fontStyle={textStyle}
          textDecoration={textDecoration}
          padding={padding}
          wrap={textWrap}
          fontSize={fontSize * scale}
          lineHeight={lineHeight}
          hitStrokeWidth={0}
          perfectDrawEnabled={false}
          listening={false}
          rotation={rotation}
        />
      ) : null}
      {image ? (
        <Image
          x={x}
          y={y}
          spacing={1}
          width={width}
          height={height}
          url={image}
        />
      ) : null}
      {showFilter ? (
        <FilterIcon
          isActive={isFilterActive}
          onClick={onFilterClick}
          rowIndex={props.rowIndex}
          columnIndex={props.columnIndex}
          x={x}
          y={y}
          height={height}
          width={width}
        />
      ) : showArrow ? (
        <ListArrow
          onClick={onEdit}
          rowIndex={props.rowIndex}
          columnIndex={props.columnIndex}
          x={x}
          y={y}
          height={height}
          width={width}
        />
      ) : null}
      {showTag ? (
        <ErrorTag
          color={isInValid ? INVALID_COLOR : ERROR_COLOR}
          x={x + width - ERROR_TAG_WIDTH}
          y={y + 1}
        />
      ) : null}
    </>
  );
});

/**
 * Error tag
 * @param param0
 */
export const ErrorTag: React.FC<ShapeConfig> = ({
  x,
  y,
  color = INVALID_COLOR,
}) => {
  return (
    <Shape
      x={x}
      y={y}
      sceneFunc={(context) => {
        context.beginPath();
        context.setAttr("fillStyle", color);
        context.moveTo(0, 0);
        context.lineTo(ERROR_TAG_WIDTH, 0);
        context.lineTo(ERROR_TAG_WIDTH, ERROR_TAG_WIDTH);
        context.closePath();
        context.fill();
      }}
    />
  );
};

export default Cell;
