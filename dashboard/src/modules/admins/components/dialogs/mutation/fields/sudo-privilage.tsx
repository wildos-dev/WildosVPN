import {
    FormField,
    FormItem,
    FormLabel,
    Checkbox,
    FormControl,
} from "@wildosvpn/common/components";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const SudoPrivilageField = () => {
    const { t } = useTranslation()
    const form = useFormContext();
    return (
        <FormField
            control={form.control}
            name="is_sudo"
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                            {t("page.admins.sudo-privilage")}
                        </FormLabel>
                    </div>
                </FormItem>
            )}
        />
    )
}
