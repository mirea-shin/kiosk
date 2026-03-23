import React from 'react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ icon, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-green-600">{icon}</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
