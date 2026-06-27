import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// 폴백은 defaultValue 로 한국어 기본 문구를 노출한다.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _k,
  }),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // 에러 경계 + React 의 에러 로깅 노이즈를 잠재운다.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('자식이 정상이면 그대로 렌더한다', () => {
    render(
      <ErrorBoundary>
        <div>정상</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('자식 렌더 에러를 격리하고 폴백을 표시한다', () => {
    function Boom(): React.ReactElement {
      throw new Error('boom');
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
  });

  it('다시 시도 클릭 시 경계를 리셋해 복구한다', () => {
    let shouldThrow = true;
    function Maybe() {
      if (shouldThrow) throw new Error('boom');
      return <div>복구됨</div>;
    }
    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(screen.getByText('복구됨')).toBeInTheDocument();
  });
});
