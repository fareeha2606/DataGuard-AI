import { createFileRoute } from '@tanstack/react-router'; import { AnomaliesPage } from '@/components/dataguard/analysis-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/anomalies')({head:()=>meta('Anomaly Detection','Review potentially unusual records and their contributing signals.'),component:AnomaliesPage});
