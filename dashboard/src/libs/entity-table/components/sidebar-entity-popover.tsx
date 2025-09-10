import {
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@wildosvpn/common/components";
import {
    SidebarEntitySelection
} from "@wildosvpn/libs/entity-table/components";
import { FC } from "react";

interface SidebarEntityTablePopoverProps {
    buttonChild: React.ReactElement;
}

export const SidebarEntityTablePopover: FC<SidebarEntityTablePopoverProps> = ({
    buttonChild,
}) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button
                size="sm"
                variant="outline"
                className="mr-1 lg:flex"
            >
                {buttonChild}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
            <SidebarEntitySelection />
        </PopoverContent>
    </Popover>
)
