/**
 * The option and state types live next to the store creators. This file only
 * re-exports them so the two definitions can never drift apart.
 */
export type { EntityStoreOptions, EntityState, EntityActions, EntityPatch, EntityStore } from '../entity.store';
export type { EntitiesStoreOptions } from '../entities.store';
export type { ZentyMiddleware } from './middleware.types';
