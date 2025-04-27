import { ReactNode } from "react";

interface FormSectionProps {
    title: string;
    children: ReactNode;
    className?: string;
    required?: boolean;
}

export function FormSection({ title, children, className = "", required = false }: FormSectionProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <h4 className="text-sm font-medium text-gray-700 flex items-start">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <div>{children}</div>
        </div>
    );
} 