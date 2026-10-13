import { createFileRoute } from '@tanstack/react-router'; import { DashboardPage,meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/')({head:()=>meta('Data Quality Dashboard','Monitor data quality, ML readiness, risks, and pipeline decisions.'),component:DashboardPage});
