import {
  createContext,
  useContext,
  useRef,
  ReactNode,
  isValidElement,
  Children,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  Cell as RechartsCell,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine as RechartsReferenceLine,
} from "recharts";

type TooltipRenderFn = (props: {
  item: Record<string, any>;
  index: number;
}) => ReactNode;

interface BarChartContextValue {
  onItemClick?: (item: Record<string, any>, index: number) => void;
  tooltipContent?: TooltipRenderFn | null;
  containerRef?: RefObject<HTMLDivElement | null>;
}

const BarChartContext = createContext<BarChartContextValue>({});

export interface BarChartProps {
  data: Record<string, any>[];
  height?: number;
  width?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: ReactNode;
  className?: string;
  onItemClick?: (item: Record<string, any>, index: number) => void;
}

export function BarChartRoot({
  data = [],
  height = 135,
  width = "100%",
  margin = { top: 8, right: 6, bottom: 20, left: 28 },
  children,
  className = "",
  onItemClick,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lastClickRef = useRef<{ key: string; time: number }>({
    key: "",
    time: 0,
  });

  const handleItemClick = (item: Record<string, any>, index: number) => {
    if (!onItemClick || !item) return;
    const key = `${item.dateStr ?? item.dayLabel ?? ""}_${index}`;
    const now = Date.now();

    // Guard against duplicate firing within 150ms between Bar and BarChart
    if (
      lastClickRef.current.key === key &&
      now - lastClickRef.current.time < 150
    ) {
      return;
    }
    lastClickRef.current = { key, time: now };
    onItemClick(item, index);
  };

  let customTooltipFn: TooltipRenderFn | undefined;

  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as any)?.displayName === "BarChartTooltip"
    ) {
      customTooltipFn = (child.props as any).content;
    }
  });

  return (
    <BarChartContext.Provider
      value={{
        onItemClick: handleItemClick,
        tooltipContent: customTooltipFn,
        containerRef,
      }}
    >
      <div
        ref={containerRef}
        className={`w-full relative overflow-visible outline-none focus:outline-none focus-visible:outline-none **:outline-none [&_svg]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none select-none ${onItemClick ? "cursor-pointer" : ""} ${className}`}
        style={{ height }}
        tabIndex={-1}
      >
        <ResponsiveContainer height="100%" width={width as any}>
          <RechartsBarChart
            accessibilityLayer={false}
            barCategoryGap="15%"
            data={data}
            margin={margin}
            tabIndex={-1}
            onClick={(state: any) => {
              if (state?.activePayload?.[0]?.payload) {
                const raw = state.activePayload[0].payload;
                const item = raw?.payload ?? raw;
                const idx = state.activeTooltipIndex ?? 0;

                handleItemClick(item, idx);
              } else if (
                state?.activeTooltipIndex !== undefined &&
                state?.activeTooltipIndex !== null &&
                data[state.activeTooltipIndex]
              ) {
                handleItemClick(
                  data[state.activeTooltipIndex],
                  state.activeTooltipIndex,
                );
              }
            }}
          >
            {children}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </BarChartContext.Provider>
  );
}

export function BarChartGrid({
  strokeDasharray,
  className,
  ...props
}: {
  strokeDasharray?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <RechartsCartesianGrid
      className={className}
      stroke="var(--separator)"
      strokeDasharray={strokeDasharray}
      vertical={false}
      {...props}
    />
  );
}
BarChartGrid.displayName = "BarChartGrid";

export function BarChartXAxis({
  dataKey = "dayLabel",
  tickFormatter,
  className = "text-[10px] fill-muted select-none",
  ...props
}: {
  dataKey?: string;
  tickFormatter?: (value: any, index: number) => string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <RechartsXAxis
      axisLine={{ stroke: "var(--separator)" }}
      className={className}
      dataKey={dataKey}
      tick={{ fill: "var(--muted)", fontSize: 10 }}
      tickFormatter={tickFormatter}
      tickLine={false}
      {...props}
    />
  );
}
BarChartXAxis.displayName = "BarChartXAxis";

export function BarChartYAxis({
  tickFormatter,
  ticksCount = 3,
  className = "text-[10px] fill-muted select-none",
  width = 28,
  ...props
}: {
  tickFormatter?: (value: any) => string;
  ticksCount?: number;
  className?: string;
  width?: number;
  [key: string]: any;
}) {
  return (
    <RechartsYAxis
      axisLine={false}
      className={className}
      tick={{ fill: "var(--muted)", fontSize: 10 }}
      tickCount={ticksCount}
      tickFormatter={tickFormatter}
      tickLine={false}
      width={width}
      {...props}
    />
  );
}
BarChartYAxis.displayName = "BarChartYAxis";

