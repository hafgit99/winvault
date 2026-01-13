/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateURL, checkForInjection, validatePassword } from '../../src/utils/validation';

describe('Input Validation & Sanitization Security', () => {

    describe('Sanitization', () => {
        it('should remove XSS script tags from text input', () => {
            const dangerous = '<script>alert("hacked")</script>My Service';
            const sanitized = sanitizeInput(dangerous, 'text');
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toBe('alert("hacked")My Service'); // Basic sanitization removes tags
        });

        it('should block dangerous URL protocols', () => {
            const payloads = [
                'javascript:alert(1)',
                'data:text/html,<script>alert(1)</script>',
                'vbscript:msgbox("hi")'
            ];
            payloads.forEach(payload => {
                const sanitized = sanitizeInput(payload, 'url');
                expect(sanitized.toLowerCase()).not.toContain('javascript:');
                expect(sanitized.toLowerCase()).not.toContain('data:');
                expect(sanitized.toLowerCase()).not.toContain('vbscript:');
            });
        });
    });

    describe('Injection Detection', () => {
        it('should detect SQL injection patterns', () => {
            const sqlInjections = [
                "admin' OR '1'='1",
                "'; DROP TABLE users; --",
                "UNION SELECT password FROM users"
            ];
            sqlInjections.forEach(input => {
                const check = checkForInjection(input);
                expect(check.isSafe).toBe(false);
                expect(check.threats).toContain('SQL injection attempt detected');
            });
        });

        it('should detect Command injection patterns', () => {
            const commandInjections = [
                "test; rm -rf /",
                "$(whoami)",
                "`ls`",
                "& notepad.exe"
            ];
            commandInjections.forEach(input => {
                const check = checkForInjection(input);
                expect(check.isSafe).toBe(false);
                expect(check.threats).toContain('Command injection attempt detected');
            });
        });
    });

    describe('Credential Policy', () => {
        it('should reject common weak passwords', () => {
            const weak = ['123456', 'password', 'qwerty'];
            weak.forEach(pwd => {
                const status = validatePassword(pwd);
                expect(status.isValid).toBe(false);
                expect(status.errors).toContain('This is a commonly used password');
            });
        });

        it('should reject passwords with sequential values', () => {
            const status = validatePassword('MyPass123456!');
            expect(status.isValid).toBe(false);
            expect(status.errors).toContain('Avoid sequential numbers');
        });
    });

    describe('URL Validation', () => {
        it('should accept valid HTTPS URLs', () => {
            const result = validateURL('https://google.com');
            if (!result.isValid) console.log('URL Validation Fail Errors:', result.errors);
            expect(result.isValid).toBe(true);
        });

        it('should reject malformed URLs', () => {
            const badURLs = [
                'not-a-url',
                'http:///invalid',
                'ftp://server.com' // only http/https allowed in pattern
            ];
            badURLs.forEach(url => {
                const result = validateURL(url);
                expect(result.isValid).toBe(false);
            });
        });
    });
});
