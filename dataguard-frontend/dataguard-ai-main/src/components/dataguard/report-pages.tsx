import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileBadge,
  Info,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { dataGuardApi } from '@/lib/dataguard-api';

import {
  Button,
  PageHeader,
  Panel,
  ScoreGauge,
  StatusBadge,
} from './ui';

import { SimpleBars, TrendChart } from './charts';

/* =========================================================
   HELPERS
========================================================= */

type AnyRecord = any;

function getDatasetId(datasets: AnyRecord[]): string | null {
  return datasets?.[0]?.id ?? null;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getScore(data: AnyRecord | null, fallback = 0): number {
  return num(
    data?.score ??
      data?.readiness_score ??
      data?.ml_readiness_score ??
      fallback,
  );
}

function getGate(data: AnyRecord | null): string {
  return (
    data?.decision ??
    data?.gate?.decision ??
    data?.analysis?.gate?.decision ??
    'In review'
  );
}

function getStatus(value: unknown): string {
  return String(value || 'Attention');
}

function getDimensions(data: AnyRecord | null): AnyRecord[] {
  if (Array.isArray(data?.dimensions)) {
    return data.dimensions;
  }

  if (Array.isArray(data?.readiness_dimensions)) {
    return data.readiness_dimensions;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function getRisks(data: AnyRecord | null): AnyRecord[] {
  if (Array.isArray(data?.risks)) {
    return data.risks;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .filter(
        ([key, value]) =>
          key !== 'score' &&
          key !== 'summary' &&
          key !== 'count' &&
          value &&
          typeof value === 'object' &&
          !Array.isArray(value),
      )
      .map(([name, value]) => ({
        name,
        ...(value as AnyRecord),
      }));
  }

  return [];
}

function getMonitoringRows(data: any): AnyRecord[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.trends)) {
    return data.trends;
  }

  if (Array.isArray(data?.history)) {
    return data.history;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function getPassportItems(
  data: AnyRecord | null,
  key: string,
): string[] {
  const value = data?.[key];

  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === 'string'
        ? item
        : JSON.stringify(item),
    );
  }

  return [];
}

function formatDate(value: unknown): string {
  if (!value) return '—';

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getGateTone(gate: string) {
  if (gate === 'Approved') return 'success';
  if (gate === 'Blocked') return 'danger';
  return 'warning';
}

/* =========================================================
   META
========================================================= */

const meta = (
  title: string,
  description: string,
) => ({
  meta: [
    {
      title: `${title} — DataGuard AI`,
    },
    {
      name: 'description',
      content: description,
    },
    {
      property: 'og:title',
      content: `${title} — DataGuard AI`,
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
  ],
});

export { meta };

/* =========================================================
   DATA LOADER
========================================================= */

function useCurrentDataset() {
  const [dataset, setDataset] =
    useState<AnyRecord | null>(null);

  const [datasetId, setDatasetId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const datasets =
        await dataGuardApi.getDatasets();

      const id = getDatasetId(datasets);

      if (!id) {
        throw new Error(
          'No dataset available. Upload and analyze a CSV first.',
        );
      }

      const result =
        await dataGuardApi.getDataset(id);

      setDatasetId(id);
      setDataset(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dataset.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    dataset,
    datasetId,
    loading,
    error,
    reload: load,
  };
}

/* =========================================================
   READINESS DIMENSIONS
========================================================= */

function DimensionGrid({
  dimensions,
}: {
  dimensions: AnyRecord[];
}) {
  if (dimensions.length === 0) {
    return (
      <Panel className="p-6">
        <p className="font-semibold">
          No readiness dimensions returned
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Run dataset analysis to generate ML readiness dimensions.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {dimensions.map(
        (item, index) => {
          const score = num(
            item.score ??
              item.value ??
              0,
          );

          return (
            <Panel
              className="p-4"
              key={
                item.name ??
                item.id ??
                index
              }
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">
                  {item.name ??
                    item.dimension ??
                    `Dimension ${index + 1}`}
                </p>

                <span className="text-xl font-bold">
                  {score}
                </span>
              </div>

              <div className="my-3 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        score,
                      ),
                    )}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <StatusBadge>
                  {getStatus(
                    item.status ??
                      (score >= 85
                        ? 'Good'
                        : score >= 70
                          ? 'Attention'
                          : 'Critical'),
                  )}
                </StatusBadge>

                <Info className="size-4 text-muted-foreground" />
              </div>

              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {item.text ??
                  item.detail ??
                  item.description ??
                  'Backend readiness analysis result.'}
              </p>
            </Panel>
          );
        },
      )}
    </div>
  );
}

/* =========================================================
   ML READINESS PAGE
========================================================= */

export function ReadinessPage() {
  const {
    dataset,
    datasetId,
    loading,
    error,
    reload,
  } = useCurrentDataset();

  const [readiness, setReadiness] =
    useState<AnyRecord | null>(null);

  const [risks, setRisks] =
    useState<AnyRecord[]>([]);

  const [loadingAnalysis, setLoadingAnalysis] =
    useState(false);

  const loadAnalysis = async () => {
    if (!datasetId) return;

    try {
      setLoadingAnalysis(true);

      const [
        readinessResult,
        risksResult,
      ] = await Promise.all([
        dataGuardApi.getMlReadiness(
          datasetId,
        ),
        dataGuardApi.getMlRisks(
          datasetId,
        ),
      ]);

      setReadiness(
        readinessResult ?? null,
      );

      setRisks(
        getRisks(
          risksResult,
        ),
      );
    } catch (err) {
      console.error(
        'ML readiness load failed:',
        err,
      );
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      loadAnalysis();
    }
  }, [datasetId]);

  const score = getScore(
    readiness,
    num(
      dataset?.readiness ??
        dataset?.analysis?.ml_readiness?.score ??
        0,
    ),
  );

  const dimensions =
    getDimensions(readiness);

  const goodCount =
    dimensions.filter(
      (item) =>
        num(item.score) >= 85,
    ).length;

  const attentionCount =
    dimensions.filter(
      (item) => {
        const value = num(
          item.score,
        );

        return (
          value >= 70 &&
          value < 85
        );
      },
    ).length;

  const criticalCount =
    dimensions.filter(
      (item) =>
        num(item.score) < 70,
    ).length;

  const gate =
    getGate(dataset);

  if (loading) {
    return (
      <>
        <PageHeader
          title="ML Readiness"
          subtitle="Evaluate whether this dataset is dependable, safe, and suitable for model development."
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading ML readiness analysis...
          </p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="ML Readiness"
          subtitle="Evaluate whether this dataset is dependable, safe, and suitable for model development."
        />

        <Panel className="p-8">
          <p className="font-semibold">
            Unable to load ML readiness
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
        title="ML Readiness"
        subtitle="Evaluate whether this dataset is dependable, safe, and suitable for model development."
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await reload();
              await loadAnalysis();
            }}
            disabled={loadingAnalysis}
          >
            <RefreshCw className="size-4" />

            {loadingAnalysis
              ? 'Refreshing...'
              : 'Re-evaluate'}
          </Button>
        }
      />

      <Panel className="mb-5">
        <div className="grid items-center gap-8 p-6 lg:grid-cols-[220px_1fr]">
          <ScoreGauge
            score={score}
            label="ML Readiness Score"
          />

          <div>
            <StatusBadge>
              {gate !== 'In review'
                ? gate
                : score >= 85
                  ? 'Good'
                  : score >= 70
                    ? 'Attention'
                    : 'Critical'}
            </StatusBadge>

            <h2 className="mt-3 text-xl font-bold">
              {dataset?.name ??
                'Current dataset'}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {readiness?.summary ??
                readiness?.explanation ??
                'The readiness score is calculated from the backend ML readiness analysis.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <span>
                <b className="text-success">
                  {goodCount}
                </b>{' '}
                good dimensions
              </span>

              <span>
                <b className="text-warning">
                  {attentionCount}
                </b>{' '}
                need attention
              </span>

              <span>
                <b className="text-danger">
                  {criticalCount}
                </b>{' '}
                critical
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <DimensionGrid
        dimensions={dimensions}
      />

      <h2 className="mb-3 mt-7 text-lg font-bold">
        ML Risk Analysis
      </h2>

      {risks.length === 0 ? (
        <Panel className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success" />

            <div>
              <p className="font-semibold">
                No ML risks returned
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                The backend did not return any additional ML risk records.
              </p>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {risks.map(
            (risk, index) => (
              <Panel
                className="p-5"
                key={
                  risk.id ??
                  risk.name ??
                  index
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    {risk.name ??
                      risk.risk ??
                      risk.title ??
                      `ML Risk ${index + 1}`}
                  </h3>

                  <StatusBadge>
                    {getStatus(
                      risk.status ??
                        risk.severity ??
                        risk.level,
                    )}
                  </StatusBadge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {risk.detail ??
                    risk.description ??
                    risk.explanation ??
                    'Backend ML risk analysis result.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-muted p-3 text-xs">
                  <span>
                    <b>Affected columns</b>
                    <br />

                    {Array.isArray(
                      risk.columns,
                    )
                      ? risk.columns.join(
                          ', ',
                        )
                      : risk.columns ??
                        risk.affected_columns ??
                        '—'}
                  </span>

                  <span>
                    <b>Recommended action</b>
                    <br />

                    {risk.action ??
                      risk.recommended_action ??
                      'Review risk'}
                  </span>
                </div>
              </Panel>
            ),
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Readiness breakdown">
          <div className="p-5">
            {dimensions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No dimension data available.
              </p>
            ) : (
              <SimpleBars
                data={dimensions
                  .slice(0, 8)
                  .map(
                    (item, index) => ({
                      name:
                        item.name ??
                        `Dimension ${index + 1}`,
                      value: num(
                        item.score,
                      ),
                    }),
                  )}
              />
            )}
          </div>
        </Panel>

        <Panel title="Why is this dataset receiving this score?">
          <div className="p-5">
            <p className="mb-4 text-sm text-muted-foreground">
              These factors come from the DataGuard AI backend readiness and risk analysis.
            </p>

            {dimensions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Readiness factors will appear after analysis.
              </p>
            ) : (
              <div className="space-y-3">
                {dimensions.map(
                  (item, index) => {
                    const value =
                      num(
                        item.score,
                      );

                    return (
                      <div
                        className="grid grid-cols-[150px_1fr_50px] items-center gap-3"
                        key={
                          item.name ??
                          index
                        }
                      >
                        <span className="text-xs">
                          {item.name ??
                            `Dimension ${index + 1}`}
                        </span>

                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  value,
                                ),
                              )}%`,
                            }}
                          />
                        </div>

                        <b className="text-right text-xs">
                          {value}
                        </b>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

/* =========================================================
   PIPELINE GATE
========================================================= */

export function GatePage() {
  const {
    dataset,
    datasetId,
    loading,
    error,
    reload,
  } = useCurrentDataset();

  const [gate, setGate] =
    useState<AnyRecord | null>(null);

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const loadGate = async () => {
    if (!datasetId) return;

    try {
      const result =
        await dataGuardApi.getGate(
          datasetId,
        );

      setGate(result);
    } catch (err) {
      console.error(
        'Gate load failed:',
        err,
      );
    }
  };

  useEffect(() => {
    if (datasetId) {
      loadGate();
    }
  }, [datasetId]);

  const decision =
    gate?.decision ??
    getGate(dataset);

  const readiness =
    num(
      gate?.readiness ??
        gate?.ml_readiness ??
        dataset?.readiness ??
        dataset?.analysis?.ml_readiness?.score,
    );

  const quality =
    num(
      gate?.quality ??
        dataset?.quality ??
        dataset?.analysis?.quality?.score,
    );

  const checks: AnyRecord[] =
    Array.isArray(gate?.checks)
      ? gate.checks
      : Array.isArray(
            gate?.safety_checks,
          )
        ? gate.safety_checks
        : [];

  const requiredActions: AnyRecord[] =
    Array.isArray(
      gate?.required_actions,
    )
      ? gate.required_actions
      : [];

  async function approve() {
    if (!datasetId) return;

    try {
      setWorking(true);
      setMessage('');

      await dataGuardApi.approveGate(
        datasetId,
        'Approved by user',
      );

      await Promise.all([
        loadGate(),
        reload(),
      ]);

      setMessage(
        'Pipeline gate approved successfully.',
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Failed to approve gate.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function reject() {
    if (!datasetId) return;

    try {
      setWorking(true);
      setMessage('');

      await dataGuardApi.rejectGate(
        datasetId,
        'Rejected by user',
      );

      await Promise.all([
        loadGate(),
        reload(),
      ]);

      setMessage(
        'Pipeline gate rejected.',
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Failed to reject gate.',
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Pipeline Gate"
          subtitle="Final decision combining data quality, ML risk signals, and review."
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading pipeline gate...
          </p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Pipeline Gate"
          subtitle="Final decision combining data quality, ML risk signals, and review."
        />

        <Panel className="p-8">
          <p className="font-semibold">
            Unable to load pipeline gate
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
        title="Pipeline Gate"
        subtitle="Final decision combining data quality, ML risk signals, and human review."
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await reload();
              await loadGate();
            }}
            disabled={working}
          >
            <RefreshCw className="size-4" />
            Re-evaluate
          </Button>
        }
      />

      {message && (
        <Panel className="mb-5 p-4">
          <p className="text-sm">
            {message}
          </p>
        </Panel>
      )}

      <Panel className="overflow-hidden">
        <div
          className={`border-l-4 p-6 ${
            decision === 'Approved'
              ? 'border-success'
              : decision === 'Blocked'
                ? 'border-danger'
                : 'border-warning'
          }`}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                {decision ===
                'Approved' ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : decision ===
                  'Blocked' ? (
                  <XCircle className="size-5 text-danger" />
                ) : (
                  <AlertTriangle className="size-5 text-warning" />
                )}

                <span className="text-sm font-semibold">
                  GATE DECISION
                </span>
              </div>

              <h2 className="mt-2 text-3xl font-extrabold">
                {decision.toUpperCase()}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {gate?.reason ??
                  gate?.explanation ??
                  'Decision returned by the DataGuard AI pipeline gate.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <p className="text-xs text-muted-foreground">
                  ML readiness
                </p>

                <p className="text-2xl font-bold">
                  {readiness}/100
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Data quality
                </p>

                <p className="text-2xl font-bold">
                  {quality}/100
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <Panel title="Hard Safety Checks">
          {checks.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              No individual safety checks were returned by the backend.
            </div>
          ) : (
            <div className="divide-y">
              {checks.map(
                (check, index) => {
                  const status =
                    String(
                      check.status ??
                        check.result ??
                        'Review',
                    );

                  const passed =
                    status.toLowerCase() ===
                      'passed' ||
                    status.toLowerCase() ===
                      'pass';

                  const failed =
                    status.toLowerCase() ===
                      'failed' ||
                    status.toLowerCase() ===
                      'fail';

                  return (
                    <div
                      className="flex items-center gap-3 p-4"
                      key={
                        check.name ??
                        check.id ??
                        index
                      }
                    >
                      {passed ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : failed ? (
                        <XCircle className="size-5 text-danger" />
                      ) : (
                        <AlertTriangle className="size-5 text-warning" />
                      )}

                      <span className="flex-1 text-sm font-medium">
                        {check.name ??
                          check.check ??
                          check.description ??
                          `Safety check ${index + 1}`}
                      </span>

                      <StatusBadge>
                        {status}
                      </StatusBadge>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </Panel>

        <Panel title="Gate Summary">
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted p-4">
                <p className="text-xs text-muted-foreground">
                  Quality
                </p>

                <p className="mt-1 text-xl font-bold">
                  {quality}/100
                </p>
              </div>

              <div className="rounded-md bg-muted p-4">
                <p className="text-xs text-muted-foreground">
                  Readiness
                </p>

                <p className="mt-1 text-xl font-bold">
                  {readiness}/100
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The pipeline gate uses the backend decision and associated safety checks. Review the required actions before approving a conditional dataset.
            </p>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Required Actions"
      >
        <div className="p-5">
          {requiredActions.length ===
          0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <CheckCircle2 className="mx-auto size-7 text-success" />

              <p className="mt-2 font-semibold">
                No required actions returned
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                The backend did not return additional gate actions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requiredActions.map(
                (action, index) => (
                  <div
                    className="flex gap-4 rounded-md border p-4"
                    key={
                      action.id ??
                      action.name ??
                      index
                    }
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {action.name ??
                          action.action ??
                          action.title ??
                          `Required action ${index + 1}`}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {action.description ??
                          action.detail ??
                          action.reason ??
                          'Review this action before proceeding.'}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t p-4">
          <Button
            variant="secondary"
            onClick={reject}
            disabled={
              working ||
              decision === 'Blocked'
            }
          >
            <XCircle className="size-4" />
            Reject Gate
          </Button>

          <Button
            onClick={approve}
            disabled={
              working ||
              decision === 'Approved' ||
              decision === 'Blocked'
            }
          >
            <Check className="size-4" />

            {working
              ? 'Processing...'
              : 'Approve Gate'}
          </Button>
        </div>
      </Panel>
    </>
  );
}

/* =========================================================
   DATA QUALITY PASSPORT
========================================================= */

export function PassportPage() {
  const {
    dataset,
    datasetId,
    loading,
    error,
  } = useCurrentDataset();

  const [passport, setPassport] =
    useState<AnyRecord | null>(null);

  const [loadingPassport, setLoadingPassport] =
    useState(false);

  const loadPassport = async () => {
    if (!datasetId) return;

    try {
      setLoadingPassport(true);

      const result =
        await dataGuardApi.getPassport(
          datasetId,
        );

      setPassport(result);
    } catch (err) {
      console.error(
        'Passport load failed:',
        err,
      );
    } finally {
      setLoadingPassport(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      loadPassport();
    }
  }, [datasetId]);

  const decision =
    passport?.gate?.decision ??
    passport?.decision ??
    getGate(dataset);

  const quality =
    num(
      passport?.quality ??
        passport?.quality_score ??
        dataset?.quality ??
        dataset?.analysis?.quality?.score,
    );

  const readiness =
    num(
      passport?.readiness ??
        passport?.ml_readiness ??
        passport?.readiness_score ??
        dataset?.readiness ??
        dataset?.analysis?.ml_readiness?.score,
    );

  const rows =
    num(
      passport?.rows ??
        dataset?.rows,
    );

  const columns =
    num(
      passport?.columns ??
        dataset?.columns,
    );

  const detectedRisks =
    getPassportItems(
      passport,
      'risks',
    );

  const cleaningActions =
    getPassportItems(
      passport,
      'cleaning_actions',
    );

  const approvals =
    getPassportItems(
      passport,
      'approvals',
    );

  const modelPolicy =
    getPassportItems(
      passport,
      'model_policy',
    );

  const exportPassport = () => {
    const exportData = {
      generated_by:
        'DataGuard AI',
      dataset,
      passport,
      exported_at:
        new Date().toISOString(),
    };

    const blob = new Blob(
      [
        JSON.stringify(
          exportData,
          null,
          2,
        ),
      ],
      {
        type: 'application/json',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download = `${datasetId ?? 'dataguard'}-passport.json`;

    document.body.appendChild(
      anchor,
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Data Quality Passport"
          subtitle="Official quality, risk, approval, and pipeline decision record."
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading passport...
          </p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Data Quality Passport"
          subtitle="Official quality, risk, approval, and pipeline decision record."
        />

        <Panel className="p-8">
          <p className="font-semibold">
            Unable to load passport
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
        title="Data Quality Passport"
        subtitle="Official quality, risk, approval, and pipeline decision record."
        actions={
          <Button
            onClick={exportPassport}
            disabled={loadingPassport}
          >
            <Download className="size-4" />
            Export Report
          </Button>
        }
      />

      <article className="mx-auto max-w-5xl border border-border bg-card shadow-card">
        <header className="flex flex-col justify-between gap-5 border-b p-7 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary p-2 text-primary-foreground">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  DataGuard AI
                </h2>

                <p className="text-xs text-muted-foreground">
                  DATA QUALITY PASSPORT
                </p>
              </div>
            </div>

            <h1 className="mt-8 text-2xl font-bold">
              {dataset?.name ??
                'Current dataset'}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {datasetId}
              {' · '}
              Generated{' '}
              {formatDate(
                passport?.created_at ??
                  passport?.issued_at ??
                  new Date().toISOString(),
              )}
            </p>
          </div>

          <div
            className={`rounded-md border px-6 py-4 text-center ${
              decision === 'Approved'
                ? 'border-success bg-success-soft'
                : decision === 'Blocked'
                  ? 'border-danger bg-danger-soft'
                  : 'border-warning bg-warning-soft'
            }`}
          >
            <p className="text-xs font-semibold">
              PIPELINE GATE
            </p>

            <p className="mt-1 text-2xl font-extrabold">
              {decision.toUpperCase()}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-px border-b bg-border md:grid-cols-4">
          {[
            [
              'Rows',
              rows.toLocaleString(),
            ],
            [
              'Columns',
              columns.toLocaleString(),
            ],
            [
              'Quality Score',
              `${quality}/100`,
            ],
            [
              'ML Readiness',
              `${readiness}/100`,
            ],
          ].map(
            ([label, value]) => (
              <div
                className="bg-card p-5"
                key={label}
              >
                <p className="text-xs text-muted-foreground">
                  {label}
                </p>

                <p className="mt-1 text-xl font-bold">
                  {value}
                </p>
              </div>
            ),
          )}
        </section>

        <section className="grid gap-8 p-7 md:grid-cols-2">
          <PassportSection
            title="Detected risks"
            items={detectedRisks}
            fallback="No risk details returned."
          />

          <PassportSection
            title="Cleaning actions"
            items={cleaningActions}
            fallback="No cleaning action details returned."
          />

          <PassportSection
            title="User approvals"
            items={approvals}
            fallback="No approval details returned."
          />

          <PassportSection
            title="Model & policy"
            items={modelPolicy}
            fallback="No model/policy details returned."
          />
        </section>

        <footer className="flex flex-col gap-2 border-t bg-muted/50 p-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            Dataset ID: {datasetId}
          </span>

          <span>
            Generated by DataGuard AI
          </span>
        </footer>
      </article>
    </>
  );
}

function PassportSection({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase text-muted-foreground">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {fallback}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map(
            (item, index) => (
              <div
                className="flex items-start gap-2 text-sm"
                key={`${item}-${index}`}
              >
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />

                <span>
                  {item}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MONITORING
========================================================= */

export function MonitoringPage() {
  const {
    dataset,
    datasetId,
    loading,
    error,
  } = useCurrentDataset();

  const [monitoring, setMonitoring] =
    useState<AnyRecord[]>([]);

  const [range, setRange] =
    useState('6 months');

  const [loadingMonitoring, setLoadingMonitoring] =
    useState(false);

  const loadMonitoring = async () => {
    if (!datasetId) return;

    try {
      setLoadingMonitoring(true);

      const result =
        await dataGuardApi.getMonitoring(
          datasetId,
        );

      setMonitoring(
        getMonitoringRows(result),
      );
    } catch (err) {
      console.error(
        'Monitoring load failed:',
        err,
      );

      setMonitoring([]);
    } finally {
      setLoadingMonitoring(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      loadMonitoring();
    }
  }, [datasetId]);

  const qualityTrend =
    monitoring.map(
      (item, index) => ({
        name:
          item.name ??
          item.date ??
          item.period ??
          `Point ${index + 1}`,
        value: num(
          item.quality ??
            item.quality_score ??
            0,
        ),
      }),
    );

  const readinessTrend =
    monitoring.map(
      (item, index) => ({
        name:
          item.name ??
          item.date ??
          item.period ??
          `Point ${index + 1}`,
        value: num(
          item.readiness ??
            item.ml_readiness ??
            item.readiness_score ??
            0,
        ),
      }),
    );

  const anomalyTrend =
    monitoring.map(
      (item, index) => ({
        name:
          item.name ??
          item.date ??
          item.period ??
          `Point ${index + 1}`,
        value: num(
          item.anomalies ??
            item.anomaly_count ??
            0,
        ),
      }),
    );

  const missingTrend =
    monitoring.map(
      (item, index) => ({
        name:
          item.name ??
          item.date ??
          item.period ??
          `Point ${index + 1}`,
        value: num(
          item.missing ??
            item.missing_pct ??
            item.missing_percentage ??
            0,
        ),
      }),
    );

  const latest =
    monitoring.length > 0
      ? monitoring[
          monitoring.length - 1
        ]
      : null;

  const quality =
    num(
      latest?.quality ??
        latest?.quality_score ??
        dataset?.quality ??
        dataset?.analysis?.quality?.score,
    );

  const readiness =
    num(
      latest?.readiness ??
        latest?.ml_readiness ??
        latest?.readiness_score ??
        dataset?.readiness ??
        dataset?.analysis?.ml_readiness?.score,
    );

  const anomalies =
    num(
      latest?.anomalies ??
        latest?.anomaly_count ??
        dataset?.anomalies ??
        dataset?.analysis?.anomalies?.count,
    );

  if (loading) {
    return (
      <>
        <PageHeader
          title="Monitoring"
          subtitle="Track quality, readiness, drift, and issue trends across dataset versions."
        />

        <Panel className="p-8">
          <p className="text-sm text-muted-foreground">
            Loading monitoring data...
          </p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Monitoring"
          subtitle="Track quality, readiness, drift, and issue trends across dataset versions."
        />

        <Panel className="p-8">
          <p className="font-semibold">
            Unable to load monitoring
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
        title="Monitoring"
        subtitle="Track quality, readiness, drift, and issue trends across dataset versions."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setRange(
                  range === '6 months'
                    ? '12 months'
                    : '6 months',
                )
              }
            >
              {range}
            </Button>

            <Button
              variant="secondary"
              onClick={loadMonitoring}
              disabled={loadingMonitoring}
            >
              <RefreshCw className="size-4" />

              {loadingMonitoring
                ? 'Refreshing...'
                : 'Refresh'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Panel className="p-4">
          <StatusBadge>
            {quality >= 85
              ? 'Healthy'
              : 'Attention'}
          </StatusBadge>

          <p className="mt-3 text-sm text-muted-foreground">
            Overall quality
          </p>

          <p className="text-2xl font-bold">
            {quality}/100
          </p>
        </Panel>

        <Panel className="p-4">
          <StatusBadge>
            {readiness >= 85
              ? 'Healthy'
              : 'Attention'}
          </StatusBadge>

          <p className="mt-3 text-sm text-muted-foreground">
            ML readiness
          </p>

          <p className="text-2xl font-bold">
            {readiness}/100
          </p>
        </Panel>

        <Panel className="p-4">
          <StatusBadge>
            {anomalies > 0
              ? 'Attention'
              : 'Healthy'}
          </StatusBadge>

          <p className="mt-3 text-sm text-muted-foreground">
            Anomalies
          </p>

          <p className="text-2xl font-bold">
            {anomalies.toLocaleString()}
          </p>
        </Panel>

        <Panel className="p-4">
          <StatusBadge>
            {monitoring.length > 0
              ? 'Available'
              : 'No data'}
          </StatusBadge>

          <p className="mt-3 text-sm text-muted-foreground">
            Monitoring points
          </p>

          <p className="text-2xl font-bold">
            {monitoring.length}
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Quality trend">
          {qualityTrend.length > 0 ? (
            <TrendChart
              data={qualityTrend}
            />
          ) : (
            <EmptyMonitoring />
          )}
        </Panel>

        <Panel title="ML readiness trend">
          {readinessTrend.length > 0 ? (
            <TrendChart
              data={readinessTrend}
            />
          ) : (
            <EmptyMonitoring />
          )}
        </Panel>

        <Panel title="Missing values trend">
          {missingTrend.length > 0 ? (
            <TrendChart
              data={missingTrend}
            />
          ) : (
            <EmptyMonitoring />
          )}
        </Panel>

        <Panel title="Anomaly trend">
          {anomalyTrend.length > 0 ? (
            <TrendChart
              data={anomalyTrend}
            />
          ) : (
            <EmptyMonitoring />
          )}
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Monitoring records"
      >
        {monitoring.length === 0 ? (
          <EmptyMonitoring />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr>
                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Period
                  </th>

                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Quality
                  </th>

                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Readiness
                  </th>

                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Missing
                  </th>

                  <th className="bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    Anomalies
                  </th>
                </tr>
              </thead>

              <tbody>
                {monitoring.map(
                  (item, index) => (
                    <tr
                      className="border-t hover:bg-muted/30"
                      key={index}
                    >
                      <td className="px-4 py-3">
                        {item.name ??
                          item.date ??
                          item.period ??
                          `Point ${index + 1}`}
                      </td>

                      <td className="px-4 py-3">
                        {num(
                          item.quality ??
                            item.quality_score,
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {num(
                          item.readiness ??
                            item.ml_readiness ??
                            item.readiness_score,
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {num(
                          item.missing ??
                            item.missing_pct ??
                            item.missing_percentage,
                        )}
                        %
                      </td>

                      <td className="px-4 py-3">
                        {num(
                          item.anomalies ??
                            item.anomaly_count,
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function EmptyMonitoring() {
  return (
    <div className="grid min-h-48 place-items-center p-6 text-center">
      <div>
        <Info className="mx-auto size-7 text-muted-foreground" />

        <p className="mt-2 font-semibold">
          No monitoring data available
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Monitoring information will appear after backend analysis generates historical records.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage quality policies, pipeline gates, notifications, and integrations."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Quality policy">
          <div className="space-y-4 p-5">
            <Setting
              name="Block on critical issues"
              active
            />

            <Setting
              name="Require schema validation"
              active
            />

            <Setting
              name="Minimum quality score: 75"
              active
            />
          </div>
        </Panel>

        <Panel title="Human approvals">
          <div className="space-y-4 p-5">
            <Setting
              name="Require approval for row deletion"
              active
            />

            <Setting
              name="Require approval above 5% impact"
              active
            />

            <Setting
              name="Allow automatic low-risk fixes"
            />
          </div>
        </Panel>

        <Panel title="Notifications">
          <div className="space-y-4 p-5">
            <Setting
              name="Pipeline blocked"
              active
            />

            <Setting
              name="Leakage detected"
              active
            />

            <Setting
              name="Data drift warning"
              active
            />
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="FastAPI integration"
      >
        <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
          <div>
            <p className="font-semibold">
              Backend service
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              DataGuard AI frontend is connected to the FastAPI backend through the API service layer.
            </p>
          </div>

          <StatusBadge>
            Connected
          </StatusBadge>
        </div>
      </Panel>
    </>
  );
}

function Setting({
  name,
  active = false,
}: {
  name: string;
  active?: boolean;
}) {
  const [on, setOn] =
    useState(active);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">
        {name}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() =>
          setOn(!on)
        }
        className={`relative h-6 w-11 rounded-full transition ${
          on
            ? 'bg-primary'
            : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-card transition ${
            on
              ? 'left-6'
              : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}