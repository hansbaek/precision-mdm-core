import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 폴백 직접 지정 시 기본 UI 대신 사용. (reset 으로 재시도) */
  fallback?: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 하위 트리의 렌더 에러를 격리해 앱 전체 화이트스크린을 막는다.
 * App 셸에서는 라우트 콘텐츠를 감싸 사용하므로(키 기반 리마운트), 탭 이동 시
 * 경계가 자동 리셋된다. 그 외엔 "다시 시도" 버튼으로 수동 리셋한다.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // 진단을 위해 콘솔에 남긴다(원격 로깅 도입 시 여기서 전송).
    console.error('[ErrorBoundary]', error, info);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return <ErrorFallback onReset={this.reset} />;
  }
}

/** 기본 폴백 UI. i18n 키 미정의 시 한국어 기본값으로 표시(defaultValue). */
function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="bg-card border border-destructive/20 rounded-xl p-10 flex flex-col items-center gap-4 text-center max-w-xl mx-auto shadow-xs"
    >
      <AlertTriangle className="h-9 w-9 text-destructive" />
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-primary">
          {t('app.error.title', { defaultValue: '문제가 발생했습니다' })}
        </h3>
        <p className="text-xs text-secondary leading-relaxed">
          {t('app.error.desc', {
            defaultValue:
              '화면을 표시하는 중 오류가 발생했습니다. 다시 시도하거나 다른 메뉴로 이동해 주세요.',
          })}
        </p>
      </div>
      <Button size="sm" onClick={onReset} className="text-xs font-bold">
        {t('app.error.retry', { defaultValue: '다시 시도' })}
      </Button>
    </div>
  );
}
