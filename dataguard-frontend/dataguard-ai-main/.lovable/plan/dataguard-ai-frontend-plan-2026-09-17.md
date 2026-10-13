# DataGuard AI frontend plan

## Product experience
- Build a desktop-first enterprise application shell with a collapsible responsive sidebar, contextual header, breadcrumbs, dataset selector, notifications, help, and user menu.
- Use a restrained navy, blue, green, amber, red, and neutral design system with clear typography, compact spacing, semantic status styling, and accessible focus states.
- Keep the product workflow visible across the experience: Detect → Explain → Simulate → Review → Approve → Validate → Gate.

## Screens
- Dashboard: portfolio metrics, recent datasets, gate decisions, quality/readiness trends, alerts, and recent activity.
- Datasets: searchable/filterable dataset inventory, upload flow, processing progress, dataset overview, preview table, and version history.
- Data Quality: score gauge, six quality dimensions, issue categories, missing-value visualization, and detailed issue table.
- Anomaly Detection: distribution summary and potentially unusual-records table with non-judgmental explanations.
- Cleaning & Simulation: recommended actions, preview/apply controls, before-versus-after metrics, and explicit approval for high-risk actions.
- ML Readiness: readiness gauge, dimension breakdown, ML risk analysis, class balance, leakage/redundancy/cardinality findings, and score explanation contributions.
- Pipeline Gate: prominent approved/conditional/blocked decision, hard checks, model signal, confidence, and exact required actions.
- Data Quality Passport: audit-style report with dataset facts, scores, risks, actions, approvals, gate result, model version, and export control.
- Monitoring: quality, readiness, missingness, anomaly, drift, and issue trends with status and date controls.
- Settings: concise product settings and integration-readiness surface.

## Reusable architecture
- Create shared components for metrics, gauges, badges, risk and chart panels, tables, progress, approvals, confirmations, and empty/error/loading states.
- Centralize realistic demo content in a mock API/service layer matching the supplied FastAPI endpoint structure; keep screen code free of scattered hard-coded records.
- Use route-specific metadata for every page and typed TanStack navigation links.
- Implement client-side search, sorting, pagination, filters, dataset selection, upload states, simulation toggles, modal approval, notifications, and export/download behavior.

## Verification
- Verify the key workflow and interactive states in the running preview at desktop and tablet widths.
- Confirm page navigation, table controls, upload behavior, simulation/approval flow, and report export remain usable without overlap or blank states.
