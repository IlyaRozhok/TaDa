/**
 * Centralized type definitions for TaDa application
 * 
 * This file serves as the single source of truth for all domain types.
 * All components should import types from here instead of defining their own.
 */

// Re-export all domain types
export * from './user';
export * from './property';
export * from './building';
export * from './preferences';
export * from './api';
export * from './common';