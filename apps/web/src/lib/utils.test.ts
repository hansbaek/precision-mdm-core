import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('클래스들을 합친다', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('falsy/조건부 클래스를 걸러낸다', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('충돌하는 tailwind 클래스는 뒤쪽이 이긴다 (twMerge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
