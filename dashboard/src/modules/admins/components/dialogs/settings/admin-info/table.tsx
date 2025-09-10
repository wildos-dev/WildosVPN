import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Table,
    TableBody,
    TableRowWithCell,
} from "@wildosvpn/common/components";
import { FC, useCallback } from "react";
import {
    type AdminProp,
    AdminEnabledPill,
    AdminPermissionPill,
    useAdminUsersStatusDisable,
    useAdminUsersStatusEnable,
    AdminTokenButton
} from "@wildosvpn/modules/admins";
import { useTranslation } from "react-i18next";
import { LoaderIcon, UserCheck, UserX } from "lucide-react";
import { format } from '@chbphone55/pretty-bytes';
import { useAuth } from "@wildosvpn/modules/auth";

export const AdminInfoTable: FC<AdminProp> = ({ admin: entity }) => {
    const { t } = useTranslation();
    const usersDataUsage = format(entity.users_data_usage);
    const { mutate: adminStatusEnable, isPending: enablePending } = useAdminUsersStatusEnable()
    const { mutate: adminStatusDisable, isPending: disablePending } = useAdminUsersStatusDisable()
    const auth = useAuth()
    
    // Check if this is the current user
    const isCurrentUser = () => {
        const token = auth.getAuthToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub === entity.username;
        } catch {
            return false;
        }
    };

    const handleAdmingStatusEnable = useCallback(() => {
        adminStatusEnable({ admin: entity })
    }, [entity, adminStatusEnable]);

    const handleAdmingStatusDisable = useCallback(() => {
        adminStatusDisable({ admin: entity })
    }, [entity, adminStatusDisable]);

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center w-full">
                <CardTitle>{t("admin_info")}</CardTitle>
                <div className="hstack justify-center items-center gap-2">
                    <Button
                        className={"bg-destructive rounded-2xl"}
                        onClick={handleAdmingStatusDisable}
                    >
                        {disablePending ? <LoaderIcon className="animate-spin" /> : (<><UserX className="mr-2" /> {t('page.admins.disable_users')} </>)}
                    </Button>
                    <Button
                        className="bg-success rounded-2xl"
                        onClick={handleAdmingStatusEnable}
                    >
                        {enablePending ? <LoaderIcon className="animate-spin" /> : (<><UserCheck className="mr-2" /> {t('page.admins.enable_users')} </>)}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRowWithCell label={t("username")} value={entity.username} />
                        <TableRowWithCell
                            label={t("enabled")}
                            value={<AdminEnabledPill admin={entity} />}
                        />
                        <TableRowWithCell
                            label={t("page.admins.permission")}
                            value={<AdminPermissionPill admin={entity} />}
                        />
                        <TableRowWithCell
                            label={t("page.admins.users-data-usage")}
                            value={`${usersDataUsage[0]} ${usersDataUsage[1]}`}
                        />
                        {isCurrentUser() && (
                            <TableRowWithCell
                                label={t("page.admins.token.copy")}
                                value={<AdminTokenButton />}
                            />
                        )}

                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
