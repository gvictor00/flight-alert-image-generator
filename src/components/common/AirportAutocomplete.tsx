'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { filterAirports, findAirport, getAirportLabel } from '@/lib/data/airports';
import type { Airport } from '@/lib/data/airports';

interface AirportAutocompleteProps {
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'Ex.: GRU, São Paulo…',
  disabled = false
}: AirportAutocompleteProps) {
  const instanceId = useId();
  const listboxId = `${instanceId}-listbox`;

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display label whenever the controlled value changes from outside
  useEffect(() => {
    setInputValue(value ? getAirportLabel(value) : '');
  }, [value]);

  const suggestions = filterAirports(inputValue);

  function selectAirport(airport: Airport) {
    onChange(airport.iata);
    setInputValue(getAirportLabel(airport.iata));
    setIsOpen(false);
    setHighlighted(-1);
  }

  function handleFocus() {
    // Clear input so the user can search from scratch without having to delete
    setInputValue('');
    setIsOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setInputValue(next);
    setHighlighted(-1);
    setIsOpen(next.trim().length > 0);
    if (!next.trim()) {
      onChange('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (isOpen && highlighted >= 0 && suggestions[highlighted]) {
        e.preventDefault();
        selectAirport(suggestions[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlighted(-1);
    }
  }

  function handleBlur() {
    // Small delay allows onMouseDown on a list item to fire before closing
    setTimeout(() => {
      setIsOpen(false);
      // Revert to the label of the last committed value
      setInputValue(value ? getAirportLabel(value) : '');
    }, 150);
  }

  const isKnownAirport = Boolean(findAirport(value));

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && highlighted >= 0 ? `${instanceId}-option-${highlighted}` : undefined
        }
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={[
          'w-full rounded-xl border bg-zinc-50/50 px-4 py-3.5 text-sm text-zinc-900 transition-all',
          'placeholder:text-zinc-400',
          'hover:bg-zinc-50 hover:border-zinc-300',
          'focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isKnownAirport && !disabled
            ? 'border-zinc-200 pr-9'
            : 'border-zinc-200'
        ].join(' ')}
      />

      {/* Checkmark badge when a valid airport is selected */}
      {isKnownAirport && !disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
        >
          {suggestions.map((airport, index) => {
            const isHighlighted = index === highlighted;
            return (
              <li
                key={airport.iata}
                id={`${instanceId}-option-${index}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={(e) => {
                  // Prevent input blur before selection commits
                  e.preventDefault();
                  selectAirport(airport);
                }}
                className={[
                  'flex cursor-pointer items-baseline gap-3 px-4 py-2.5 text-sm transition-colors',
                  isHighlighted
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-50'
                ].join(' ')}
              >
                <span
                  className={[
                    'w-10 shrink-0 font-mono text-xs font-bold',
                    isHighlighted ? 'text-white' : 'text-zinc-900'
                  ].join(' ')}
                >
                  {airport.iata}
                </span>
                <span className="min-w-0 truncate">{airport.city}</span>
                <span
                  className={[
                    'ml-auto shrink-0 text-xs',
                    isHighlighted ? 'text-zinc-300' : 'text-zinc-400'
                  ].join(' ')}
                >
                  {airport.country}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* No results hint */}
      {isOpen && inputValue.trim().length > 0 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400 shadow-xl">
          Nenhum aeroporto encontrado para &ldquo;{inputValue}&rdquo;.
        </div>
      )}
    </div>
  );
}
