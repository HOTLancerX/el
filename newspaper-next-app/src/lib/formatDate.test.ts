import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('should format a valid date string correctly', () => {
    expect(formatDate('2023-01-15T12:00:00.000Z')).toBe('January 15, 2023');
  });

  it('should format a Date object correctly', () => {
    expect(formatDate(new Date(2023, 0, 15))).toBe('January 15, 2023');
  });

  it('should return "N/A" for undefined input', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null input', () => {
    expect(formatDate(null as any)).toBe('N/A'); // Test null explicitly
  });

  it('should use custom format options if provided', () => {
    const options: Intl.DateTimeFormatOptions = {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    };
    expect(formatDate('2023-01-15T12:00:00.000Z', options)).toBe('Jan 15, 23');
  });

  it('should return "Invalid Date" for unparseable date strings', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });

  it('should return "Invalid Date" for Date objects representing an invalid date', () => {
    expect(formatDate(new Date('not-a-date-either'))).toBe('Invalid Date');
  });
});
