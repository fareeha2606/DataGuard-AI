import { createFileRoute } from '@tanstack/react-router'; import { SettingsPage } from '@/components/dataguard/report-pages'; import { meta } from '@/components/dataguard/pages';
export const Route=createFileRoute('/settings')({head:()=>meta('Settings','Configure DataGuard AI quality policies and approvals.'),component:SettingsPage});
