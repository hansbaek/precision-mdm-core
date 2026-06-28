import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALL_MARKETS } from '@/types';
import { useStdTestItemForm } from './useStdTestItemForm';

const { createMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('@/hooks/use-std-codes', () => ({ useStdCodes: () => ({ data: [] }) }));
vi.mock('@/api/endur-svrty', () => ({
  getRegulationCodes: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/api/template', () => ({
  createStdTestItem: createMock,
  updateStdTestItem: updateMock,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function renderForm(overrides: Partial<Parameters<typeof useStdTestItemForm>[0]> = {}) {
  const onSaved = vi.fn();
  const onPending = vi.fn();
  const onCreatedContinue = vi.fn();
  const utils = renderHook(
    () =>
      useStdTestItemForm({
        isOpen: true,
        item: null,
        mode: 'create',
        onSaved,
        onPending,
        onCreatedContinue,
        ...overrides,
      }),
    { wrapper },
  );
  return { ...utils, onSaved, onPending, onCreatedContinue };
}

describe('useStdTestItemForm', () => {
  afterEach(() => vi.clearAllMocks());

  it('create 모드 초기 폼은 비어있다', () => {
    const { result } = renderForm();
    expect(result.current.isCreate).toBe(true);
    expect(result.current.form.productLine).toBe('');
    expect(result.current.selectedMarkets.size).toBe(0);
  });

  it('handleFieldChange/toggleMarket 가 상태를 갱신한다', () => {
    const { result } = renderForm();
    act(() => result.current.handleFieldChange('productLine', 'TBR'));
    expect(result.current.form.productLine).toBe('TBR');

    const code = ALL_MARKETS[0];
    act(() => result.current.toggleMarket(code));
    expect(result.current.selectedMarkets.has(code)).toBe(true);
    act(() => result.current.toggleMarket(code));
    expect(result.current.selectedMarkets.has(code)).toBe(false);
  });

  it('저장 성공: 선택 시장을 콤마 문자열로 합쳐 생성 호출 + onSaved', async () => {
    createMock.mockResolvedValue({ applied: true, result: { id: 5 } });
    const { result, onSaved } = renderForm();
    const code = ALL_MARKETS[0];
    act(() => {
      result.current.handleFieldChange('productLine', 'TBR');
      result.current.handleFieldChange('testItemName', '내구');
      result.current.toggleMarket(code);
    });
    await act(async () => {
      await result.current.handleSave(false);
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ productLine: 'TBR', testItemName: '내구', markets: code }),
    );
    expect(onSaved).toHaveBeenCalledWith({ id: 5 });
  });

  it('승인 대기(applied:false)면 onPending(crId) 호출', async () => {
    createMock.mockResolvedValue({ applied: false, crId: 9 });
    const { result, onSaved, onPending } = renderForm();
    act(() => {
      result.current.handleFieldChange('productLine', 'TBR');
      result.current.handleFieldChange('testItemName', '내구');
    });
    await act(async () => {
      await result.current.handleSave(false);
    });
    expect(onPending).toHaveBeenCalledWith(9);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('저장 실패 시 error 메시지를 설정한다', async () => {
    createMock.mockRejectedValue(new Error('boom'));
    const { result } = renderForm();
    await act(async () => {
      await result.current.handleSave(false);
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
