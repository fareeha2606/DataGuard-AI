import { createFileRoute } from '@tanstack/react-router'; import { ReadinessPage } from '@/components/dataguard/report-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/ml-readiness')({head:()=>meta('ML Readiness','Evaluate dataset readiness and risks before model development.'),component:ReadinessPage});
