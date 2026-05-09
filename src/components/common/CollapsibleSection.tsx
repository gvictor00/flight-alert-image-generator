import { useState } from 'react';
import { ArrowDownToLine, ArrowRightToLine } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="collapsible-section">
      <button
        className="text-sm font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-1"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {title} {isOpen ? <ArrowDownToLine /> : <ArrowRightToLine />}
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}
