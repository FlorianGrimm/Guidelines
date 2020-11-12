import * as React from "react";
import logger from "./logger";
import { ITriggerEvent, Unsubscripe } from "./triggerEvent";

export type TriggerUpdateViewHost = {
    triggerUpdateView: ITriggerEvent<any>;
}
export type TriggerUpdateViewProps = {
    getTriggers: (()=>TriggerUpdateViewHost);
}
export type TriggerUpdateViewState = {
    tick: number;
}
export type TriggerUpdateViewReactComponent<P extends TriggerUpdateViewProps, S extends TriggerUpdateViewState>
    = React.Component<P, S>
    & {
        tick: number;
    };

export function wireTriggerUpdateView<P extends TriggerUpdateViewProps, S extends TriggerUpdateViewState>(
    that: TriggerUpdateViewReactComponent<P, S>,
    props: TriggerUpdateViewProps
) : Unsubscripe {
    const triggerUpdateView = () => {
        const thisTick = that.tick;
        const stateTick = that.state.tick;
        logger.log("triggerUpdateView", thisTick, stateTick);
        if (thisTick == stateTick) {
            that.tick = 0;
            that.setState({ tick: stateTick + 1 });
        }
    };
    return props.getTriggers().triggerUpdateView.subscripe(triggerUpdateView);
} 
