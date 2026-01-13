/** @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import AddEditModal from '../../src/components/Vault/Modals/AddEditModal';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// Mock utils/index
vi.mock('../../src/utils', async () => {
    return {
        TRANSLATIONS: {
            'en': {
                siteName: 'Site Name',
                placeholderSiteName: 'Example.com',
                selectCategory: 'Category',
                username: 'Username',
                placeholderUsername: 'User',
                password: 'Password',
                placeholderAlias: 'Alias',
                alias: 'Alias',
                random: 'Random',
                tabLogin: 'Login',
                tabCard: 'Card',
                tabNote: 'Note',
                documents: 'Docs',
                addAccount: 'Add Account',
                editAccount: 'Edit Account'
            }
        },
        convertFileToBase64: vi.fn(),
        generatePasswordFromSettings: vi.fn(),
        downloadAttachment: vi.fn(),
    };
});

// Mock utils/validation
vi.mock('../../src/utils/validation', () => {
    return {
        validateURL: (url: string) => {
            if (url.includes('javascript:')) return { isValid: false, errors: ['Invalid protocol'] };
            if (!url.includes('.')) return { isValid: false, errors: ['Invalid domain'] };
            return { isValid: true, errors: [] };
        }
    };
});

describe('AddEditModal Validation', () => {
    const defaultProps = {
        editingId: null,
        categories: [{ id: '1', name: 'General', isSystem: true }],
        onClose: vi.fn(),
        onAdd: vi.fn(),
        onUpdate: vi.fn(),
        lang: 'en' as const,
        generatorSettings: {} as any,
    };

    it('should show error for invalid URL starting with http', () => {
        render(<AddEditModal {...defaultProps} />);

        // Debug
        // screen.debug(); 

        const siteInputs = screen.getAllByTestId('site-name-input');
        const siteInput = siteInputs[0];

        // Enter invalid URL
        fireEvent.change(siteInput, { target: { value: 'http://invalid-url-without-dot' } });

        // Should show error because our mock says no dot = invalid
        expect(screen.getByText('Invalid URL format')).toBeDefined();
    });

    it('should NOT show error for valid URL', () => {
        render(<AddEditModal {...defaultProps} />);

        const siteInputs = screen.getAllByTestId('site-name-input');
        const siteInput = siteInputs[0];

        fireEvent.change(siteInput, { target: { value: 'https://google.com' } });

        // Should NOT show error
        expect(screen.queryByText('Invalid URL format')).toBeNull();
    });

    it('should NOT validate plain text site names', () => {
        render(<AddEditModal {...defaultProps} />);

        const siteInputs = screen.getAllByTestId('site-name-input');
        const siteInput = siteInputs[0];

        fireEvent.change(siteInput, { target: { value: 'My Bank Account' } });

        expect(screen.queryByText('Invalid URL format')).toBeNull();
    });
});
