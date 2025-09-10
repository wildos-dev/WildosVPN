import { DeleteConfirmation } from "@wildosvpn/common/components";
import { type FC, useEffect } from "react";
import {
    type AdminType,
    useAdminsDeletionMutation,
} from "@wildosvpn/modules/admins";

interface AdminsDeleteConfirmationDialogProps {
    onOpenChange: (state: boolean) => void;
    open: boolean;
    entity: AdminType;
    onClose: () => void;
}

export const AdminsDeleteConfirmationDialog: FC<
    AdminsDeleteConfirmationDialogProps
> = ({ onOpenChange, open, entity, onClose }) => {
    const deleteMutation = useAdminsDeletionMutation();

    useEffect(() => {
        if (!open) onClose();
    }, [open, onClose]);

    return (
        <DeleteConfirmation
            open={open}
            onOpenChange={onOpenChange}
            action={() => deleteMutation.mutate(entity)}
        />
    );
};
