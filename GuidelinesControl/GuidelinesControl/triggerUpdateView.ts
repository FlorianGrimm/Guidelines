import * as React from "react";
import { ITriggerEvent, Unsubscripe } from "./triggerEvent";

export interface TriggerUpdateViewHost {
    triggerUpdateView: ITriggerEvent<any,any>;
}
export type TriggerUpdateViewProps = {
    getHost: (()=>TriggerUpdateViewHost);
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
        if (thisTick == stateTick) {
            that.tick = 0;
            that.setState({ tick: stateTick + 1 });
        }
    };
    return props.getHost().triggerUpdateView.subscripe(triggerUpdateView);
} 
