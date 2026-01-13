/** @vitest-environment jsdom */
import { renderHook, act } from '@testing-library/react';
import { useClipboardTimeout } from '../../src/hooks/useClipboardTimeout';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useClipboardTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(),
            },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should copy text to clipboard', () => {
        const { result } = renderHook(() => useClipboardTimeout());

        act(() => {
            result.current('my-password');
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('my-password');
    });

    it('should clear clipboard after 5 seconds', () => {
        const { result } = renderHook(() => useClipboardTimeout({ timeout: 5000 }));

        act(() => {
            result.current('my-password');
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('my-password');

        // Fast-forward time
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });

    it('should call onCopy and onClear callbacks', () => {
        const onCopy = vi.fn();
        const onClear = vi.fn();

        const { result } = renderHook(() => useClipboardTimeout({
            timeout: 5000,
            onCopy,
            onClear
        }));

        act(() => {
            result.current('test');
        });

        expect(onCopy).toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(onClear).toHaveBeenCalled();
    });

    it('it should reset timer if copied again before timeout', () => {
        const { result } = renderHook(() => useClipboardTimeout({ timeout: 5000 }));

        act(() => {
            result.current('pass1');
        });

        // Advance 3s
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // Copy again
        act(() => {
            result.current('pass2');
        });

        // Advance another 3s (total 6s from start, but only 3s from second copy)
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // Should NOT have cleared yet (last call was pass2)
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('pass2');

        // Advance remaining 2s
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('');
    });
});
