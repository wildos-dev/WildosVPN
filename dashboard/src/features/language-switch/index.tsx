import {
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuItem,
    DropdownMenuSubTrigger,
    DropdownMenuPortal
} from "@wildosvpn/common/components";
import { Languages } from "lucide-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@wildosvpn/common/utils";

const LanguageItem = ({ language, title }: { language: string, title: string }) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };
    return (
        <DropdownMenuItem
            className={cn({ "bg-primary text-secondary": i18n.language === language })}
            onClick={() => changeLanguage(language)}
        >
            {title}
        </DropdownMenuItem>
    );
}

export const LanguageSwitchMenu: FC = () => {
    const { t } = useTranslation();

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger arrowDir="left">
                <div className="hstack items-center gap-2 w-full justify-end">
                    <span>{t("language")}</span>
                    <Languages className="size-[1rem]" />
                </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <LanguageItem language="en" title="English" />
                    <LanguageItem language="ru" title="Русский" />
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
};
