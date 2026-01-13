import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureClipboard } from '../../src/utils/memorySecurity';

describe('Secure Clipboard Security Service', () => {
    // Mock navigator.clipboard
    const clipboardMock = {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        // Setup global mock for navigator
        Object.defineProperty(global, 'navigator', {
            value: { clipboard: clipboardMock },
            configurable: true
        });
    });

    it('should copy text to clipboard successfully', async () => {
        const text = 'secret-password-123';
        await SecureClipboard.copy(text, 5000);

        expect(clipboardMock.writeText).toHaveBeenCalledWith(text);
    });

    it('should auto-clear clipboard after 5 seconds', async () => {
        const text = 'sensitive-data';
        await SecureClipboard.copy(text, 5000);

        // Confirm it was written
        expect(clipboardMock.writeText).toHaveBeenCalledWith(text);

        // Fast-forward 5 seconds
        await vi.advanceTimersByTimeAsync(5000);

        // Confirm it was cleared (writeText called with empty string)
        expect(clipboardMock.writeText).toHaveBeenLastCalledWith('');
    });

    it('should clear existing timeout if new copy occurs', async () => {
        const text1 = 'first-password';
        const text2 = 'second-password';

        await SecureClipboard.copy(text1, 5000);

        // Wait 2 seconds
        await vi.advanceTimersByTimeAsync(2000);

        // Copy new password
        await SecureClipboard.copy(text2, 5000);

        // Wait another 3.5 seconds (total 5.5s from first copy, 3.5s from second)
        await vi.advanceTimersByTimeAsync(3500);

        // First copy timer should have been cleared, so it shouldn't have been cleared yet
        // Last call should still be the second password
        expect(clipboardMock.writeText).toHaveBeenLastCalledWith(text2);

        // Wait another 2 seconds (total 5.5s from second copy)
        await vi.advanceTimersByTimeAsync(2000);

        // Now it should be cleared
        expect(clipboardMock.writeText).toHaveBeenLastCalledWith('');
    });
});
