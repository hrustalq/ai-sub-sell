import "server-only";

export { isCoreAdminEmail, getCoreAdminEmails } from "@/lib/rbac/core-admin";
export {
  resolveUserPermissions,
  getUserPermissionsById,
  getUserPermissionsByEmail,
} from "@/lib/rbac/permissions";
export {
  ADMIN_NAV_ITEMS,
  getAdminNavItems,
  getAdminPanelHomeHref,
  type AdminNavItemConfig,
} from "@/lib/rbac/navigation";
export type { UserPermissions, UserRbacFlags } from "@/lib/rbac/types";
