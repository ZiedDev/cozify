export interface DateSuggestion {
  id: string;
  label: string;
  dateValue: string; // ISO date string (YYYY-MM-DD)
  hint: string;
  badge: string;
}

const WEEKDAYS = [
  { full: "sunday", short: "sun", dayIndex: 0, label: "Sunday" },
  { full: "monday", short: "mon", dayIndex: 1, label: "Monday" },
  { full: "tuesday", short: "tue", dayIndex: 2, label: "Tuesday" },
  { full: "wednesday", short: "wed", dayIndex: 3, label: "Wednesday" },
  { full: "thursday", short: "thu", dayIndex: 4, label: "Thursday" },
  { full: "friday", short: "fri", dayIndex: 5, label: "Friday" },
  { full: "saturday", short: "sat", dayIndex: 6, label: "Saturday" },
];

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return "";
  const datePart = dateStr.split(" ")[0];

  const todayStr = formatDateISO(new Date());
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateISO(tomorrow);

  if (datePart === todayStr) {
    return "Today";
  }
  if (datePart === tomorrowStr) {
    return "Tomorrow";
  }

  try {
    const [y, m, d] = datePart.split("-").map(Number);
    const parsedDate = new Date(y, m - 1, d);

    return parsedDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return datePart;
  }
}

/**
 * Returns dynamic preset date suggestions based on the current date
 */
export function getDateSuggestions(
  baseDate: Date = new Date(),
): DateSuggestion[] {
  const suggestions: DateSuggestion[] = [];

  // 1. Today
  const todayISO = formatDateISO(baseDate);

  suggestions.push({
    id: "today",
    label: `Today (${baseDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
    dateValue: todayISO,
    hint: "@today",
    badge: "Today",
  });

  // 2. Tomorrow
  const tomorrow = new Date(baseDate);

  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = formatDateISO(tomorrow);

  suggestions.push({
    id: "tomorrow",
    label: `Tomorrow (${tomorrow.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })})`,
    dateValue: tomorrowISO,
    hint: "@tomorrow",
    badge: "Tomorrow",
  });

  // 3. Upcoming weekdays (next 5 days)
  for (let offset = 2; offset <= 7; offset++) {
    const upcomingDate = new Date(baseDate);

    upcomingDate.setDate(upcomingDate.getDate() + offset);
    const dayIndex = upcomingDate.getDay();
    const weekdayInfo = WEEKDAYS.find((w) => w.dayIndex === dayIndex);
    const dateISO = formatDateISO(upcomingDate);

    if (weekdayInfo) {
      suggestions.push({
        id: weekdayInfo.short,
        label: `${weekdayInfo.label} (${upcomingDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
        dateValue: dateISO,
        hint: `@${weekdayInfo.short}`,
        badge: weekdayInfo.label,
      });
    }
  }

  // 4. In 1 week / Next week
  const inOneWeek = new Date(baseDate);

  inOneWeek.setDate(inOneWeek.getDate() + 7);
  suggestions.push({
    id: "nextweek",
    label: `Next Week (${inOneWeek.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
    dateValue: formatDateISO(inOneWeek),
    hint: "@nextweek",
    badge: "+1 Week",
  });

  return suggestions;
}

/**
 * Parses natural date token text (without the leading '@')
 * Returns standard date string "YYYY-MM-DD", plus formatted label.
 */
export function parseDateInput(
  rawInput: string,
  baseDate: Date = new Date(),
): { dateValue: string; label: string; tokenSnippet: string } | null {
  if (!rawInput) return null;
  const datePart = rawInput.trim().toLowerCase();

  // 1. Relative keywords
  let resolvedDate: Date | null = null;

  if (datePart === "today" || datePart === "tod") {
    resolvedDate = new Date(baseDate);
  } else if (
    datePart === "tomorrow" ||
    datePart === "tom" ||
    datePart === "tmrw"
  ) {
    resolvedDate = new Date(baseDate);
    resolvedDate.setDate(resolvedDate.getDate() + 1);
  } else if (datePart === "nextweek" || datePart === "week") {
    resolvedDate = new Date(baseDate);
    resolvedDate.setDate(resolvedDate.getDate() + 7);
  } else {
    // Check weekdays (e.g. mon, monday, fri, friday)
    const weekdayMatch = WEEKDAYS.find(
      (w) => w.full === datePart || w.short === datePart,
    );

    if (weekdayMatch) {
      resolvedDate = new Date(baseDate);
      const currentDay = baseDate.getDay();
      let diff = weekdayMatch.dayIndex - currentDay;

      if (diff <= 0) diff += 7; // Next occurrence
      resolvedDate.setDate(resolvedDate.getDate() + diff);
    }
  }

  // 2. Month & day patterns (e.g. "sep15", "sep-15", "september 15", "15sep")
  if (!resolvedDate) {
    const monthDayMatch = datePart.match(/^([a-z]{3,9})[- /]?(\d{1,2})$/i);

    if (monthDayMatch && MONTH_NAMES[monthDayMatch[1]] !== undefined) {
      const monthNum = MONTH_NAMES[monthDayMatch[1]];
      const dayNum = parseInt(monthDayMatch[2], 10);
      const year = baseDate.getFullYear();

      resolvedDate = new Date(year, monthNum, dayNum);
      if (resolvedDate.getTime() < baseDate.getTime() - 86400000 * 30) {
        resolvedDate.setFullYear(year + 1);
      }
    }
  }

  // 3. Standard ISO YYYY-MM-DD or MM-DD or MM/DD
  if (!resolvedDate) {
    const isoMatch = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);

      resolvedDate = new Date(y, m, d);
    } else {
      const mdMatch = datePart.match(/^(\d{1,2})[-/](\d{1,2})$/);

      if (mdMatch) {
        const m = parseInt(mdMatch[1], 10) - 1;
        const d = parseInt(mdMatch[2], 10);
        const y = baseDate.getFullYear();

        resolvedDate = new Date(y, m, d);
      }
    }
  }

  if (!resolvedDate || isNaN(resolvedDate.getTime())) {
    return null;
  }

  const dateISO = formatDateISO(resolvedDate);

  return {
    dateValue: dateISO,
    label: formatFriendlyDate(dateISO),
    tokenSnippet: `@${rawInput}`,
  };
}
