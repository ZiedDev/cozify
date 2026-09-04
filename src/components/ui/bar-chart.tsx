import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
  HTMLAttributes,
  useCallback,
  MouseEvent,
} from "react";

type MousePosition = {
  x: number;
  y: number;
  percentX: number;
};

type TooltipRenderFn = (props: {
  item: Record<string, any>;
  index: number;
}) => ReactNode;

type BarChartContextValue = {
  data: Record<string, any>[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  chartWidth: number;
  chartHeight: number;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
  mousePosition: MousePosition | null;
  setMousePosition: (pos: MousePosition | null) => void;
  maxValue: number;
  activeDataKeys: string[];
  registerDataKey: (key: string) => void;
  tooltipContent: TooltipRenderFn | null;
  setTooltipContent: (fn: TooltipRenderFn | null) => void;
  onItemClick?: (item: Record<string, any>, index: number) => void;
};

const BarChartContext = createContext<BarChartContextValue | null>(null);

function useBarChartContext() {
  const ctx = useContext(BarChartContext);

  if (!ctx) {
    throw new Error(
      "BarChart compound components must be rendered inside <BarChart>",
    );
  }

  return ctx;
}

type BarChartProps = HTMLAttributes<HTMLDivElement> & {
  data: Record<string, any>[];
  height?: number;
  width?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: ReactNode;
  onItemClick?: (item: Record<string, any>, index: number) => void;
};

export function BarChartRoot({
  data = [],
  height = 200,
  width = "100%",
  margin: customMargin,
  children,
  className = "",
  onItemClick,
  onClick,
  ...props
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(500);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition | null>(
    null,
  );
  const [dataKeys, setDataKeys] = useState<string[]>([]);
  const [tooltipContent, setTooltipContentState] =
    useState<TooltipRenderFn | null>(null);

  const setTooltipContent = useCallback((fn: TooltipRenderFn | null) => {
    setTooltipContentState(() => fn);
  }, []);

  // Measure exact real pixel width to prevent SVG aspect ratio text distortion
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;

        if (w > 0) setContainerWidth(w);
      }
    };

    updateWidth();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  const margin = useMemo(
    () => ({
      top: customMargin?.top ?? 14,
      right: customMargin?.right ?? 10,
      bottom: customMargin?.bottom ?? 28,
      left: customMargin?.left ?? 36,
    }),
    [customMargin],
  );

  const registerDataKey = (key: string) => {
    setDataKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const maxValue = useMemo(() => {
    if (!data.length) return 100;
    let max = 0;

    data.forEach((item) => {
      if (dataKeys.length === 0) {
        Object.values(item).forEach((v) => {
          if (typeof v === "number" && v > max) max = v;
        });
      } else {
        dataKeys.forEach((k) => {
          const val = Number(item[k]) || 0;

          if (val > max) max = val;
        });
      }
    });

    return max > 0 ? max : 100;
  }, [data, dataKeys]);

  const chartHeight = Math.max(10, height - margin.top - margin.bottom);
  const chartWidth = Math.max(10, containerWidth - margin.left - margin.right);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const leftPx = margin.left;
    const rightPx = rect.width - margin.right;
    const innerWidth = Math.max(1, rightPx - leftPx);

    const clampedRelX = Math.max(leftPx, Math.min(rightPx, relX));
    const fraction = (clampedRelX - leftPx) / innerWidth;
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.floor(fraction * data.length)),
    );

    setHoveredIndex(index);
    setMousePosition({
      x: relX,
      y: relY,
      percentX: (relX / rect.width) * 100,
    });
  };

  return (
    <BarChartContext.Provider
      value={{
        data,
        width: typeof width === "number" ? width : containerWidth,
        height,
        margin,
        chartWidth,
        chartHeight,
        hoveredIndex,
        setHoveredIndex,
        mousePosition,
        setMousePosition,
        maxValue,
        activeDataKeys: dataKeys,
        registerDataKey,
        tooltipContent,
        setTooltipContent,
        onItemClick,
      }}
    >
      <div
        ref={containerRef}
        aria-label="Interactive bar chart"
        className={`bar-chart relative w-full select-none touch-manipulation overflow-visible ${className}`}
        role={onClick ? "button" : "region"}
        style={{ height }}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onClick(e as unknown as MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        onMouseLeave={(e) => {
          const related = e.relatedTarget as HTMLElement | null;

          if (related && containerRef.current?.contains(related)) {
            return;
          }
          setHoveredIndex(null);
          setMousePosition(null);
        }}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {/* 1:1 Pixel-Accurate SVG: No Aspect Ratio Distortion or Squished Text */}
        <svg
          className="w-full h-full block overflow-visible"
          viewBox={`0 0 ${containerWidth} ${height}`}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {children}
          </g>
        </svg>

        {/* Desktop Mouse Hover Tooltip (Only shown on desktop hover) */}
        <BarChartTooltipRenderer />
      </div>
    </BarChartContext.Provider>
  );
}

