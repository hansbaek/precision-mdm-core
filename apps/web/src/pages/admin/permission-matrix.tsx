import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Save, Trash2 } from 'lucide-react';
import {
  createRole,
  deleteRole,
  getRolePermissions,
  listMenus,
  listRoles,
  updateRolePermissions,
} from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { AdminMenu, AdminRole, RoleMenuPermission } from '@/types';

type Flags = Omit<RoleMenuPermission, 'menuId'>;
const EMPTY_FLAGS: Flags = {
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};
const ACTIONS: { key: keyof Flags; labelKey: string }[] = [
  { key: 'canView', labelKey: 'admin.perm.view' },
  { key: 'canCreate', labelKey: 'admin.perm.create' },
  { key: 'canUpdate', labelKey: 'admin.perm.update' },
  { key: 'canDelete', labelKey: 'admin.perm.delete' },
];

export default function PermissionMatrixPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [menus, setMenus] = useState<AdminMenu[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [matrix, setMatrix] = useState<Record<string, Flags>>({});
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleNm, setNewRoleNm] = useState('');

  // 초기: 역할 + 메뉴 카탈로그 로드.
  useEffect(() => {
    Promise.all([listRoles(), listMenus()])
      .then(([r, m]) => {
        setRoles(r);
        setMenus(m);
        setSelectedRole((cur) => cur || r[0]?.roleId || '');
      })
      .catch(() => toast.error(t('error.default')))
      .finally(() => setLoading(false));
  }, [t]);

  // 선택 역할의 권한 로드.
  useEffect(() => {
    if (!selectedRole) return;
    setPermLoading(true);
    getRolePermissions(selectedRole)
      .then((perms) => {
        const map: Record<string, Flags> = {};
        for (const p of perms) {
          map[p.menuId] = {
            canView: p.canView,
            canCreate: p.canCreate,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
          };
        }
        setMatrix(map);
      })
      .catch(() => toast.error(t('error.default')))
      .finally(() => setPermLoading(false));
  }, [selectedRole, t]);

  // 모듈 → 종속 탭 순서로 정렬된 행.
  const orderedMenus = useMemo(() => {
    const modules = menus
      .filter((m) => m.menuType === 'MODULE')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const rows: AdminMenu[] = [];
    for (const mod of modules) {
      rows.push(mod);
      menus
        .filter((m) => m.parentId === mod.menuId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .forEach((tab) => rows.push(tab));
    }
    return rows;
  }, [menus]);

  const toggle = (menuId: string, key: keyof Flags) => {
    setMatrix((prev) => {
      const cur = prev[menuId] ?? EMPTY_FLAGS;
      return { ...prev, [menuId]: { ...cur, [key]: !cur[key] } };
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permissions: RoleMenuPermission[] = orderedMenus.map((m) => ({
        menuId: m.menuId,
        ...(matrix[m.menuId] ?? EMPTY_FLAGS),
      }));
      await updateRolePermissions(selectedRole, permissions);
      toast.success(t('admin.perm.saved'));
    } catch {
      toast.error(t('error.default'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    const roleId = newRoleId.trim().toUpperCase();
    if (!roleId || !newRoleNm.trim()) return;
    try {
      const role = await createRole({ roleId, roleNm: newRoleNm.trim() });
      setRoles((prev) => [...prev, role]);
      setSelectedRole(role.roleId);
      setNewRoleId('');
      setNewRoleNm('');
      toast.success(t('admin.role.created'));
    } catch (e) {
      toast.error((e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message ?? t('error.default'));
    }
  };

  const handleDeleteRole = async (role: AdminRole) => {
    if (role.isSystemYn === 'Y') return;
    if (!confirm(t('admin.role.confirmDelete', { name: role.roleNm }))) return;
    try {
      await deleteRole(role.roleId);
      setRoles((prev) => prev.filter((r) => r.roleId !== role.roleId));
      if (selectedRole === role.roleId) setSelectedRole(roles[0]?.roleId ?? '');
      toast.success(t('admin.role.deleted'));
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('error.default'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6">
      {/* 역할 목록 */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-primary font-hanken">
          {t('admin.role.title')}
        </h3>
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {roles.map((role) => (
            <div
              key={role.roleId}
              className={`flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer border-b border-border last:border-0 ${
                selectedRole === role.roleId
                  ? 'bg-accent/10 text-primary font-bold'
                  : 'hover:bg-muted text-secondary'
              }`}
              onClick={() => setSelectedRole(role.roleId)}
            >
              <span className="flex flex-col">
                <span>{role.roleNm}</span>
                <span className="text-2xs text-muted-foreground font-mono">
                  {role.roleId}
                </span>
              </span>
              {role.isSystemYn !== 'Y' && (
                <button
                  className="text-muted-foreground hover:text-destructive p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteRole(role);
                  }}
                  title={t('delete')}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 역할 추가 */}
        <div className="space-y-2 border border-dashed border-border rounded-lg p-3">
          <Input
            placeholder={t('admin.role.idPlaceholder')}
            value={newRoleId}
            onChange={(e) => setNewRoleId(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder={t('admin.role.namePlaceholder')}
            value={newRoleNm}
            onChange={(e) => setNewRoleNm(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={handleAddRole}
            disabled={!newRoleId.trim() || !newRoleNm.trim()}
          >
            <Plus className="size-3.5" /> {t('admin.role.add')}
          </Button>
        </div>
      </div>

      {/* 권한 매트릭스 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-primary font-hanken">
            {t('admin.perm.title')}
          </h3>
          <Button size="sm" onClick={handleSave} disabled={saving || !selectedRole}>
            {saving ? <Spinner /> : <Save className="size-3.5" />} {t('save')}
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-card relative">
          {permLoading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <Spinner className="size-5" />
            </div>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-secondary">
                <th className="text-left px-4 py-2.5 font-bold">
                  {t('admin.perm.menu')}
                </th>
                {ACTIONS.map((a) => (
                  <th key={a.key} className="px-3 py-2.5 font-bold w-20 text-center">
                    {t(a.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedMenus.map((m) => {
                const flags = matrix[m.menuId] ?? EMPTY_FLAGS;
                const isTab = m.menuType === 'TAB';
                return (
                  <tr key={m.menuId} className="border-t border-border">
                    <td
                      className={`px-4 py-2 ${isTab ? 'pl-9 text-secondary' : 'font-bold text-primary'}`}
                    >
                      {m.i18nKey ? t(m.i18nKey) : m.menuNm}
                    </td>
                    {ACTIONS.map((a) => (
                      <td key={a.key} className="text-center">
                        <input
                          type="checkbox"
                          className="cursor-pointer size-4 accent-accent"
                          checked={flags[a.key]}
                          onChange={() => toggle(m.menuId, a.key)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
