import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useState } from 'react';

const useCounter = () => {
    const [count, setCount] = useState(0);
    const increment = () => setCount(c => c + 1);
    return { count, increment };
};

describe('Minimal React Test', () => {
    it('should use renderHook', () => {
        const { result } = renderHook(() => useCounter());
        expect(result.current.count).toBe(0);
    });
});
