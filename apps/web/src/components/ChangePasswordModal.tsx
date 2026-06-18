import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { EyeIcon, EyeOffIcon, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { changePassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

const MIN_LENGTH = 8;

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const { t } = useTranslation();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // 모달이 닫힐 때 입력값 초기화 (다음 오픈 시 잔상 방지).
  useEffect(() => {
    if (!open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setShow(false);
      setLoading(false);
    }
  }, [open]);

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    current.length > 0 &&
    next.length >= MIN_LENGTH &&
    next === confirm &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      const res = await changePassword({ currentPassword: current, newPassword: next });
      if (!res.ok) {
        toast.error(res.error ?? t('error.default'));
        return;
      }
      toast.success(t('navbar.profile.changePassword.success'));
      onOpenChange(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.error ?? t('error.default'));
      } else {
        toast.error(t('error.default'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {t('navbar.profile.changePassword.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cp-current">{t('navbar.profile.changePassword.current')}</Label>
            <Input
              id="cp-current"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cp-new">{t('navbar.profile.changePassword.new')}</Label>
            <div className="relative">
              <Input
                id="cp-new"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                aria-invalid={tooShort}
                className="pr-9"
              />
              <button
                type="button"
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {tooShort && (
              <p className="text-2xs text-destructive">
                {t('navbar.profile.changePassword.tooShort')}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cp-confirm">{t('navbar.profile.changePassword.confirm')}</Label>
            <Input
              id="cp-confirm"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch}
            />
            {mismatch && (
              <p className="text-2xs text-destructive">
                {t('navbar.profile.changePassword.mismatch')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? <Spinner /> : t('navbar.profile.changePassword.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
