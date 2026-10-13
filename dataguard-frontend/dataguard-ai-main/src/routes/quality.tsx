import { createFileRoute } from '@tanstack/react-router'; import { QualityPage } from '@/components/dataguard/analysis-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/quality')({head:()=>meta('Data Quality','Review quality scores, dimensions, and recommended actions.'),component:QualityPage});
