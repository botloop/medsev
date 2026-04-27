/**
 * Role-Based Access Control (RBAC) Permissions
 */
export const PERMISSIONS = {
    // Personnel permissions
    PERSONNEL_READ: 'personnel.read',
    PERSONNEL_CREATE: 'personnel.create',
    PERSONNEL_UPDATE: 'personnel.update',
    PERSONNEL_DELETE: 'personnel.delete',
    // Lab Results permissions
    LAB_RESULTS_READ: 'labResults.read',
    LAB_RESULTS_CREATE: 'labResults.create',
    LAB_RESULTS_DELETE: 'labResults.delete',
    // Medical Status permissions
    MEDICAL_UPDATE: 'medical.update',
    // User management permissions
    USER_READ: 'user.read',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    // Activity Log permissions
    ACTIVITY_LOG_READ: 'activityLog.read',
    // Analytics permissions
    ANALYTICS_READ: 'analytics.read',
    // Asset & Resource permissions
    ASSETS_READ: 'assets.read',
    ASSETS_WRITE: 'assets.write',
};
/**
 * Role Definitions with their associated permissions
 */
export const ROLE_PERMISSIONS = {
    admin: [
        PERMISSIONS.PERSONNEL_READ,
        PERMISSIONS.PERSONNEL_CREATE,
        PERMISSIONS.PERSONNEL_UPDATE,
        PERMISSIONS.PERSONNEL_DELETE,
        PERMISSIONS.LAB_RESULTS_READ,
        PERMISSIONS.LAB_RESULTS_CREATE,
        PERMISSIONS.LAB_RESULTS_DELETE,
        PERMISSIONS.MEDICAL_UPDATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_DELETE,
        PERMISSIONS.ACTIVITY_LOG_READ,
        PERMISSIONS.ANALYTICS_READ,
        PERMISSIONS.ASSETS_READ,
        PERMISSIONS.ASSETS_WRITE,
    ],
    medical: [
        PERMISSIONS.PERSONNEL_READ,
        PERMISSIONS.PERSONNEL_CREATE,
        PERMISSIONS.PERSONNEL_UPDATE,
        PERMISSIONS.LAB_RESULTS_READ,
        PERMISSIONS.LAB_RESULTS_CREATE,
        PERMISSIONS.MEDICAL_UPDATE,
        PERMISSIONS.ACTIVITY_LOG_READ,
        PERMISSIONS.ANALYTICS_READ,
        PERMISSIONS.ASSETS_READ,
    ],
    viewer: [
        PERMISSIONS.PERSONNEL_READ,
        PERMISSIONS.LAB_RESULTS_READ,
        PERMISSIONS.ANALYTICS_READ,
    ],
};
export function getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}
export function hasPermission(userPermissions, requiredPermission) {
    return userPermissions.includes(requiredPermission);
}
//# sourceMappingURL=permissions.js.map