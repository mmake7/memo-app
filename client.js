const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ========================================
// Storage Layer (Backend REST API)
// Interface: { list, create, update, remove }
// Data shape: { id, title, body, created_at, updated_at }
// ========================================
const storage = {
  async list() {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error('list failed');
    return res.json();
  },
  async create(partial = {}) {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: partial.title ?? '', body: partial.body ?? '' }),
    });
    if (!res.ok) throw new Error('create failed');
    return res.json();
  },
  async update(id, patch) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('update failed');
    return res.json();
  },
  async remove(id) {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('remove failed');
  },
};

// ========================================
// Utilities
// ========================================
function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr < 24) return `${diffHr}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function previewBody(body) {
  if (!body) return '';
  const firstLine = body.split('\n').find((l) => l.trim().length > 0) || '';
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine;
}

// ========================================
// Design System / Small Components
// ========================================
function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ========================================
// MemoListItem
// ========================================
function MemoListItem({ memo, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(memo.id)}
      className={`w-full text-left px-3 py-3 rounded-lg transition-colors border ${
        selected
          ? 'bg-slate-100 border-slate-200'
          : 'bg-transparent border-transparent hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 truncate">
          {memo.title.trim() || '제목 없음'}
        </h3>
        <span className="text-[11px] text-slate-400 shrink-0">{formatTimestamp(memo.updated_at)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500 truncate">
        {previewBody(memo.body) || <span className="text-slate-400">내용 없음</span>}
      </p>
    </button>
  );
}

// ========================================
// EmptyState
// ========================================
function EmptyState({ onCreate }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="text-5xl mb-4">📝</div>
      <h2 className="text-lg font-semibold text-slate-700 mb-1">첫 메모를 작성해보세요</h2>
      <p className="text-sm text-slate-500 mb-5">아이디어, 할 일, 기록하고 싶은 모든 것을 적어보세요.</p>
      <Button variant="primary" size="lg" onClick={onCreate}>
        <IconPlus /> 새 메모
      </Button>
    </div>
  );
}

// ========================================
// Sidebar
// ========================================
function Sidebar({
  memos,
  selectedId,
  onSelect,
  onCreate,
  query,
  onQueryChange,
  totalCount,
  open,
  onToggle,
}) {
  return (
    <aside
      className={`${
        open ? 'flex' : 'hidden'
      } md:flex flex-col w-full md:w-72 border-r border-slate-200 bg-white`}
    >
      <div className="p-3 border-b border-slate-200 space-y-2">
        <Button variant="primary" className="w-full" onClick={onCreate}>
          <IconPlus /> 새 메모
        </Button>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="검색..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin p-2">
        {memos.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-slate-400">
            {totalCount === 0 ? '메모가 없습니다' : '검색 결과가 없습니다'}
          </div>
        ) : (
          <div className="space-y-1">
            {memos.map((m) => (
              <MemoListItem
                key={m.id}
                memo={m}
                selected={m.id === selectedId}
                onSelect={(id) => {
                  onSelect(id);
                  onToggle && onToggle(false);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ========================================
// Editor
// ========================================
function Editor({ memo, onChange, onDelete, savedState }) {
  const titleRef = useRef(null);

  const [title, setTitle] = useState(memo.title);
  const [body, setBody] = useState(memo.body);

  useEffect(() => {
    setTitle(memo.title);
    setBody(memo.body);
  }, [memo.id]);

  useEffect(() => {
    if (title !== memo.title || body !== memo.body) {
      onChange({ title, body });
    }
  }, [title, body]);

  return (
    <section className="flex-1 flex flex-col bg-white min-w-0">
      <div className="flex items-center justify-between gap-2 px-4 md:px-6 py-3 border-b border-slate-200">
        <div className="text-xs text-slate-500 flex items-center gap-2 min-w-0">
          <span className="truncate">마지막 수정: {formatTimestamp(memo.updated_at)}</span>
          <SavedIndicator state={savedState} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="danger" size="sm" onClick={onDelete}>
            <IconTrash /> 삭제
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-6">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full bg-transparent text-2xl font-semibold text-slate-900 placeholder-slate-300 border-none focus:ring-0"
        />
      </div>

      <div className="flex-1 px-4 md:px-8 pb-6 pt-2 min-h-0">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용을 입력하세요..."
          className="w-full h-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-700 placeholder-slate-300 border-none focus:ring-0"
        />
      </div>
    </section>
  );
}

function SavedIndicator({ state }) {
  if (state === 'saving') {
    return <span className="text-amber-600">저장 중…</span>;
  }
  if (state === 'saved') {
    return <span className="text-emerald-600">저장됨</span>;
  }
  return null;
}

// ========================================
// App
// ========================================
function App() {
  const [memos, setMemos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedState, setSavedState] = useState('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const saveTimerRef = useRef(null);
  const savedLabelTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const list = await storage.list();
      setMemos(list);
      setSelectedId(list[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const filteredMemos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter(
      (m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.body || '').toLowerCase().includes(q)
    );
  }, [memos, query]);

  const selected = useMemo(
    () => memos.find((m) => m.id === selectedId) || null,
    [memos, selectedId]
  );

  const handleCreate = useCallback(async () => {
    const created = await storage.create({ title: '', body: '' });
    const fresh = await storage.list();
    setMemos(fresh);
    setSelectedId(created.id);
    setQuery('');
    setSavedState('idle');
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selected) return;
    const ok = window.confirm('이 메모를 삭제할까요?');
    if (!ok) return;
    await storage.remove(selected.id);
    const fresh = await storage.list();
    setMemos(fresh);
    setSelectedId(fresh[0]?.id ?? null);
  }, [selected]);

  const handleEdit = useCallback(
    (patch) => {
      if (!selected) return;
      setMemos((prev) =>
        prev.map((m) =>
          m.id === selected.id
            ? { ...m, ...patch, updated_at: new Date().toISOString() }
            : m
        )
      );
      setSavedState('saving');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await storage.update(selected.id, patch);
        const fresh = await storage.list();
        setMemos(fresh);
        setSavedState('saved');
        if (savedLabelTimerRef.current) clearTimeout(savedLabelTimerRef.current);
        savedLabelTimerRef.current = setTimeout(() => setSavedState('idle'), 1500);
      }, 500);
    },
    [selected]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedLabelTimerRef.current) clearTimeout(savedLabelTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="목록 열기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">
            📝 메모장
          </h1>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {memos.length}개의 메모
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          memos={filteredMemos}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={handleCreate}
          query={query}
          onQueryChange={setQuery}
          totalCount={memos.length}
          open={sidebarOpen}
          onToggle={setSidebarOpen}
        />

        <main className="flex-1 flex min-w-0">
          {selected ? (
            <Editor
              key={selected.id}
              memo={selected}
              onChange={handleEdit}
              onDelete={handleDelete}
              savedState={savedState}
            />
          ) : (
            <EmptyState onCreate={handleCreate} />
          )}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
