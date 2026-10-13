import { createFileRoute } from '@tanstack/react-router'; import { CleaningPage } from '@/components/dataguard/analysis-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/cleaning')({head:()=>meta('Cleaning & Simulation','Simulate, review, and approve controlled data cleaning actions.'),component:CleaningPage});
