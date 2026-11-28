import "./UtilityLearning.css";

export type WeeklyProgressPoint = {
    label: string;
    value: number;
};

type WeeklyProgressChartProps = {
    points: WeeklyProgressPoint[];
    valueLabel?: string;
};

export default function WeeklyProgressChart({
    points,
    valueLabel = "hoạt động",
}: WeeklyProgressChartProps) {
    const max = Math.max(1, ...points.map(point => point.value));
    return (
        <div className="weekly-progress-chart" aria-label={`Biểu đồ ${valueLabel} trong 7 ngày`}>
            {points.map(point => (
                <div className="weekly-progress-column" key={point.label} title={`${point.label}: ${point.value} ${valueLabel}`}>
                    <div className="weekly-progress-bar">
                        <span style={{ height: `${Math.round((point.value / max) * 100)}%` }} />
                    </div>
                    <small>{point.label}</small>
                </div>
            ))}
        </div>
    );
}
