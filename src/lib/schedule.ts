/**
 * Returns the next `count` available Tue/Fri dates (YYYY-MM-DD),
 * starting from tomorrow. Each slot is unique and skips any dates already taken (1 blog per day).
 */
export function getNextPublishSlots(
  count: number,
  fromDate?: Date,
  occupiedSlots: string[] = []
): string[] {
  const occupiedSet = new Set(occupiedSlots.map((s) => s.slice(0, 10)));
  const slots: string[] = [];
  const d = fromDate ? new Date(fromDate) : new Date();
  // Start from tomorrow
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);

  // Safety limit of 365 days
  let safety = 365;
  while (slots.length < count && safety-- > 0) {
    const day = d.getDay(); // 0=Sun, 2=Tue, 5=Fri
    if (day === 2 || day === 5) {
      const dateStr = d.toISOString().slice(0, 10);
      if (!occupiedSet.has(dateStr)) {
        slots.push(dateStr);
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return slots;
}


/** Format a YYYY-MM-DD slot for display, e.g. "Tuesday, Oct 15, 2026" */
export function formatSlotLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const dayName = day === 2 ? "Tuesday" : "Friday";
  return `${dayName}, ${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}

/** Same logic as server, usable on the client */
export function getNextPublishSlotsClient(count: number): string[] {
  return getNextPublishSlots(count);
}
