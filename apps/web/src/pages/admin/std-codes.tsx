import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  EyeOff,
  FolderPlus,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import StdCodeEditModal from '@/components/StdCodeEditModal';
import {
  deleteStdCode,
  getStdCodeGroups,
  getStdCodeTree,
  moveStdCode,
  updateStdCode,
} from '@/api/stdCodes';
import type { StdCode, StdCodeGroup, StdCodeNode } from '@/types';

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? fallback;

const nodeKey = (n: { codeLvl: number; codeCd: string }) =>
  `${n.codeLvl}|${n.codeCd}`;

/** 드롭 위치: 앞(형제), 안(자식), 뒤(형제). */
type DropPos = 'before' | 'into' | 'after';

/** 모달 컨텍스트: 코드 추가 또는 코드 수정. */
type ModalState =
  | {
      mode: 'create';
      groupId: string;
      groupNm: string | null;
      parentCd: string | null;
      isNewGroup: boolean;
      seed?: StdCode | null;
    }
  | { mode: 'edit'; groupId: string; groupNm: string | null; code: StdCode }
  | null;

/** 노드의 ATTR_VAL(존재하는 것만)을 칩 표시용으로 추린다. */
function attrChips(n: StdCodeNode): { val: string; title: string }[] {
  const slots: [string | null, string | null, string | null][] = [
    [n.attr1Val, n.attr1Nm, n.attr1Desc],
    [n.attr2Val, n.attr2Nm, n.attr2Desc],
    [n.attr3Val, n.attr3Nm, n.attr3Desc],
  ];
  return slots
    .filter(([val]) => val && val.trim() !== '')
    .map(([val, nm, desc]) => ({
      val: val as string,
      title: [nm, desc].filter(Boolean).join(' — ') || (val as string),
    }));
}

/** key → 그 노드를 포함하는 형제 배열(정렬/다음형제 계산용). */
function buildSiblingIndex(tree: StdCodeNode[]): Map<string, StdCodeNode[]> {
  const map = new Map<string, StdCodeNode[]>();
  const walk = (siblings: StdCodeNode[]) => {
    for (const n of siblings) {
      map.set(nodeKey(n), siblings);
      if (n.children.length) walk(n.children);
    }
  };
  walk(tree);
  return map;
}

/** 노드 + 모든 하위의 key 집합(자기 자신 포함). 자기 서브트리로의 드롭 차단용. */
function subtreeKeys(node: StdCodeNode): Set<string> {
  const out = new Set<string>();
  const walk = (n: StdCodeNode) => {
    out.add(nodeKey(n));
    n.children.forEach(walk);
  };
  walk(node);
  return out;
}

const matchesQuery = (n: StdCodeNode, q: string): boolean =>
  [n.codeCd, n.codeNm, n.codeDesc, n.attr1Val, n.attr2Val, n.attr3Val]
    .filter(Boolean)
    .some((v) => (v as string).toLowerCase().includes(q));

/**
 * 검색어/미사용숨김을 적용해 트리를 가지치기하고, 자동펼침 key 를 모은다.
 * - 노드가 매칭이면 그 하위 트리 전체를 함께 표시(하위 비매칭 코드도 노출).
 * - 비매칭이라도 하위에 매칭이 있으면 경로상 조상으로 유지.
 * - hideInactive 시 USE_YN!=='Y' 서브트리는 제거.
 */
function buildDisplay(
  tree: StdCodeNode[],
  query: string,
  hideInactive: boolean,
): { nodes: StdCodeNode[]; autoExpand: Set<string> } {
  const q = query.trim().toLowerCase();
  const autoExpand = new Set<string>();

  // 검색어를 무시하고 하위 전체를 포함(미사용숨김만 적용). 매칭 노드의 서브트리용.
  const includeAll = (nodes: StdCodeNode[]): StdCodeNode[] =>
    nodes
      .filter((n) => !(hideInactive && n.useYn !== 'Y'))
      .map((n) => ({ ...n, children: includeAll(n.children) }));

  const walk = (nodes: StdCodeNode[]): StdCodeNode[] => {
    const out: StdCodeNode[] = [];
    for (const n of nodes) {
      if (hideInactive && n.useYn !== 'Y') continue;
      const self = q === '' || matchesQuery(n, q);
      // 매칭 노드는 하위 전체, 비매칭 노드는 매칭 경로만 유지.
      const kids = self ? includeAll(n.children) : walk(n.children);
      if (self || kids.length) {
        out.push({ ...n, children: kids });
        if (q !== '' && kids.length) autoExpand.add(nodeKey(n));
      }
    }
    return out;
  };

  return { nodes: walk(tree), autoExpand };
}

