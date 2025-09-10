
import { DateField } from "@wildosvpn/common/components";
import { FC } from "react";

export const ActivationDeadlineField: FC = () => {
    return <DateField name="activation_deadline" label="page.users.activation_deadline" />;
};
