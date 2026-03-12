import React from 'react';

// Small utility to visually hide content while keeping it available to screen readers
export default function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
