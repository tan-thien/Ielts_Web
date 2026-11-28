import type { ReactNode } from "react";
import "./UtilityLearning.css";

type UtilityPageHeaderProps = {
    eyebrow: string;
    title: string;
    description: string;
    icon?: ReactNode;
    actions?: ReactNode;
};

export default function UtilityPageHeader({
    eyebrow,
    title,
    description,
    icon,
    actions,
}: UtilityPageHeaderProps) {
    return (
        <header className="utility-page-header">
            <div className="utility-page-heading-copy">
                {icon && <span className="utility-page-icon" aria-hidden="true">{icon}</span>}
                <div>
                    <span className="utility-page-eyebrow">{eyebrow}</span>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            </div>
            {actions && <div className="utility-page-actions">{actions}</div>}
        </header>
    );
}
