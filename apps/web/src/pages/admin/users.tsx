import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import {
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  resetUserPassword,
  updateUser,
} from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { AdminRole, AdminUser } from '@/types';

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? fallback;

export default function UsersAdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState({
    userId: '',
    userNm: '',
    teamNm: '',
    password: '',
    roleId: '',
  });
  const [creating, setCreating] = useState(false);

  const reload = () =>
    Promise.all([listUsers(), listRoles()])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r);
        setNewUser((prev) => ({ ...prev, roleId: prev.roleId || r[0]?.roleId || '' }));
      })
      .catch(() => toast.error(t('error.default')))
      .finally(() => setLoading(false));

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newUser.userId.trim() || !newUser.userNm.trim() || !newUser.password || !newUser.roleId) {
      toast.error(t('admin.user.fillRequired'));
      return;
    }
    setCreating(true);
    try {
      await createUser({
        userId: newUser.userId.trim(),
        userNm: newUser.userNm.trim(),
        teamNm: newUser.teamNm.trim() || undefined,
        password: newUser.password,
        roleId: newUser.roleId,
      });
      toast.success(t('admin.user.created'));
      setNewUser({ userId: '', userNm: '', teamNm: '', password: '', roleId: roles[0]?.roleId ?? '' });
      await reload();
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, roleId: string) => {
    try {
      await updateUser(user.userId, { roleId });
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, roleId } : u)),
      );
      toast.success(t('admin.user.roleUpdated'));
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    const useYn = user.useYn === 'Y' ? 'N' : 'Y';
    try {
      await updateUser(user.userId, { useYn });
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, useYn } : u)),
      );
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    const pw = prompt(t('admin.user.newPasswordPrompt', { id: user.userId }));
    if (!pw) return;
    try {
      await resetUserPassword(user.userId, pw);
      toast.success(t('admin.user.passwordReset'));
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(t('admin.user.confirmDelete', { id: user.userId }))) return;
    try {
      await deleteUser(user.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
      toast.success(t('admin.user.deleted'));
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  const selectCls =
    'h-8 text-xs rounded-md border border-border bg-background px-2 cursor-pointer';

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-extrabold text-primary font-hanken">
        {t('admin.user.title')}
      </h3>

      {/* 사용자 생성 */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_120px_auto] gap-2 items-center border border-dashed border-border rounded-lg p-3 bg-card">
        <Input
          placeholder={t('admin.user.userId')}
          value={newUser.userId}
          onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          placeholder={t('admin.user.userNm')}
          value={newUser.userNm}
          onChange={(e) => setNewUser({ ...newUser, userNm: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          placeholder={t('admin.user.teamNm')}
          value={newUser.teamNm}
          onChange={(e) => setNewUser({ ...newUser, teamNm: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="password"
          placeholder={t('admin.user.password')}
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          className="h-8 text-xs"
        />
        <select
          className={selectCls}
          value={newUser.roleId}
          onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
        >
          {roles.map((r) => (
            <option key={r.roleId} value={r.roleId}>
              {r.roleNm}
            </option>
          ))}
        </select>
        <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={creating}>
          {creating ? <Spinner /> : <Plus className="size-3.5" />} {t('admin.user.add')}
        </Button>
      </div>

      {/* 사용자 목록 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-secondary">
              <th className="text-left px-4 py-2.5 font-bold">{t('admin.user.userId')}</th>
              <th className="text-left px-4 py-2.5 font-bold">{t('admin.user.userNm')}</th>
              <th className="text-left px-4 py-2.5 font-bold">{t('admin.user.teamNm')}</th>
              <th className="text-left px-4 py-2.5 font-bold">{t('admin.user.role')}</th>
              <th className="px-4 py-2.5 font-bold text-center">{t('admin.user.active')}</th>
              <th className="px-4 py-2.5 font-bold text-center">{t('admin.user.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-t border-border">
                <td className="px-4 py-2 font-mono">{u.userId}</td>
                <td className="px-4 py-2">{u.userNm}</td>
                <td className="px-4 py-2 text-secondary">{u.teamNm ?? '-'}</td>
                <td className="px-4 py-2">
                  <select
                    className={selectCls}
                    value={u.roleId}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.roleId} value={r.roleId}>
                        {r.roleNm}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                      u.useYn === 'Y'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => handleToggleActive(u)}
                  >
                    {u.useYn === 'Y' ? t('admin.user.on') : t('admin.user.off')}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="text-muted-foreground hover:text-accent p-1"
                      onClick={() => handleResetPassword(u)}
                      title={t('admin.user.resetPassword')}
                    >
                      <KeyRound className="size-3.5" />
                    </button>
                    {u.userId !== 'admin' && (
                      <button
                        className="text-muted-foreground hover:text-destructive p-1"
                        onClick={() => handleDelete(u)}
                        title={t('delete')}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
