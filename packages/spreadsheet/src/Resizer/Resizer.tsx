import React, { useRef, useEffect, useCallback } from "react";

interface ResizerProps {
  onDrag?: (value: number) => void;
  top: number;
  minTop?: number;
}

const RESIZER_HEIGHT = 4;

const Resizer = ({ onDrag, top, minTop = 0 }: ResizerProps) => {
  const dragging = useRef(false);
  const startY = useRef(0);
  const el = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!el.current) {
      return;
    }
    const diff = Math.max(e.pageY - startY.current, minTop);
    onDrag?.(diff);
    el.current.style.top = diff + "px";
  }, []);
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    var top = el.current?.style.top ? parseInt(el.current?.style.top) : 0;
    startY.current = e.pageY - top;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);
  const handleMouseUp = useCallback(() => {
    dragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      ref={el}
      style={{
        userSelect: "none",
        // background: 'red',
        height: RESIZER_HEIGHT,
        position: "absolute",
        left: 0,
        marginTop: -RESIZER_HEIGHT,
        top: top,
        right: 0,
        zIndex: 1,
        cursor: "ns-resize",
      }}
    />
  );
};

export default Resizer;
