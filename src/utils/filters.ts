import { DateUtils } from "./date.utils";

export function buildDateFilter(startDate?: string, endDate?: string) {
  const DEFAULT_DAYS_RANGE = 30;
  const MAX_MONTHS_RANGE = 6;

  if (startDate && endDate) {
    const startUTC = DateUtils.parsePeruStartUTC(startDate);
    const endUTC = DateUtils.parsePeruEndUTC(endDate);

    const monthsDiff =
      (endUTC.getUTCFullYear() - startUTC.getUTCFullYear()) * 12 +
      (endUTC.getUTCMonth() - startUTC.getUTCMonth());

    if (monthsDiff > MAX_MONTHS_RANGE) {
      const adjustedEnd = new Date(startUTC);
      adjustedEnd.setUTCMonth(adjustedEnd.getUTCMonth() + MAX_MONTHS_RANGE);

      return {
        gte: startUTC,
        lte: DateUtils.getEndOfDayUTC(adjustedEnd),
      };
    }

    return {
      gte: startUTC,
      lte: endUTC,
    };
  }

  if (startDate && !endDate) {
    const startUTC = DateUtils.parsePeruStartUTC(startDate);
    const end = new Date(startUTC);
    end.setUTCDate(end.getUTCDate() + DEFAULT_DAYS_RANGE);

    return {
      gte: startUTC,
      lte: DateUtils.getEndOfDayUTC(end),
    };
  }

  if (!startDate && endDate) {
    const endUTC = DateUtils.parsePeruEndUTC(endDate);
    const start = new Date(endUTC);
    start.setUTCDate(start.getUTCDate() - DEFAULT_DAYS_RANGE);

    return {
      gte: DateUtils.getStartOfDayUTC(start),
      lte: endUTC,
    };
  }

  const todayPeru = DateUtils.getNowInPeru();
  const oneMonthAgoPeru = new Date(todayPeru);
  oneMonthAgoPeru.setDate(oneMonthAgoPeru.getDate() - DEFAULT_DAYS_RANGE);

  return {
    gte: DateUtils.getStartOfDayUTC(oneMonthAgoPeru),
    lte: DateUtils.getEndOfDayUTC(todayPeru),
  };
}
