import { createFileRoute } from '@tanstack/react-router'; import { GatePage } from '@/components/dataguard/report-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/pipeline-gate')({head:()=>meta('Pipeline Gate','Review hard safety checks and the final ML pipeline decision.'),component:GatePage});
