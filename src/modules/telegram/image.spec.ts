import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { imageType } from './imageType';

describe('imageType', () => {
  it('knows the pictures that Claude can see', () => {
    assert.equal(imageType('фото.JPG'), 'image/jpeg');
    assert.equal(imageType('screen.png'), 'image/png');
    assert.equal(imageType('a.b.webp'), 'image/webp');
  });

  it('does not take data files or names without a type', () => {
    assert.equal(imageType('продажи.xlsx'), undefined);
    assert.equal(imageType('picture'), undefined);
    assert.equal(imageType(''), undefined);
  });
});
