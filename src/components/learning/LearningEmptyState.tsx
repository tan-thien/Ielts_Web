import type { ReactNode } from "react";
import "./UtilityLearning.css";

type LearningEmptyStateProps = {
    title: string;
    description: string;
    icon?: ReactNode;
    action?: ReactNode;
};

export default function LearningEmptyState({
    title,
    description,
    icon,
    action,
}: LearningEmptyStateProps) {
    return (
        <div className="learning-empty-state">
            {icon && <span className="learning-empty-icon" aria-hidden="true">{icon}</span>}
            <h2>{title}</h2>
            <p>{description}</p>
            {action}
        </div>
    );
}
