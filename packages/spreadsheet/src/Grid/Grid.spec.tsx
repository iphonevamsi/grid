import React from "react";
import { domRenderer, cleanup } from "./../utils/test-utils";
import Grid from "./Grid";
import { theme } from "@chakra-ui/core";

describe("Grid", () => {
  afterEach(cleanup);
  it("renders a spreadsheet grid", () => {
    const renderGrid = () =>
      domRenderer(
        <Grid
          cells={{
            1: {
              1: {
                text: "hello",
              },
            },
          }}
          activeCell={null}
          selections={[]}
          selectedSheet={null}
          theme={theme}
          hiddenRows={[2]}
          hiddenColumns={[2]}
          filterViews={[
            {
              bounds: {
                top: 1,
                left: 1,
                right: 10,
                bottom: 1,
              },
              filters: {
                2: {
                  operator: "containsText",
                  values: ["A"],
                },
              },
            },
          ]}
        />
      );
    expect(renderGrid).not.toThrow();
  });

  it("matches snapshot", () => {
    const { asFragment } = domRenderer(
      <Grid
        cells={{
          1: {
            1: {
              text: "hello",
            },
          },
        }}
        activeCell={null}
        selections={[]}
        selectedSheet={null}
        theme={theme}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
