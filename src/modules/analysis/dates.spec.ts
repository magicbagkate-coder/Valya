import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clockDay, dayText, labelRange, parseIsoDay, reelDay, toDay } from './dates';
import { resolveWindow } from './resolveWindow';

const dayOf = (year: number, month: number, day: number): number | undefined => toDay({ year, month, day });
const TEST_DAY = dayOf(2026, 11, 18) ?? 0;

describe('dates', () => {
  it('reads and writes days', () => {
    assert.equal(parseIsoDay('2026-11-18'), TEST_DAY);
    assert.equal(parseIsoDay('2026-02-31'), undefined);
    assert.equal(parseIsoDay('18.11.2026'), undefined);
    assert.equal(clockDay('2026-11-18 09:05'), TEST_DAY);
    assert.equal(dayText(TEST_DAY), '18.11');
  });

  it('reads the headers of the sales columns as ranges of days', () => {
    assert.deepEqual(labelRange('04-10.11', TEST_DAY), { from: dayOf(2026, 11, 4), to: dayOf(2026, 11, 10) });
    assert.deepEqual(labelRange('11.11-17.11', TEST_DAY), { from: dayOf(2026, 11, 11), to: dayOf(2026, 11, 17) });
    assert.deepEqual(labelRange('28,09-04,10', TEST_DAY), { from: dayOf(2026, 9, 28), to: dayOf(2026, 10, 4) });
    assert.deepEqual(labelRange('21,10', TEST_DAY), { from: dayOf(2026, 10, 21), to: dayOf(2026, 10, 21) });
    assert.deepEqual(labelRange(' 01-30.09 ', TEST_DAY), { from: dayOf(2026, 9, 1), to: dayOf(2026, 9, 30) });
    assert.equal(labelRange('остаток17,11', TEST_DAY), undefined);
    assert.equal(labelRange('', TEST_DAY), undefined);
  });

  it('puts a range over the new year into the right years', () => {
    const today = dayOf(2026, 1, 10) ?? 0;
    assert.deepEqual(labelRange('28.12-03.01', today), { from: dayOf(2025, 12, 28), to: dayOf(2026, 1, 3) });
  });

  it('reads the day of a Reels cell and uses the latest year that is not in the future', () => {
    assert.equal(reelDay('27.04 сборн', TEST_DAY), dayOf(2026, 4, 27));
    assert.equal(reelDay('11 03', TEST_DAY), dayOf(2026, 3, 11));
    assert.equal(reelDay('03.04сб', TEST_DAY), dayOf(2026, 4, 3));
    assert.equal(reelDay('25.12', TEST_DAY), dayOf(2025, 12, 25));
    assert.equal(reelDay('26.99', TEST_DAY), undefined);
    assert.equal(reelDay('Сборн', TEST_DAY), undefined);
    assert.equal(reelDay('', TEST_DAY), undefined);
  });
});

describe('resolveWindow', () => {
  it('gives no frame when "from" is empty', () => {
    assert.equal(resolveWindow({ period: { from: '', to: '' }, today: TEST_DAY }), undefined);
  });

  it('uses today when "to" is empty and cuts an end in the future', () => {
    assert.deepEqual(resolveWindow({ period: { from: '2026-11-12', to: '' }, today: TEST_DAY }), { from: TEST_DAY - 6, to: TEST_DAY });
    assert.deepEqual(resolveWindow({ period: { from: '2026-11-12', to: '2027-01-01' }, today: TEST_DAY }), { from: TEST_DAY - 6, to: TEST_DAY });
    assert.deepEqual(resolveWindow({ period: { from: '2026-11-17', to: '2026-11-17' }, today: TEST_DAY }), { from: TEST_DAY - 1, to: TEST_DAY - 1 });
  });

  it('says what is wrong with a bad period', () => {
    assert.throws(() => resolveWindow({ period: { from: 'вчера', to: '' }, today: TEST_DAY }), /Не поняла даты/);
    assert.throws(() => resolveWindow({ period: { from: '2026-11-20', to: '' }, today: TEST_DAY }), /позже/);
    assert.throws(() => resolveWindow({ period: { from: '2026-11-18', to: '2026-11-10' }, today: TEST_DAY }), /позже/);
    assert.throws(() => resolveWindow({ period: { from: '2020-01-01', to: '' }, today: TEST_DAY }), /слишком много/);
  });
});
