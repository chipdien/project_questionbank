'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils/cn.utils';
import { ChevronDown, Check } from 'lucide-react';

interface AppSelectProps {
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  label?: string;
  leftIcon?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  id?: string;
  children: React.ReactNode;
}

export default function AppSelect({
  value,
  onChange,
  placeholder,
  label,
  leftIcon,
  error,
  children,
  className,
  wrapperClassName,
  disabled = false,
  id,
}: AppSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Phân tích các thẻ <option> truyền vào để lấy giá trị, label hiển thị, và các prop đặc biệt (như màu sắc)
  const options = useMemo(() => {
    const list: { value: string | number; label: React.ReactNode; rawLabel: string; colorCode?: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const element = child as React.ReactElement<{ value?: string | number; children?: React.ReactNode; 'data-color'?: string }>;
        const childrenContent = element.props.children;

        let rawLabel = '';
        if (typeof childrenContent === 'string') {
          rawLabel = childrenContent;
        } else if (typeof childrenContent === 'number') {
          rawLabel = String(childrenContent);
        }

        list.push({
          value: element.props.value ?? '',
          label: childrenContent || '',
          rawLabel: rawLabel,
          colorCode: element.props['data-color'] || undefined,
        });
      }
    });
    return list;
  }, [children]);

  // Tìm label của option đang được chọn
  const selectedOption = useMemo(() => {
    const active = options.find((opt) => String(opt.value) === String(value));
    if (active) return active;
    if (options.length > 0 && options[0].value === '') return options[0];
    return { label: placeholder || 'Chọn...', colorCode: undefined };
  }, [value, options, placeholder]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optValue: string | number) => {
    if (disabled) return;
    setIsOpen(false);

    // Tạo event giả lập tương thích hoàn toàn với React.ChangeEvent<HTMLSelectElement>
    if (onChange) {
      const mockEvent = {
        target: {
          value: String(optValue),
          name: '',
        },
        currentTarget: {
          value: String(optValue),
          name: '',
        },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(mockEvent);
    }
  };

  return (
    <div ref={containerRef} className={cn("space-y-1.5 w-full relative", wrapperClassName)}>
      {label && (
        <label
          className="flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-wider pl-1 select-none"
        >
          {leftIcon && (
            <span className="material-symbols-outlined text-sm text-primary/70">
              {leftIcon}
            </span>
          )}
          {label}
        </label>
      )}

      <div className="relative w-full">
        {/* Nút Trigger - CSS đồng bộ với TopicTreeSelect */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "w-full text-left flex items-center justify-between transition-all duration-200 select-none font-semibold text-xs border bg-surface-container-lowest rounded-xl py-1.5 px-3 pr-8 h-[34px]",
            disabled
              ? "opacity-50 bg-surface-container-low/50 border-outline-variant/30 cursor-not-allowed text-outline"
              : "border-outline-variant/35 hover:border-primary/50 hover:bg-surface-container-lowest",
            isOpen ? "border-primary ring-2 ring-primary/10 shadow-sm" : "",
            error ? "border-error focus:border-error focus:ring-error/10" : "",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption.colorCode && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedOption.colorCode }}
              />
            )}
            <span className="truncate">{selectedOption.label}</span>
          </div>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-outline-variant transition-transform duration-200 pointer-events-none",
              isOpen ? "rotate-180 text-primary" : ""
            )}
          />
        </button>

        {/* Dropdown Popover - CSS đồng bộ với TopicTreeSelect Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl overflow-y-auto max-h-[220px] z-[120] p-1.5 space-y-0.5 animate-in fade-in-50 slide-in-from-top-2 duration-150">
            {options.map((opt, index) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  className={cn(
                    "w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer",
                    isSelected
                      ? "bg-primary/8 text-primary font-bold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.colorCode && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.colorCode }}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-error pl-1 block font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
