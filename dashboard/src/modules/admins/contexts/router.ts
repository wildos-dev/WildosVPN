import { createContext, useContext } from "react";
import { AdminType } from "@wildosvpn/modules/admins";

interface RouterAdminContextProps {
    admin: AdminType | null;
    isPending?: boolean;
}

export const RouterAdminContext = createContext<RouterAdminContextProps | null>(null);

export const useRouterAdminContext = () => {
    const ctx = useContext(RouterAdminContext);
    return ctx;
};