// 1. Grid Component
type BarChartGridProps = {
  strokeDasharray?: string;
  className?: string;
  horizontal?: boolean;
  vertical?: boolean;
  ticksCount?: number;
};

export function BarChartGrid({
  strokeDasharray = "4 4",
  className = "stroke-separator/80",
  horizontal = true,
  ticksCount = 4,
}: BarChartGridProps) {
  const { chartWidth, chartHeight } = useBarChartContext();

  if (!horizontal) return null;

  const lines = [];

  for (let i = 0; i <= ticksCount; i++) {
    const y = (chartHeight / ticksCount) * i;

    lines.push(
      <line
        key={i}
        className={className}
        strokeDasharray={strokeDasharray}
        strokeWidth="1"
        x1="0"
        x2={chartWidth}
        y1={y}
        y2={y}
      />,
    );
  }

  return <g className="recharts-cartesian-grid">{lines}</g>;
}

// 2. Y-Axis Component
type BarChartYAxisProps = {
  tickFormatter?: (value: number) => string;
  ticksCount?: number;
  className?: string;
};

export function BarChartYAxis({
  tickFormatter = (v) => `${v}`,
  ticksCount = 3,
  className = "fill-muted text-[11px] font-normal",
}: BarChartYAxisProps) {
  const { chartHeight, maxValue } = useBarChartContext();
  const ticks = [];

  for (let i = 0; i <= ticksCount; i++) {
    const ratio = (ticksCount - i) / ticksCount;
    const value = Math.round(maxValue * ratio);
    const y = (chartHeight / ticksCount) * i;

    ticks.push(
      <text
        key={i}
        className={className}
        dominantBaseline="middle"
        textAnchor="end"
        x={-8}
        y={y}
      >
        {tickFormatter(value)}
      </text>,
    );
  }

  return <g className="recharts-cartesian-axis recharts-yAxis">{ticks}</g>;
}

// 3. X-Axis Component
type BarChartXAxisProps = {
  dataKey: string;
  tickFormatter?: (value: any, index: number) => string;
  className?: string;
};

