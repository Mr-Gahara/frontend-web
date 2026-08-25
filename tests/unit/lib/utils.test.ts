import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils - cn()', () => {
  it('harus menggabungkan string class biasa (Happy Path)', () => {
    expect(cn('p-4', 'bg-red-500')).toBe('p-4 bg-red-500');
  });

  it('harus menyelesaikan konflik class Tailwind (Edge Case)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });

  it('harus mengabaikan nilai falsy seperti null, undefined, dan false (Unhappy Path)', () => {
    expect(cn('p-4', null, undefined, false, 'text-center')).toBe('p-4 text-center');
  });

  it('harus mendukung format object dan array (Edge Case)', () => {
    expect(cn('p-4', ['flex', 'items-center'], { 'bg-blue-500': true, 'text-white': false }))
      .toBe('p-4 flex items-center bg-blue-500');
  });
});
