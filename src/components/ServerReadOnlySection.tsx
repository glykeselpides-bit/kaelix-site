import type { ReactNode } from "react";

type StatCard = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
};

type DataTableProps<T> = {
  columns: {
    key: string;
    label: string;
    render: (item: T) => ReactNode;
  }[];
  emptyText: string;
  items: T[];
};

export function MetricGrid({ metrics }: { metrics: StatCard[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            {metric.label}
          </p>
          <div className="mt-4 text-3xl font-semibold text-white">
            {metric.value}
          </div>
          {metric.note ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {metric.note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DetailsGrid({ items }: { items: StatCard[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            {item.label}
          </p>
          <div className="mt-4 text-xl font-semibold text-white">
            {item.value}
          </div>
          {item.note ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {item.note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DataTable<T>({ columns, emptyText, items }: DataTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-blue-300">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-300">
            {items.map((item, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 align-top">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LoadError({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-red-200">
      Failed to load {label}.
    </div>
  );
}

export function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
      {children}
    </div>
  );
}

export function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
      {children}
    </div>
  );
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
      {children}
    </div>
  );
}

export function EmptyValue() {
  return <span className="text-slate-500">Not set</span>;
}

export function formatDashboardDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
