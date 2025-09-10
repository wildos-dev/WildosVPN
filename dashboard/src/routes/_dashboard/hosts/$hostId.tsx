import {
    createFileRoute,
    defer,
    Await,
    Outlet,
} from "@tanstack/react-router";
import {
    RouterHostContext,
    fetchHost,
} from "@wildosvpn/modules/hosts";
import { Suspense } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    Loading
} from "@wildosvpn/common/components";

const HostProvider = () => {
    const { host } = Route.useLoaderData()
    return (
        <Suspense fallback={<Loading />}>
            <Await promise={host}>
                {(host) => (
                    <RouterHostContext.Provider value={{ host }}>
                        <Suspense>
                            <Outlet />
                        </Suspense>
                    </RouterHostContext.Provider>
                )}
            </Await>
        </Suspense>
    )
}

export const Route = createFileRoute('/_dashboard/hosts/$hostId')({
    loader: async ({ params }) => {
        const hostPromise = fetchHost({
            queryKey: ["hosts", Number.parseInt(params.hostId)]
        });

        return {
            host: defer(hostPromise)
        }
    },
    errorComponent: () => (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <AlertDialogTitle>
                    Host not found
                </AlertDialogTitle>
            </AlertDialogContent>
        </AlertDialog>
    ),
    component: HostProvider,
})
