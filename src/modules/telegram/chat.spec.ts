import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isDataFile } from './isDataFile';
import { isPureHint } from './isPureHint';
import { stateFacts } from './stateFacts';
import { wantsAnalysis } from './wantsAnalysis';

describe('isPureHint', () => {
  it('takes a message that has only a period or a date', () => {
    assert.equal(isPureHint('продажи 27-29,10'), true);
    assert.equal(isPureHint('23,10-29,10'), true);
    assert.equal(isPureHint('остатки на 29,10'), true);
    assert.equal(isPureHint('продажи с 23,10 по 29, остатки на 29,10'), true);
  });

  it('sends a question or a talk to Claude', () => {
    assert.equal(isPureHint('почему продажи 21.10 не записались?'), false);
    assert.equal(isPureHint('привет, как дела'), false);
    assert.equal(isPureHint('что ты умеешь'), false);
  });
});

describe('stateFacts', () => {
  it('says what is missing for the table', () => {
    const text = stateFacts({ stock: Buffer.from('x'), period: '21-26,10' });
    assert.match(text, /Already received for the table: файл остатков/);
    assert.match(text, /Still missing for the table: файл продаж/);
    assert.match(text, /Sales period: 21-26,10/);
  });
});

describe('wantsAnalysis', () => {
  it('finds a request to analyze', () => {
    assert.equal(wantsAnalysis('проанализируй продажи'), true);
    assert.equal(wantsAnalysis('Посчитай топ 5 и дай рекомендации'), true);
    assert.equal(wantsAnalysis('какие выводы?'), true);
  });

  it('does not take a plain caption with a period', () => {
    assert.equal(wantsAnalysis('продажи 21-26.10'), false);
    assert.equal(wantsAnalysis('остатки на 29,10'), false);
    assert.equal(wantsAnalysis(''), false);
  });
});

describe('isDataFile', () => {
  it('opens tables and data, not other files', () => {
    assert.equal(isDataFile('продажи.xlsx'), true);
    assert.equal(isDataFile('Данные.CSV'), true);
    assert.equal(isDataFile('список.txt'), true);
    assert.equal(isDataFile('фото.jpg'), false);
    assert.equal(isDataFile(''), false);
  });
});
