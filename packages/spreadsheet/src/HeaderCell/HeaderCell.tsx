import React, { memo, useCallback, useMemo, useState, useRef } from "react";
import { Cell, RendererProps } from "@rowsncolumns/grid";
import {
  number2Alpha,
  DARK_MODE_COLOR,
  HEADER_BORDER_COLOR,
} from "../constants";
import { Rect } from "react-konva";
import { ShapeConfig } from "konva/types/Shape";
import { AXIS } from "../types";
import { ThemeType } from "../styled";

export interface HeaderCellProps extends RendererProps {
  isActive?: boolean;
  onResize?: (axis: AXIS, index: number, dimension: number) => void;
  isLightMode?: boolean;
  theme: ThemeType;
  scale?: number;
  isFiltered?: boolean;
  isSelected?: boolean;
}

interface DraggableRectProps
  extends Pick<
    ShapeConfig,
    | "x"
    | "y"
    | "height"
    | "width"
    | "onDblClick"
    | "onMouseEnter"
    | "onMouseLeave"
  > {
  axis?: AXIS;
  columnIndex: number;
  rowIndex: number;
  onResize?: (axis: AXIS, index: number, dimension: number) => void;
  onAdjustColumn?: (columnIndex: number) => void;
  parentX: number;
  parentY: number;
  showResizer?: boolean;
  scale?: number;
  parentWidth?: number;
  parentHeight?: number;
}
const DRAG_HANDLE_WIDTH = 5;
const DraggableRect: React.FC<DraggableRectProps> = memo((props) => {
  const {
    axis = "x",
    x = 0,
    y = 0,
    height = 0,
    width = 0,
    columnIndex,
    rowIndex,
    onResize,
    parentX = 0,
    parentY = 0,
    showResizer,
    scale = 1,
    parentWidth,
    parentHeight,
    ...rest
  } = props;
  const index = useMemo(() => (axis === "x" ? columnIndex : rowIndex), [axis]);
  const dragStartPos = useRef<number>();
  const dragStartDim = useRef<number>();
  return (
    <Rect
      perfectDrawEnabled={false}
      fill={showResizer ? "#4C90FD" : "transparent"}
      draggable
      strokeScaleEnabled={false}
      shadowForStrokeEnable={false}
      hitStrokeWidth={5}
      onMouseDown={(e) => e.evt.stopPropagation()}
      dragBoundFunc={(pos) => {
        if (dragStartPos.current === void 0 || dragStartDim.current === void 0)
          return pos;
        const _x =
          axis === "y"
            ? 0
            : Math.max(
                dragStartPos.current - dragStartDim.current + DRAG_HANDLE_WIDTH,
                pos.x
              );
        const _y =
          axis === "x"
            ? 0
            : Math.max(
                dragStartPos.current - dragStartDim.current + DRAG_HANDLE_WIDTH,
                pos.y
              );
        return {
          x: _x,
          y: _y,
        };
      }}
      onDragMove={(e) => {
        const node = e.target;
        const dimension =
          axis === "x"
            ? node.x() - parentX + DRAG_HANDLE_WIDTH
            : node.y() - parentY + DRAG_HANDLE_WIDTH;

        onResize?.(axis, index, dimension / scale);
      }}
      onTouchStart={(e) => {
        e.evt.stopPropagation();
      }}
      onDragStart={(e) => {
        const clientRect = e.currentTarget.getClientRect();
        dragStartPos.current = axis === "x" ? clientRect.x : clientRect.y;
        dragStartDim.current = axis === "x" ? parentWidth : parentHeight;
      }}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rest}
    />
  );
});

const HeaderCell: React.FC<HeaderCellProps> = memo((props) => {
  const [showResizer, setShowResizer] = useState(false);
  const {
    rowIndex,
    columnIndex,
    isActive,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    isLightMode,
    theme,
  } = props;
  const {
    onResize,
    onAdjustColumn,
    scale = 1,
    isFiltered,
    isSelected,
    ...rest
  } = props;
  const isCorner = rowIndex === columnIndex;
  const value = isCorner
    ? ""
    : rowIndex === 0
    ? number2Alpha(columnIndex - 1)
    : rowIndex.toString();
  const isRowHeader = rowIndex === 0;
  const fill = isLightMode
    ? isFiltered
      ? isSelected
        ? "#198039"
        : "#E6F4EA"
      : isSelected
      ? "#5F6268"
      : isActive
      ? "#E9EAED"
      : "#F8F9FA"
    : isActive
    ? theme.colors.gray[700]
    : DARK_MODE_COLOR;
  const textColor = isSelected || !isLightMode ? "white" : "#333";
  const stroke = isLightMode ? HEADER_BORDER_COLOR : theme.colors.gray[600];
  const axis = isRowHeader ? "x" : "y";
  const cursor = axis === "x" ? "e-resize" : "n-resize";
  const handleMouseEnter = useCallback(() => {
    document.body.style.cursor = cursor;
    setShowResizer(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    document.body.style.cursor = "default";
    setShowResizer(false);
  }, []);
  const handleAdjustColumn = () => onAdjustColumn?.(columnIndex);
  const fontSize = 10 * scale;
  return (
    <Cell
      {...rest}
      x={x}
      y={y}
      fill={fill}
      align="center"
      value={value}
      textColor={textColor}
      stroke={stroke}
      fontSize={fontSize}
    >
      {!isCorner ? (
        <DraggableRect
          parentWidth={width}
          parentHeight={height}
          parentX={x}
          parentY={y}
          x={isRowHeader ? x + width - DRAG_HANDLE_WIDTH : x}
          y={isRowHeader ? y : y + height - DRAG_HANDLE_WIDTH}
          width={isRowHeader ? DRAG_HANDLE_WIDTH : width}
          height={isRowHeader ? height : DRAG_HANDLE_WIDTH}
          axis={axis}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          onResize={onResize}
          onDblClick={handleAdjustColumn}
          showResizer={showResizer}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          scale={scale}
        />
      ) : null}
    </Cell>
  );
});

export default HeaderCell;
