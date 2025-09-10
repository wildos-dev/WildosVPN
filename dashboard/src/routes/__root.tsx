import { TooltipProvider, Loading } from '@wildosvpn/common/components';
import { ThemeProvider } from '@wildosvpn/features/theme-switch'
import { queryClient } from '@wildosvpn/common/utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
                <TooltipProvider>
                    <Suspense fallback={<Loading />}>
                        <Outlet />
                    </Suspense>
                </TooltipProvider>
            </ThemeProvider>
        </QueryClientProvider>
    ),
})
