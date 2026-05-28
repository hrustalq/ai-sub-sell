import "server-only";

export {
  isAdminEmail,
  getAdminSession,
  requireAdmin,
  requireAdminPanel,
  requireSupport,
  requireCoreAdmin,
  getAdminPanelSession,
  type AdminPanelSession,
} from "@/lib/admin/auth";
export {
  requireAdminApi,
  requireAdminPanelApi,
  requireSupportApi,
  requireCoreAdminApi,
} from "@/lib/admin/api";
export {
  seedAdminUser,
  getAdminSeedConfig,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_NAME,
} from "@/lib/admin/seed";
export {
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  getAdminUserPayments,
  getAdminPayments,
  getAdminActivityLog,
  type AdminStats,
  type AdminUserRow,
  type AdminPaymentRow,
} from "@/lib/admin/queries";
export type {
  AdminStatsSnapshot,
  AdminUserRecord,
  AdminUserDetailRecord,
  AdminPaymentRecord,
  AdminPlanRecord,
  AdminPlansProviderGroup,
  AdminLogEntry,
} from "@/lib/admin/types";
export { groupAdminPlansByProvider } from "@/lib/admin/plans-grouping";
export { getAdminPlanGroups, getAdminProviders, toAdminPlanRecord } from "@/lib/admin/plans";
