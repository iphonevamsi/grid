import React from "react";
import { Layer, Rect, Line, Path, Group } from "react-konva";
import { HEADER_BORDER_COLOR } from "../constants";

/**
 * Sheet outline level
 *
 * outlineLevelCol = 1
 * outlineLevelRow = 1
 */
const OUTLINE_ICON_WIDTH = 15;
const PlusIconPath = "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z";
const MinusIconPath = "M19 13H5v-2h14v2z";
const PlusIcon = ({ x, y, onClick }) => {
  return (
    <>
      <Rect
        fill="#545454"
        x={x}
        y={y}
        width={15}
        height={15}
        cornerRadius={2}
        onClick={onClick}
      />
      <Path
        data={PlusIconPath}
        x={x + 1.5}
        y={y + 1.5}
        fill="white"
        listening={false}
        scaleX={0.5}
        scaleY={0.5}
      />
    </>
  );
};

const MinusIcon = ({ x, y, onClick }) => {
  return (
    <>
      <Rect
        fill="white"
        x={x}
        y={y}
        width={15}
        height={15}
        cornerRadius={2}
        onClick={onClick}
      />
      <Path
        data={MinusIconPath}
        x={x + 1.5}
        y={y + 1.5}
        fill="#545454"
        listening={false}
        scaleX={0.5}
        scaleY={0.5}
      />
    </>
  );
};

const Outline = ({
  frozenRowHeight,
  rowStartIndex,
  rowStopIndex,
  getRowHeights,
  width,
  height,
  scrollTop,
}) => {
  const cells = [];
  const [rowHeights, rowOffsets] = getRowHeights();
  for (let i = rowStartIndex; i < rowStopIndex; i++) {
    const y =
      rowOffsets[i - rowStartIndex] +
      rowHeights[i - rowStartIndex] / 2 -
      OUTLINE_ICON_WIDTH / 2;
    cells.push(<PlusIcon y={y} x={OUTLINE_ICON_WIDTH / 2} />);
  }
  return (
    <Layer>
      <Rect
        fill="#ddd"
        x={0.5}
        y={0.5}
        width={width}
        height={height - 1}
        stroke={HEADER_BORDER_COLOR}
        strokeWidth={1}
      />
      <Group
        clipY={frozenRowHeight}
        clipX={0}
        clipWidth={width}
        clipHeight={height}
      >
        <Group offsetY={scrollTop}>{cells}</Group>
      </Group>
    </Layer>
  );
};

export default Outline;
