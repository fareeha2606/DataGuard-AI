import { createFileRoute } from '@tanstack/react-router'; import { MonitoringPage } from '@/components/dataguard/report-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/monitoring')({head:()=>meta('Dataset Monitoring','Track data quality, readiness, drift, and issue trends.'),component:MonitoringPage});
