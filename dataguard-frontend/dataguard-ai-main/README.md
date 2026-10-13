# DataGuard AI

Build a complete, professional, modern, enterprise-grade frontend web application called DataGuard AI.

DataGuard AI is an AI-powered Data Quality & ML Pipeline Gatekeeper. The platform allows users to upload CSV/tabular datasets, analyze their data quality, detect data issues and anomalies, simulate/perform cleaning, evaluate ML readiness and ML risks, explain the results, and finally decide whether the dataset is safe to enter an ML pipeline.

The frontend must look like a real production SaaS/MLOps platform, not like a student project or a generic admin dashboard.

1. Overall Design Direction

Design style:

Professional

Clean

Modern

Minimal but visually attractive

Enterprise SaaS

Data/AI/MLOps oriented

Decent and trustworthy

Easy to understand

Not overly colorful

Not cartoonish

Avoid excessive gradients

Avoid unnecessary animations

Avoid huge decorative elements

Avoid a futuristic "AI neon" style

Prioritize usability and information hierarchy

The application should feel similar in quality and professionalism to modern products such as enterprise analytics, data observability, and MLOps platforms.

Use a consistent design system throughout the entire application.

2. Brand

Product name:

DataGuard AI

Tagline:

"Intelligent Data Quality & ML Pipeline Gatekeeper"

Logo concept:

Create a simple professional logo combining:

Data/table concept

Shield/security concept

AI/intelligence concept

Keep the logo simple and suitable for a professional SaaS product.

Use the product name consistently as:

DataGuard AI

3. Color System

Use a restrained professional palette.

Primary:

Deep navy / dark blue

Secondary:

Blue / indigo

Success:

Green

Warning:

Amber/orange

Danger:

Red

Neutral:

White

Light gray

Dark gray

Do not use too many colors.

Use colors mainly for:

Status

Risk

Alerts

Important metrics

Buttons

Charts

The UI should remain readable and professional.

4. Layout

Use a desktop-first responsive SaaS dashboard layout.

Main structure:

LEFT SIDEBAR

+

TOP HEADER

+

MAIN CONTENT AREA

Sidebar should contain:

Dashboard

Datasets

Data Quality

Anomaly Detection

Cleaning & Simulation

ML Readiness

Pipeline Gate

Reports / Data Quality Passport

Monitoring

Settings

At the bottom of the sidebar show:

User profile

Account/settings

Help

Top header:

Page title

Breadcrumbs where useful

Dataset selector when applicable

Notifications

User profile/avatar

5. Landing / Welcome Dashboard

Create a professional dashboard home page.

Header:

Welcome to DataGuard AI

Subtitle:

Monitor data quality, identify ML risks, and make safer pipeline decisions.

Main dashboard cards:

Total Datasets

Show number of datasets analyzed.

Average Data Quality

Show overall quality score.

Average ML Readiness

Show ML readiness score.

Pipeline Decisions

Show:

Approved

Conditional

Blocked

Critical Issues

Show number of unresolved critical issues.

Anomalies Detected

Show number of suspicious records.

Use clean metric cards with small icons and subtle visual indicators.

6. Dataset Upload Page

Create a dedicated dataset upload experience.

Title:

Upload Dataset

Subtitle:

Upload a CSV dataset to analyze its quality and ML readiness.

Large drag-and-drop upload area.

Support:

CSV

Large CSV files

Display:

File name

File size

Upload progress

Remove file

Analyze Dataset button

Also provide a small information section:

What happens after upload?

Dataset profiling

Data quality analysis

Anomaly detection

Cleaning recommendations

ML risk analysis

ML readiness evaluation

Pipeline gate decision

The upload experience should be simple and trustworthy.

7. Dataset Overview Page

After uploading a dataset, show:

Dataset name

File size

Rows

Columns

Upload date

Processing status

Then show summary cards:

Data Quality Score

ML Readiness Score

Total Issues

Anomalies

Missing Values

Duplicate Rows

Include a dataset preview table.

The preview table should support:

Search

Sort

Pagination

Column names

Data types

Missing-value indicators

8. Data Quality Page

Create a detailed Data Quality dashboard.

Main score:

Data Quality Score

Use a large professional circular/gauge visualization.

Below it show quality dimensions:

Completeness

Accuracy

Consistency

Validity

Uniqueness

Integrity

Each should have:

Score

Status

Short explanation

Example:

Completeness — 92%

Status: Good

Accuracy — 81%

Status: Needs Attention

Consistency — 74%

Status: Warning

Create a detailed issue table.

Columns:

Issue

Column

Severity

Affected Rows

Description

Recommended Action

Status

Severity levels:

Critical

High

Medium

Low

Use professional status badges.

9. Data Issues

Create separate visual sections for:

