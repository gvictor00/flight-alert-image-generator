import { describe, expect, it } from 'vitest';
import { matchDestinationPhotoKey, photoPathForDestination } from './destination-photos';

describe('ECMv2 destination photo mapping', () => {
  it.each([
    ['Atenas', 'atenas'],
    ['Boston', 'boston'],
    ['Cancun', 'cancun'],
    ['Copenhague', 'copenhague'],
    ['Pequim', 'pequim'],
    ['Toronto', 'toronto'],
    ['Veneza', 'veneza']
  ])('matches %s', (input, key) => {
    expect(matchDestinationPhotoKey(input)).toBe(key);
  });

  it('returns default and Go Miles bank paths', () => {
    expect(photoPathForDestination('Boston')).toBe('/assets/destinations/html/default/boston.jpg');
    expect(photoPathForDestination('Boston', true)).toBe('/assets/destinations/html/gomiles/boston.jpg');
  });
});
