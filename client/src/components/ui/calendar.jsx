"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-utils";

// Add CSS for calendar styling
import "./calendar.css";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  // Custom formatter for weekday labels to show abbreviated day names
  const formatWeekdayName = (weekday) => {
    const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return labels[weekday.getDay()];
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-between items-center mb-4",
        caption_label: "text-base font-medium",
        nav: "flex gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        nav_button_previous: "rdp-nav-prev",  // Custom class for specific styling
        nav_button_next: "rdp-nav-next",      // Custom class for specific styling
        table: "w-full border-collapse",
        head_row: "flex w-full justify-between mb-2",
        head_cell:
          "text-muted-foreground rounded-md w-10 font-medium text-[0.875rem] text-center",
        row: "flex w-full justify-between mt-2",
        cell: "text-center text-sm p-0 relative flex items-center justify-center h-10 w-10",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-bold",
        day_outside:
          "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      formatters={{ formatWeekday: formatWeekdayName }}
      // Ensure today's date and selected dates are styled correctly
      modifiersClassNames={{
        today: "rdp-day_today",
        selected: "rdp-day_selected"
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