Missing Values

Show:

Total missing cells

Missing percentage

Columns affected

Include a bar chart showing missing percentage by column.

Duplicates

Show:

Duplicate row count

Duplicate percentage

Data Type Issues

Show:

Expected type

Detected type

Affected column

Invalid Values

Show:

Invalid records

Affected columns

Example invalid values

Inconsistencies

Examples:

Different spellings

Different casing

Formatting inconsistencies

Category inconsistencies

Make these issues easy to understand for non-technical users.

10. Anomaly Detection Page

Title:

Anomaly Detection

Subtitle:

Identify unusual records that may affect downstream ML pipelines.

Show:

Total records

Anomalies detected

Anomaly percentage

Normal records

Use a clean chart showing anomaly distribution.

Include anomaly table:

Record ID

Anomaly Score

Severity

Reason / suspicious features

Use a professional visualization.

Do not imply that anomalies are automatically bad data.

Clearly label them as:

Potentially Unusual Records

11. Cleaning & What-If Simulation Page

This is one of the most important pages.

Title:

Cleaning & Simulation

Show:

Recommended Cleaning Actions

Each recommendation should contain:

Issue

Recommended action

Expected impact

Risk level

Estimated affected rows

Examples:

Impute missing numerical values

Impute missing categorical values

Remove duplicate rows

Standardize category values

Correct data types

Handle invalid values

Handle suspicious records

Each action should have:

Apply

and

Preview

buttons.

Before applying cleaning, allow the user to simulate the result.

12. Before vs After Comparison

Create a professional comparison section.

Show:

BEFORE

vs

AFTER

Metrics:

Quality Score

ML Readiness

Missing Values

Duplicate Rows

Invalid Values

Anomalies

Use visual comparison cards and charts.

Important:

Never make it look like cleaning automatically improves everything.

Clearly show if a metric:

Improved

Decreased

Stayed the same

13. Human-in-the-Loop Approval

For risky cleaning operations, show an approval interface.

Example:

High-Risk Cleaning Action

"Removing 1,248 suspicious records may affect model performance."

Buttons:

Approve

Reject

Review Details

Show:

Why this action is recommended

Number of affected records

Expected benefit

Potential risk

The user must remain in control.

14. ML Readiness Page

Title:

ML Readiness

Large central score:

ML Readiness Score: 84/100

Use a professional gauge.

Show dimensions:

Data Completeness

Data Consistency

Feature Quality

Anomaly Risk

Class Balance

Leakage Risk

Feature Redundancy

Distribution Risk

Each dimension should show:

Score

Status

Explanation

Use:

Green = Good

Amber = Attention

Red = Critical

15. ML Risk Engine

Create a detailed section called:

ML Risk Analysis

Show detected risks such as:

Data Leakage

Status:

Safe / Warning / Critical

Target Leakage

Status:

Safe / Warning / Critical

Train/Test Contamination

Status:

Safe / Warning / Critical

Class Imbalance

Show class distribution chart.

High Cardinality

Show affected columns.

Feature Redundancy

Show correlated features.

Suspicious Identifier Columns

Show columns that may act as IDs.

Distribution Issues

Show warnings where applicable.

Each risk should have:

Risk level

Explanation

Affected columns

Recommended action

16. Explainability / SHAP Page

Create a section:

Why is this dataset receiving this ML Readiness score?

Show a professional explanation visualization.

Use SHAP-style feature contribution visualization.

Example:

Factors increasing readiness:

Low missingness

Good consistency

Balanced target

Factors reducing readiness:

High anomaly rate

Class imbalance

Potential leakage

Clearly explain:

These explanations describe the model's readiness/risk prediction.

17. Pipeline Gate

This is the most important final decision page.

Title:

Pipeline Gate

Show one large status card.

Possible states:

APPROVED

Dataset passed required quality and ML safety checks.

CONDITIONAL

Dataset can proceed after addressing specified issues.

BLOCKED

Critical issues prevent safe pipeline execution.

Do NOT rely only on the ML prediction.

Show:

Gate Decision

Status

Hard Safety Checks

Critical data-quality violations

Leakage checks

Target leakage

Train/test contamination

Invalid schema

Severe data issues

ML Risk Prediction

Show:

Predicted readiness

Risk level

Model confidence if available

Required Actions

List exact actions required before approval.

Include:

View Detailed Report

and

Export Data Quality Passport

18. Data Quality Passport

Create a professional report page called:

Data Quality Passport

It should look like an official dataset certification/audit document.

Include:

Dataset name

Dataset ID

Timestamp

Rows

Columns

Data Quality Score

ML Readiness Score

Detected risks

Cleaning actions

User approvals

Pipeline Gate decision

Model/version information

Provide:

Export Report

