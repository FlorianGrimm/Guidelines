import * as React from "react";
import type { Unsubscripe } from "./triggerEvent";
import { TriggerUpdateViewProps, wireTriggerUpdateView } from './triggerUpdateView';
export type GuidelinesControlViewProps = TriggerUpdateViewProps & {
};
export type GuidelinesControlViewState = {
    tick: number;
};

export default class GuidelinesControlView extends React.Component<GuidelinesControlViewProps, GuidelinesControlViewState> {
    tick: number;
    unwireTriggerUpdateView: Unsubscripe;
    constructor(props: GuidelinesControlViewProps) {
        super(props);
        this.tick = 1;
        this.state = { tick: 1 };
        this.unwireTriggerUpdateView = wireTriggerUpdateView(this, props);
    }
   
    render() {
        this.tick = this.state.tick;
        return (<div>GuidelinesControlView {this.tick}</div>);
    }
    componentWillUnmount() {
        this.unwireTriggerUpdateView = this.unwireTriggerUpdateView();
    }
}