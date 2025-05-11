import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { ActionButton } from './action-button';
import { ITranslationProvider } from '../common/ITranslationProvider';
import { Alternating } from '../api-utils/bling';
import { QueryElementBadge } from './QueryElement';

interface QueryAnalysisSectionProps {
  /** Raw SQL string to analyse */
  query: string;
  /** Dialect name (e.g. "postgres", "bigquery") */
  dialect: string;

  translationProvider: ITranslationProvider;
}

/**
 * Nicely-styled card that presents basic statistics (columns, joins) and
 * expandable panels with the exact columns & join clauses found in the
 * *top-level* query.
 */
const QueryAnalysisSection: React.FC<QueryAnalysisSectionProps> = ({
  query,
  dialect,
  translationProvider,
}) => {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [columns, setColumns] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [joinCount, setJoinCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Accordion state, persisted in localStorage so it survives page reloads ──
  const getInitialCollapse = useCallback(
    (key: string, fallback: boolean) => {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    [],
  );

  const [showColumns, setShowColumns] = useState<boolean>(() =>
    getInitialCollapse('sqlscope_showColumns', true),
  );
  const [showTables, setShowJoins] = useState<boolean>(() =>
    getInitialCollapse('sqlscope_showJoins', true),
  );

  // Persist whenever toggled
  useEffect(() => {
    localStorage.setItem('sqlscope_showColumns', JSON.stringify(showColumns));
  }, [showColumns]);
  useEffect(() => {
    localStorage.setItem('sqlscope_showJoins', JSON.stringify(showTables));
  }, [showTables]);

  // ---------------------------------------------------------------------------
  // EFFECT: fetch analysis whenever query/dialect changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!query) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cols, jns] = await Promise.all([
          translationProvider.GetColumns(query, dialect),
          translationProvider.GetJoins(query, dialect),
        ]);
        if (cancelled) return;
        setColumns(cols);
        setTables(jns.tables);
        setJoinCount(jns.join_count);
        setError(null);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? 'Unable to analyse query');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, dialect, translationProvider]);

  // ---------------------------------------------------------------------------
  // DERIVED STATS
  // ---------------------------------------------------------------------------
  const totalColumns = columns.length;
  const allTables = tables.length;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  if (!query) return null;

  if (error) {
    return (
      <div className="bg-dracula-red text-dracula-background p-4 rounded mt-4">
        {error}
      </div>
    );
  }

  return (
    <div className="query-analysis-card bg-dracula-selection/30 border-l-4 border-dracula-pink rounded-lg shadow px-4 py-4 mt-4">
      {/* ─────────────── Stats row */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs font-medium">
        <span className="px-3 py-1 rounded-full bg-dracula-selection text-dracula-foreground">
          Columns: {totalColumns}
        </span>
        <span className="px-3 py-1 rounded-full bg-dracula-selection text-dracula-foreground">
          Tables: {allTables}
        </span>
        <span className="px-3 py-1 rounded-full bg-dracula-selection text-dracula-foreground">
          Joins: {joinCount}
        </span>
        {loading && (
          <span className="animate-pulse px-3 py-1 rounded-full bg-dracula-selection text-dracula-foreground">
            Loading…
          </span>
        )}
      </div>

      {/* ─────────────── Columns panel */}
      {totalColumns > 0 && (
        <div className="mb-3">
          <ActionButton
            buttonStyle="w-full flex justify-between items-center bg-dracula-selection text-dracula-foreground p-2 rounded font-medium hover:bg-dracula-selection/80 transition-colors"
            onClick={() => setShowColumns((prev) => !prev)}
            ariaLabel="Toggle columns list"
            title="Toggle columns list"
          >
            <span>Columns</span>
            {showColumns ? <FaChevronDown /> : <FaChevronRight />}
          </ActionButton>

          {/* Accordion body */}
          {showColumns && (
            <div className="pl-6 pt-3 flex flex-wrap gap-2 transition-all duration-200">
              {columns.map((c, idx) => (
                <QueryElementBadge bgColorClass={Alternating(idx, ['bg-dracula-selection', 'bg-dracula-comment'])} text={c} key={c}/>
              ))}
            </div>
          )}
        </div>
      )}

      {allTables > 0 && (
        <div>
          <ActionButton
            buttonStyle="w-full flex justify-between items-center bg-dracula-selection text-dracula-foreground p-2 rounded font-medium hover:bg-dracula-selection/80 transition-colors"
            onClick={() => setShowJoins((prev) => !prev)}
            ariaLabel="Toggle joins list"
            title="Toggle joins list"
          >
            <span>Tables</span>
            {showTables ? <FaChevronDown /> : <FaChevronRight />}
          </ActionButton>

          {showTables && (
            <div className="pl-6 pt-3 flex flex-wrap gap-2 transition-all duration-200">
              {tables.map((j, idx) => (
                <QueryElementBadge bgColorClass={Alternating(idx, ['bg-dracula-selection', 'bg-dracula-comment'])} text={j} key={j}/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { QueryAnalysisSection };