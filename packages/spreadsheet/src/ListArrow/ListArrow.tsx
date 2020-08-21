import React, { useState, useCallback } from "react";
import { Group, Rect, Path } from "react-konva";
import { ShapeConfig } from "konva/types/Shape";
import { KonvaEventObject } from "konva/types/Node";
import { CellInterface } from "@rowsncolumns/grid";

export const LIST_ICON_DIM = 16;

export interface FilterIconProps extends ShapeConfig {
  rowIndex: number;
  columnIndex: number;
  onClick?: (cell: CellInterface) => void;
}

export const ARROW_ICON_PATH = "M7 10l5 5 5-5z";
const ICON_COLOR = "#808080";

/**
 * Filter icon
 * @param param0
 */
const FilterIcon: React.FC<FilterIconProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  rowIndex,
  columnIndex,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const padding = (height - LIST_ICON_DIM) / 2;
  const posX = x + width - LIST_ICON_DIM - 2; // - padding + 0.5;
  const posY = y + padding + 0.5;
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    onClick?.({ rowIndex, columnIndex });
  };
  return (
    <Group
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Rect
        x={posX}
        y={posY}
        width={LIST_ICON_DIM}
        height={LIST_ICON_DIM}
        fill={isHovered ? ICON_COLOR : "transparent"}
        cornerRadius={2}
      />
      <Path
        data={ARROW_ICON_PATH}
        x={posX - 1}
        y={posY - 1}
        fill={isHovered ? "white" : ICON_COLOR}
        scaleY={0.8}
        scaleX={0.8}
        listening={false}
      />
    </Group>
  );
};

export default FilterIcon;
