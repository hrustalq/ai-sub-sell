export type UserRbacFlags = {
  rbacAdmin: boolean;
  rbacSupport: boolean;
};

export type UserPermissions = UserRbacFlags & {
  isCoreAdmin: boolean;
  canAccessAdminPanel: boolean;
  canAccessAdmin: boolean;
  canAccessSupport: boolean;
  canManageRbac: boolean;
};
