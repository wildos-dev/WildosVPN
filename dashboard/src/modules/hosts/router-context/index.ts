import { createContext, useContext } from "react";
import { HostType } from "@wildosvpn/modules/hosts";

interface RouterHostContextProps {
    host: HostType;
}

export const RouterHostContext = createContext<RouterHostContextProps | null>(null);

export const useRouterHostContext = () => {
    const ctx = useContext(RouterHostContext);
    return ctx;
};
