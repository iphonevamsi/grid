import {
  getSelectionsFromInput,
  normalizeTokens,
  tokenize,
  detokenize,
  getCurrentCursorOffset,
  functionSuggestion,
  showCellSuggestions,
  formulaToRelativeReference,
} from "./helpers";
import React, { useState } from "react";
import { render } from "@testing-library/react";
import { Token } from "fast-formula-parser/grammar/lexing";
import { createEditor, Editor, Transforms, Node } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { withHistory } from "slate-history";

describe("Extract cell selection from raw text", () => {
  it("exists", () => {
    expect(getSelectionsFromInput).toBeDefined();
  });

  it("can parse single cells", () => {
    const text = "=A1";
    const selections = getSelectionsFromInput(text, 1);
    expect(selections.length).toBe(1);
  });
  it("can parse range cells", () => {
    const text = "=A1:A3";
    const selections = getSelectionsFromInput(text, 2);
    expect(selections.length).toBe(1);
  });
});

describe("getSelectionsFromInput", () => {
  it("can retrieve selections", () => {
    const selections = getSelectionsFromInput("=SUM(A1,A2)", "Sheet1");
    expect(selections.length).toBe(2);
    expect(selections[0].sheet).toBe("Sheet1");
  });

  it("can retrieve selections cross sheet", () => {
    const selections = getSelectionsFromInput("=SUM(A1,Sheet2!A2)", "Sheet1");
    expect(selections.length).toBe(2);
    expect(selections[1].sheet).toBe("Sheet2");
  });

  it("can retrieve selections cross sheet", () => {
    const selections = getSelectionsFromInput("=SUM(A1,Sheet2!A2)", "Sheet1");
    expect(selections.length).toBe(2);
    expect(selections[1].sheet).toBe("Sheet2");
  });

  it("can retrieve selections range", () => {
    const selections = getSelectionsFromInput(
      "=SUM(Sheet2!I10:I17,H5:H10)",
      "Sheet1"
    );
    expect(selections.length).toBe(2);
    expect(selections[0].sheet).toBe("Sheet2");
  });
});

describe("Parsing", () => {
  let editor: Editor & ReactEditor;
  let App;
  let defaultValue = [{ children: [{ text: "" }] }];
  let c = "<cursor>";
  let clen = c.length;
  const cleanup = (value: string): [string, number] => {
    const cidx = value.indexOf(c);
    const val = value.substr(0, cidx) + value.substr(cidx + clen);
    return [val, cidx];
  };
  beforeEach(() => {
    editor = withHistory(withReact(createEditor()));
    App = () => {
      const [value, setValue] = useState<Node[]>(defaultValue);
      return (
        <Slate editor={editor} value={value} onChange={setValue}>
          <Editable />
        </Slate>
      );
    };
  });
  it("exists", () => {
    expect(Slate).toBeDefined();
  });

  it("gets current offset", () => {
    const value = "=SUM(A1:A2)";
    const app = render(<App />);
    ReactEditor.focus(editor);
    editor.insertNode({
      text: value,
    });
    const start = getCurrentCursorOffset(editor);
    expect(start).toBeDefined();
    expect(start.offset).toBe(value.length);
  });

  it("can parse functions", () => {
    const app = render(<App />);
    const [value, distance] = cleanup("=S<cursor>UM(A1:A2)");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens = normalizeTokens(value);
    const fnToken: Token = functionSuggestion(tokens, editor);
    expect(fnToken.image).toBe("SUM(");
  });

  it("can parse nested functions", () => {
    const app = render(<App />);
    const [value, distance] = cleanup("=SUM(SEAR<cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens = normalizeTokens(value);
    const fnToken: Token = functionSuggestion(tokens, editor);
    expect(fnToken.image).toBe("SEAR");
  });

  it("can parse conditions", () => {
    const app = render(<App />);
    const [value, distance] = cleanup("=SUM(A1, A2, IF<cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens = normalizeTokens(value);
    const fnToken: Token = functionSuggestion(tokens, editor);
    expect(fnToken.image).toBe("IF");
  });

  it("Should show suggestion cursor", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=SUM(A1, A2, <cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeTruthy();
  });

  it("Should hide suggestion cursor", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=SUM(A1, A2<cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeFalsy();
  });

  it("Should hide suggestion cursor in function boundary", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=SUM(A1, A2) <cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeFalsy();
  });

  it("Should hide suggestion cursor in function boundary", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=SUM(A1,A2) + B1  <cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeFalsy();
  });
  it("Should hide suggestion cursor in inside functions", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=SUM(A1,<cursor>2)");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeFalsy();
  });
  it("Should hide suggestion cursor between functions", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=SU<cursor>M()");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeFalsy();
  });
  it("Should show suggestion cursor after functions", () => {
    const app = render(<App />);
    let [value, distance] = cleanup("=INDEX(<cursor>");
    editor.insertNode({
      text: value,
    });
    Transforms.move(editor, { unit: "line", reverse: true });
    Transforms.move(editor, { unit: "character", distance }); // User's cursor is at =S<cursor>
    const tokens: Token[] = normalizeTokens(value);

    let showCursor: boolean = showCellSuggestions(editor, tokens);
    expect(showCursor).toBeTruthy();
  });
});

describe("tokenize/detokenize", () => {
  const text = "=SUM(A1, 20)";
  it("tokenizes", () => {
    const { tokens } = tokenize(text);
    expect(tokens.length).toBe(6);
  });

  it("detokenizes", () => {
    const { tokens } = tokenize(text);
    expect(detokenize(tokens)).toBe(text);
  });
});

describe("formulaToRelativeReference", () => {
  it("can update formulas based on source cell", () => {
    expect(
      formulaToRelativeReference(
        "=A1",
        { rowIndex: 1, columnIndex: 2 },
        { rowIndex: 2, columnIndex: 2 }
      )
    ).toBe("=A2");
  });

  it("can update multiple formulas based on source cell", () => {
    expect(
      formulaToRelativeReference(
        "=A1 + SUM(A1:A3)",
        { rowIndex: 1, columnIndex: 2 },
        { rowIndex: 2, columnIndex: 2 }
      )
    ).toBe("=A2 + SUM(A2:A4)");
  });
});
