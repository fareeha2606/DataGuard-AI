import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Eye,
  Info,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

import { dataGuardApi } from '@/lib/dataguard-api';

import {
  Button,
  Delta,
  PageHeader,
  Panel,
  ScoreGauge,
  StatusBadge,
} from './ui';

import { Donut, SimpleBars } from './charts';

const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[820px] text-left text-sm">
      {children}
    </table>
  </div>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th className="bg-muted/90 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
    {children}
  </th>
);

const Td = ({ children }: { children: ReactNode }) => (
  <td className="border-t border-border px-4 py-3 align-top">
    {children}
  </td>
);

type AnyRecord = {
  [key: string]: any;
};

function getDatasetId(
  datasets: AnyRecord[],
): string | null {
  return datasets?.[0]?.['id'] ?? null;
}

function getStatus(value: any): any {
  return value || 'Attention';
}

function getScore(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getQualityDimensions(
  quality: AnyRecord | null,
) {
  if (
    quality &&
    Array.isArray(quality['dimensions'])
  ) {
    return quality['dimensions'];
  }

  if (
    quality &&
    Array.isArray(
      quality['quality_dimensions'],
    )
  ) {
    return quality['quality_dimensions'];
  }

  return [];
}

function getIssues(
  quality: AnyRecord | null,
): AnyRecord[] {
  if (
    quality &&
    Array.isArray(quality['issues'])
  ) {
    return quality['issues'];
  }

  return [];
}

function getAnomalyRecords(
  data: AnyRecord | null,
): AnyRecord[] {
  if (
    data &&
    Array.isArray(data['records'])
  ) {
    return data['records'];
  }

  if (
    data &&
    Array.isArray(data['anomalies'])
  ) {
    return data['anomalies'];
  }

  return [];
}

function getCleaningActions(
  data: AnyRecord | null,
): AnyRecord[] {
  if (
    data &&
    Array.isArray(data['actions'])
  ) {
    return data['actions'];
  }

  if (
    data &&
    data['cleaning'] &&
    Array.isArray(
      data['cleaning']['actions'],
    )
  ) {
    return data['cleaning']['actions'];
  }

  return [];
}

/* ============================================================
   QUALITY PAGE
   ============================================================ */

export function QualityPage() {
  const [quality, setQuality] =
    useState<AnyRecord | null>(null);

  const [dataset, setDataset] =
    useState<AnyRecord | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const datasets =
          await dataGuardApi.getDatasets();

        const datasetId =
          getDatasetId(datasets);

        if (!datasetId) {
          if (!cancelled) {
            setQuality(null);
            setDataset(null);

            setError(
              'No dataset available. Upload and analyze a CSV first.',
            );
          }

          return;
        }

        const [
          datasetData,
          qualityData,
        ] = await Promise.all([
          dataGuardApi.getDataset(datasetId),
          dataGuardApi.getQuality(datasetId),
        ]);

        if (!cancelled) {
          setDataset(datasetData);
          setQuality(qualityData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load quality data.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const dimensions =
    getQualityDimensions(quality);

  const issues =
    getIssues(quality);

  const score = getScore(
    quality?.['score'] ??
      quality?.['quality_score'] ??
      dataset?.['quality'] ??
      dataset?.['analysis']?.['quality']?.[
        'score'
      ],
  );

  const missing = getScore(
    quality?.['missing_pct'] ??
      quality?.['missing_percentage'] ??
      dataset?.['missing'] ??
      dataset?.['analysis']?.['quality']?.[
        'missing_percentage'
      ],
  );

  if (loading) {
    return (
      <>
        <PageHeader
          title="Data Quality"
          subtitle="Understand what is reliable, what needs attention, and how to address each issue."
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading real quality analysis...
          </p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Data Quality"
          subtitle="Understand what is reliable, what needs attention, and how to address each issue."
        />

        <Panel className="p-8">
          <p className="font-semibold">
            Unable to load quality data
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Data Quality"
        subtitle="Understand what is reliable, what needs attention, and how to address each issue."
        actions={
          <Button variant="secondary">
            <Info className="size-4" />
            Scoring method
          </Button>
        }
      />

      <Panel className="mb-5">
        <div className="grid items-center gap-6 p-6 lg:grid-cols-[220px_1fr]">
          <ScoreGauge
            score={score}
            label="Data Quality Score"
          />

          <div>
            <div className="flex items-center gap-2">
              <StatusBadge>
                {score >= 85
                  ? 'Good'
                  : score >= 70
                    ? 'Attention'
                    : 'Critical'}
              </StatusBadge>
            </div>

            <h2 className="mt-3 text-xl font-bold">
              {dataset?.['name'] ||
                'Current dataset'}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Quality metrics below are loaded
              from the DataGuard AI backend.
            </p>
          </div>
        </div>
      </Panel>

      {dimensions.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dimensions.map(
            (
              item: AnyRecord,
              index: number,
            ) => (
              <Panel
                className="p-4"
                key={
                  item['name'] ??
                  index
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {item['name'] ??
                        `Dimension ${
                          index + 1
                        }`}
                    </p>

                    <StatusBadge>
                      {getStatus(
                        item['status'],
                      )}
                    </StatusBadge>
                  </div>

                  <p className="text-2xl font-bold">
                    {getScore(
                      item['score'],
                    )}

                    <span className="text-sm font-normal text-muted-foreground">
                      %
                    </span>
                  </p>
                </div>

                <div className="my-3 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        getScore(
                          item['score'],
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  {item['text'] ??
                    item['detail'] ??
                    item['description'] ??
                    ''}
                </p>
              </Panel>
            ),
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Quality summary">
          <div className="grid grid-cols-3 border-t">
            <div className="p-4 text-center">
              <b>
                {quality?.[
                  'missing_cells'
                ] ??
                  quality?.[
                    'missing_total'
                  ] ??
                  0}
              </b>

              <p className="text-xs text-muted-foreground">
                Missing cells
              </p>
            </div>

            <div className="p-4 text-center">
              <b>{missing}%</b>

              <p className="text-xs text-muted-foreground">
                Missing
              </p>
            </div>

            <div className="p-4 text-center">
              <b>
                {quality?.[
                  'duplicates'
                ] ?? 0}
              </b>

              <p className="text-xs text-muted-foreground">
                Duplicates
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Issue overview">
          <div className="grid grid-cols-2 gap-px bg-border">
            <IssueBlock
              title="Issues"
              value={String(
                issues.length,
              )}
              detail="Detected by backend quality analysis"
            />

            <IssueBlock
              title="Dataset rows"
              value={String(
                dataset?.['rows'] ?? 0,
              )}
              detail="Rows analyzed"
            />

            <IssueBlock
              title="Columns"
              value={String(
                dataset?.['columns'] ?? 0,
              )}
              detail="Columns analyzed"
            />

            <IssueBlock
              title="Duplicates"
              value={String(
                quality?.[
                  'duplicates'
                ] ??
                  dataset?.[
                    'duplicates'
                  ] ??
                  0,
              )}
              detail="Exact duplicate rows"
            />
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Detailed issues"
        action={
          <Button variant="secondary">
            Severity: All
            <ChevronRight className="size-4" />
          </Button>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Issue</Th>
              <Th>Column</Th>
              <Th>Severity</Th>
              <Th>Affected rows</Th>
              <Th>Description</Th>
              <Th>Recommended action</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {issues.length === 0 ? (
              <tr>
                <Td>
                  <span className="text-muted-foreground">
                    No issues returned by
                    the backend.
                  </span>
                </Td>
              </tr>
            ) : (
              issues.map(
                (
                  item: AnyRecord,
                  index: number,
                ) => (
                  <tr
                    key={
                      item['issue'] ??
                      index
                    }
                    className="hover:bg-muted/30"
                  >
                    <Td>
                      <b>
                        {item['issue'] ??
                          item['name'] ??
                          'Issue'}
                      </b>
                    </Td>

                    <Td>
                      <code className="rounded bg-muted px-1.5 py-1 text-xs">
                        {item['column'] ??
                          item['columns'] ??
                          '-'}
                      </code>
                    </Td>

                    <Td>
                      <StatusBadge>
                        {item[
                          'severity'
                        ] ??
                          item[
                            'status'
                          ] ??
                          'Attention'}
                      </StatusBadge>
                    </Td>

                    <Td>
                      {item['rows'] ??
                        item[
                          'affected_rows'
                        ] ??
                        '-'}
                    </Td>

                    <Td>
                      <span className="text-muted-foreground">
                        {item[
                          'description'
                        ] ??
                          item[
                            'detail'
                          ] ??
                          ''}
                      </span>
                    </Td>

                    <Td>
                      {item['action'] ??
                        item[
                          'recommended_action'
                        ] ??
                        '-'}
                    </Td>

                    <Td>
                      <StatusBadge>
                        {item[
                          'status'
                        ] ?? 'Open'}
                      </StatusBadge>
                    </Td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

function IssueBlock({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-card p-5">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

/* ============================================================
   ANOMALIES PAGE
   ============================================================ */

export function AnomaliesPage() {
  const [filter, setFilter] =
    useState('All');

  const [records, setRecords] =
    useState<AnyRecord[]>([]);

  const [data, setData] =
    useState<AnyRecord | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const datasets =
          await dataGuardApi.getDatasets();

        const datasetId =
          getDatasetId(datasets);

        if (!datasetId) {
          throw new Error(
            'No dataset available. Upload and analyze a CSV first.',
          );
        }

        const result =
          await dataGuardApi.getAnomalies(
            datasetId,
          );

        if (!cancelled) {
          setData(result);

          setRecords(
            getAnomalyRecords(
              result,
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load anomaly data.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      records.filter(
        (item: AnyRecord) =>
          filter === 'All' ||
          item['severity'] ===
            filter,
      ),
    [records, filter],
  );

  const anomalyCount = Number(
    data?.['count'] ??
      records.length,
  );

  const sampledRows = Number(
    data?.['sampled_rows'] ?? 0,
  );

  if (loading) {
    return (
      <>
        <PageHeader
          title="Anomaly Detection"
          subtitle="Identify unusual records that may affect downstream ML pipelines."
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading real anomaly
            analysis...
          </p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Anomaly Detection"
          subtitle="Identify unusual records that may affect downstream ML pipelines."
        />

        <Panel className="p-8">
          <p className="font-semibold">
            Unable to load anomalies
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Anomaly Detection"
        subtitle="Identify unusual records that may affect downstream ML pipelines."
        actions={
          <Button variant="secondary">
            Detection settings
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Panel className="p-4">
          <p className="text-sm text-muted-foreground">
            Analyzed rows
          </p>

          <p className="mt-2 text-2xl font-bold">
            {sampledRows || '—'}
          </p>
        </Panel>

        <Panel className="p-4">
          <p className="text-sm text-muted-foreground">
            Anomalies detected
          </p>

          <p className="mt-2 text-2xl font-bold">
            {anomalyCount}
          </p>
        </Panel>

        <Panel className="p-4">
          <p className="text-sm text-muted-foreground">
            Detection method
          </p>

          <p className="mt-2 text-lg font-bold">
            {data?.['method'] ??
              'Isolation Forest'}
          </p>
        </Panel>

        <Panel className="p-4">
          <p className="text-sm text-muted-foreground">
            Returned records
          </p>

          <p className="mt-2 text-2xl font-bold">
            {records.length}
          </p>
        </Panel>
      </div>

      <Panel title="Record distribution">
        <div className="p-5">
          <Donut
            value={
              sampledRows
                ? Math.min(
                    100,
                    (anomalyCount /
                      sampledRows) *
                      100,
                  )
                : 0
            }
          />

          <div className="mx-5 mb-5 rounded-md bg-primary-soft p-3 text-xs leading-5 text-foreground">
            <Info className="mr-2 inline size-4 text-primary" />

            Anomalies are potentially
            unusual records, not
            automatically bad data.
            Review their business context
            before acting.
          </div>
        </div>
      </Panel>

      <Panel
        className="mt-5"
        title="Potentially Unusual Records"
        action={
          <div className="flex gap-2">
            {[
              'All',
              'High',
              'Medium',
              'Low',
            ].map((value) => (
              <Button
                key={value}
                variant={
                  filter === value
                    ? 'primary'
                    : 'secondary'
                }
                onClick={() =>
                  setFilter(value)
                }
              >
                {value}
              </Button>
            ))}
          </div>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Record ID</Th>
              <Th>Anomaly score</Th>
              <Th>Severity</Th>
              <Th>
                Reason / suspicious
                features
              </Th>
              <Th>Action</Th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(
              (
                item: AnyRecord,
                index: number,
              ) => (
                <tr
                  key={
                    item['id'] ??
                    index
                  }
                >
                  <Td>
                    <b>
                      {item['id'] ??
                        `REC-${
                          index + 1
                        }`}
                    </b>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-warning"
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                item[
                                  'score'
                                ] ??
                                  0,
                              ) * 100,
                            )}%`,
                          }}
                        />
                      </div>

                      {Number(
                        item[
                          'score'
                        ] ?? 0,
                      ).toFixed(2)}
                    </div>
                  </Td>

                  <Td>
                    <StatusBadge>
                      {item[
                        'severity'
                      ] ?? 'Medium'}
                    </StatusBadge>
                  </Td>

                  <Td>
                    {item['reason'] ??
                      'Unusual multivariate numeric pattern'}
                  </Td>

                  <Td>
                    <Button variant="ghost">
                      <Eye className="size-4" />
                      Inspect
                    </Button>
                  </Td>
                </tr>
              ),
            )}

            {filtered.length === 0 && (
              <tr>
                <Td>
                  <span className="text-muted-foreground">
                    No anomaly records
                    for this filter.
                  </span>
                </Td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

/* ============================================================
   CLEANING PAGE
   ============================================================ */

export function CleaningPage() {
  const [actions, setActions] =
    useState<AnyRecord[]>([]);

  const [selected, setSelected] =
    useState<string[]>([]);

  const [simulated, setSimulated] =
    useState<AnyRecord | null>(null);

  const [approval, setApproval] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState('');

  const [datasetId, setDatasetId] =
    useState<string | null>(null);

  const [appliedFile, setAppliedFile] =
    useState<AnyRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const datasets =
          await dataGuardApi.getDatasets();

        const id =
          getDatasetId(datasets);

        if (!id) {
          throw new Error(
            'No dataset available. Upload and analyze a CSV first.',
          );
        }

        const result =
          await dataGuardApi.getCleaning(
            id,
          );

        const loadedActions =
          getCleaningActions(result);

        if (!cancelled) {
          setDatasetId(id);

          setActions(
            loadedActions,
          );

          setSelected(
            loadedActions.map(
              (item) =>
                String(item['id']),
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load cleaning actions.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setSelected(
      (current) =>
        current.includes(id)
          ? current.filter(
              (value) =>
                value !== id,
            )
          : [
              ...current,
              id,
            ],
    );
  };

  const selectedActions =
    actions.filter((item) =>
      selected.includes(
        String(item['id']),
      ),
    );

  async function simulate() {
    if (!datasetId) return;

    if (selectedActions.length === 0) {
      setError(
        'Please select at least one cleaning action.',
      );
      return;
    }

    try {
      setWorking(true);
      setError('');

      const result =
        await dataGuardApi.simulateCleaning(
          datasetId,

          selectedActions.map(
            (item) =>
              String(
                item['id'],
              ),
          ),
        );

      setSimulated(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Cleaning simulation failed.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function apply() {
    if (!datasetId) return;

    if (selectedActions.length === 0) {
      setError(
        'Please select at least one cleaning action.',
      );
      return;
    }

    try {
      setWorking(true);
      setError('');

      const result =
        await dataGuardApi.applyCleaning(
          datasetId,

          selectedActions.map(
            (item) =>
              String(
                item['id'],
              ),
          ),

          'user',
        );

      setAppliedFile(result);

      setApproval(false);

      const cleaningResult =
        await dataGuardApi.getCleaning(
          datasetId,
        );

      setActions(
        getCleaningActions(
          cleaningResult,
        ),
      );

      setSimulated(null);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Applying cleaning failed.',
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Cleaning & Simulation"
          subtitle="Detect → Explain → Simulate → Review → Approve → Validate → Gate"
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading real cleaning
            recommendations...
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Cleaning & Simulation"
        subtitle="Detect → Explain → Simulate → Review → Approve → Validate → Gate"
        actions={
          <Button
            onClick={simulate}
            disabled={
              working ||
              selected.length === 0
            }
          >
            <Play className="size-4" />

            {working
              ? 'Running...'
              : 'Simulate selected'}
          </Button>
        }
      />

      {error && (
        <Panel className="mb-5 border-danger p-4">
          <p className="font-semibold">
            Cleaning error
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {error}
          </p>
        </Panel>
      )}

      {appliedFile && datasetId && (
        <Panel className="mb-5 border-success">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-full bg-success-soft">
                  <Check className="size-5 text-success" />
                </div>

                <h3 className="font-semibold">
                  Cleaning applied successfully
                </h3>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                A new cleaned CSV file has
                been created. The original
                source dataset has not been
                overwritten.
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                  <b className="text-foreground">
                    File:
                  </b>{' '}
                  {appliedFile[
                    'filename'
                  ] ??
                    `${datasetId}_cleaned.csv`}
                </span>

                <span>
                  <b className="text-foreground">
                    Rows:
                  </b>{' '}
                  {appliedFile[
                    'rows'
                  ] ?? '-'}
                </span>

                <span>
                  <b className="text-foreground">
                    Columns:
                  </b>{' '}
                  {appliedFile[
                    'columns'
                  ] ?? '-'}
                </span>
              </div>
            </div>

            {/* FIXED: Button does not support asChild */}
            <a
              href={dataGuardApi.downloadCleanedDataset(
                datasetId,
              )}
              download={
                appliedFile[
                  'filename'
                ] ??
                `${datasetId}_cleaned.csv`
              }
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Download className="size-4" />
              Download cleaned CSV
            </a>
          </div>
        </Panel>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Panel title="Recommended Cleaning Actions">
          <div className="divide-y divide-border">
            {actions.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No cleaning actions returned
                by the backend.
              </div>
            ) : (
              actions.map(
                (
                  item: AnyRecord,
                ) => {
                  const id =
                    String(
                      item['id'],
                    );

                  return (
                    <div
                      key={id}
                      className="p-5"
                    >
                      <div className="flex gap-3">
                        <input
                          aria-label={`Select ${
                            item[
                              'action'
                            ] ??
                            id
                          }`}
                          type="checkbox"
                          checked={selected.includes(
                            id,
                          )}
                          onChange={() =>
                            toggle(id)
                          }
                          className="mt-1 size-4 accent-primary"
                        />

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {item[
                                'action'
                              ] ??
                                'Cleaning action'}
                            </p>

                            <StatusBadge>
                              {item[
                                'risk'
                              ] ??
                                'Low'}
                            </StatusBadge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {item[
                              'issue'
                            ] ??
                              ''}
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-3">
                            <span>
                              <b>
                                Expected
                                impact
                              </b>
                              <br />
                              {item[
                                'impact'
                              ] ??
                                '-'}
                            </span>

                            <span>
                              <b>
                                Affected
                                rows
                              </b>
                              <br />
                              {item[
                                'rows'
                              ] ??
                                '-'}
                            </span>

                            <span>
                              <b>
                                Risk
                              </b>
                              <br />
                              {item[
                                'risk'
                              ] ??
                                'Low'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={
                              simulate
                            }
                            disabled={
                              working
                            }
                          >
                            <Eye className="size-4" />
                            Preview
                          </Button>

                          <Button
                            onClick={() => {
                              if (
                                !selected.includes(
                                  id,
                                )
                              ) {
                                setSelected(
                                  (
                                    current,
                                  ) => [
                                    ...current,
                                    id,
                                  ],
                                );
                              }

                              if (
                                item[
                                  'risk'
                                ] ===
                                'High'
                              ) {
                                setApproval(
                                  true,
                                );
                              } else {
                                if (
                                  selected.includes(
                                    id,
                                  )
                                ) {
                                  apply();
                                } else {
                                  setSelected(
                                    (
                                      current,
                                    ) => [
                                      ...current,
                                      id,
                                    ],
                                  );
                                }
                              }
                            }}
                            disabled={
                              working
                            }
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>
        </Panel>

        <Panel title="Simulation summary">
          <div className="p-5">
            {!simulated ? (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <Sparkles className="mx-auto size-8 text-muted-foreground" />

                  <p className="mt-3 font-semibold">
                    Run a what-if
                    simulation
                  </p>

                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Preview likely benefits
                    and trade-offs before
                    changing any records.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-md bg-success-soft p-4">
                  <p className="font-semibold text-success">
                    Simulation complete
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    No changes have been
                    applied to the source
                    dataset.
                  </p>
                </div>

                <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
                  {JSON.stringify(
                    simulated,
                    null,
                    2,
                  )}
                </pre>

                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    setApproval(
                      true,
                    )
                  }
                  disabled={
                    working ||
                    selected.length === 0
                  }
                >
                  Review and apply
                  changes
                </Button>
              </>
            )}
          </div>
        </Panel>
      </div>

      {approval && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-lg bg-card shadow-float"
          >
            <div className="flex items-start gap-3 border-b p-5">
              <div className="rounded-md bg-danger-soft p-2 text-danger">
                <ShieldAlert className="size-5" />
              </div>

              <div className="flex-1">
                <StatusBadge>
                  Cleaning Review
                </StatusBadge>

                <h2 className="mt-2 text-lg font-bold">
                  Apply selected cleaning
                  actions?
                </h2>
              </div>

              <Button
                variant="ghost"
                onClick={() =>
                  setApproval(
                    false,
                  )
                }
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-5">
              <p className="font-semibold">
                {selected.length}{' '}
                cleaning action(s)
                selected.
              </p>

              <div className="mt-4 space-y-3 text-sm">
                <p>
                  <b>
                    Selected actions:
                  </b>{' '}
                  {
                    selectedActions.length
                  }
                </p>

                <p>
                  <b>Dataset:</b>{' '}
                  {datasetId}
                </p>

                <p className="text-muted-foreground">
                  Review the simulation
                  result before applying
                  changes to the dataset.
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setApproval(
                      false,
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  onClick={apply}
                  disabled={working}
                >
                  <Check className="size-4" />

                  {working
                    ? 'Applying...'
                    : 'Approve & Apply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}