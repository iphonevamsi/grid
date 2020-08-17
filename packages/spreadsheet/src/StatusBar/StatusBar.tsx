import React, { memo, useMemo } from "react";
import { Text, Box, useColorMode } from "@chakra-ui/core";
import { SelectionArea, isNull } from "@rowsncolumns/grid";
import { Cells } from "../Spreadsheet";
import { isNumeric } from "../constants";

export interface StatusBarProps {
  selections: SelectionArea[];
  cells: Cells;
}

const EMPTY_ARRAY: SelectionArea[] = [];

const StatusBar: React.FC<StatusBarProps> = memo(
  ({ selections = EMPTY_ARRAY, cells }) => {
    const { colorMode } = useColorMode();
    const isLight = colorMode === "light";
    const bg = isLight ? "white" : "#000";
    const color = isLight ? "#333" : "#ccc";
    const shadow = isLight
      ? "0 0 2px 1px rgba(0,0,0,0.2)"
      : "0 0 2px 1px rgba(255,255,255,0.2)";

    let count = 0;
    let avg = 0;
    let sum = 0;
    const getMinMax = (o: Object) => {
      const keys = Object.keys(o ?? {}).map(Number);
      return [Math.min(...keys), Math.max(...keys)];
    };
    const [minRow, maxRow] = useMemo(() => {
      return getMinMax(cells);
    }, [cells]);

    for (let i = 0; i < selections.length; i++) {
      const { bounds } = selections[i];
      const top = Math.max(minRow, bounds.top);
      const bottom = Math.min(maxRow, bounds.bottom);
      for (let j = top; j <= bottom; j++) {
        const [minCol, maxCol] = getMinMax(cells[j]);
        const left = Math.max(minCol, bounds.left);
        const right = Math.min(maxCol, bounds.right);
        for (let k = left; k <= right; k++) {
          const cell = cells[j]?.[k];
          if (cell === void 0 || isNull(cell)) continue;
          const isFormula = cell.datatype === "formula";
          const value = isFormula ? cell.result : cell.text;
          if (!isNull(value) && isNumeric(cell)) {
            count += 1;
            sum += Number(value);
          }
        }
      }
    }
    avg = sum / count;

    if (count === 0 && sum === 0 && avg === 0) return null;

    const avgFixed = avg.toFixed(2);

    return (
      <Box display="flex" alignItems="center" pr={2} pl={2}>
        {count !== 0 && (
          <Box
            ml={2}
            boxShadow={shadow}
            bg={bg}
            color={color}
            borderRadius={5}
            pl={2}
            pr={2}
            pt={1}
            pb={1}
          >
            <Text as="div" fontSize="xs">
              Count: {count}
            </Text>
          </Box>
        )}
        {count > 0 && (
          <Box
            ml={2}
            boxShadow={shadow}
            bg={bg}
            color={color}
            borderRadius={5}
            pl={2}
            pr={2}
            pt={1}
            pb={1}
          >
            <Text as="div" fontSize="xs">
              Sum: {sum}
            </Text>
          </Box>
        )}
        {count > 0 && (
          <Box
            ml={2}
            boxShadow={shadow}
            bg={bg}
            color={color}
            borderRadius={5}
            pl={2}
            pr={2}
            pt={1}
            pb={1}
          >
            <Text as="div" fontSize="xs">
              Avg: {avgFixed}
            </Text>
          </Box>
        )}
      </Box>
    );
  }
);

export default StatusBar;
