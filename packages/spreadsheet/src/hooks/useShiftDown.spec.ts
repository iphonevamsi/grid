import { renderHook, act } from "@testing-library/react-hooks";
import useShiftDown from "./useShiftDown";
import { KeyCodes } from "@rowsncolumns/grid";

describe("useShiftDown", () => {
  it("is a function", () => {
    expect(typeof useShiftDown).toBe("function");
  });

  it("can set initial input value", () => {
    const { result } = renderHook(() =>
      useShiftDown({
        initialInputValue: "hello",
      })
    );

    expect(result.current.inputValue).toBe("hello");
  });

  it("opens menu if its closed, when up/down arrow is pressed", () => {
    const { result } = renderHook(() => useShiftDown({}));
    act(() => {
      result.current.onKeyDown({
        // @ts-ignore
        nativeEvent: {
          which: KeyCodes.Up,
        },
      });
    });

    expect(result.current.isOpen).toBeTruthy();
  });

  it("sets highlighted index", () => {
    const { result } = renderHook(() =>
      useShiftDown({
        options: ["A", "B"],
        initialIsOpen: true,
      })
    );
    act(() => {
      result.current.onKeyDown({
        // @ts-ignore
        nativeEvent: {
          which: KeyCodes.Down,
        },
      });
    });

    expect(result.current.highlightedIndex).toBe(0);

    act(() => {
      result.current.onKeyDown({
        // @ts-ignore
        nativeEvent: {
          which: KeyCodes.Up,
        },
      });
    });

    expect(result.current.highlightedIndex).toBe(1);
  });

  it("calls setSelectedItem", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useShiftDown({
        options: ["A", "B"],
        defaultHighlightedIndex: 0,
        initialIsOpen: true,
        onChange,
      })
    );

    act(() => {
      result.current.onKeyDown({
        // @ts-ignore
        nativeEvent: {
          which: KeyCodes.Enter,
        },
      });
    });

    expect(onChange).toBeCalled();
  });
});
