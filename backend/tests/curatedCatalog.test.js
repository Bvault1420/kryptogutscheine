import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCuratedIds,
  curatedCatalogSize,
  isCuratedProductId,
  isCuratedIdBlocked,
} from '../data/curatedCatalog.js';

describe('curated catalog size', () => {
  test('Germany has substantially more cards', () => {
    assert.ok(curatedCatalogSize('DE') >= 140, `DE only ${curatedCatalogSize('DE')}`);
  });

  test('Austria expanded beyond minimum', () => {
    assert.ok(curatedCatalogSize('AT') >= 20, `AT only ${curatedCatalogSize('AT')}`);
  });

  test('Switzerland expanded beyond minimum', () => {
    assert.ok(curatedCatalogSize('CH') >= 18, `CH only ${curatedCatalogSize('CH')}`);
  });

  test('blocks risky patterns in curated list', () => {
    for (const id of getCuratedIds('DE')) {
      assert.equal(isCuratedIdBlocked(id), false, `blocked id in DE list: ${id}`);
    }
  });

  test('new DE cards are in whitelist', () => {
    assert.equal(isCuratedProductId('intersport-germany', 'DE'), true);
    assert.equal(isCuratedProductId('mydays-de', 'DE'), true);
    assert.equal(isCuratedProductId('canda-pin-germany', 'DE'), true);
    assert.equal(isCuratedProductId('tiktok-coins-germany', 'DE'), true);
  });
});
