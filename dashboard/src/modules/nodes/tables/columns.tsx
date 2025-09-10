import { ColumnDef } from "@tanstack/react-table"
import { NodesStatusBadge, NodeType, NodesStatus } from "@wildosvpn/modules/nodes"
import {
    DataTableActionsCell,
    DataTableColumnHeader
} from "@wildosvpn/libs/entity-table"
import i18n from "@wildosvpn/features/i18n"
import {
    type ColumnActions
} from "@wildosvpn/libs/entity-table";
import {
    NoPropogationButton,
} from "@wildosvpn/common/components"

export const columns = (actions: ColumnActions<NodeType>): ColumnDef<NodeType>[] => ([
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader title={i18n.t('name')} column={column} />,
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader title={i18n.t('status')} column={column} />,
        cell: ({ row }) => <NodesStatusBadge status={NodesStatus[row.original.status]} />,
    },
    {
        accessorKey: "address",
        header: ({ column }) => <DataTableColumnHeader title={i18n.t('address')} column={column} />,
        cell: ({ row }) => `${row.original.address}:${row.original.port}`
    },
    {
        accessorKey: "usage_coefficient",
        header: ({ column }) => <DataTableColumnHeader title={i18n.t('page.nodes.usage_coefficient')} column={column} />,
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <NoPropogationButton row={row} actions={actions}>
                    <DataTableActionsCell {...actions} row={row} />
                </NoPropogationButton>
            );
        },
    }
]);
