"use client";

import * as React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react";

// Import komponen Select Shadcn yang sudah kita miliki
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown", // ganti dari "dropdown-buttons"
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  startMonth = new Date(1990, 0), // ganti dari fromYear
  endMonth = new Date(new Date().getFullYear() + 10, 11), // ganti dari toYear
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      locale={locale}
      className={cn(
        "group/calendar bg-[#F2EAE1] p-4 rounded-[1.5rem] shadow-sm border border-[#041E3F]/10 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(9)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 pointer-events-none",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0 select-none aria-disabled:opacity-50 text-[#041E3F] hover:bg-[#041E3F]/10 rounded-lg cursor-pointer pointer-events-auto",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0 select-none aria-disabled:opacity-50 text-[#041E3F] hover:bg-[#041E3F]/10 rounded-lg cursor-pointer pointer-events-auto",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center gap-2",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-2 text-sm font-bold text-[#041E3F]",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-lg flex items-center",
          defaultClassNames.dropdown_root,
        ),
        caption_label: cn(
          "font-bold select-none text-[#041E3F]",
          captionLayout === "label"
            ? "text-base"
            : "flex items-center gap-1 rounded-lg text-base [&>svg]:size-4 [&>svg]:text-[#041E3F]/60",
          defaultClassNames.caption_label,
        ),
        month_grid: "w-full border-collapse mt-2",
        weekdays: cn("flex mb-2", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-lg text-xs font-bold text-[#041E3F]/50 select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-1.5 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-xl p-0 text-center select-none",
          defaultClassNames.day,
        ),
        today: cn(
          "rounded-xl bg-[#041E3F]/10 text-[#041E3F] font-bold",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-[#041E3F]/30 aria-selected:text-[#041E3F]/30 font-normal",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-[#041E3F]/30 opacity-50",
          defaultClassNames.disabled,
        ),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-5", className)} {...props} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-5", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        // 4. INJEKSI CUSTOM DROPDOWN SHADCN
        Dropdown: ({ value, onChange, options, ...props }: any) => {
          const handleChange = (val: string) => {
            const changeEvent = {
              target: { value: val },
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange?.(changeEvent);
          };

          return (
            <Select value={value?.toString()} onValueChange={handleChange}>
              <SelectTrigger className="h-8 w-fit gap-1.5 border-none bg-transparent p-1 focus:ring-0 hover:bg-[#041E3F]/5 font-bold text-base text-[#041E3F] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="max-h-55 bg-[#F2EAE1] border-[#041E3F]/10 shadow-xl rounded-xl"
              >
                {options?.map((option: any, id: number) => (
                  <SelectItem
                    key={`${option.value}-${id}`}
                    value={option.value?.toString()}
                    className="cursor-pointer text-[#041E3F] hover:bg-[#041E3F]/5 font-semibold"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-9 flex-col gap-1 border-0 leading-none font-semibold text-[#041E3F] cursor-pointer rounded-xl hover:bg-[#041E3F]/10 transition-colors",
        // Modifier untuk Range & Selected
        "data-[range-end=true]:rounded-l-none data-[range-end=true]:rounded-r-xl data-[range-end=true]:bg-[#041E3F] data-[range-end=true]:text-[#FFFAF3] data-[range-end=true]:hover:bg-[#041E3F]/90",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-[#041E3F]/10 data-[range-middle=true]:text-[#041E3F] data-[range-middle=true]:hover:bg-[#041E3F]/20",
        "data-[range-start=true]:rounded-r-none data-[range-start=true]:rounded-l-xl data-[range-start=true]:bg-[#041E3F] data-[range-start=true]:text-[#FFFAF3] data-[range-start=true]:hover:bg-[#041E3F]/90",
        "data-[selected-single=true]:bg-[#041E3F] data-[selected-single=true]:text-[#FFFAF3] data-[selected-single=true]:rounded-xl data-[selected-single=true]:hover:bg-[#041E3F]/90",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