export function BarChartReferenceLine({
  y,
  label,
  position = "insideBottomRight",
  strokeDasharray,
  className,
  ...props
}: {
  y: number;
  label?: string;
  position?: any;
  strokeDasharray?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <RechartsReferenceLine
      className={className}
      label={
        label
          ? {
              value: label,
              fill: "var(--accent)",
              fontSize: 10,
              position,
              offset: 4,
            }
          : undefined
      }
      stroke="var(--accent)"
      strokeDasharray={strokeDasharray}
      y={y}
      {...props}
    />
  );
}
BarChartReferenceLine.displayName = "BarChartReferenceLine";

export function BarChartBar({
  dataKey = "focusMinutes",
  radius = 4,
  className = "fill-accent/85 cursor-pointer",
  children,
  background = {
    fill: "transparent",
    stroke: "none",
    strokeWidth: 0,
    cursor: "pointer",
  },
  minPointSize = 3,
  ...props
}: {
  dataKey?: string;
  radius?: number | [number, number, number, number];
  className?: string;
  children?: ReactNode;
  background?: any;
  minPointSize?: number;
  [key: string]: any;
}) {
  const { onItemClick } = useContext(BarChartContext);

  return (
    <RechartsBar
      background={background}
      className={className}
      dataKey={dataKey}
      fill="var(--accent)"
      minPointSize={minPointSize}
      radius={radius as any}
      onClick={(entry: any, index: number) => {
        if (onItemClick && entry) {
          const item = entry.payload ?? entry;

          onItemClick(item, index);
        }
      }}
      {...props}
    >
      {children}
    </RechartsBar>
  );
}
BarChartBar.displayName = "BarChartBar";

export const BarChartCell = RechartsCell;

export function BarChartTooltip({
  content,
  allowEscapeViewBox = true,
  offset = 8,
  ...props
}: {
  content: TooltipRenderFn;
  allowEscapeViewBox?: { x?: boolean; y?: boolean } | boolean;
  offset?: number;
  [key: string]: any;
}) {
  const { containerRef } = useContext(BarChartContext);

  return (
    <RechartsTooltip
      allowEscapeViewBox={allowEscapeViewBox as any}
      content={({ active: isTooltipActive, payload, coordinate }: any) => {
        if (
          !isTooltipActive ||
          !payload?.length ||
          typeof document === "undefined"
        )
          return null;
        const raw = payload[0].payload;
        const item = raw?.payload ?? raw;

        const rect = containerRef?.current?.getBoundingClientRect();
        const posX = (rect ? rect.left : 0) + (coordinate?.x ?? 0);
        const posY = (rect ? rect.top : 0) + (coordinate?.y ?? 0);

        const safeX = Math.max(
          90,
          Math.min(
            typeof window !== "undefined" ? window.innerWidth - 90 : 9999,
            posX,
          ),
        );
        const isNearTop = posY < 130;
        const safeY = isNearTop ? posY + 20 : posY;

        return createPortal(
          <div
            className={`fixed z-9999 pointer-events-none hidden sm:block -translate-x-1/2 animate-in fade-in zoom-in-95 duration-100 ${
              isNearTop ? "translate-y-2 mt-1" : "-translate-y-full -mt-2.5"
            }`}
            style={{
              left: safeX,
              top: safeY,
            }}
          >
            {content({ item, index: 0 })}
          </div>,
          document.body,
        );
      }}
      cursor={{ fill: "var(--separator)", opacity: 0.12 }}
      isAnimationActive={false}
      offset={offset}
      wrapperStyle={{
        pointerEvents: "none",
        zIndex: 9999,
        outline: "none",
        visibility: "hidden",
      }}
      {...props}
    />
  );
}
BarChartTooltip.displayName = "BarChartTooltip";

export const BarChart = Object.assign(BarChartRoot, {
  Grid: BarChartGrid,
  XAxis: BarChartXAxis,
  YAxis: BarChartYAxis,
  ReferenceLine: BarChartReferenceLine,
  Bar: BarChartBar,
  Cell: BarChartCell,
  Tooltip: BarChartTooltip,
});
