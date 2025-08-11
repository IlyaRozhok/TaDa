"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import styles from "./DateRangePicker.module.scss";

interface DateRangePickerProps {
  label: string;
  value: { start: string | null; end: string | null };
  onChange: (range: { start: string; end: string }) => void;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "Select date range",
  minDate = new Date(),
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(
    value.start ? new Date(value.start) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    value.end ? new Date(value.end) : null
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize component to enable animations after first render
  useEffect(() => {
    if (!isInitialized) {
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [isInitialized]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["MO", "TH", "WE", "TH", "FR", "ST", "SU"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert Sunday (0) to Monday-first week (6)
    return day === 0 ? 6 : day - 1;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(selectedDate);
      setEndDate(null);
    } else {
      // Complete the range
      if (selectedDate < startDate) {
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }

      // Trigger onChange when range is complete
      const start = selectedDate < startDate ? selectedDate : startDate;
      const end = selectedDate < startDate ? startDate : selectedDate;
      onChange({
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      });

      // Close calendar after selection is complete
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const formatDisplayRange = () => {
    if (!startDate) return placeholder;

    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = monthNames[date.getMonth()].slice(0, 3);
      return `${month} ${day}`;
    };

    if (!endDate) {
      return formatDate(startDate);
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isInRange = (day: number) => {
    if (!startDate) return false;

    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    if (endDate) {
      return date >= startDate && date <= endDate;
    }

    if (hoverDate && startDate) {
      const hoverStart = startDate < hoverDate ? startDate : hoverDate;
      const hoverEnd = startDate < hoverDate ? hoverDate : startDate;
      return date >= hoverStart && date <= hoverEnd;
    }

    return false;
  };

  const isRangeStart = (day: number) => {
    if (!startDate) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date.toDateString() === startDate.toDateString();
  };

  const isRangeEnd = (day: number) => {
    if (!endDate) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date.toDateString() === endDate.toDateString();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const disabled = isDateDisabled(day);
      const inRange = isInRange(day);
      const rangeStart = isRangeStart(day);
      const rangeEnd = isRangeEnd(day);
      const isToday = date.toDateString() === new Date().toDateString();

      const classNames = [styles.dayCell];
      if (disabled) classNames.push(styles.disabled);
      if (isToday) classNames.push(styles.today);
      if (rangeStart) classNames.push(styles.rangeStart);
      else if (rangeEnd) classNames.push(styles.rangeEnd);
      else if (inRange) classNames.push(styles.inRange);
      else if (rangeStart || rangeEnd) classNames.push(styles.selected);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !disabled && handleDateSelect(day)}
          onMouseEnter={() => {
            if (startDate && !endDate) {
              setHoverDate(date);
            }
          }}
          onMouseLeave={() => setHoverDate(null)}
          disabled={disabled}
          className={classNames.join(" ")}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative" ref={pickerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-6 pt-8 pb-4 pr-12 bg-white rounded-full cursor-pointer
          flex items-center
          transition-all duration-200 focus:outline-none
          ${error ? "border-red-400" : ""}
          ${isOpen ? "" : ""}
        `}
      >
        <span className={startDate ? "text-gray-900" : "text-transparent"}>
          {formatDisplayRange() || "Select date range"}
        </span>
      </div>

      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

      <label
        className={`absolute left-6 pointer-events-none ${
          isInitialized ? "transition-all duration-200" : ""
        } ${
          startDate || isOpen
            ? "top-3 text-xs text-gray-500"
            : "top-1/2 -translate-y-1/2 text-base text-gray-400"
        }`}
      >
        {label}
      </label>

      {error && <p className="mt-1 text-sm text-red-600 px-6">{error}</p>}

      {isOpen && (
        <div className={`absolute z-50 mt-2 ${styles.glassCard}`}>
          {/* Calendar Header */}
          <div className={styles.calendarHeader}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={styles.navButton}
            >
              <ChevronLeft />
            </button>

            <div className="text-center">
              <h3>{monthNames[currentMonth.getMonth()]}</h3>
              <p>{currentMonth.getFullYear()}</p>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={styles.navButton}
            >
              <ChevronRight />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day) => (
              <div key={day} className={styles.weekDayLabel}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
        </div>
      )}
    </div>
  );
};
