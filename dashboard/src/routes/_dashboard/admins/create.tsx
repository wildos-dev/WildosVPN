import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminsMutationDialog } from "@wildosvpn/modules/admins";

const AdminCreate = () => {
    const navigate = useNavigate({ from: "/admins/create" });
    return (
        <AdminsMutationDialog
            entity={null}
            onClose={() => navigate({ to: "/admins" })}
        />
    );
}

export const Route = createFileRoute("/_dashboard/admins/create")({
    component: AdminCreate,
});
