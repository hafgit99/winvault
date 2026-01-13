/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from '../../src/store/useVaultStore';

describe('Vault Store CRUD Operations', () => {

    beforeEach(() => {
        // Reset store state
        useVaultStore.setState({
            credentials: [],
            categories: [
                { id: 'General', name: 'Genel', isSystem: true }
            ]
        });
    });

    it('should add a new credential', () => {
        const store = useVaultStore.getState();
        const newEntry = {
            type: 'LOGIN' as const,
            siteName: 'Test Service',
            username: 'testuser',
            passwordValue: 'password123',
            category: 'General'
        };

        store.addCredential(newEntry);

        const updatedStore = useVaultStore.getState();
        expect(updatedStore.credentials.length).toBe(1);
        expect(updatedStore.credentials[0].siteName).toBe('Test Service');
        expect(updatedStore.credentials[0].id).toBeDefined();
        expect(updatedStore.credentials[0].updatedAt).toBeDefined();
    });

    it('should handle soft delete (Trash)', () => {
        const store = useVaultStore.getState();
        store.addCredential({ type: 'LOGIN', siteName: 'To Delete', username: 'u', passwordValue: 'p', category: 'General' });

        const entryId = useVaultStore.getState().credentials[0].id;

        // Soft delete
        store.deleteCredential(entryId);

        let credentials = useVaultStore.getState().credentials;
        expect(credentials[0].deletedAt).toBeDefined();

        // Restore
        store.restoreCredential(entryId);
        credentials = useVaultStore.getState().credentials;
        expect(credentials[0].deletedAt).toBeUndefined();
    });

    it('should permanent delete and empty trash', () => {
        const store = useVaultStore.getState();
        store.addCredential({ type: 'LOGIN', siteName: 'A', username: 'u', passwordValue: 'p', category: 'General' });
        store.addCredential({ type: 'LOGIN', siteName: 'B', username: 'u', passwordValue: 'p', category: 'General' });

        const entryAId = useVaultStore.getState().credentials[1].id;

        // Soft delete A
        store.deleteCredential(entryAId);

        // Empty trash
        store.emptyTrash();

        const credentials = useVaultStore.getState().credentials;
        expect(credentials.length).toBe(1);
        expect(credentials[0].siteName).toBe('B');
    });

    it('should maintain password history on update', () => {
        const store = useVaultStore.getState();
        store.addCredential({ type: 'LOGIN', siteName: 'History Test', username: 'u', passwordValue: 'v1', category: 'General' });

        const entryId = useVaultStore.getState().credentials[0].id;

        // Update password
        store.updateCredential(entryId, { passwordValue: 'v2' });

        const entry = useVaultStore.getState().credentials[0];
        expect(entry.passwordValue).toBe('v2');
        expect(entry.history?.length).toBe(1);
        expect(entry.history?.[0].value).toBe('v1');
    });

    it('should prevent deleting system categories', () => {
        const store = useVaultStore.getState();
        // Try to delete 'General' which is isSystem: true
        store.deleteCategory('General');

        const categories = useVaultStore.getState().categories;
        expect(categories.find(c => c.id === 'General')).toBeDefined();
    });
});
