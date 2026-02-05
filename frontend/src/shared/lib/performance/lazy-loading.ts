/**
 * Lazy loading utilities for better performance
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced lazy loading with error boundary and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  displayName?: string
): LazyExoticComponent<T> {
  const LazyComponent = lazy(importFn);
  
  if (displayName) {
    (LazyComponent as any).displayName = `Lazy(${displayName})`;
  }
  
  return LazyComponent;
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): void {
  // Access the _payload to trigger preloading
  const payload = (lazyComponent as any)._payload;
  if (payload && payload._status === -1) {
    payload._result();
  }
}

/**
 * Create lazy route components with consistent loading
 * NOTE: Commented out - pages are located in app/app/ not pages/
 * These functions are not currently used in the codebase
 */
// export const createLazyRoute = {
//   /**
//    * Dashboard pages
//    */
//   dashboard: () => createLazyComponent(
//     () => import('@/pages/dashboard'),
//     'DashboardPage'
//   ),

//   /**
//    * Property pages
//    */
//   propertyDetails: () => createLazyComponent(
//     () => import('@/pages/property-details'),
//     'PropertyDetailsPage'
//   ),

//   propertySearch: () => createLazyComponent(
//     () => import('@/pages/property-search'),
//     'PropertySearchPage'
//   ),

//   /**
//    * Auth pages
//    */
//   login: () => createLazyComponent(
//     () => import('@/pages/auth/login'),
//     'LoginPage'
//   ),

//   register: () => createLazyComponent(
//     () => import('@/pages/auth/register'),
//     'RegisterPage'
//   ),

//   /**
//    * Admin pages
//    */
//   adminPanel: () => createLazyComponent(
//     () => import('@/pages/admin/panel'),
//     'AdminPanelPage'
//   ),
// };

/**
 * Create lazy modals
 * NOTE: Commented out - modals may not exist at these paths
 * These functions are not currently used in the codebase
 */
// export const createLazyModal = {
//   propertyDetails: () => createLazyComponent(
//     () => import('@/widgets/modals/property-details'),
//     'PropertyDetailsModal'
//   ),

//   editProfile: () => createLazyComponent(
//     () => import('@/widgets/modals/edit-profile'),
//     'EditProfileModal'
//   ),

//   addProperty: () => createLazyComponent(
//     () => import('@/widgets/modals/add-property'),
//     'AddPropertyModal'
//   ),
// };

/**
 * Intersection Observer for lazy loading images/components
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  constructor(options?: IntersectionObserverInit) {
    if (typeof window !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const callback = this.callbacks.get(entry.target);
              if (callback) {
                callback();
                this.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
          ...options,
        }
      );
    }
  }

  observe(element: Element, callback: () => void): void {
    if (this.observer) {
      this.callbacks.set(element, callback);
      this.observer.observe(element);
    }
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.callbacks.delete(element);
      this.observer.unobserve(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
    }
  }
}

// Global lazy loader instance
export const globalLazyLoader = new LazyLoader();