const assert = require('assert');
const tasks = require('../src/core-js-dates-tasks');

describe('core-js-dates boundary cases', () => {
  it('uses UTC for weekday names near midnight', () => {
    assert.strictEqual(tasks.getDayName('2024-01-01T00:00:00Z'), 'Monday');
    assert.strictEqual(tasks.getDayName('2024-01-01T23:59:59Z'), 'Monday');
  });

  it('formats midnight and noon in UTC', () => {
    assert.strictEqual(
      tasks.formatDate('2024-01-01T00:00:00Z'),
      '1/1/2024, 12:00:00 AM'
    );
    assert.strictEqual(
      tasks.formatDate('2024-01-01T12:00:00Z'),
      '1/1/2024, 12:00:00 PM'
    );
  });

  it('finds the next Friday across a year boundary', () => {
    assert.deepStrictEqual(
      tasks.getNextFriday(new Date('2023-12-31T23:59:59Z')),
      new Date('2024-01-05T23:59:59Z')
    );
  });

  it('skips the current Friday and preserves UTC time across DST changes', () => {
    assert.deepStrictEqual(
      tasks.getNextFriday(new Date('2024-03-08T10:20:30.456Z')),
      new Date('2024-03-15T10:20:30.456Z')
    );
  });

  it('counts both boundaries of a single day and a leap-day period', () => {
    assert.strictEqual(
      tasks.getCountDaysOnPeriod('2024-02-29', '2024-02-29'),
      1
    );
    assert.strictEqual(
      tasks.getCountDaysOnPeriod('2024-02-28', '2024-03-01'),
      3
    );
  });

  it('counts UTC calendar days when the boundary times differ', () => {
    assert.strictEqual(
      tasks.getCountDaysOnPeriod(
        '2024-03-09T23:59:59Z',
        '2024-03-11T00:00:01Z'
      ),
      3
    );
  });

  it('includes the end of a period and compares equivalent timestamps', () => {
    const period = {
      start: '2024-02-01T00:00:00Z',
      end: '2024-02-02T00:00:00Z',
    };
    assert.strictEqual(tasks.isDateInPeriod(period.end, period), true);
    assert.strictEqual(
      tasks.isDateInPeriod('2024-02-02T03:00:00+03:00', period),
      true
    );
    assert.strictEqual(
      tasks.isDateInPeriod('2024-02-02T00:00:00.001Z', period),
      false
    );
  });

  it('handles the century exceptions for leap years and February lengths', () => {
    [
      [1900, false, 28],
      [2000, true, 29],
      [2100, false, 28],
      [2400, true, 29],
    ].forEach(([year, leapYear, days]) => {
      assert.strictEqual(tasks.isLeapYear(new Date(year, 1, 1)), leapYear);
      assert.strictEqual(tasks.getCountDaysInMonth(2, year), days);
    });
  });

  it('counts a weekend leap day', () => {
    assert.strictEqual(tasks.getCountWeekendsInMonth(2, 2020), 9);
    assert.strictEqual(tasks.getCountWeekendsInMonth(2, 2021), 8);
  });

  it('uses the ISO week year around New Year', () => {
    [
      [2015, 11, 31, 53],
      [2016, 0, 1, 53],
      [2016, 0, 4, 1],
      [2019, 11, 30, 1],
      [2021, 0, 3, 53],
      [2021, 0, 4, 1],
      [2024, 11, 30, 1],
    ].forEach(([year, month, day, week]) => {
      assert.strictEqual(
        tasks.getWeekNumberByDate(new Date(year, month, day, 23, 45)),
        week
      );
    });
  });

  it('finds Friday the 13th strictly after the current calendar date', () => {
    assert.deepStrictEqual(
      tasks.getNextFridayThe13th(new Date(2024, 8, 13, 12)),
      new Date(2024, 11, 13)
    );
    assert.deepStrictEqual(
      tasks.getNextFridayThe13th(new Date(2023, 0, 14)),
      new Date(2023, 9, 13)
    );
  });

  it('keeps the work cycle across a year boundary', () => {
    assert.deepStrictEqual(
      tasks.getWorkSchedule({ start: '30-12-2023', end: '04-01-2024' }, 2, 2),
      ['30-12-2023', '31-12-2023', '03-01-2024', '04-01-2024']
    );
  });

  it('includes leap day and the last working day in a schedule', () => {
    assert.deepStrictEqual(
      tasks.getWorkSchedule({ start: '28-02-2024', end: '03-03-2024' }, 2, 1),
      ['28-02-2024', '29-02-2024', '02-03-2024', '03-03-2024']
    );
  });

  it('keeps schedule dates consecutive across DST changes', () => {
    assert.deepStrictEqual(
      tasks.getWorkSchedule({ start: '09-03-2024', end: '12-03-2024' }, 1, 0),
      ['09-03-2024', '10-03-2024', '11-03-2024', '12-03-2024']
    );
  });

  it('returns no work dates for zero working days or an empty period', () => {
    assert.deepStrictEqual(
      tasks.getWorkSchedule({ start: '01-01-2024', end: '05-01-2024' }, 0, 2),
      []
    );
    assert.deepStrictEqual(
      tasks.getWorkSchedule({ start: '05-01-2024', end: '01-01-2024' }, 2, 2),
      []
    );
  });

  it('does not change Date arguments', () => {
    const date = new Date(2024, 1, 29, 12, 34, 56, 789);
    const timestamp = date.getTime();
    [
      tasks.getTime,
      tasks.getNextFriday,
      tasks.getWeekNumberByDate,
      tasks.getNextFridayThe13th,
      tasks.getQuarter,
      tasks.isLeapYear,
    ].forEach((task) => {
      task(date);
      assert.strictEqual(date.getTime(), timestamp);
    });
  });
});