button.

19. Monitoring Page

Create a monitoring dashboard for future dataset versions.

Show:

Data quality trend

ML readiness trend

Missing value trend

Anomaly trend

Data drift

Issue trend

Use line charts and clear date ranges.

Include status:

Healthy

Warning

Critical

20. Dataset History

Create a dataset version/history section.

Example:

Version 1

Version 2

Version 3

For each version show:

Date

Quality Score

ML Readiness

Gate Status

Changes

Allow users to compare versions.

21. Notifications

Create a notification system for:

Critical data-quality issue

Pipeline blocked

ML leakage detected

Dataset processing completed

Cleaning approval required

Data drift detected

Use subtle notification badges.

22. Search & Filters

Provide professional search/filter functionality.

Users should be able to filter:

Dataset

Severity

Issue type

Status

Date

Gate decision

23. Loading States

Create polished loading states.

During dataset processing show:

Analyzing Dataset...

Progress stages:

Uploading

Profiling

Checking data quality

Detecting anomalies

Evaluating ML risks

Calculating readiness

Generating gate decision

Use a clean progress indicator.

24. Empty States

Every page should have meaningful empty states.

Example:

"No dataset analyzed yet."

Button:

Upload Dataset

Avoid blank screens.

25. Error States

Create professional error messages.

Examples:

"Unable to process dataset."

"CSV format is invalid."

"Dataset exceeds the current processing limit."

"Backend service unavailable."

Always provide a clear next action.

26. Tables

All tables should be:

Clean

Responsive

Searchable

Sortable

Paginated

Use sticky headers where appropriate.

Do not overload tables with unnecessary columns.

27. Charts

Use professional charts for:

Quality scores

Missing values

Anomaly distribution

Class distribution

ML risk

Feature importance

Data drift

Version comparison

Charts should be readable and not overly decorative.

28. Responsive Design

The application should work well on:

Desktop

Laptop

Tablet

Prioritize desktop because this is an enterprise data platform.

29. Accessibility

Use:

Good contrast

Clear typography

Proper labels

Keyboard-friendly controls

Meaningful icons

Tooltips for technical terms

30. UX Principle

The user should always understand:

What happened?

Why did it happen?

What is the risk?

What should I do next?

Avoid showing raw technical information without explanation.

For technical metrics, provide tooltips or short explanations.

31. Important Product Philosophy

DataGuard AI should NOT blindly clean datasets.

The UI must communicate:

Detect → Explain → Simulate → Review → Approve → Validate → Gate

The system should prioritize user control and explainability.

High-risk operations should require Human-in-the-Loop approval.

32. Backend Integration Preparation

Build the frontend so that it can later connect cleanly to a FastAPI backend.

Create a clean API service layer.

Expected API structure:

POST /api/datasets/upload

GET /api/datasets

GET /api/datasets/{dataset_id}

POST /api/datasets/{dataset_id}/analyze

GET /api/datasets/{dataset_id}/quality

GET /api/datasets/{dataset_id}/anomalies

GET /api/datasets/{dataset_id}/cleaning

POST /api/datasets/{dataset_id}/cleaning/simulate

POST /api/datasets/{dataset_id}/cleaning/apply

GET /api/datasets/{dataset_id}/ml-readiness

GET /api/datasets/{dataset_id}/ml-risks

GET /api/datasets/{dataset_id}/gate

POST /api/datasets/{dataset_id}/gate/approve

POST /api/datasets/{dataset_id}/gate/reject

GET /api/datasets/{dataset_id}/passport

GET /api/datasets/{dataset_id}/monitoring

For now, if the backend is not connected, use realistic mock data through a dedicated API/service abstraction. Do NOT hard-code data directly throughout UI components.

33. Component Architecture

Create reusable components for:

Sidebar

Header

MetricCard

ScoreGauge

StatusBadge

RiskCard

IssueTable

DatasetTable

ChartCard

ProgressStepper

ApprovalModal

ConfirmationModal

EmptyState

ErrorState

LoadingState

DataPreviewTable

Keep the frontend modular and maintainable.

34. Final Quality Requirement

The final result should look like a real enterprise Data Quality + MLOps SaaS application.

It should be:

Beautiful

Professional

Decent

Clean

Trustworthy

Modern

Easy to navigate

Technically credible

Presentation-ready

Demo-ready

Scalable for future backend integration

Do not make it look like a generic AI landing page.

Do not use excessive gradients, glassmorphism, neon colors, oversized text, or unnecessary animations.

Prioritize professional enterprise UX over visual gimmicks.

Build the complete frontend with realistic screens, navigation, components, mock data, loading states, empty states, error states, responsive design, and API integration architecture.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f8d99be-aec4-4225-aa5b-10ddd65862fd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
