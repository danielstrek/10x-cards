import { describe, it, expect, vi } from 'vitest';

describe('Example Unit Test Suite', () => {
  it('should pass a simple assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should work with mocks', () => {
    const mockFn = vi.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalledOnce();
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should work with async code', async () => {
    const asyncFn = async () => {
      return Promise.resolve('success');
    };

    const result = await asyncFn();
    expect(result).toBe('success');
  });
});

