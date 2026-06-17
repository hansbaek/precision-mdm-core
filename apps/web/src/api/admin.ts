import { axiosInstance } from '.';
import type {
  AdminMenu,
  AdminRole,
  AdminUser,
  RoleMenuPermission,
} from '@/types';

// ---- Roles ----
export const listRoles = (): Promise<AdminRole[]> =>
  axiosInstance.get('/admin/roles').then((r) => r.data);

export const createRole = (data: {
  roleId: string;
  roleNm: string;
  sortOrder?: number;
}): Promise<AdminRole> =>
  axiosInstance.post('/admin/roles', data).then((r) => r.data);

export const updateRole = (
  roleId: string,
  data: { roleNm?: string; sortOrder?: number; useYn?: string },
): Promise<AdminRole> =>
  axiosInstance.patch(`/admin/roles/${roleId}`, data).then((r) => r.data);

export const deleteRole = (roleId: string): Promise<{ ok: boolean }> =>
  axiosInstance.delete(`/admin/roles/${roleId}`).then((r) => r.data);

// ---- Menus ----
export const listMenus = (): Promise<AdminMenu[]> =>
  axiosInstance.get('/admin/menus').then((r) => r.data);

// ---- Role × Menu permissions ----
export const getRolePermissions = (
  roleId: string,
): Promise<RoleMenuPermission[]> =>
  axiosInstance.get(`/admin/roles/${roleId}/permissions`).then((r) => r.data);

export const updateRolePermissions = (
  roleId: string,
  permissions: RoleMenuPermission[],
): Promise<RoleMenuPermission[]> =>
  axiosInstance
    .put(`/admin/roles/${roleId}/permissions`, { permissions })
    .then((r) => r.data);

// ---- Users ----
export const listUsers = (): Promise<AdminUser[]> =>
  axiosInstance.get('/admin/users').then((r) => r.data);

export const createUser = (data: {
  userId: string;
  userNm: string;
  userNmEng?: string;
  teamNm?: string;
  teamNmEng?: string;
  password: string;
  roleId: string;
}): Promise<{ userId: string }> =>
  axiosInstance.post('/admin/users', data).then((r) => r.data);

export const updateUser = (
  userId: string,
  data: {
    userNm?: string;
    userNmEng?: string;
    teamNm?: string;
    teamNmEng?: string;
    roleId?: string;
    useYn?: string;
  },
): Promise<{ ok: boolean }> =>
  axiosInstance.patch(`/admin/users/${userId}`, data).then((r) => r.data);

export const deleteUser = (userId: string): Promise<{ ok: boolean }> =>
  axiosInstance.delete(`/admin/users/${userId}`).then((r) => r.data);

export const resetUserPassword = (
  userId: string,
  password: string,
): Promise<{ ok: boolean }> =>
  axiosInstance
    .post(`/admin/users/${userId}/reset-password`, { password })
    .then((r) => r.data);
