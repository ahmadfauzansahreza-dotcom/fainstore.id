"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  topic: string;
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="overflow-hidden rounded-xl2 border border-border bg-background-secondary/60">
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
            >
              <span>
                <span className="mr-2 text-xs text-accent-blue">{item.topic}</span>
                <span className="font-medium text-white">{item.question}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <div className="px-4 pb-3 text-sm text-gray-400">{item.answer}</div>}
          </div>
        );
      })}
    </div>
  );
}
