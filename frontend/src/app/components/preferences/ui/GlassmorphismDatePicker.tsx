"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./GlassmorphismDatePicker.module.scss";

interface GlassmorphismDatePickerProps {
  label: string;
  value: string | null;
  onChange: (date: string) => void;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const GlassmorphismDatePicker: React.FC<
  GlassmorphismDatePickerProps
> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "Select date",
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      return new Date(value);
    }
    // For birth date, start at a reasonable year (25 years ago)
    const currentYear = new Date().getFullYear();
    return new Date(currentYear - 25, 0, 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    direction: "up" | "down";
  }>({ top: 0, left: 0, width: 0, direction: "down" });
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showYearPicker || showMonthPicker) {
          setShowYearPicker(false);
          setShowMonthPicker(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize);
      };
    }
  }, [isOpen, showYearPicker, showMonthPicker]);

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 420; // Approximate calendar height
    const dropdownWidth = 320; // Fixed calendar width
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine direction based on available space
    const direction =
      spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "up" : "down";

    // Calculate horizontal position to prevent overflow
    let left = rect.left;
    const rightEdge = left + dropdownWidth;

    // If calendar would overflow right edge, adjust position
    if (rightEdge > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from edge
    }

    // Ensure calendar doesn't go off left edge
    if (left < 10) {
      left = 10;
    }

    setDropdownPosition({
      top:
        direction === "up" ? rect.top - dropdownHeight - 10 : rect.bottom + 10,
      left: left,
      width: dropdownWidth,
      direction,
    });
  };

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

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday from 0 to 6
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
    const maxYear = maxDate ? maxDate.getFullYear() : currentYear;
    const years = [];

    for (let year = maxYear; year >= minYear; year--) {
      years.push(year);
    }
    return years;
  };

  const handleYearChange = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth()));
    setShowYearPicker(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
    setShowMonthPicker(false);
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(selectedDate);
    onChange(selectedDate.toISOString().split("T")[0]);
    setIsOpen(false);
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

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Previous month days
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1
    );
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className={`${styles.day} ${styles.otherMonth}`}>
          {daysInPrevMonth - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day);
      const today = isToday(day);
      const selected = isSelected(day);

      days.push(
        <div
          key={day}
          className={`${styles.day} ${selected ? styles.selected : ""} ${
            today ? styles.today : ""
          } ${disabled ? styles.disabled : ""}`}
          onClick={() => !disabled && handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }

    // Next month days
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className={`${styles.day} ${styles.otherMonth}`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
    // Reset picker states when closing
    if (isOpen) {
      setShowYearPicker(false);
      setShowMonthPicker(false);
    }
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    try {
      const date = new Date(value);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return placeholder;
    }
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      {/* Input Field */}
      <div
        ref={inputRef}
        className={`w-full px-6 pt-8 pb-4 pr-12 rounded-3xl focus:outline-none transition-all duration-200 bg-white cursor-pointer border-0 shadow-sm ${
          value ? "text-gray-900" : "text-gray-400"
        } ${error ? "ring-2 ring-red-400 focus:ring-red-500" : ""}`}
        onClick={handleToggle}
      >
        {formatDisplayValue()}
      </div>

      {/* Floating label */}
      {value && (
        <label className="absolute left-6 top-3 text-xs text-gray-500 pointer-events-none">
          {label}
        </label>
      )}

      {/* Calendar Icon */}
      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className={`fixed z-[9999] backdrop-blur-[3px] ${styles.datePickerCard}`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.monthYear}>
              <button
                className="hover:bg-white/10 px-2 py-1 rounded transition-colors"
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
              >
                {monthNames[currentMonth.getMonth()]}
              </button>
              <button
                className="hover:bg-white/10 px-2 py-1 rounded transition-colors ml-2"
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
              >
                {currentMonth.getFullYear()}
              </button>
            </div>
            <div className={styles.navigation}>
              <button
                className={styles.navButton}
                onClick={() => navigateMonth("prev")}
                disabled={
                  minDate &&
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  ) < new Date(minDate.getFullYear(), minDate.getMonth())
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className={styles.navButton}
                onClick={() => navigateMonth("next")}
                disabled={
                  maxDate &&
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1
                  ) > new Date(maxDate.getFullYear(), maxDate.getMonth())
                }
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Year Picker */}
          {showYearPicker && (
            <div className="bg-white/20 backdrop-blur-md border-b border-white/30 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1 p-2">
                {getYearOptions().map((year) => (
                  <button
                    key={year}
                    className={`px-2 py-1 text-sm rounded hover:bg-white/30 transition-colors backdrop-blur-sm ${
                      year === currentMonth.getFullYear()
                        ? "bg-white/40 text-grey-700 font-medium"
                        : "text-white hover:text-gray-900"
                    }`}
                    onClick={() => handleYearChange(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Month Picker */}
          {showMonthPicker && (
            <div className="bg-white/20 backdrop-blur-md border-b border-white/30">
              <div className="grid grid-cols-3 gap-1 p-2">
                {monthNames.map((month, index) => (
                  <button
                    key={month}
                    className={`px-2 py-1 text-sm rounded hover:bg-white/30 transition-colors backdrop-blur-sm ${
                      index === currentMonth.getMonth()
                        ? "bg-white/40 text-grey-700 font-medium"
                        : "text-white hover:text-gray-900"
                    }`}
                    onClick={() => handleMonthChange(index)}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar View */}
          {!showYearPicker && !showMonthPicker && (
            <>
              {/* Weekdays */}
              <div className={styles.weekdays}>
                {weekdays.map((day) => (
                  <div key={day} className={styles.weekday}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className={styles.days}>{renderCalendar()}</div>
            </>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <button
              className={styles.footerButton}
              onClick={() => {
                setSelectedDate(null);
                onChange("");
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button
              className={styles.footerButton}
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                onChange(today.toISOString().split("T")[0]);
                setIsOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1 ml-6">{error}</p>}
    </div>
  );
};
