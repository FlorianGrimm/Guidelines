import React = require("react");
import ReactDOM = require("react-dom");
import { ControlSize } from "./ControlSize";
import RootReactControl, { RootReactControlProps } from "./RootReactControl";
import { ServiceProvider } from "./ServiceProvider";

export default class ReactControl<IInputs, IOutputs> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    serviceProvider: ServiceProvider;
    context: ComponentFramework.Context<IInputs>;
    notifyOutputChanged: (() => void) | null;
    container: HTMLDivElement | null;
    constructor() {
        this.serviceProvider = new ServiceProvider();
    }

    init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged?: () => void,
        state?: ComponentFramework.Dictionary,
        container?: HTMLDivElement
    ): void {
        this.container = container || null;
        this.notifyOutputChanged = notifyOutputChanged || null;

        if (container) {
            const props: RootReactControlProps = {
                getServiceProvider: () => this.serviceProvider,
                controlSize: this.getControlSize()
            };
            var ele = React.createElement(RootReactControl, props);
            ReactDOM.render(ele, container);
        }
    }

    updateView(
        context: ComponentFramework.Context<IInputs>
    ): void {

    }

    destroy(): void {
        const container = this.container;
        if (container) {
            this.container = null;
            ReactDOM.unmountComponentAtNode(container);
        }
    }

    public getControlSize(): ControlSize {
        let configuredHeight: number | undefined = undefined;

        // If there is a parameter called height in the manifest, pass it to the the control
        const parametersRecord = (this.context.parameters as unknown) as Record<
            string,
            ComponentFramework.PropertyTypes.Property
        >;
        if (parametersRecord["height"] && parametersRecord["height"].raw) {
            configuredHeight = parametersRecord["height"].raw;
        }

        const width = this.context.mode.allocatedWidth == -1 ? undefined : this.context.mode.allocatedWidth;
        const height = this.context.mode.allocatedHeight == -1 ? configuredHeight : this.context.mode.allocatedHeight;
        const controlSize: ControlSize = { width, height };
        return controlSize;
    }
}
