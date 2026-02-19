/**
 * Storage Service - Abstraction layer for consultation data storage
 *
 * This service provides a unified interface for storing and retrieving consultations.
 * Primary storage: PostgreSQL database (via supabaseService)
 * Fallback storage: localStorage (for offline/error scenarios)
 *
 * Phase 4: Supabase Storage & Migration
 */

import { Consultation } from '../types';
import {
    saveConsultation,
    getAllConsultations,
    getConsultationById,
    checkConnection,
    SupabaseError
} from './supabaseService';

// Storage type enum
export type StorageType = 'postgresql' | 'localstorage';

// Storage health check result
export interface StorageHealth {
    type: StorageType;
    available: boolean;
    latency?: number; // ms
    error?: string;
}

// Migration result
export interface MigrationResult {
    success: boolean;
    migrated: number;
    failed: number;
    errors: string[];
}

/**
 * Get the current storage type based on availability
 */
export async function getStorageType(): Promise<StorageType> {
    const isAvailable = await checkConnection();
    return isAvailable ? 'postgresql' : 'localstorage';
}

/**
 * Check health of all storage backends
 */
export async function checkStorageHealth(): Promise<StorageHealth[]> {
    const results: StorageHealth[] = [];

    // Check PostgreSQL
    const pgStart = performance.now();
    try {
        const available = await checkConnection();
        const latency = performance.now() - pgStart;
        results.push({
            type: 'postgresql',
            available,
            latency: available ? latency : undefined,
            error: available ? undefined : 'Database connection failed'
        });
    } catch (error) {
        results.push({
            type: 'postgresql',
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    // Check localStorage
    try {
        localStorage.setItem('health-check', 'test');
        localStorage.removeItem('health-check');
        results.push({
            type: 'localstorage',
            available: true
        });
    } catch (error) {
        results.push({
            type: 'localstorage',
            available: false,
            error: error instanceof Error ? error.message : 'localStorage not available'
        });
    }

    return results;
}

/**
 * Save a consultation to the best available storage
 */
export async function saveConsultationToStorage(
    consultation: Consultation
): Promise<{ storage: StorageType; consultation: Consultation }> {
    const storageType = await getStorageType();

    if (storageType === 'postgresql') {
        try {
            // Encode attachment data as base64 if not already encoded
            const encodedConsultation = encodeAttachments(consultation);
            await saveConsultation(encodedConsultation);

            // Also save to localStorage as backup
            await saveToLocalStorage(encodedConsultation);

            return { storage: 'postgresql', consultation: encodedConsultation };
        } catch (error) {
            console.warn('PostgreSQL save failed, falling back to localStorage:', error);
            // Fall back to localStorage
            await saveToLocalStorage(consultation);
            return { storage: 'localstorage', consultation };
        }
    }

    // Use localStorage
    await saveToLocalStorage(consultation);
    return { storage: 'localstorage', consultation };
}

/**
 * Load all consultations from the best available storage
 */
export async function loadConsultationsFromStorage(): Promise<{
    storage: StorageType;
    consultations: Consultation[];
}> {
    const storageType = await getStorageType();

    if (storageType === 'postgresql') {
        try {
            const consultations = await getAllConsultations();

            // Also update localStorage as cache
            await syncToLocalStorage(consultations);

            return { storage: 'postgresql', consultations };
        } catch (error) {
            console.warn('PostgreSQL load failed, falling back to localStorage:', error);
            const consultations = await loadFromLocalStorage();
            return { storage: 'localstorage', consultations };
        }
    }

    // Use localStorage
    const consultations = await loadFromLocalStorage();
    return { storage: 'localstorage', consultations };
}

/**
 * Load a specific consultation by ID
 */
export async function loadConsultationById(
    id: string
): Promise<{ storage: StorageType; consultation: Consultation | null }> {
    const storageType = await getStorageType();

    if (storageType === 'postgresql') {
        try {
            const consultation = await getConsultationById(id);
            if (consultation) {
                consultation.attachments = decodeAttachments(consultation.attachments);
            }
            return { storage: 'postgresql', consultation };
        } catch (error) {
            console.warn('PostgreSQL load failed, checking localStorage:', error);
        }
    }

    // Check localStorage
    const consultations = await loadFromLocalStorage();
    const consultation = consultations.find(c => c.id === id) || null;
    return { storage: 'localstorage', consultation };
}

/**
 * Migrate all consultations from localStorage to PostgreSQL
 */
export async function migrateFromLocalStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
        success: true,
        migrated: 0,
        failed: 0,
        errors: []
    };

    try {
        // Check if PostgreSQL is available
        const isAvailable = await checkConnection();
        if (!isAvailable) {
            throw new Error('PostgreSQL is not available for migration');
        }

        // Load consultations from localStorage
        const localConsultations = await loadFromLocalStorage();

        if (localConsultations.length === 0) {
            result.success = true;
            return result;
        }

        // Migrate each consultation
        for (const consultation of localConsultations) {
            try {
                // Encode attachments for database storage
                const encoded = encodeAttachments(consultation);
                await saveConsultation(encoded);
                result.migrated++;
            } catch (error) {
                result.failed++;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                result.errors.push(`${consultation.id}: ${errorMsg}`);
            }
        }

        // If all migrations succeeded, clear localStorage
        if (result.failed === 0 && result.migrated > 0) {
            await clearLocalStorage();
        }

        result.success = result.failed === 0;
    } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
}

/**
 * Check if migration is needed
 */
export async function isMigrationNeeded(): Promise<boolean> {
    const isPostgresAvailable = await checkConnection();
    if (!isPostgresAvailable) {
        return false; // Can't migrate if PostgreSQL is unavailable
    }

    const localConsultations = await loadFromLocalStorage();
    if (localConsultations.length === 0) {
        return false; // Nothing to migrate
    }

    // Check if PostgreSQL has any consultations
    try {
        const dbConsultations = await getAllConsultations();
        // If we have local data but no DB data, migration is needed
        return dbConsultations.length === 0;
    } catch {
        return true; // Assume migration needed if DB check fails
    }
}

// ============================================
// Helper Functions
// ============================================

const STORAGE_KEY = 'consultations';

/**
 * Encode attachments for database storage
 * Converts raw data to base64 if needed
 */
function encodeAttachments(consultation: Consultation): Consultation {
    return {
        ...consultation,
        attachments: consultation.attachments.map(att => ({
            ...att,
            data: att.data.startsWith('data:') ? att.data : `data:${att.mimeType};base64,${att.data}`
        }))
    };
}

/**
 * Decode attachments from database storage
 */
function decodeAttachments(attachments: { name: string; mimeType: string; data: string }[]): { name: string; mimeType: string; data: string }[] {
    return attachments.map(att => ({
        ...att,
        data: att.data || '' // Ensure data is always a string
    }));
}

/**
 * Save to localStorage
 */
async function saveToLocalStorage(consultation: Consultation): Promise<void> {
    const consultations = await loadFromLocalStorage();
    const existingIndex = consultations.findIndex(c => c.id === consultation.id);

    if (existingIndex >= 0) {
        consultations[existingIndex] = consultation;
    } else {
        consultations.push(consultation);
    }

    // Sort by timestamp descending
    consultations.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultations));
}

/**
 * Load from localStorage
 */
async function loadFromLocalStorage(): Promise<Consultation[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        return [];
    }

    try {
        const consultations: Consultation[] = JSON.parse(data);
        return consultations;
    } catch (error) {
        console.error('Failed to parse localStorage data:', error);
        return [];
    }
}

/**
 * Sync consultations to localStorage (as cache)
 */
async function syncToLocalStorage(consultations: Consultation[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultations));
}

/**
 * Clear all consultations from localStorage
 */
async function clearLocalStorage(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    console.log('localStorage cleared after successful migration');
}
