import "./UtilityLearning.css";

type LearningProgressBarProps = {
    label: string;
    value: number;
    target?: number;
    tone?: "orange" | "blue" | "green";
};

export default function LearningProgressBar({
    label,
    value,
    target,
    tone = "orange",
}: LearningProgressBarProps) {
    const safeValue = Math.max(0, Math.min(100, value));
    return (
        <div className="learning-progress">
            <div className="learning-progress-label">
                <span>{label}</span>
                <strong>{target ? `${safeValue}% / ${target}%` : `${safeValue}%`}</strong>
            </div>
            <div className={`learning-progress-track tone-${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
                <span style={{ width: `${safeValue}%` }} />
            </div>
        </div>
    );
}
