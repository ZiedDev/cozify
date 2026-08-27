import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useMemo,
  ReactNode,
} from "react";

interface MousePosition {
  x: number;
  y: number;
  percentX: number;
}

type TooltipRenderFn = (props: {
  item: Record<string, any>;
  index: number;
}) => React.ReactNode;

interface BarChartContextValue {
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
}

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

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[];
  height?: number;
  width?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: ReactNode;
}

export function BarChartRoot({
  data = [],
  height = 200,
  width = "100%",
  margin: customMargin,
  children,
  className = "",
  ...props
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition | null>(
    null,
  );
  const [dataKeys, setDataKeys] = useState<string[]>([]);
  const [tooltipContent, setTooltipContentState] =
    useState<TooltipRenderFn | null>(null);

  const setTooltipContent = React.useCallback((fn: TooltipRenderFn | null) => {
    setTooltipContentState(() => fn);
  }, []);

  const margin = useMemo(
    () => ({
      top: customMargin?.top ?? 12,
      right: customMargin?.right ?? 12,
      bottom: customMargin?.bottom ?? 24,
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
  const chartWidth = 500; // standard SVG coordinate space viewBox width
  const totalSvgWidth = chartWidth + margin.left + margin.right;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const leftPx = (margin.left / totalSvgWidth) * rect.width;
    const rightPx = rect.width - (margin.right / totalSvgWidth) * rect.width;
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
        width: typeof width === "number" ? width : 500,
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
      }}
    >
      <div
        ref={containerRef}
        className={`bar-chart relative w-full select-none ${className}`}
        style={{ height }}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setMousePosition(null);
        }}
        onMouseMove={handleMouseMove}
        {...props}
      >
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${totalSvgWidth} ${height}`}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {children}
          </g>
        </svg>

        {/* Floating Tooltip positioned relative to cursor */}
        <BarChartTooltipRenderer />
      </div>
    </BarChartContext.Provider>
  );
}

// 1. Grid Component
export interface BarChartGridProps {
  strokeDasharray?: string;
  className?: string;
  horizontal?: boolean;
  vertical?: boolean;
  ticksCount?: number;
}

export function BarChartGrid({
  strokeDasharray = "3 3",
  className = "stroke-separator/40",
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
export interface BarChartYAxisProps {
  tickFormatter?: (value: number) => string;
  ticksCount?: number;
  className?: string;
}

export function BarChartYAxis({
  tickFormatter = (v) => `${v}`,
  ticksCount = 4,
  className = "fill-muted text-[10px]",
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
export interface BarChartXAxisProps {
  dataKey: string;
  tickFormatter?: (value: any, index: number) => string;
  className?: string;
}

export function BarChartXAxis({
  dataKey,
  tickFormatter = (v) => `${v}`,
  className = "fill-muted text-[10px]",
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
            {tickFormatter(val, idx)}
          </text>
        );
      })}
    </g>
  );
}

// 4. Bar Component
export interface BarChartBarProps {
  dataKey: string;
  radius?: number;
  className?: string;
  hoverClassName?: string;
}

export function BarChartBar({
  dataKey,
  radius = 4,
  className = "fill-accent/85 transition-all duration-200 cursor-pointer",
  hoverClassName = "fill-accent",
}: BarChartBarProps) {
  const {
    data,
    chartWidth,
    chartHeight,
    maxValue,
    hoveredIndex,
    registerDataKey,
  } = useBarChartContext();

  React.useEffect(() => {
    registerDataKey(dataKey);
  }, [dataKey]);

  const count = data.length;

  if (count === 0) return null;

  const bandWidth = chartWidth / count;
  const barPadding = Math.max(3, bandWidth * 0.22);
  const barWidth = Math.max(2, bandWidth - barPadding * 2);

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
          <g key={idx}>
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

// 5. Reference Line Component (e.g. 1h goal)
export interface BarChartReferenceLineProps {
  y: number;
  label?: string;
  strokeDasharray?: string;
  className?: string;
}

export function BarChartReferenceLine({
  y: targetValue,
  label,
  strokeDasharray = "4 4",
  className = "stroke-accent/50",
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
          className="fill-accent text-[9px] font-medium"
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

// 6. Tooltip Component Definition and Renderer
export interface BarChartTooltipProps {
  content?: TooltipRenderFn;
}

export function BarChartTooltip({ content }: BarChartTooltipProps) {
  const { setTooltipContent } = useBarChartContext();

  React.useEffect(() => {
    if (content) {
      setTooltipContent(content);
    }

    return () => {
      setTooltipContent(null);
    };
  }, [content, setTooltipContent]);

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

  // Prevent horizontal overflow at edges
  let transformX = "-50%";

  if (mousePosition.percentX < 25) {
    transformX = "0%";
  } else if (mousePosition.percentX > 75) {
    transformX = "-100%";
  }

  // Vertical placement: above cursor if space allows, otherwise below
  const isNearTop = mousePosition.y < 85;
  const topPos = isNearTop
    ? mousePosition.y + 14
    : Math.max(0, mousePosition.y - 10);
  const transformY = isNearTop ? "0%" : "-100%";

  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
      style={{
        left: `${mousePosition.percentX}%`,
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
