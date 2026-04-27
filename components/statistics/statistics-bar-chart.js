"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_COLORS = [
  "#0ea5e9",
  "#38bdf8",
  "#7dd3fc",
  "#0284c7",
  "#06b6d4",
  "#22d3ee",
];

const tooltipFormatter = (value, _name, payload, valueLabel) => {
  const numericValue = Number(value) || 0;
  const label = valueLabel ? `${numericValue} ${valueLabel}` : `${numericValue}`;
  return [label, payload?.payload?.label || ""];
};

export default function StatisticsBarChart({
  title,
  description,
  items = [],
  valueLabel = "",
  emptyMessage = "Aucune donnée disponible.",
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
          {emptyMessage}
        </div>
      </section>
    );
  }

  const chartHeight = Math.max(320, items.length * 56);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer>
          <BarChart
            data={items}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
            barCategoryGap={12}
          >
            <CartesianGrid horizontal stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={160}
              tick={{ fill: "#0f172a", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(14, 165, 233, 0.08)" }}
              formatter={(value, name, payload) =>
                tooltipFormatter(value, name, payload, valueLabel)
              }
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              }}
              labelFormatter={(_label, payload) => {
                const item = payload?.[0]?.payload;
                return item?.meta ? `${item.label} • ${item.meta}` : item?.label || "";
              }}
            />
            <Bar dataKey="value" radius={[0, 10, 10, 0]} maxBarSize={28}>
              {items.map((item, index) => (
                <Cell
                  key={`${item.label}-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
