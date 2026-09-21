import { ErrorHandler, ErrorType } from './ErrorHandler';

/**
 * Permission levels
 */
export enum PermissionLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN'
}

/**
 * User roles with associated permissions
 */
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN'
}

/**
 * Permission mapping for roles
 */
const ROLE_PERMISSIONS: Record<UserRole, PermissionLevel[]> = {
  [UserRole.GUEST]: [PermissionLevel.READ],
  [UserRole.USER]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.DELETE],
  [UserRole.ADMIN]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.DELETE, PermissionLevel.ADMIN]
};

/**
 * Permission manager class
 */
export class PermissionManager {
  private static instance: PermissionManager;
  private currentRole: UserRole = UserRole.USER; // Default role

  private constructor() {
    // Initialize with default role
    this.loadRole();
  }

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Load user role from storage
   */
  private loadRole(): void {
    try {
      // Check if localStorage is available (not in server-side rendering)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedRole = localStorage.getItem('user_role');
        if (savedRole && Object.values(UserRole).includes(savedRole as UserRole)) {
          this.currentRole = savedRole as UserRole;
        }
      }
    } catch (error) {
      console.warn('Failed to load user role:', error);
      this.currentRole = UserRole.USER;
    }
  }

  /**
   * Save user role to storage
   */
  private saveRole(role: UserRole): void {
    try {
      // Check if localStorage is available (not in server-side rendering)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('user_role', role);
      }
    } catch (error) {
      console.warn('Failed to save user role:', error);
    }
  }

  /**
   * Get current user role
   */
  public getCurrentRole(): UserRole {
    return this.currentRole;
  }

  /**
   * Set user role
   */
  public setRole(role: UserRole): void {
    this.currentRole = role;
    this.saveRole(role);
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: PermissionLevel): boolean {
    const permissions = ROLE_PERMISSIONS[this.currentRole];
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the required permissions
   */
  public hasAnyPermission(permissions: PermissionLevel[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all required permissions
   */
  public hasAllPermissions(permissions: PermissionLevel[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Require specific permission
   * @throws Error if permission is not granted
   */
  public requirePermission(permission: PermissionLevel): void {
    if (!this.hasPermission(permission)) {
      const error = ErrorHandler.handleAuthError('权限不足');
      throw error;
    }
  }

  /**
   * Require any of the permissions
   * @throws Error if none of the permissions are granted
   */
  public requireAnyPermission(permissions: PermissionLevel[]): void {
    if (!this.hasAnyPermission(permissions)) {
      const error = ErrorHandler.handleAuthError('权限不足');
      throw error;
    }
  }

  /**
   * Require all permissions
   * @throws Error if any permission is not granted
   */
  public requireAllPermissions(permissions: PermissionLevel[]): void {
    if (!this.hasAllPermissions(permissions)) {
      const error = ErrorHandler.handleAuthError('权限不足');
      throw error;
    }
  }

  /**
   * Get permissions for current role
   */
  public getPermissions(): PermissionLevel[] {
    return ROLE_PERMISSIONS[this.currentRole];
  }

  /**
   * Check if user is admin
   */
  public isAdmin(): boolean {
    return this.currentRole === UserRole.ADMIN;
  }

  /**
   * Check if user is guest
   */
  public isGuest(): boolean {
    return this.currentRole === UserRole.GUEST;
  }

  /**
   * Check if user is regular user
   */
  public isUser(): boolean {
    return this.currentRole === UserRole.USER;
  }
}

export default PermissionManager.getInstance();
