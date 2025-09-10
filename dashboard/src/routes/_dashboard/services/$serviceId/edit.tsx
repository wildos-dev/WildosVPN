import {
    createFileRoute,
    useNavigate,
} from "@tanstack/react-router";
import {
    MutationDialog,
    useRouterServiceContext,
} from "@wildosvpn/modules/services";

const ServiceEdit = () => {
    const value = useRouterServiceContext()
    const navigate = useNavigate({ from: "/services/$serviceId/edit" });

    return value && (
        <MutationDialog
            entity={value.service}
            onClose={() => navigate({ to: "/services" })}
        />
    );
}

export const Route = createFileRoute('/_dashboard/services/$serviceId/edit')({
    component: ServiceEdit
})
