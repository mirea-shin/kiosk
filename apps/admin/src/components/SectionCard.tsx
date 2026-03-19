import React from 'react';

export default function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {children}
    </div>
  );
}
