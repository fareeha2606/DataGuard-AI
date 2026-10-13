import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeadContent, Link, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import appCss from '../styles.css?url';
import { AppShell } from '@/components/dataguard/AppShell';
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({head:()=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{name:'theme-color',content:'#172038'}],links:[{rel:'stylesheet',href:appCss},{rel:'preconnect',href:'https://fonts.googleapis.com'},{rel:'preconnect',href:'https://fonts.gstatic.com',crossOrigin:'anonymous'},{rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'},{rel:'icon',href:'/favicon.ico'}]}),shellComponent:RootShell,component:Root,notFoundComponent:()=> <div className='grid min-h-screen place-items-center'><div className='text-center'><h1 className='text-5xl font-bold'>404</h1><p className='my-3 text-muted-foreground'>This page could not be found.</p><Link to='/' className='text-primary underline'>Return to dashboard</Link></div></div>});
function RootShell({children}:{children:ReactNode}){return <html lang='en'><head><HeadContent/></head><body>{children}<Scripts/></body></html>}
function Root(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><AppShell><Outlet/></AppShell></QueryClientProvider>}
