import React from "react";
import { render } from "@testing-library/react";
import { Stage, Layer } from "react-konva";
import { ThemeProvider, theme } from "@chakra-ui/core";
import Konva from "konva";

const KonvaWrapper = ({ children }) => {
  return (
    <Stage>
      <ThemeWrapper>
        <Layer>{children}</Layer>
      </ThemeWrapper>
    </Stage>
  );
};

const konvaRenderer = (ui) => render(ui, { wrapper: KonvaWrapper });
const domRenderer = (ui) => render(ui, { wrapper: ThemeWrapper });

export * from "@testing-library/react";
export { konvaRenderer, domRenderer };

export const ThemeWrapper = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