export function BarChartXAxis({
  dataKey,
  tickFormatter = (v) => `${v}`,
  className = "fill-muted text-[11px] font-normal",
}: BarChartXAxisProps) {
  const { data, chartWidth, chartHeight, hoveredIndex } = useBarChartContext();
  const count = data.length;

  if (count === 0) return null;
  const bandWidth = chartWidth / count;

  return (
    <g className="recharts-cartesian-axis recharts-xAxis">
      {data.map((item, idx) => {
        const x = idx * bandWidth + bandWidth / 2;
        const y = chartHeight + 16;
        const val = item[dataKey];
        const isHovered = hoveredIndex === idx;

        const text = tickFormatter(val, idx);

        if (!text) return null;

        return (
          <text
            key={idx}
            className={`${className} transition-colors duration-150 ${
              isHovered ? "fill-accent font-semibold" : ""
            }`}
            dominantBaseline="hanging"
            textAnchor="middle"
            x={x}
            y={y}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
}

// 4. Bar Component
type BarChartBarProps = {
  dataKey: string;
  radius?: number;
  className?: string;
  hoverClassName?: string;
};

export function BarChartBar({
  dataKey,
  radius = 4,
  className = "fill-accent/85 transition-[fill,opacity] duration-200 cursor-pointer",
  hoverClassName = "fill-accent",
}: BarChartBarProps) {
  const {
    data,
    margin,
    chartWidth,
    chartHeight,
    maxValue,
    hoveredIndex,
    setHoveredIndex,
    setMousePosition,
    onItemClick,
    registerDataKey,
  } = useBarChartContext();

  useEffect(() => {
    registerDataKey(dataKey);
  }, [dataKey]);

  const count = data.length;

  if (count === 0) return null;

  const bandWidth = chartWidth / count;
  const barPadding = Math.max(2, bandWidth * 0.22);
  const barWidth = Math.max(3, bandWidth - barPadding * 2);

  return (
    <g className="recharts-bar">
      {data.map((item, idx) => {
        const rawValue = Number(item[dataKey]) || 0;
        const heightRatio = maxValue > 0 ? rawValue / maxValue : 0;
        const barHeight = Math.max(
          rawValue > 0 ? 4 : 2,
          chartHeight * heightRatio,
        );
        const x = idx * bandWidth + barPadding;
        const y = chartHeight - barHeight;
        const isHovered = hoveredIndex === idx;

        return (
          <g
            key={idx}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onItemClick?.(item, idx);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onItemClick?.(item, idx);
              }
            }}
            onMouseEnter={() => {
              setHoveredIndex(idx);
              setMousePosition({
                x: idx * bandWidth + bandWidth / 2 + margin.left,
                y: Math.max(16, y),
                percentX: ((idx + 0.5) / count) * 100,
              });
            }}
          >
            {/* Transparent Full-Height Hit Box for reliable touch/hover */}
            <rect
              className="fill-transparent"
              height={chartHeight}
              width={bandWidth}
              x={idx * bandWidth}
              y={0}
            />

            {/* Subtle Hover Cursor Column */}
            {isHovered && (
              <rect
                className="fill-surface-secondary/60 transition-opacity duration-150 pointer-events-none"
                height={chartHeight}
                rx={radius}
                width={bandWidth}
                x={idx * bandWidth}
                y={0}
              />
            )}

            {/* The Actual Bar */}
            <rect
              className={`${className} ${isHovered ? hoverClassName : ""} ${
                rawValue === 0 ? "fill-surface-secondary/80 opacity-50" : ""
              }`}
              height={barHeight}
              rx={radius}
              width={barWidth}
              x={x}
              y={y}
            />
          </g>
        );
      })}
    </g>
  );
}

// 5. Reference Line Component (e.g. Average line)
type BarChartReferenceLineProps = {
  y: number;
  label?: string;
  strokeDasharray?: string;
  className?: string;
};

export function BarChartReferenceLine({
  y: targetValue,
  label,
  strokeDasharray = "5 4",
  className = "stroke-accent/90",
}: BarChartReferenceLineProps) {
  const { chartWidth, chartHeight, maxValue } = useBarChartContext();

  if (targetValue > maxValue || targetValue <= 0) return null;

  const yPos = chartHeight - (targetValue / maxValue) * chartHeight;

  return (
    <g className="recharts-reference-line pointer-events-none">
      <line
        className={className}
        strokeDasharray={strokeDasharray}
        strokeWidth="1.5"
        x1="0"
        x2={chartWidth}
        y1={yPos}
        y2={yPos}
      />
      {label && (
        <text
          className="fill-accent text-[11px] font-medium"
          dominantBaseline="auto"
          textAnchor="end"
          x={chartWidth - 4}
          y={yPos - 4}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// 6. Tooltip Component Definition and Renderer (Desktop Mouse Only)
type BarChartTooltipProps = {
  content?: TooltipRenderFn;
};

export function BarChartTooltip({ content }: BarChartTooltipProps) {
  const { setTooltipContent } = useBarChartContext();
  const contentRef = useRef(content);

  contentRef.current = content;

  useEffect(() => {
    setTooltipContent((props) => contentRef.current?.(props));

    return () => {
      setTooltipContent(null);
    };
  }, [setTooltipContent]);

  return null;
}

function BarChartTooltipRenderer() {
  const { hoveredIndex, data, mousePosition, tooltipContent } =
    useBarChartContext();

  if (
    hoveredIndex === null ||
    !data[hoveredIndex] ||
    !tooltipContent ||
    !mousePosition
  ) {
    return null;
  }

  const item = data[hoveredIndex];

  let leftStyle: string;
  let transformX: string;

  if (mousePosition.percentX < 30) {
    leftStyle = "8px";
    transformX = "0%";
  } else if (mousePosition.percentX > 70) {
    leftStyle = "calc(100% - 8px)";
    transformX = "-100%";
  } else {
    leftStyle = `${mousePosition.percentX}%`;
    transformX = "-50%";
  }

  const isNearTop = mousePosition.y < 85;
  const topPos = isNearTop
    ? mousePosition.y + 14
    : Math.max(0, mousePosition.y - 8);
  const transformY = isNearTop ? "0%" : "-100%";

  return (
    <div
      className="absolute z-50 pointer-events-none transition-[left,top,transform] duration-75 ease-out max-w-[calc(100%-16px)] hidden sm:block"
      style={{
        left: leftStyle,
        top: `${topPos}px`,
        transform: `translate(${transformX}, ${transformY})`,
      }}
    >
      {tooltipContent({ item, index: hoveredIndex })}
    </div>
  );
}

// Attach Compound Components to BarChart
export const BarChart = Object.assign(BarChartRoot, {
  Grid: BarChartGrid,
  XAxis: BarChartXAxis,
  YAxis: BarChartYAxis,
  Bar: BarChartBar,
  ReferenceLine: BarChartReferenceLine,
  Tooltip: BarChartTooltip,
});
