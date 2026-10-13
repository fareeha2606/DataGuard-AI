import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* =========================================================
   TREND CHART
========================================================= */

type TrendPoint = {
  name?: string;
  date?: string;
  period?: string;
  value?: number;
  quality?: number;
  readiness?: number;
  missing?: number;
  anomalies?: number;
  [key: string]: any;
};

export function TrendChart({
  data,
  keys,
}: {
  data: TrendPoint[];
  keys?: string[];
}) {
  const chartData = Array.isArray(data) ? data : [];

  /*
    report-pages.tsx sends monitoring data as:

    {
      name: "...",
      value: 93
    }

    Older callers may send:

    {
      date: "...",
      quality: 93,
      readiness: 84
    }

    This component supports both formats.
  */

  const usesValueFormat =
    chartData.length > 0 &&
    chartData.some(
      (item) =>
        item &&
        Object.prototype.hasOwnProperty.call(
          item,
          'value',
        ),
    );

  const xAxisKey = usesValueFormat
    ? 'name'
    : 'date';

  const chartKeys =
    keys && keys.length > 0
      ? keys
      : usesValueFormat
        ? ['value']
        : ['quality', 'readiness'];

  return (
    <div className="h-64 w-full">
      {chartData.length === 0 ? (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          No trend data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              left: 0,
              right: 8,
              top: 12,
              bottom: 8,
            }}
          >
            <defs>
              <linearGradient
                id="trendGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.25}
                />

                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
            />

            <XAxis
              dataKey={xAxisKey}
              tick={{
                fill: 'var(--muted-foreground)',
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, 'auto']}
              tick={{
                fill: 'var(--muted-foreground)',
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
              }}
            />

            {chartKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={
                  index === 0
                    ? 'var(--primary)'
                    : 'var(--success)'
                }
                fill={
                  index === 0
                    ? 'url(#trendGradient)'
                    : 'transparent'
                }
                strokeWidth={2}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: 'var(--card)',
                }}
                activeDot={{
                  r: 6,
                }}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* =========================================================
   SIMPLE BARS
========================================================= */

export function SimpleBars({
  data,
}: {
  data: {
    name: string;
    value: number;
  }[];
}) {
  return (
    <div className="h-56 w-full">
      {data.length === 0 ? (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              left: 20,
              right: 20,
              top: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid
              stroke="var(--border)"
              horizontal={false}
            />

            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{
                fontSize: 11,
                fill: 'var(--muted-foreground)',
              }}
              axisLine={false}
            />

            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{
                fontSize: 11,
                fill: 'var(--muted-foreground)',
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
              }}
            />

            <Bar
              dataKey="value"
              fill="var(--primary)"
              radius={[0, 3, 3, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* =========================================================
   DONUT
========================================================= */

export function Donut({
  value,
}: {
  value: number;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0),
  );

  const data = [
    {
      name: 'Potentially unusual',
      value: safeValue,
    },
    {
      name: 'Normal',
      value: 100 - safeValue,
    },
  ];

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={62}
            outerRadius={82}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={
                  index
                    ? 'var(--muted)'
                    : 'var(--warning)'
                }
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-2xl font-bold">
            {safeValue}%
          </p>

          <p className="text-xs text-muted-foreground">
            unusual
          </p>
        </div>
      </div>
    </div>
  );
}