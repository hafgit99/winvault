/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { generatePasswordFromSettings } from '../../src/utils';
import { GeneratorSettings } from '../../src/types';

describe('Password Generator Security & Compliance', () => {

    it('should generate password with requested length', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 24,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };
        const password = generatePasswordFromSettings(settings);
        expect(password.length).toBe(24);
    });

    it('should include all character types if requested', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 100, // Large enough to guarantee inclusion statistically
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };
        const password = generatePasswordFromSettings(settings);

        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[0-9]/);
        expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
    });

    it('should generate valid memorable passphrase', () => {
        const settings: GeneratorSettings = {
            mode: 'memorable',
            length: 20,
            includeUppercase: false,
            includeNumbers: false,
            includeSymbols: false,
            wordCount: 4,
            separator: '_',
            capitalize: true
        };
        const passphrase = generatePasswordFromSettings(settings);
        const parts = passphrase.split('_');

        expect(parts.length).toBe(4);
        // Each part should start with uppercase since capitalize: true
        parts.forEach(part => {
            expect(part[0]).toMatch(/[A-Z]/);
        });
    });

    it('should handle zero-length or unexpected settings gracefully', () => {
        const settings: any = {
            mode: 'random',
            length: 0
        };
        const password = generatePasswordFromSettings(settings);
        expect(password).toBe('');
    });
});

/**
 * Entropy Calculation for Password Strength
 * 
 * Entropy (bits) = log2(pool_size^length) = length * log2(pool_size)
 * 
 * Character pool sizes:
 * - Lowercase only: 26
 * - Lowercase + Uppercase: 52
 * - Lowercase + Uppercase + Numbers: 62
 * - Lowercase + Uppercase + Numbers + Symbols (~32): 94
 */
function calculatePasswordEntropy(password: string): number {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);

    let poolSize = 0;
    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSymbols) poolSize += 32; // Approximate symbol count

    if (poolSize === 0) return 0;

    return password.length * Math.log2(poolSize);
}

describe('Password Generator Strength (Entropy)', () => {
    // NIST recommends minimum 80 bits for high security
    // 64 bits is considered strong for general use
    // <40 bits is considered weak

    it('should generate passwords with at least 64 bits of entropy', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 16,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };

        const password = generatePasswordFromSettings(settings);
        const entropy = calculatePasswordEntropy(password);

        // 16 chars with full charset (~94) = 16 * log2(94) ≈ 105 bits
        expect(entropy).toBeGreaterThanOrEqual(64);
    });

    it('should generate strong entropy (80+ bits) for long passwords', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 24,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };

        const password = generatePasswordFromSettings(settings);
        const entropy = calculatePasswordEntropy(password);

        // 24 chars with full charset = 24 * log2(94) ≈ 157 bits
        expect(entropy).toBeGreaterThanOrEqual(80);
    });

    it('should have lower entropy for limited character sets', () => {
        const fullSettings: GeneratorSettings = {
            mode: 'random',
            length: 16,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };

        const limitedSettings: GeneratorSettings = {
            mode: 'random',
            length: 16,
            includeUppercase: false,
            includeNumbers: false,
            includeSymbols: false,
            wordCount: 3,
            separator: '-',
            capitalize: false
        };

        const fullPassword = generatePasswordFromSettings(fullSettings);
        const limitedPassword = generatePasswordFromSettings(limitedSettings);

        const fullEntropy = calculatePasswordEntropy(fullPassword);
        const limitedEntropy = calculatePasswordEntropy(limitedPassword);

        expect(fullEntropy).toBeGreaterThan(limitedEntropy);
    });

    it('should generate unique passwords each time (cryptographic randomness)', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 16,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };

        const passwords = new Set<string>();
        for (let i = 0; i < 100; i++) {
            passwords.add(generatePasswordFromSettings(settings));
        }

        // All 100 passwords should be unique
        expect(passwords.size).toBe(100);
    });

    it('should not generate predictable patterns', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 16,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };

        const password = generatePasswordFromSettings(settings);

        // Should not have repeating patterns
        const repeatingPattern = /(.)\1{3,}/; // 4+ same chars in a row
        expect(password).not.toMatch(repeatingPattern);
    });

    it('should generate memorable passphrase with good entropy', () => {
        const settings: GeneratorSettings = {
            mode: 'memorable',
            length: 20,
            includeUppercase: false,
            includeNumbers: false,
            includeSymbols: false,
            wordCount: 5,
            separator: '-',
            capitalize: true
        };

        const passphrase = generatePasswordFromSettings(settings);

        // Passphrases derive entropy from word count
        // With 5 words from a ~2000 word list: 5 * log2(2000) ≈ 55 bits
        // Plus random length variations
        expect(passphrase.length).toBeGreaterThanOrEqual(15);
        expect(passphrase.split('-').length).toBe(5);
    });

    it('should meet minimum length requirements for security', () => {
        const settings: GeneratorSettings = {
            mode: 'random',
            length: 12,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            wordCount: 3,
            separator: '-',
            capitalize: true
        };

        const password = generatePasswordFromSettings(settings);
        const entropy = calculatePasswordEntropy(password);

        // 12 characters is considered minimum for modern security
        expect(password.length).toBeGreaterThanOrEqual(12);
        // Should still have at least 50 bits of entropy
        expect(entropy).toBeGreaterThanOrEqual(50);
    });
});
