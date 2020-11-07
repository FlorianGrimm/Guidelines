import React = require("react");
import ReactDOM = require("react-dom");

import { ControlSize } from "./ControlSize";
import { RootReactControlService } from "./RootReactControlService";
import { GetServiceProvider, ServiceProvider } from "./ServiceProvider";

export type RootReactControlProps = {
    getServiceProvider: GetServiceProvider;
    controlSize: ControlSize;
};
export type RootReactControlState = {
    tick: number;
    controlSize: ControlSize;
};

export default class RootReactControl extends React.Component<RootReactControlProps, RootReactControlState> {
    renderTick: number;
    serviceProvider: ServiceProvider;

    constructor(props: RootReactControlProps) {
        super(props);
        this.renderTick = 0;
        this.state = { tick: 0, controlSize: props.controlSize };
        this.serviceProvider = props.getServiceProvider();
        const rootReactControlService = this.serviceProvider.get<RootReactControlService<any, any>>(RootReactControlService.ServiceName);
        rootReactControlService.onControlSizeChanged.subscribe(this.onControlSizeChanged.bind(this));
        rootReactControlService.onUpdateView.subscribe(this.onUpdateView.bind(this));
    }

    public onControlSizeChanged(controlSize: ControlSize) {
        var changed = false;
        let { width, height } = this.state.controlSize;

        if (controlSize.width && (controlSize.width || 0) != (width || 0)) {
            width = controlSize.width;
            changed = true;
        }
        if (controlSize.height && (controlSize.height || 0) != (height || 0)) {
            height = controlSize.height;
            changed = true;
        }
        if (changed) {
            this.setState({ tick: this.renderTick + 1, controlSize: { width: width, height: height } });
        }
    }

    public onUpdateView(msg: string | undefined) {
        if (this.state.tick == this.renderTick) {
            this.setState({ tick: this.renderTick + 1 })
        }
    }

    public render() {
        this.renderTick = this.state.tick;
        return (<div>Root t:{this.renderTick} w:{this.state.controlSize.width}; h:{this.state.controlSize.height}</div>);
    }
}