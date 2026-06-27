import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import StdTestItemDetailModal from '@/components/StdTestItemDetailModal';
import StdTestItemEditModal from '@/components/StdTestItemEditModal';
import type { StdItemsDashboard } from '@/hooks/use-std-items-dashboard';

/** STD 시험항목 대시보드의 상세·편집·삭제 모달 묶음. App 셸에서 분리. */
export default function DashboardModals({
  dashboard,
}: {
  dashboard: StdItemsDashboard;
}) {
  return (
    <>
      <StdTestItemDetailModal {...dashboard.detailModalProps} />
      <StdTestItemEditModal {...dashboard.editModalProps} />
      <ConfirmDeleteDialog {...dashboard.deleteDialogProps} />
    </>
  );
}
