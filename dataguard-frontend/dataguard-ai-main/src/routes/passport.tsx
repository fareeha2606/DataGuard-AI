import { createFileRoute } from '@tanstack/react-router'; import { PassportPage } from '@/components/dataguard/report-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/passport')({head:()=>meta('Data Quality Passport','Export an official dataset quality and pipeline safety record.'),component:PassportPage});