/** 그룹별 펼침 상태를 localStorage 에 보존한다. */
const EXPAND_STORE_PREFIX = 'stdcode.expanded.';

function loadStoredExpanded(grpId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(EXPAND_STORE_PREFIX + grpId);
    if (!raw) return null;
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr as string[]) : null;
  } catch {
    return null;
  }
}

function persistExpanded(grpId: string | null, set: Set<string>): void {
  if (!grpId) return;
  try {
    localStorage.setItem(EXPAND_STORE_PREFIX + grpId, JSON.stringify([...set]));
  } catch {
    /* 저장 실패는 무시(시크릿 모드 등) */
  }
}

/** 트리에서 한 노드의 codeNm 만 불변 갱신(인라인 편집 낙관적 반영). */
function updateNodeNm(
  nodes: StdCodeNode[],
  key: string,
  nm: string,
): StdCodeNode[] {
  return nodes.map((n) => {
    if (nodeKey(n) === key) return { ...n, codeNm: nm };
    if (n.children.length)
      return { ...n, children: updateNodeNm(n.children, key, nm) };
    return n;
  });
}

export default function StdCodesAdminPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<StdCodeGroup[]>([]);
  const [selectedGrp, setSelectedGrp] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [tree, setTree] = useState<StdCodeNode[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);

  // 트리 보기 옵션.
  const [treeSearch, setTreeSearch] = useState('');
  const [hideInactive, setHideInactive] = useState(false);

  // 인라인 코드명 편집.
  const [rename, setRename] = useState<{ key: string; value: string } | null>(null);

  // 드래그 상태.
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ key: string; pos: DropPos } | null>(null);

  const selectedGroupNm = useMemo(
    () => groups.find((g) => g.codeGrpId === selectedGrp)?.codeGrpNm ?? null,
    [groups, selectedGrp],
  );

  // 이동(move) 계산은 항상 원본 트리 기준.
  const nodeIndex = useMemo(() => {
    const map = new Map<string, StdCodeNode>();
    const walk = (ns: StdCodeNode[]) =>
      ns.forEach((n) => {
        map.set(nodeKey(n), n);
        walk(n.children);
      });
    walk(tree);
    return map;
  }, [tree]);
  const siblingIndex = useMemo(() => buildSiblingIndex(tree), [tree]);
  const allExpandableKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (ns: StdCodeNode[]) =>
      ns.forEach((n) => {
        if (n.children.length) keys.push(nodeKey(n));
        walk(n.children);
      });
    walk(tree);
    return keys;
  }, [tree]);

  // 표시용(검색/미사용숨김 적용) 트리 + 자동펼침.
  const display = useMemo(
    () => buildDisplay(tree, treeSearch, hideInactive),
    [tree, treeSearch, hideInactive],
  );
  const filtering = treeSearch.trim() !== '' || hideInactive;
  const effectiveExpanded = useMemo(
    () =>
      treeSearch.trim() ? new Set([...expanded, ...display.autoExpand]) : expanded,
    [treeSearch, expanded, display.autoExpand],
  );

  const reloadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const data = await getStdCodeGroups();
      setGroups(data);
      setSelectedGrp((cur) =>
        cur && data.some((g) => g.codeGrpId === cur)
          ? cur
          : (data[0]?.codeGrpId ?? null),
      );
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    } finally {
      setGroupsLoading(false);
    }
  }, [t]);

  const reloadTree = useCallback(async (grpId: string) => {
    setTreeLoading(true);
    try {
      const data = await getStdCodeTree(grpId);
      setTree(data);
      // 저장된 펼침 상태를 복원, 없으면 최상위만 펼친다.
      setExpanded(loadStoredExpanded(grpId) ?? new Set(data.map(nodeKey)));
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
      setTree([]);
    } finally {
      setTreeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void reloadGroups();
  }, [reloadGroups]);

  useEffect(() => {
    if (selectedGrp) void reloadTree(selectedGrp);
    else setTree([]);
  }, [selectedGrp, reloadTree]);

  const afterMutation = async () => {
    if (selectedGrp) await reloadTree(selectedGrp);
    await reloadGroups();
  };

  const applyExpanded = (next: Set<string>) => {
    setExpanded(next);
    persistExpanded(selectedGrp, next);
  };

  const toggleExpand = (key: string) => {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    applyExpanded(next);
  };

  const expandAll = () => applyExpanded(new Set(allExpandableKeys));
  const collapseAll = () => applyExpanded(new Set());

  const handleNewGroup = () => {
    const grpId = window.prompt('새 코드 그룹 ID (CODE_GRP_ID) 를 입력하세요 (예: PRODUCT_LINE)');
    if (!grpId || !grpId.trim()) return;
    const id = grpId.trim();
    if (groups.some((g) => g.codeGrpId === id)) {
      toast.error('이미 존재하는 그룹 ID 입니다.');
      setSelectedGrp(id);
      return;
    }
    setModal({ mode: 'create', groupId: id, groupNm: null, parentCd: null, isNewGroup: true });
  };

  const handleDelete = async (node: StdCodeNode) => {
    if (!confirm(`코드를 삭제(비활성)하시겠습니까?\n${node.codeGrpId} / ${node.codeCd}`)) return;
    try {
      await deleteStdCode(node.codeGrpId, node.codeLvl, node.codeCd);
      toast.success(`표준코드 삭제: ${node.codeCd}`);
      await afterMutation();
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    }
  };

  // 하위코드 추가/수정 저장 후. 하위코드 추가였으면 부모를 펼쳐 새 코드를 노출.
  const handleModalSaved = async () => {
    if (modal?.mode === 'create' && modal.parentCd) {
      const parentNode = [...nodeIndex.values()].find(
        (n) => n.codeCd === modal.parentCd,
      );
      if (parentNode) {
        const next = new Set(expanded);
        next.add(nodeKey(parentNode));
        applyExpanded(next);
      }
    }
    await afterMutation();
  };

  const startRename = (node: StdCodeNode) =>
    setRename({ key: nodeKey(node), value: node.codeNm ?? '' });

  const commitRename = async () => {
    if (!rename) return;
    const { key, value } = rename;
    setRename(null);
    const node = nodeIndex.get(key);
    const newNm = value.trim();
    if (!node || (node.codeNm ?? '') === newNm) return;
    // 낙관적 반영(펼침/스크롤 유지) 후 서버 반영, 실패 시 트리 리로드로 복원.
    setTree((prev) => updateNodeNm(prev, key, newNm));
    try {
      await updateStdCode(node.codeGrpId, node.codeLvl, node.codeCd, {
        codeNm: newNm,
      });
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
      if (selectedGrp) await reloadTree(selectedGrp);
    }
  };

  const clearDrag = () => {
    setDragKey(null);
    setDropHint(null);
  };

  const handleDrop = async () => {
    const hint = dropHint;
    const srcKey = dragKey;
    clearDrag();
    if (!hint || !srcKey || srcKey === hint.key) return;

    const src = nodeIndex.get(srcKey);
    const target = nodeIndex.get(hint.key);
    if (!src || !target) return;

    if (subtreeKeys(src).has(hint.key)) {
      toast.error('하위 코드 아래로는 이동할 수 없습니다.');
      return;
    }

    let newParentCd: string | undefined;
    let beforeCd: string | undefined;
    if (hint.pos === 'into') {
      newParentCd = target.codeCd;
      beforeCd = undefined;
    } else {
      newParentCd = target.parentCd ?? undefined;
      if (hint.pos === 'before') {
        beforeCd = target.codeCd;
      } else {
        const sibs = siblingIndex.get(hint.key) ?? [];
        const idx = sibs.findIndex((s) => nodeKey(s) === hint.key);
        beforeCd = sibs[idx + 1]?.codeCd;
      }
    }

    try {
      await moveStdCode(src.codeGrpId, src.codeLvl, src.codeCd, {
        newParentCd,
        beforeCd,
      });
      toast.success(`이동 완료: ${src.codeCd}`);
      await afterMutation();
    } catch (e) {
      toast.error(errMsg(e, t('error.default')));
    }
  };

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.codeGrpId.toLowerCase().includes(q) ||
        (g.codeGrpNm ?? '').toLowerCase().includes(q),
    );
  }, [groups, groupSearch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-primary font-hanken">
            표준코드 관리 (DW_STD_CODE)
          </h3>
          <p className="text-2xs text-secondary mt-0.5">
            계층형 표준코드를 그룹별로 입력·수정·관리합니다. 행을 드래그해 부모/순서를 바꿀 수 있고, 변경은 즉시 반영됩니다.
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleNewGroup}>
          <FolderPlus className="size-3.5" /> 새 그룹
        </Button>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-4 items-start">
        {/* 좌: 코드 그룹 목록 */}
        <aside className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="그룹 검색"
                className="h-8 text-xs pl-8"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {groupsLoading ? (
              <div className="flex justify-center py-10">
                <Spinner className="size-5" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <p className="text-2xs text-muted-foreground text-center py-8">
                그룹이 없습니다.
              </p>
            ) : (
              filteredGroups.map((g) => {
                const active = g.codeGrpId === selectedGrp;
                return (
                  <button
                    key={g.codeGrpId}
                    onClick={() => setSelectedGrp(g.codeGrpId)}
                    className={`w-full text-left px-3 py-2 border-b border-border/60 transition-colors ${
                      active ? 'bg-accent/10' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-xs truncate ${
                          active ? 'text-accent font-bold' : 'text-foreground'
                        }`}
                      >
                        {g.codeGrpId}
                      </span>
                      <span className="text-2xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {g.codeCount}
                      </span>
                    </div>
                    {g.codeGrpNm && (
                      <span className="text-2xs text-secondary truncate block">
                        {g.codeGrpNm}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 우: 선택 그룹의 코드 트리 */}
        <section className="border border-border rounded-lg bg-card overflow-hidden min-h-[40vh]">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40 flex-wrap">
            <span className="text-xs font-bold text-foreground font-mono mr-1">
              {selectedGrp ?? '—'}
              {selectedGroupNm ? (
                <span className="text-secondary font-sans font-normal"> · {selectedGroupNm}</span>
              ) : null}
            </span>

            {/* 트리 검색 */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="코드·명·속성 검색"
                className="h-7 text-2xs pl-7 w-44"
              />
            </div>

            {/* 펼침/접기 */}
            <button
              onClick={expandAll}
              title="모두 펼치기"
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-2xs font-bold text-secondary hover:bg-muted hover:text-foreground"
            >
              <ChevronsUpDown className="size-3.5" /> 모두 펼치기
            </button>
            <button
              onClick={collapseAll}
              title="모두 접기"
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-2xs font-bold text-secondary hover:bg-muted hover:text-foreground"
            >
              <ChevronsDownUp className="size-3.5" /> 모두 접기
            </button>

            {/* 미사용 숨기기 */}
            <button
              onClick={() => setHideInactive((v) => !v)}
              title="미사용 코드 숨기기"
              className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-2xs font-bold ${
                hideInactive
                  ? 'bg-accent/15 text-accent'
                  : 'text-secondary hover:bg-muted hover:text-foreground'
              }`}
            >
              <EyeOff className="size-3.5" /> 미사용 숨김
            </button>

            {selectedGrp && (
              <Button
                size="sm"
                className="h-7 text-2xs bg-accent hover:bg-accent-hover text-white ml-auto"
                onClick={() =>
                  setModal({
                    mode: 'create',
                    groupId: selectedGrp,
                    groupNm: selectedGroupNm,
                    parentCd: null,
                    isNewGroup: false,
                  })
                }
              >
                <Plus className="size-3.5" /> 최상위 코드 추가
              </Button>
            )}
          </div>

          {filtering && (
            <div className="px-3 py-1.5 text-2xs text-muted-foreground bg-muted/20 border-b border-border/60">
              필터가 적용되어 드래그 정렬이 일시 비활성화됩니다. 검색을 비우고 미사용 숨김을 끄면 다시 활성화됩니다.
            </div>
          )}

          {treeLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-16">
              코드가 없습니다. "최상위 코드 추가"로 시작하세요.
            </p>
          ) : display.nodes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-16">
              조건에 맞는 코드가 없습니다.
            </p>
          ) : (
            <div className="py-1" onDragEnd={clearDrag}>
              {display.nodes.map((node) => (
                <TreeRow
                  key={nodeKey(node)}
                  node={node}
                  depth={0}
                  expanded={effectiveExpanded}
                  dragEnabled={!filtering}
                  dragKey={dragKey}
                  dropHint={dropHint}
                  renameKey={rename?.key ?? null}
                  renameValue={rename?.value ?? ''}
                  onRenameStart={startRename}
                  onRenameInput={(v) => setRename((r) => (r ? { ...r, value: v } : r))}
                  onRenameCommit={commitRename}
                  onRenameCancel={() => setRename(null)}
                  onToggle={toggleExpand}
                  onDragStart={setDragKey}
                  onDragOver={(key, pos) => setDropHint({ key, pos })}
                  onDrop={handleDrop}
                  onAddChild={(n) =>
                    setModal({
                      mode: 'create',
                      groupId: n.codeGrpId,
                      groupNm: selectedGroupNm,
                      parentCd: n.codeCd,
                      isNewGroup: false,
                    })
                  }
                  onDuplicate={(n) =>
                    setModal({
                      mode: 'create',
                      groupId: n.codeGrpId,
                      groupNm: selectedGroupNm,
                      parentCd: n.parentCd,
                      isNewGroup: false,
                      seed: n,
                    })
                  }
                  onEdit={(n) =>
                    setModal({
                      mode: 'edit',
                      groupId: n.codeGrpId,
                      groupNm: selectedGroupNm,
                      code: n,
                    })
                  }
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {modal && (
        <StdCodeEditModal
          open
          mode={modal.mode}
          groupId={modal.groupId}
          groupNm={modal.groupNm}
          parentCd={modal.mode === 'create' ? modal.parentCd : modal.code.parentCd}
          isNewGroup={modal.mode === 'create' ? modal.isNewGroup : false}
          code={modal.mode === 'edit' ? modal.code : null}
          seed={modal.mode === 'create' ? (modal.seed ?? null) : null}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}

interface TreeRowProps {
  node: StdCodeNode;
  depth: number;
  expanded: Set<string>;
  dragEnabled: boolean;
  dragKey: string | null;
  dropHint: { key: string; pos: DropPos } | null;
  renameKey: string | null;
  renameValue: string;
  onRenameStart: (n: StdCodeNode) => void;
  onRenameInput: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onToggle: (key: string) => void;
  onDragStart: (key: string) => void;
  onDragOver: (key: string, pos: DropPos) => void;
  onDrop: () => void;
  onAddChild: (n: StdCodeNode) => void;
  onDuplicate: (n: StdCodeNode) => void;
  onEdit: (n: StdCodeNode) => void;
  onDelete: (n: StdCodeNode) => void;
}

function TreeRow({
  node,
  depth,
  expanded,
  dragEnabled,
  dragKey,
  dropHint,
  renameKey,
  renameValue,
  onRenameStart,
  onRenameInput,
  onRenameCommit,
  onRenameCancel,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onAddChild,
  onDuplicate,
  onEdit,
  onDelete,
}: TreeRowProps) {
  const key = nodeKey(node);
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(key);
  const inactive = node.useYn !== 'Y';
  const isDragging = dragKey === key;
  const hint = dropHint?.key === key ? dropHint.pos : null;
  const chips = attrChips(node);
  const editing = renameKey === key;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragEnabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const pos: DropPos = ratio < 0.3 ? 'before' : ratio > 0.7 ? 'after' : 'into';
    onDragOver(key, pos);
  };

  return (
    <>
      <div
        draggable={dragEnabled && !editing}
        onDragStart={(e) => {
          if (!dragEnabled || editing) return;
          e.dataTransfer.effectAllowed = 'move';
          onDragStart(key);
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          if (!dragEnabled) return;
          e.preventDefault();
          onDrop();
        }}
        className={`group relative flex items-center gap-2 pr-3 py-1.5 border-b border-border/40 ${
          isDragging ? 'opacity-40' : 'hover:bg-muted/40'
        } ${hint === 'into' ? 'ring-2 ring-inset ring-accent bg-accent/5' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hint === 'before' && (
          <span className="absolute left-0 right-0 top-0 h-0.5 bg-accent" />
        )}
        {hint === 'after' && (
          <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent" />
        )}

        <GripVertical
          className={`size-3.5 shrink-0 ${
            dragEnabled
              ? 'text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab'
              : 'text-muted-foreground/20 cursor-not-allowed'
          }`}
        />

        <button
          onClick={() => hasChildren && onToggle(key)}
          className={`size-4 flex items-center justify-center shrink-0 ${
            hasChildren ? 'text-muted-foreground hover:text-foreground' : 'opacity-0 cursor-default'
          }`}
          tabIndex={hasChildren ? 0 : -1}
        >
          {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>

        <span className="text-2xs font-mono font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
          L{node.codeLvl}
        </span>

        <span
          className={`font-mono text-xs font-bold shrink-0 ${
            inactive ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}
        >
          {node.codeCd}
        </span>

        {editing ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameCommit();
              else if (e.key === 'Escape') onRenameCancel();
            }}
            onBlur={onRenameCommit}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            placeholder="코드명"
            className="text-xs border border-accent rounded px-1.5 py-0.5 w-44 min-w-0 outline-none focus:ring-2 focus:ring-ring/30 bg-card text-foreground"
          />
        ) : (
          <span
            className="text-xs text-secondary truncate min-w-0 cursor-text rounded hover:bg-muted/60 px-1 -mx-1"
            onDoubleClick={() => onRenameStart(node)}
            title="더블클릭하여 코드명 수정"
          >
            {node.codeNm || '–'}
          </span>
        )}

        {/* ATTR 값 칩(존재하는 슬롯만) */}
        {chips.length > 0 && (
          <span className="flex items-center gap-1 shrink-0">
            {chips.map((c, i) => (
              <span
                key={i}
                title={c.title}
                className="text-2xs font-mono bg-primary/5 text-primary/80 border border-primary/10 px-1.5 py-0.5 rounded cursor-help max-w-32 truncate"
              >
                {c.val}
              </span>
            ))}
          </span>
        )}

        <span className="flex-1" />

        {inactive && (
          <span className="text-2xs font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
            미사용
          </span>
        )}

        {/* 행 액션 — hover 시 노출 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="text-muted-foreground hover:text-accent p-1"
            title="하위코드 추가"
            onClick={() => onAddChild(node)}
          >
            <Plus className="size-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-accent p-1"
            title="복제(같은 레벨에 추가)"
            onClick={() => onDuplicate(node)}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-primary p-1"
            title="수정"
            onClick={() => onEdit(node)}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-destructive p-1"
            title="삭제(비활성)"
            onClick={() => onDelete(node)}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {hasChildren &&
        isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={nodeKey(child)}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            dragEnabled={dragEnabled}
            dragKey={dragKey}
            dropHint={dropHint}
            renameKey={renameKey}
            renameValue={renameValue}
            onRenameStart={onRenameStart}
            onRenameInput={onRenameInput}
            onRenameCommit={onRenameCommit}
            onRenameCancel={onRenameCancel}
            onToggle={onToggle}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onAddChild={onAddChild}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}
