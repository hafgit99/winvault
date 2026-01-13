import { useCallback, useEffect, useRef } from 'react';

interface UseClipboardTimeoutProps {
    onCopy?: () => void;
    onClear?: () => void;
    timeout?: number;
}

export const useClipboardTimeout = ({ onCopy, onClear, timeout = 5000 }: UseClipboardTimeoutProps = {}) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const copyWithTimeout = useCallback((text: string) => {
        // Clear existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        navigator.clipboard.writeText(text);
        if (onCopy) onCopy();

        timerRef.current = setTimeout(() => {
            navigator.clipboard.writeText('');
            if (onClear) onClear();
        }, timeout);
    }, [onCopy, onClear, timeout]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return copyWithTimeout;
};
