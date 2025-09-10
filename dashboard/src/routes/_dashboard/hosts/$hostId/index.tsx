import {
    createFileRoute,
    useNavigate,
} from "@tanstack/react-router";
import {
    useRouterHostContext,
    HostSettingsDialog,
} from "@wildosvpn/modules/hosts";
import { useDialog } from "@wildosvpn/common/hooks";

const HostOpen = () => {
    const [settingsDialogOpen, setSettingsDialogOpen] = useDialog(true);
    const value = useRouterHostContext()
    const navigate = useNavigate({ from: "/hosts/$hostId" });

    return value && (
        <HostSettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
            entity={value.host}
            onClose={() => navigate({ to: "/hosts" })}
        />
    );
}

export const Route = createFileRoute('/_dashboard/hosts/$hostId/')({
    component: HostOpen
})
