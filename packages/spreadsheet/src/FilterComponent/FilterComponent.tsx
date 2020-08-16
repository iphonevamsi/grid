import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  useColorMode,
  useTheme,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  Checkbox,
} from "@chakra-ui/core";
import { DARK_MODE_COLOR } from "../constants";
import { Button } from "./../styled";
import { CellPosition, FilterDefinition } from "@rowsncolumns/grid";
import ReactList from "react-list";

export interface FilterComponentProps {
  position: CellPosition;
  onChange?: (
    filterIndex: number,
    columnIndex: number,
    filter?: FilterDefinition
  ) => void;
  onCancel?: () => void;
  values: React.ReactText[];
  filter: FilterDefinition;
  columnIndex?: number;
  index: number;
  width: number;
}

/**
 * Sort values
 * @param a
 * @param b
 */
const sortFn = (a: React.ReactText, b: React.ReactText) => {
  if (typeof a === "string" && typeof b === "string") {
    return Intl.Collator().compare(a, b);
  }
  if (a == b) return 0;
  if (a > b) return 1;
  return -1;
};

const FilterComponent = ({
  position,
  onChange,
  onCancel,
  values = [],
  filter,
  columnIndex,
  index,
  width,
}: FilterComponentProps) => {
  if (!columnIndex) return null;
  const [filterText, setFilterText] = useState("");
  const { values: selectedValues = [] } = filter || {};
  const [userValues, setUserValues] = useState(
    filter ? selectedValues : values
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const isLight = colorMode === "light";
  const color = isLight ? DARK_MODE_COLOR : theme.colors.white;
  const borderColor = isLight ? theme.colors.gray[300] : theme.colors.gray[600];
  const bgColor = isLight ? theme.colors.white : theme.colors.gray[700];
  let { x = 0, y } = position;
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setUserValues((prev) => prev.concat(value));
    } else {
      setUserValues((prev) => prev.filter((v) => v !== value));
    }
  }, []);
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);
  const handleSubmit = useCallback(() => {
    const selectedFilter =
      userValues.length === values.length
        ? undefined
        : {
            values: userValues,
            operator: filter?.operator,
          };
    onChange?.(index, columnIndex, selectedFilter);
  }, [userValues]);
  const isSelectAll = values.length === userValues.length;
  const items = values
    .filter((value) => new RegExp(filterText, "gi").test(value.toString()))
    .sort(sortFn);
  const itemRenderer = useCallback(
    (index, key) => {
      const value = items[index];
      const valueItem = value || "";
      const isChecked = userValues.indexOf(valueItem) !== -1;
      const label = value || "(Blanks)";
      return (
        <Box key={key} pb={1} display="flex">
          <Checkbox
            onChange={handleChange}
            value={valueItem}
            size="sm"
            borderColor={borderColor}
            isChecked={isChecked}
            alignItems="flex-start"
            lineHeight="1rem"
            color={color}
          >
            <Box fontSize={12}>{label}</Box>
          </Checkbox>
        </Box>
      );
    },
    [items]
  );
  const inputBoxHeight = "26px";
  return (
    <Box
      left={0}
      top={0}
      position="absolute"
      zIndex={1}
      transform={`translate(${x}px, ${y}px)`}
    >
      <Box
        shadow="md"
        bg={bgColor}
        borderColor={borderColor}
        borderWidth={1}
        borderStyle="solid"
        borderRadius={5}
        width={width}
      >
        <Box padding={3}>
          <Button
            onClick={() => setUserValues(values)}
            variant="link"
            fontSize={12}
            mr={2}
            background="none"
            size="sm"
          >
            Select all
          </Button>
          <Button
            onClick={() => setUserValues([])}
            variant="link"
            fontSize={12}
            background="none"
            size="sm"
          >
            Clear
          </Button>
          <InputGroup size="sm" mt={2}>
            <InputLeftElement
              height={inputBoxHeight}
              children={<Icon name="search" color="gray.300" />}
            />
            <Input
              type="text"
              size="sm"
              borderColor={borderColor}
              value={filterText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFilterText(e.target.value);
              }}
              color={color}
              ref={searchInputRef}
              height={inputBoxHeight}
            />
          </InputGroup>
          <Box
            overflow="auto"
            height={160}
            mt={2}
            mb={1}
            pt={2}
            pb={2}
            pl={1}
            pr={1}
          >
            <ReactList
              itemRenderer={itemRenderer}
              length={items.length}
              type="variable"
            />
          </Box>
          <Box pt={2}>
            <Button
              size="sm"
              variantColor="green"
              variant="solid"
              onClick={handleSubmit}
              mr={1}
            >
              Done
            </Button>
            <Button
              bg={borderColor}
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FilterComponent;
