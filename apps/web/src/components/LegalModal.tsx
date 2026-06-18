import { useTranslation } from 'react-i18next';
import { FileText, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getLegalDocument, type LegalKind } from '@/content/legal';

interface LegalModalProps {
  /** 표시할 문서 종류. null이면 닫힘. */
  kind: LegalKind | null;
  onClose: () => void;
}

export default function LegalModal({ kind, onClose }: LegalModalProps) {
  const { t, i18n } = useTranslation();

  // 닫힘 상태에서도 Dialog는 마운트 유지(애니메이션). 내용은 kind 있을 때만 계산.
  const doc = kind ? getLegalDocument(kind, i18n.language) : null;
  const Icon = kind === 'privacy' ? ShieldCheck : FileText;

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {doc?.title}
          </DialogTitle>
          {doc && (
            <p className="text-2xs text-muted-foreground">
              {doc.effectiveLabel}: {doc.effectiveDate}
            </p>
          )}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1 grid gap-4 text-sm leading-relaxed">
          {doc?.sections.map((section) => (
            <section key={section.heading} className="grid gap-1.5">
              <h3 className="font-semibold text-foreground">{section.heading}</h3>
              {section.body.map((block, i) =>
                Array.isArray(block) ? (
                  <ul key={i} className="list-disc pl-5 grid gap-1 text-muted-foreground">
                    {block.map((li, j) => (
                      <li key={j}>{li}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="text-muted-foreground">
                    {block}
                  </p>
                ),
              )}
            </section>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
