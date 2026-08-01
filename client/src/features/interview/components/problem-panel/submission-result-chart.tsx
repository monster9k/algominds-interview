/**
 * Chart component showing runtime/memory distribution
 * Used in submission detail view
 */

interface SubmissionResultChartProps {
  data: number[];
  userValue: number;
  label: string;
}

/**
 * Bar chart showing distribution of runtimes/memory across all users
 * Highlights user's value in color
 */
export function SubmissionResultChart({
  data,
  userValue,
  label,
}: SubmissionResultChartProps) {
  const maxValue = Math.max(...data);
  // Approximate user value index (scale 0-110ms -> 0-data.length)
  const userValueIndex = Math.floor((userValue / 110) * data.length);

  return (
    <div className="w-full">
      <div className="flex items-end justify-start h-14 gap-[2px]">
        {data.map((value, index) => (
          <div
            key={index}
            className={`w-full rounded-t-sm ${
              index === userValueIndex ? "bg-blue-600" : "bg-zinc-700/50"
            }`}
            style={{ height: `${Math.max((value / maxValue) * 100, 4)}%` }}
            title={`${index * 10}ms - ${value}%`}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2 text-center">
        {label}
      </div>
    </div>
  );
}
