import React from 'react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export default function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <span className="text-green-600">{icon}</span>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
