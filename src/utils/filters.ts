export function buildDateFilter(startDate?: string, endDate?: string) {
  const DEFAULT_DAYS_RANGE = 30;
  const MAX_MONTHS_RANGE = 6;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const monthsDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (monthsDiff > MAX_MONTHS_RANGE) {
      const adjustedEnd = new Date(start);
      adjustedEnd.setMonth(adjustedEnd.getMonth() + MAX_MONTHS_RANGE);

      return {
        gte: new Date(startDate),
        lte: getEndOfDay(adjustedEnd),
      };
    }

    return {
      gte: new Date(startDate),
      lte: getEndOfDay(end),
    };
  }

  if (startDate && !endDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + DEFAULT_DAYS_RANGE);

    return {
      gte: start,
      lte: getEndOfDay(end),
    };
  }

  if (!startDate && endDate) {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - DEFAULT_DAYS_RANGE);

    return {
      gte: getStartOfDay(start),
      lte: getEndOfDay(end),
    };
  }

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - DEFAULT_DAYS_RANGE);

  return {
    gte: getStartOfDay(oneMonthAgo),
    lte: getEndOfDay(today),
  };
}

function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}

function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setUTCHours(23, 59, 59, 999);
  return newDate;
}
