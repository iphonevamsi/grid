import React from "react";
import { domRenderer, cleanup } from "./../utils/test-utils";
import FilterComponent from "./FilterComponent";

describe("FilterComponent", () => {
  afterEach(cleanup);
  it("renders a filterComponent", () => {
    const renderGrid = () =>
      domRenderer(
        <FilterComponent
          columnIndex={1}
          position={{
            x: 0,
            y: 0,
            width: 300,
            height: 500
          }}
          values={
            ['A', 'b']
          }
          filter={{
            operator: 'containsText',
            values: ['H']
          }}
          index={0}
          width={200}
        />
      );
    expect(renderGrid).not.toThrow();
  });

  it("matches snapshot", () => {
    const { asFragment } = domRenderer(
      <FilterComponent
        columnIndex={1}
        position={{
          x: 0,
          y: 0,
          width: 300,
          height: 500
        }}
        values={
          ['A', 'b']
        }
        filter={{
          operator: 'containsText',
          values: ['H']
        }}
        index={0}
        width={200}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
})