import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { appEnv } from '@/config/appEnv';
import { parseReminders } from './parseReminders';
import { readCancelId, readReminder } from './readReminder';
import { ReminderService } from './reminder.service';
import { clockText, formatDue, parseClock } from './zoneTime';

const HOUR_MS = 3_600_000;
const TEST_NOW = Date.UTC(2026, 9, 30, 12, 0);

describe('Kyiv clock', () => {
  it('reads winter time as UTC+2 and summer time as UTC+3', () => {
    assert.equal(parseClock('2026-10-30 15:00'), Date.UTC(2026, 9, 30, 13, 0));
    assert.equal(parseClock('2026-07-01 12:00'), Date.UTC(2026, 6, 1, 9, 0));
  });

  it('writes a moment back as the Kyiv clock', () => {
    assert.equal(clockText(Date.UTC(2026, 9, 30, 13, 0)), '2026-10-30 15:00');
    assert.equal(formatDue(Date.UTC(2026, 9, 30, 13, 5)), '30.10 в 15:05');
  });

  it('gives nothing for a date that does not exist', () => {
    assert.equal(parseClock('2026-02-31 10:00'), undefined);
    assert.equal(parseClock('2026-10-30 25:00'), undefined);
    assert.equal(parseClock('2026-03-29 03:30'), undefined);
    assert.equal(parseClock('завтра в 9'), undefined);
  });
});

describe('readReminder', () => {
  it('reads a time from now', () => {
    assert.deepEqual(readReminder({ text: ' Встреча ', inMinutes: 60 }, TEST_NOW), { text: 'Встреча', dueAt: TEST_NOW + HOUR_MS });
  });

  it('reads a clock time', () => {
    assert.deepEqual(readReminder({ text: 'Позвонить', at: '2026-10-31 09:00' }, TEST_NOW), { text: 'Позвонить', dueAt: Date.UTC(2026, 9, 31, 7, 0) });
  });

  it('refuses a missing text, a past time, an unclear time, or a time too far away', () => {
    assert.equal(readReminder({ inMinutes: 10 }, TEST_NOW), undefined);
    assert.equal(readReminder({ text: '  ', inMinutes: 10 }, TEST_NOW), undefined);
    assert.equal(readReminder({ text: 'x', at: '2026-10-30 10:00' }, TEST_NOW), undefined);
    assert.equal(readReminder({ text: 'x' }, TEST_NOW), undefined);
    assert.equal(readReminder({ text: 'x', inMinutes: 600_000 }, TEST_NOW), undefined);
    assert.equal(readReminder('text', TEST_NOW), undefined);
  });
});

describe('readCancelId', () => {
  it('reads a whole number only', () => {
    assert.equal(readCancelId({ id: 3 }), 3);
    assert.equal(readCancelId({ id: '3' }), undefined);
    assert.equal(readCancelId({ id: 1.5 }), undefined);
    assert.equal(readCancelId(null), undefined);
  });
});

describe('parseReminders', () => {
  it('keeps good items and drops broken ones', () => {
    const items = parseReminders([{ id: 1, chatId: 5, text: 'a', dueAt: 10 }, { id: 'x', chatId: 5, text: 'b', dueAt: 10 }, 7, { id: 2, chatId: 5, text: 'c' }]);
    assert.deepEqual(items, [{ id: 1, chatId: 5, text: 'a', dueAt: 10 }]);
    assert.deepEqual(parseReminders('broken'), []);
  });
});

describe('ReminderService', () => {
  it('saves, lists, sends, and cancels reminders by chat', () => {
    appEnv.dataDir = mkdtempSync(path.join(tmpdir(), 'reminders-'));
    const service = new ReminderService();
    const first = service.addReminder({ chatId: 1, text: 'later', dueAt: 200 });
    const second = service.addReminder({ chatId: 1, text: 'soon', dueAt: 100 });
    service.addReminder({ chatId: 2, text: 'other chat', dueAt: 50 });
    assert.deepEqual(service.listFor(1).map((item) => item.text), ['soon', 'later']);
    assert.deepEqual(service.listDue(120).map((item) => item.text), ['soon', 'other chat']);
    assert.equal(service.cancelReminder({ chatId: 2, id: first.id }), false);
    assert.equal(service.cancelReminder({ chatId: 1, id: first.id }), true);
    service.removeReminder(second.id);
    assert.deepEqual(service.listFor(1), []);
    assert.equal(new ReminderService().listFor(2).length, 1);
  });
});
