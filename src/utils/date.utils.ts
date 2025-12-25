import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const PERU_TIMEZONE = 'America/Lima';

export class DateUtils {
  static toPeruTime(utcDate: Date): Date {
    return toZonedTime(utcDate, PERU_TIMEZONE);
  }

  static fromPeruToUTC(peruDate: Date): Date {
    return fromZonedTime(peruDate, PERU_TIMEZONE);
  }

  static getStartOfDayUTC(date?: Date): Date {
    const baseDate = date || new Date();
    const peruDate = toZonedTime(baseDate, PERU_TIMEZONE);
    peruDate.setHours(0, 0, 0, 0);
    return fromZonedTime(peruDate, PERU_TIMEZONE);
  }

  static getEndOfDayUTC(date?: Date): Date {
    const baseDate = date || new Date();
    const peruDate = toZonedTime(baseDate, PERU_TIMEZONE);

    peruDate.setHours(23, 59, 59, 999);

    return fromZonedTime(peruDate, PERU_TIMEZONE);
  }

  static getNowInPeru(): Date {
    return toZonedTime(new Date(), PERU_TIMEZONE);
  }

  static parsePeruStartUTC(dateStr: string): Date {
    return fromZonedTime(`${dateStr} 00:00:00`, PERU_TIMEZONE);
  }

  static parsePeruEndUTC(dateStr: string): Date {
    return fromZonedTime(`${dateStr} 23:59:59.999`, PERU_TIMEZONE);
  }

  static getStartOfWeekUTC(date: Date): Date {
    const peruDate = toZonedTime(date, PERU_TIMEZONE);
    const day = peruDate.getDay(); 
    const diff = peruDate.getDate() - day;
    peruDate.setDate(diff);
    peruDate.setHours(0, 0, 0, 0);
    return fromZonedTime(peruDate, PERU_TIMEZONE);
  }

  static getStartOfMonthUTC(date: Date): Date {
    const peruDate = toZonedTime(date, PERU_TIMEZONE);
    peruDate.setDate(1);
    peruDate.setHours(0, 0, 0, 0);
    return fromZonedTime(peruDate, PERU_TIMEZONE);
  }
}
