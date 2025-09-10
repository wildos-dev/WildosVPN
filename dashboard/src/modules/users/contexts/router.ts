import { createContext, useContext } from "react";
import { UserType } from "@wildosvpn/modules/users";

interface RouterUserContextProps {
    user: UserType | null;
    isPending?: boolean;
}

export const RouterUserContext = createContext<RouterUserContextProps | null>(null);

export const useRouterUserContext = () => {
    const ctx = useContext(RouterUserContext);
    return ctx;
};
