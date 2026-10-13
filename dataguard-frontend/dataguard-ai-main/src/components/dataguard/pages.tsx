import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Database,
  FileSearch,
  Play,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { dataGuardApi } from '@/lib/dataguard-api';
import {
  Button,
  MetricCard,
  PageHeader,
  Panel,
  StatusBadge,
} from './ui';
import { TrendChart } from './charts';

const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — DataGuard AI` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} — DataGuard AI` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
});

export { meta };

const SearchBox = ({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <label className="relative block">
    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

    <input
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-64"
    />
  </label>
);

const TableWrap = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm">
      {children}
    </table>
  </div>
);

const Th = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <th className="sticky top-0 bg-muted/90 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
    {children}
  </th>
);

const Td = ({
  children,
  className = '',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    {...props}
    className={`border-t border-border px-4 py-3 ${className}`}
  >
    {children}
  </td>
);

function formatDate(value: unknown) {
  if (!value) return '—';

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getGate(dataset: any) {
  return (
    dataset?.gate?.decision ||
    dataset?.analysis?.gate?.decision ||
    'In review'
  );
}

function getQuality(dataset: any) {
  return Number(
    dataset?.quality ??
      dataset?.analysis?.quality?.score ??
      0
  );
}

function getReadiness(dataset: any) {
  return Number(
    dataset?.readiness ??
      dataset?.analysis?.ml_readiness?.score ??
      0
  );
}

function getMissing(dataset: any) {
  return Number(
    dataset?.missing ??
      dataset?.analysis?.profile?.missing_pct ??
      dataset?.analysis?.quality?.missing_percentage ??
      0
  );
}

function getAnomalies(dataset: any) {
  return Number(
    dataset?.anomalies ??
      dataset?.analysis?.anomalies?.count ??
      0
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export function DashboardPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dataGuardApi.getDatasets(),

      dataGuardApi.getDatasets().then(async (items) => {
        if (!items.length) return [];

        try {
          return await dataGuardApi.getMonitoring(items[0].id);
        } catch {
          return [];
        }
      }),
    ])
      .then(([items, trends]) => {
        setDatasets(items || []);
        setMonitoring(trends || []);
      })
      .catch((error) => {
        console.error('Dashboard load failed:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const total = datasets.length;

  const quality =
    total > 0
      ? datasets.reduce(
          (sum, x) => sum + getQuality(x),
          0
        ) / total
      : 0;

  const readiness =
    total > 0
      ? datasets.reduce(
          (sum, x) => sum + getReadiness(x),
          0
        ) / total
      : 0;

  const approved = datasets.filter(
    (x) => getGate(x) === 'Approved'
  ).length;

  const conditional = datasets.filter(
    (x) => getGate(x) === 'Conditional'
  ).length;

  const blocked = datasets.filter(
    (x) => getGate(x) === 'Blocked'
  ).length;

  const criticalIssues = datasets.reduce(
    (sum, x) =>
      sum +
      Number(
        x?.issues ??
          x?.analysis?.quality?.critical_issues ??
          0
      ),
    0
  );

  const anomalies = datasets.reduce(
    (sum, x) => sum + getAnomalies(x),
    0
  );

  return (
    <>
      <PageHeader
        title="Welcome to DataGuard AI"
        subtitle="Monitor data quality, identify ML risks, and make safer pipeline decisions."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Total datasets"
          value={loading ? '…' : String(total)}
          detail="Uploaded datasets"
          icon={<Database className="size-4" />}
        />

        <MetricCard
          label="Average data quality"
          value={loading ? '…' : quality.toFixed(1)}
          detail="Across uploaded datasets"
          icon={<ShieldCheck className="size-4" />}
        />

        <MetricCard
          label="Average ML readiness"
          value={loading ? '…' : readiness.toFixed(1)}
          detail="Across analyzed datasets"
          icon={<Sparkles className="size-4" />}
        />

        <MetricCard
          label="Pipeline decisions"
          value={`${approved} / ${conditional} / ${blocked}`}
          detail="Approved · Conditional · Blocked"
          icon={<CheckCircle2 className="size-4" />}
        />

        <MetricCard
          label="Critical issues"
          value={
            loading ? '…' : String(criticalIssues)
          }
          detail="From backend analysis"
          icon={<ShieldAlert className="size-4" />}
        />

        <MetricCard
          label="Anomalies detected"
          value={
            loading
              ? '…'
              : anomalies.toLocaleString()
          }
          detail="Potentially unusual records"
          icon={<Activity className="size-4" />}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title="Portfolio health"
          action={
            <span className="text-xs text-muted-foreground">
              Backend monitoring
            </span>
          }
        >
          {monitoring.length > 0 ? (
            <TrendChart data={monitoring} />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Monitoring data will appear after a dataset is analyzed.
            </div>
          )}
        </Panel>

        <Panel title="Needs your attention">
          {datasets.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              No datasets uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {datasets.slice(0, 3).map((x) => (
                <div
                  className="flex items-center gap-3 p-4"
                  key={x.id}
                >
                  <div className="rounded-md bg-warning-soft p-2 text-warning">
                    <AlertTriangle className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {x.name}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      Quality {getQuality(x)}/100 · Readiness{' '}
                      {getReadiness(x)}/100
                    </p>
                  </div>

                  <StatusBadge>
                    {getGate(x)}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Recent datasets"
        action={
          <span className="text-xs text-muted-foreground">
            Live backend data
          </span>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Dataset</Th>
              <Th>Rows</Th>
              <Th>Quality</Th>
              <Th>ML readiness</Th>
              <Th>Gate decision</Th>
              <Th>Updated</Th>
            </tr>
          </thead>

          <tbody>
            {datasets.map((x) => (
              <tr
                key={x.id}
                className="hover:bg-muted/40"
              >
                <Td>
                  <div className="font-semibold">
                    {x.name}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {x.id}
                  </div>
                </Td>

                <Td>
                  {Number(x.rows || 0).toLocaleString()}
                </Td>

                <Td>
                  <b>{getQuality(x)}</b>/100
                </Td>

                <Td>
                  <b>{getReadiness(x)}</b>/100
                </Td>

                <Td>
                  <StatusBadge>
                    {getGate(x)}
                  </StatusBadge>
                </Td>

                <Td className="text-muted-foreground">
                  {formatDate(
                    x.updated_at || x.created_at
                  )}
                </Td>
              </tr>
            ))}

            {!loading && datasets.length === 0 && (
              <tr>
                <Td
                  className="text-center text-muted-foreground"
                  colSpan={6}
                >
                  No datasets found. Upload a CSV from the Datasets page.
                </Td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

/* =========================================================
   DATASETS PAGE
========================================================= */

export function DatasetsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] =
    useState<any | null>(null);
  const [error, setError] = useState('');
  const [loadingDatasets, setLoadingDatasets] =
    useState(true);

  const loadDatasets = async () => {
    try {
      setLoadingDatasets(true);

      const items = await dataGuardApi.getDatasets();

      setDatasets(items || []);

      if (items?.length && !selectedDataset) {
        setSelectedDataset(items[0]);
      }
    } catch (e: any) {
      setError(
        e?.message || 'Unable to load datasets.'
      );
    } finally {
      setLoadingDatasets(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const uploadAndAnalyze = async () => {
    if (!file) return;

    try {
      setError('');
      setProgress(15);

      const uploaded =
        await dataGuardApi.uploadDataset(file);

      setProgress(45);

      const datasetId =
        uploaded?.id ||
        uploaded?.dataset_id;

      if (!datasetId) {
        throw new Error(
          'Backend upload succeeded but no dataset ID was returned.'
        );
      }

      setProgress(60);

      await dataGuardApi.analyzeDataset(
        datasetId
      );

      setProgress(90);

      const freshDataset =
        await dataGuardApi.getDataset(
          datasetId
        );

      setSelectedDataset(freshDataset);

      const items =
        await dataGuardApi.getDatasets();

      setDatasets(items || []);

      setProgress(100);
    } catch (e: any) {
      console.error(e);

      setError(
        e?.message ||
          'Upload or analysis failed.'
      );

      setProgress(0);
    }
  };

  const filteredDatasets =
    datasets.filter((x) =>
      String(x.name || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <>
      <PageHeader
        title="Datasets"
        subtitle="Upload, review, and compare datasets across their full quality lifecycle."
      />

      {error && (
        <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.6fr]">
        <Panel title="Upload Dataset">
          <div className="p-5">
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:border-primary">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  setFile(
                    e.target.files?.[0] ?? null
                  );

                  setProgress(0);
                  setError('');
                }}
              />

              <div className="rounded-md bg-primary-soft p-3 text-primary">
                <Upload className="size-6" />
              </div>

              <p className="mt-3 font-semibold">
                Drop a CSV here or browse
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Secure upload · CSV files up to 500 MB
              </p>
            </label>

            {file && (
              <div className="mt-4 rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <FileSearch className="size-5 text-primary" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {file.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <button
                    aria-label="Remove file"
                    onClick={() => {
                      setFile(null);
                      setProgress(0);
                      setError('');
                    }}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {progress > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {progress < 100
                        ? `Processing Dataset… ${progress}%`
                        : 'Analysis complete'}
                    </p>
                  </div>
                )}

                <Button
                  className="mt-3 w-full"
                  onClick={uploadAndAnalyze}
                  disabled={
                    progress > 0 &&
                    progress < 100
                  }
                >
                  {progress === 100 ? (
                    <>
                      <Check className="size-4" />
                      Analysis complete
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Upload & Analyze Dataset
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t p-5">
            <p className="text-sm font-semibold">
              What happens after upload?
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {[
                'Dataset profiling',
                'Quality analysis',
                'Anomaly detection',
                'Cleaning recommendations',
                'ML risk analysis',
                'Pipeline gate decision',
              ].map((x, i) => (
                <div
                  className="flex items-center gap-2"
                  key={x}
                >
                  <span className="grid size-5 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>

                  {x}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Dataset inventory">
          <div className="border-b p-4">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search datasets"
            />
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th>Dataset</Th>
                <Th>Rows</Th>
                <Th>Columns</Th>
                <Th>Quality</Th>
                <Th>Readiness</Th>
                <Th>Gate</Th>
              </tr>
            </thead>

            <tbody>
              {filteredDatasets.map((x) => (
                <tr
                  key={x.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() =>
                    setSelectedDataset(x)
                  }
                >
                  <Td>
                    <p className="font-semibold">
                      {x.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {x.id}
                    </p>
                  </Td>

                  <Td>
                    {Number(
                      x.rows || 0
                    ).toLocaleString()}
                  </Td>

                  <Td>
                    {x.columns ?? 0}
                  </Td>

                  <Td>
                    {getQuality(x)}/100
                  </Td>

                  <Td>
                    {getReadiness(x)}/100
                  </Td>

                  <Td>
                    <StatusBadge>
                      {getGate(x)}
                    </StatusBadge>
                  </Td>
                </tr>
              ))}

              {!loadingDatasets &&
                filteredDatasets.length === 0 && (
                  <tr>
                    <Td
                      className="text-center text-muted-foreground"
                      colSpan={6}
                    >
                      No datasets uploaded yet.
                    </Td>
                  </tr>
                )}
            </tbody>
          </TableWrap>
        </Panel>
      </div>

      {selectedDataset && (
        <DatasetOverview
          dataset={selectedDataset}
          onRefresh={async () => {
            const fresh =
              await dataGuardApi.getDataset(
                selectedDataset.id
              );

            setSelectedDataset(fresh);

            const items =
              await dataGuardApi.getDatasets();

            setDatasets(items || []);
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   DATASET OVERVIEW
========================================================= */

function DatasetOverview({
  dataset,
  onRefresh,
}: {
  dataset: any;
  onRefresh: () => Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const [quality, setQuality] =
    useState<any>(null);
  const [anomalies, setAnomalies] =
    useState<any>(null);

  useEffect(() => {
    if (!dataset?.id) return;

    Promise.all([
      dataGuardApi
        .getQuality(dataset.id)
        .catch(() => null),

      dataGuardApi
        .getAnomalies(dataset.id)
        .catch(() => null),
    ]).then(([q, a]) => {
      setQuality(q);
      setAnomalies(a);
    });
  }, [dataset?.id]);

  const rows = Number(
    dataset?.rows || 0
  );

  const columns = Number(
    dataset?.columns || 0
  );

  const missing = getMissing(dataset);

  const anomalyCount = Number(
    anomalies?.count ??
      getAnomalies(dataset)
  );

  return (
    <div className="mt-5">
      <PageHeader
        title={dataset.name || 'Dataset'}
        subtitle={`${dataset.id} · Uploaded ${formatDate(
          dataset.created_at ||
            dataset.uploaded
        )}`}
        actions={
          <StatusBadge>
            {dataset.status ||
              getGate(dataset)}
          </StatusBadge>
        }
      />

      {/* Dataset metrics */}

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ['File size', dataset.size || '—'],
          ['Rows', rows.toLocaleString()],
          ['Columns', columns],
          [
            'Quality',
            `${getQuality(dataset)}/100`,
          ],
          [
            'ML readiness',
            `${getReadiness(dataset)}/100`,
          ],
          [
            'Anomalies',
            anomalyCount.toLocaleString(),
          ],
        ].map(([a, b]) => (
          <Panel
            className="p-4"
            key={String(a)}
          >
            <p className="text-xs text-muted-foreground">
              {a}
            </p>

            <p className="mt-1 text-xl font-bold">
              {b}
            </p>
          </Panel>
        ))}
      </div>

      {/* Live analysis summary */}

      <Panel
        className="mt-5"
        title="Live analysis summary"
        action={
          <Button
            variant="secondary"
            onClick={onRefresh}
          >
            Refresh
          </Button>
        }
      >
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Missing values
            </p>

            <p className="mt-1 text-2xl font-bold">
              {missing}%
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Anomalies
            </p>

            <p className="mt-1 text-2xl font-bold">
              {anomalyCount.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Gate
            </p>

            <div className="mt-2">
              <StatusBadge>
                {getGate(dataset)}
              </StatusBadge>
            </div>
          </div>
        </div>
      </Panel>

      {/* =====================================================
          QUALITY ANALYSIS
      ===================================================== */}

      {quality && (
        <Panel
          className="mt-5"
          title="Quality analysis"
        >
          <div className="p-5">

            {/* Overall score */}

            <div className="mb-5 flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Overall quality score
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {Number(
                    quality.score ??
                      getQuality(dataset)
                  )}
                  /100
                </p>
              </div>

              <StatusBadge>
                {Number(
                  quality.score ?? 0
                ) >= 90
                  ? 'Good'
                  : Number(
                        quality.score ?? 0
                      ) >= 75
                    ? 'Attention'
                    : 'Critical'}
              </StatusBadge>
            </div>

            {/* Quality dimensions */}

            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Quality dimensions
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(quality.dimensions || []).map(
                  (dimension: any) => (
                    <div
                      key={dimension.name}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {dimension.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {dimension.text}
                          </p>
                        </div>

                        <span className="text-lg font-bold">
                          {Number(
                            dimension.score ?? 0
                          )}
                          /100
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                Number(
                                  dimension.score ??
                                    0
                                )
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3">
                        <StatusBadge>
                          {dimension.status ||
                            'Unknown'}
                        </StatusBadge>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Detected issues */}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Detected issues
                </h3>

                <span className="text-xs text-muted-foreground">
                  {(quality.issues || []).length}{' '}
                  issue
                  {(quality.issues || []).length ===
                  1
                    ? ''
                    : 's'}
                </span>
              </div>

              {(quality.issues || []).length ===
              0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <CheckCircle2 className="mx-auto size-7 text-primary" />

                  <p className="mt-2 text-sm font-semibold">
                    No quality issues detected
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    The backend analysis did not identify any open issues.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                          Issue
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                          Column
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                          Severity
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                          Rows
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                          Recommended action
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(quality.issues || []).map(
                        (
                          issue: any,
                          index: number
                        ) => (
                          <tr
                            key={`${issue.issue}-${index}`}
                            className="border-t hover:bg-muted/30"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">
                                {issue.issue}
                              </div>

                              {issue.description && (
                                <div className="mt-1 max-w-xs text-xs text-muted-foreground">
                                  {issue.description}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3 font-medium">
                              {issue.column ||
                                '—'}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge>
                                {issue.severity ||
                                  'Unknown'}
                              </StatusBadge>
                            </td>

                            <td className="px-4 py-3">
                              {issue.rows ??
                                '—'}
                            </td>

                            <td className="px-4 py-3 text-muted-foreground">
                              {issue.action ||
                                'Review issue'}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge>
                                {issue.status ||
                                  'Open'}
                              </StatusBadge>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Dataset information */}

      <Panel
        className="mt-5"
        title="Dataset information"
      >
        <div className="p-5 text-sm text-muted-foreground">
          This panel is now backed by the uploaded dataset.
          Select another dataset from the inventory to view
          its live backend results.
        </div>
      </Panel>

      {/* Pagination */}

      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page}
        </span>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() =>
              setPage(
                Math.max(1, page - 1)
              )
            }
          >
            Previous
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              setPage(page + 1)
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}