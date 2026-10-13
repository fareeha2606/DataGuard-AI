import { createFileRoute } from '@tanstack/react-router'; import { DatasetsPage,meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/datasets')({head:()=>meta('Datasets','Upload and review datasets for quality and ML readiness.'),component:DatasetsPage});
