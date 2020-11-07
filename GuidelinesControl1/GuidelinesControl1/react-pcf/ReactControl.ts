import React = require("react");
import ReactDOM = require("react-dom");

import { ControlSize } from "./ControlSize";
import { DiagnosticsService } from "./DiagnosticsService";
import RootReactControl, { RootReactControlProps } from "./RootReactControl";
import { RootReactControlService } from "./RootReactControlService";
import { ServiceProvider } from "./ServiceProvider";
export type UpdateContextCaller = "init" | "updateView";
export type UpdateContextNextSteps = {
    updateView: boolean;
    layoutChanged: boolean;
    parametersChanged: boolean;
    entityIdChanged: boolean;
    datasetChanged: string[]
};
export type UpdateContextUpdatedProperties = { [updatedProperty: string]: boolean; };

export default class ReactControl<IInputs, IOutputs> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    serviceProvider: ServiceProvider;

    // from init
    context: ComponentFramework.Context<IInputs>;
    notifyOutputChanged: (() => void) | null;
    state?: ComponentFramework.Dictionary;
    container: HTMLDivElement | null;
    diagnosticsService: DiagnosticsService;

    constructor(emmitDebug?: boolean) {
        this.diagnosticsService = new DiagnosticsService(emmitDebug);
        this.serviceProvider = new ServiceProvider();
        this.serviceProvider.register(DiagnosticsService.ServiceName, this.diagnosticsService);
        const rootReactControlService = new RootReactControlService(this);
        this.serviceProvider.register(RootReactControlService.ServiceName, rootReactControlService);
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged?: () => void,
        state?: ComponentFramework.Dictionary,
        container?: HTMLDivElement
    ): void {
        try {
            this.context = context;
            this.notifyOutputChanged = notifyOutputChanged || null;
            this.state = state;
            this.container = container || null;
            this.diagnosticsService.debug(["init", context]);
            this.updateContext(context, "init");
            if (container) {
                this.createReactElementAndRender(container);
            }
        } catch (err) {
            this.diagnosticsService.showError(this.container, ["ReactControl.init", err]);
            throw err;
        }
    }

    createReactElementAndRender(container: HTMLDivElement) {
        const props: RootReactControlProps = {
            getServiceProvider: () => this.serviceProvider,
            controlSize: this.getControlSize()
        };
        var ele = React.createElement(RootReactControl, props);
        ReactDOM.render(ele, container);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    updateView(
        context: ComponentFramework.Context<IInputs>
    ): void {
        this.context = context;
        this.diagnosticsService.debug(["updateView", context]);

        this.updateContext(context, "updateView");
    }

    updateContext(
        context: ComponentFramework.Context<IInputs>,
        caller: "init" | "updateView"
    ) {
        let updatedProperties: string[] = [];
        updatedProperties.push(...context.updatedProperties);
        const nextSteps: UpdateContextNextSteps = { updateView:false,layoutChanged: false, parametersChanged: false, entityIdChanged: false, datasetChanged: [] as string[] };
        const wasEmpty = (!updatedProperties || updatedProperties.length === 0);
        const dctUpdatedProperties: UpdateContextUpdatedProperties = {};
        updatedProperties.forEach((p) => { dctUpdatedProperties[p] = true; });
        if (dctUpdatedProperties["layout"] || wasEmpty || caller == "init") {
            dctUpdatedProperties["layout"] = false;
            nextSteps.layoutChanged = true;
        }
        if (dctUpdatedProperties["viewportSizeMode"]) {
            dctUpdatedProperties["viewportSizeMode"] = false;
            nextSteps.layoutChanged = true;
        }
        if (dctUpdatedProperties["parameters"] || wasEmpty || caller == "init") {
            dctUpdatedProperties["parameters"] = false;
            nextSteps.parametersChanged = true;
        }
        if (dctUpdatedProperties["entityId"]) {
            dctUpdatedProperties["entityId"] = false;
            nextSteps.entityIdChanged = true;
        }
        if (dctUpdatedProperties["fullscreen_open"]) {
            dctUpdatedProperties["fullscreen_open"] = false;
            nextSteps.layoutChanged = true;
        }
        if (dctUpdatedProperties["fullscreen_close"]) {
            dctUpdatedProperties["fullscreen_close"] = false;
            nextSteps.layoutChanged = true;
        }
        if (dctUpdatedProperties["IsControlDisabled"]) {
            dctUpdatedProperties["IsControlDisabled"] = false;
            nextSteps.layoutChanged = true;
        }
        this.updateContextNextSteps(caller, dctUpdatedProperties, nextSteps);
        this.updateContextExecute(caller, dctUpdatedProperties, nextSteps);
    }


    updateContextNextSteps(caller: UpdateContextCaller, dctUpdatedProperties: UpdateContextUpdatedProperties, nextSteps: UpdateContextNextSteps) {
        // override
    }

    updateContextExecute(caller: UpdateContextCaller, dctUpdatedProperties: UpdateContextUpdatedProperties, nextSteps: UpdateContextNextSteps) {
        const rootReactControlService = this.serviceProvider.get<RootReactControlService<IInputs, IOutputs>>(RootReactControlService.ServiceName);
        if (nextSteps.updateView && caller == "updateView") {
            rootReactControlService.onUpdateView.dispatch(this, "updateContextExecute");
        }
    }
    // /** 
    //  * It is called by the framework prior to a control receiving new data. 
    //  * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
    //  */
    // public getOutputs(): IOutputs {
    //     return {} as IOutputs;
    // }

    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    destroy(): void {
        const container = this.container;
        if (container) {
            this.container = null;
            ReactDOM.unmountComponentAtNode(container);
        }
    }

    public getControlSize(): ControlSize {
        if (this.context && this.context.parameters && this.context.mode) {
            let configuredHeight: number | undefined = undefined;

            // If there is a parameter called height in the manifest, pass it to the the control
            const parametersRecord = (this.context.parameters as unknown) as Record<string, ComponentFramework.PropertyTypes.Property>;
            if (parametersRecord["height"] && parametersRecord["height"].raw) {
                configuredHeight = parametersRecord["height"].raw;
            }
            const width = this.context.mode.allocatedWidth == -1 ? undefined : this.context.mode.allocatedWidth;
            const height = this.context.mode.allocatedHeight == -1 ? configuredHeight : this.context.mode.allocatedHeight;
            this.diagnosticsService.debug(["getControlSize", width, height]);
            const controlSize: ControlSize = { width, height };
            return controlSize;
        } else {
            const controlSize: ControlSize = { width: undefined, height: undefined };
            return controlSize;
        }
    }

    public hasControlSizeChanged(controlSizeOld: ControlSize, controlSizeCurrent: ControlSize): { changed: boolean, controlSize: ControlSize } {
        var changed = false;
        let { width: widthOld, height: heightOld } = controlSizeOld;
        let { width: widthCurrent, height: heightCurrent } = controlSizeCurrent;

        if (widthCurrent !== undefined && (widthCurrent || 0) != (widthOld || 0)) {
            widthOld = widthCurrent;
            changed = true;
        }
        if (heightCurrent !== undefined && (heightCurrent || 0) != (heightOld || 0)) {
            heightOld = heightCurrent;
            changed = true;
        }
        if (changed) {
            return { changed: true, controlSize: { width: widthOld, height: heightOld } };
        } else {
            return { changed: false, controlSize: controlSizeOld };
        }
    }
}
