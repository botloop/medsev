/**
 * Role-Based Access Control (RBAC) Permissions
 */
export declare const PERMISSIONS: {
    readonly PERSONNEL_READ: "personnel.read";
    readonly PERSONNEL_CREATE: "personnel.create";
    readonly PERSONNEL_UPDATE: "personnel.update";
    readonly PERSONNEL_DELETE: "personnel.delete";
    readonly LAB_RESULTS_READ: "labResults.read";
    readonly LAB_RESULTS_CREATE: "labResults.create";
    readonly LAB_RESULTS_DELETE: "labResults.delete";
    readonly MEDICAL_UPDATE: "medical.update";
    readonly USER_READ: "user.read";
    readonly USER_UPDATE: "user.update";
    readonly USER_DELETE: "user.delete";
    readonly ACTIVITY_LOG_READ: "activityLog.read";
    readonly ANALYTICS_READ: "analytics.read";
    readonly ASSETS_READ: "assets.read";
    readonly ASSETS_WRITE: "assets.write";
};
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
/**
 * Role Definitions with their associated permissions
 */
export declare const ROLE_PERMISSIONS: Record<string, Permission[]>;
export declare function getRolePermissions(role: string): Permission[];
export declare function hasPermission(userPermissions: string[], requiredPermission: string): boolean;
//# sourceMappingURL=permissions.d.ts.map