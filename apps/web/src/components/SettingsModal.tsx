import { useState } from 'react';
import { Settings as SettingsIcon, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { savePreferences } from '@/api/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStdCodes } from '@/hooks/use-std-codes';
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  usePreferencesStore,
  type Preferences,
} from '@/hooks/use-preferences-store';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZES = [10, 20, 50, 100];
const SORT_FIELDS = ['id', 'productLine', 'testItemName', 'testMethod', 'certiType'];

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" />
            {t('settings.title')}
          </DialogTitle>
          <p className="text-2xs text-muted-foreground">{t('settings.subtitle')}</p>
        </DialogHeader>

        {/* open일 때만 마운트 → 매번 최신 저장값으로 draft 초기화. */}
        {open && <SettingsForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const update = usePreferencesStore((s) => s.update);
  const reset = usePreferencesStore((s) => s.reset);
  const { data: productLines } = useStdCodes('PRODUCT_LINE', 2);

  // 저장 전까지는 draft에만 반영. 닫기/취소 시 변경 폐기.
  const [draft, setDraft] = useState<Preferences>(getPreferences);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    // 로컬 즉시 반영(낙관적) 후 서버 동기화. 서버 실패해도 로컬 설정은 유지.
    update(draft);
    setSaving(true);
    try {
      const res = await savePreferences(draft);
      if (!res.ok) {
        toast.error(res.error ?? t('settings.syncFailed'));
      } else {
        toast.success(t('settings.saved'));
      }
    } catch {
      toast.warning(t('settings.syncFailed'));
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleReset = () => {
    reset();
    setDraft(DEFAULT_PREFERENCES);
    toast.success(t('settings.reset'));
  };

  return (
    <>
      <div className="grid gap-5 py-1">
        <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          {t('settings.dataDisplay')}
        </p>

        {/* 페이지당 항목 수 */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="grid gap-0.5">
            <Label>{t('settings.pageSize')}</Label>
            <span className="text-2xs text-muted-foreground">{t('settings.pageSizeDesc')}</span>
          </div>
          <Select value={String(draft.pageSize)} onValueChange={(v) => set('pageSize', Number(v))}>
            <SelectTrigger className="w-28 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)} className="font-mono text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 기본 정렬 기준 */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Label>{t('settings.sortBy')}</Label>
          <Select value={draft.sortBy} onValueChange={(v) => set('sortBy', v)}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">
                  {t(`settings.field.${f}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 정렬 방향 */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Label>{t('settings.sortOrder')}</Label>
          <Select
            value={draft.sortOrder}
            onValueChange={(v) => set('sortOrder', v as Preferences['sortOrder'])}
          >
            <SelectTrigger className="w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc" className="text-xs">
                {t('settings.asc')}
              </SelectItem>
              <SelectItem value="desc" className="text-xs">
                {t('settings.desc')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 기본 제품군 */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Label>{t('settings.defaultProductLine')}</Label>
          <Select
            value={draft.defaultProductLine}
            onValueChange={(v) => set('defaultProductLine', v)}
          >
            <SelectTrigger className="w-40 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-bold">
                {t('settings.allProductLines')}
              </SelectItem>
              {productLines.map((pl) => (
                <SelectItem key={pl.codeCd} value={pl.codeCd} className="font-mono text-xs">
                  {pl.codeCd}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 밀도 */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Label>{t('settings.density')}</Label>
          <Select
            value={draft.density}
            onValueChange={(v) => set('density', v as Preferences['density'])}
          >
            <SelectTrigger className="w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable" className="text-xs">
                {t('settings.comfortable')}
              </SelectItem>
              <SelectItem value="compact" className="text-xs">
                {t('settings.compact')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground border-t border-border pt-4">
          {t('settings.notifications')}
        </p>

        {/* 시스템 상태 알림 */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="grid gap-0.5">
            <Label>{t('settings.notifySystemStatus')}</Label>
            <span className="text-2xs text-muted-foreground">
              {t('settings.notifySystemStatusDesc')}
            </span>
          </div>
          <Select
            value={draft.notifySystemStatus ? 'on' : 'off'}
            onValueChange={(v) => set('notifySystemStatus', v === 'on')}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on" className="text-xs">
                {t('settings.on')}
              </SelectItem>
              <SelectItem value="off" className="text-xs">
                {t('settings.off')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-2xs text-muted-foreground border-t border-border pt-3">
          {t('settings.applyNote')}
        </p>
      </div>

      <DialogFooter className="sm:justify-between">
        <Button type="button" variant="ghost" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          {t('settings.resetDefaults')}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner /> : t('save')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
