import { TableCell, TableRow } from "@wildosvpn/common/components";
import { FC } from "react";

interface TableRowWithCellProps {
    label: string | JSX.Element;
    value?: null | string | number | JSX.Element;
}

export const TableRowWithCell: FC<TableRowWithCellProps> = ({ label, value }) => (
    <TableRow>
        <TableCell>{label}</TableCell>
        <TableCell>{value}</TableCell>
    </TableRow>
);

