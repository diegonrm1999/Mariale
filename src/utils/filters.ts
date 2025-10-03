export function buildDateFilter(startDate?: string, endDate?: string) {
  const DEFAULT_DAYS_RANGE = 30;

  if (startDate && endDate) {
    return {
      gte: new Date(startDate),
      lte: getEndOfDay(new Date(endDate)),
    };
  }

  if (startDate && !endDate) {
    return {
      gte: new Date(startDate),
      lte: getEndOfDay(new Date()),
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
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DEFAULT_DAYS_RANGE);

  return {
    gte: getStartOfDay(thirtyDaysAgo),
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
