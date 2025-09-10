import {
    ChartConfig,
} from "@wildosvpn/common/components";
import { UserNodeUsagesResponse } from "@wildosvpn/modules/users";
import { interpolateColors } from "@wildosvpn/common/utils";
import { interpolateRdBu } from "d3";

export const useChartConfig = (nodesUsage: UserNodeUsagesResponse) => {
    const numberOfNodes = nodesUsage.node_usages.length;
    const config: Record<string, any> = {
        views: {
            label: "Page Views",
        }
    }
    const colorRangeInfo = {
        colorStart: 0,
        colorEnd: 1,
        useEndAsStart: false,
    };
    const colors = interpolateColors(numberOfNodes, interpolateRdBu, colorRangeInfo);
    nodesUsage.node_usages.forEach((node, i) => {
        config[node.node_name] = { label: node.node_name, color: colors[i] };
    })
    return config satisfies ChartConfig;
}
