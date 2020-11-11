import React = require("react");
import ReactDOM = require("react-dom");
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import GuidelinesControlView, { GuidelinesControlViewProps } from "./GuidelinesControlView";
import type { HotReloadHost } from "./HotReload";
import { SingleTriggerEvent } from "./triggerEvent";
import { ControlSize, TriggerUpdateControlSize } from "./triggerSizeChanged";
import { TriggerUpdateViewHost } from "./triggerUpdateView";


export class GuidelinesControl
	implements ComponentFramework.StandardControl<IInputs, IOutputs>,
	HotReloadHost<IInputs, IOutputs> {
	static namespace = "FlorianGrimm";
	static version = 7;

	notifyOutputChanged: (() => void) | null;
	state: ComponentFramework.Dictionary | null;
	container: HTMLDivElement | null;
	context: ComponentFramework.Context<IInputs> | null;
	triggers: TriggerUpdateViewHost & TriggerUpdateControlSize;

	constructor() {
		this.notifyOutputChanged = null;
		this.state = null;
		this.container = null;
		this.context = null;
		this.triggers = {
			triggerUpdateView: new SingleTriggerEvent<any, any>(),
			triggerUpdateSize: new SingleTriggerEvent<any, ControlSize>();
		};
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		this.notifyOutputChanged = notifyOutputChanged || null;
		this.state = state || null;
		this.container = container || null;
		this.updateContext(context, "init");
		this.startReact();
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		this.updateContext(context, "updateView");
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		this.triggers.triggerUpdateView.clear();
		//
		const container = this.container;
		if (container) {
			this.container = null;
			ReactDOM.unmountComponentAtNode(container);
		}
	}

	startReact() {
		const container = this.container;
		if (container) {
			const props: GuidelinesControlViewProps = {
				getHost: () => this.triggers
			};
			ReactDOM.render(React.createElement(GuidelinesControlView, props), container);
		}
	}

	updateContext(context: ComponentFramework.Context<IInputs>, mode: "init" | "updateView" | "hotReload") {
		this.context = context;
		const resumeUpdateView = this.triggers.triggerUpdateView.pause();
		try {
			const isInit = mode === "init" || mode === "hotReload"
			const isUpdateView = mode === "updateView"
			const isReload = mode === "hotReload"

			//const x=context.
			if (isInit || isReload) {
				context.mode.trackContainerResize(true);
			}


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
			// this.updateContextNextSteps(caller, dctUpdatedProperties, nextSteps);
			// this.updateContextExecute(caller, dctUpdatedProperties, nextSteps);


			this.triggers.triggerUpdateView.trigger(this, {});
		} finally {
			resumeUpdateView();
		}

	}

	getHotReloadState?(): any {
		return {};
	}

	public hotReload(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement, hotReloadState?: any) {
		this.notifyOutputChanged = notifyOutputChanged;
		this.state = state;
		this.container = container;
		this.updateContext(context, "hotReload");
		this.startReact();
	}
}
