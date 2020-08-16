import React from "react";
import {
  Box,
  Menu,
  MenuList,
  MenuDivider,
  useColorMode,
  useTheme,
} from "@chakra-ui/core";
import { MdContentCut, MdContentCopy, MdContentPaste } from "react-icons/md";
import { ContextMenuProps } from "../Grid/Grid";
import { CellInterface, SelectionArea } from "@rowsncolumns/grid";
import { MenuItem } from "./../styled";

export interface ContextMenuComponentProps extends ContextMenuProps {
  activeCell: CellInterface | null;
  selections: SelectionArea[];
  onRequestClose: () => void;
  onInsertRow?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onDeleteRow?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onInsertColumn?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onDeleteColumn?: (
    cell: CellInterface | null,
    selections: SelectionArea[]
  ) => void;
  onCopy?: (cell: CellInterface | null, selections: SelectionArea[]) => void;
  onCut?: (cell: CellInterface | null, selections: SelectionArea[]) => void;
  onPaste?: (cell: CellInterface | null, selections: SelectionArea[]) => void;
}

const ContextMenu: React.FC<ContextMenuComponentProps> = ({
  left,
  top,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
  onCut,
  onCopy,
  onPaste,
  activeCell,
  selections,
  onRequestClose,
}) => {
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const isLight = colorMode === "light";
  const color = isLight ? theme.colors.gray[800] : theme.colors.gray[100];
  const borderColor = isLight ? theme.colors.gray[300] : theme.colors.gray[600];
  const dividerColor = isLight
    ? theme.colors.gray[300]
    : "rgba(255, 255, 255, 0.16)";
  return (
    <Box
      left={0}
      top={0}
      position="absolute"
      zIndex={1}
      transform={`translate(${left}px, ${top}px)`}
    >
      <Menu isOpen>
        <MenuList
          fontSize={14}
          color={color}
          borderColor={borderColor}
          borderStyle="solid"
        >
          <MenuItem
            alignItems="center"
            onClick={() => {
              onCut?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            <Box mr={2} as={MdContentCut} />
            Cut
          </MenuItem>
          <MenuItem
            onClick={() => {
              onCopy?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            <Box mr={2} as={MdContentCopy} />
            Copy
          </MenuItem>
          <MenuItem
            onClick={() => {
              onPaste?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            <Box mr={2} as={MdContentPaste} />
            Paste
          </MenuItem>
          <MenuDivider borderColor={dividerColor} />
          <MenuItem
            onClick={() => {
              onInsertRow?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            Insert row
          </MenuItem>
          <MenuItem
            onClick={() => {
              onInsertColumn?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            Insert column
          </MenuItem>
          <MenuDivider borderColor={dividerColor} />
          <MenuItem
            onClick={() => {
              onDeleteRow?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            Delete row
          </MenuItem>
          <MenuItem
            onClick={() => {
              onDeleteColumn?.(activeCell, selections);
              onRequestClose?.();
            }}
          >
            Delete column
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default ContextMenu;
