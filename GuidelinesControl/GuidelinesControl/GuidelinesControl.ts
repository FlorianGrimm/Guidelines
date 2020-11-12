import React = require("react");
import ReactDOM = require("react-dom");
import { calcFormula, parseFormula } from "./formula";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import GuidelinesControlView, { GuidelinesControlViewProps } from "./GuidelinesControlView";
import type { HotReloadHost } from "./shared/HotReload";
import logger from "./shared/logger";
import { emptyPCFState, initPCFState, PCFState } from "./shared/PCFState";
import { MultiTriggerEvent, SingleTriggerEvent, TriggerProperty, Unsubscripe, Unsubscripes } from "./shared/triggerEvent";
import { calcControlSize, ControlSize, getControlSize, TriggerUpdateControlSize } from "./shared/triggerSizeChanged";
import { TriggerUpdateViewHost } from "./shared/triggerUpdateView";
import { transferParameters, updateContextInit } from "./shared/updateContext";

export type TriggerHost = {
	triggerOutputs: TriggerProperty<boolean>;
	triggerUpdateView: MultiTriggerEvent;
	triggerUpdateSize: TriggerProperty<ControlSize>;
} & TriggerUpdateViewHost & TriggerUpdateControlSize

export type State = {
	isAuthoringMode: TriggerProperty<boolean>,
	controlSize: TriggerProperty<ControlSize>,
	calcNeeded: TriggerProperty<boolean>,
	inProps: {
		InX: TriggerProperty<number>,
		InY: TriggerProperty<number>,
		InW: TriggerProperty<number>,
		InH: TriggerProperty<number>,
	}
	fxProps: {
		FxX1: TriggerProperty<string>,
		FxX2: TriggerProperty<string>,
		FxX3: TriggerProperty<string>,
		FxX4: TriggerProperty<string>,
		FxX5: TriggerProperty<string>,
		FxY1: TriggerProperty<string>,
		FxY2: TriggerProperty<string>,
		FxY3: TriggerProperty<string>,
		FxY4: TriggerProperty<string>,
		FxY5: TriggerProperty<string>,
	}
	resultProps: {
		X1: TriggerProperty<number>,
		X2: TriggerProperty<number>,
		X3: TriggerProperty<number>,
		X4: TriggerProperty<number>,
		X5: TriggerProperty<number>,
		Y1: TriggerProperty<number>,
		Y2: TriggerProperty<number>,
		Y3: TriggerProperty<number>,
		Y4: TriggerProperty<number>,
		Y5: TriggerProperty<number>,
		W1: TriggerProperty<number>,
		W2: TriggerProperty<number>,
		W3: TriggerProperty<number>,
		W4: TriggerProperty<number>,
		W5: TriggerProperty<number>,
		H1: TriggerProperty<number>,
		H2: TriggerProperty<number>,
		H3: TriggerProperty<number>,
		H4: TriggerProperty<number>,
		H5: TriggerProperty<number>,
	}
};

export class GuidelinesControl
	implements ComponentFramework.StandardControl<IInputs, IOutputs>,
	HotReloadHost<IInputs, IOutputs> {
	static namespace = "FlorianGrimm";
	static version = 10504;

	pcfState: PCFState<IInputs, IOutputs>;

	state: State;

	unsubscripes: Unsubscripes;

	triggers: TriggerHost;

	constructor() {		
		logger.log(`${GuidelinesControl.namespace}.GuidelinesControl version ${GuidelinesControl.version}` );
		this.unsubscripes = new Unsubscripes();
		this.pcfState = emptyPCFState();
		this.state = {
			isAuthoringMode: new TriggerProperty<boolean>("isAuthoringMode", false),
			controlSize: new TriggerProperty<ControlSize>("controlSize", { width: undefined, height: undefined }, calcControlSize),
			calcNeeded: new TriggerProperty<boolean>("calcNeeded",true),
			inProps: {
				InX: new TriggerProperty<number>("InX", 0),
				InY: new TriggerProperty<number>("InY", 0),
				InW: new TriggerProperty<number>("InW", 0),
				InH: new TriggerProperty<number>("InH", 0),
			},
			fxProps: {
				FxX1: new TriggerProperty<string>("FxX1", ""),
				FxX2: new TriggerProperty<string>("FxX2", ""),
				FxX3: new TriggerProperty<string>("FxX3", ""),
				FxX4: new TriggerProperty<string>("FxX4", ""),
				FxX5: new TriggerProperty<string>("FxX5", ""),
				FxY1: new TriggerProperty<string>("FxY1", ""),
				FxY2: new TriggerProperty<string>("FxY2", ""),
				FxY3: new TriggerProperty<string>("FxY3", ""),
				FxY4: new TriggerProperty<string>("FxY4", ""),
				FxY5: new TriggerProperty<string>("FxY5", ""),
			},
			resultProps: {
				X1: new TriggerProperty<number>("X1", 0),
				X2: new TriggerProperty<number>("X2", 0),
				X3: new TriggerProperty<number>("X3", 0),
				X4: new TriggerProperty<number>("X4", 0),
				X5: new TriggerProperty<number>("X5", 0),
				Y1: new TriggerProperty<number>("Y1", 0),
				Y2: new TriggerProperty<number>("Y2", 0),
				Y3: new TriggerProperty<number>("Y3", 0),
				Y4: new TriggerProperty<number>("Y4", 0),
				Y5: new TriggerProperty<number>("Y5", 0),
				W1: new TriggerProperty<number>("W1", 0),
				W2: new TriggerProperty<number>("W2", 0),
				W3: new TriggerProperty<number>("W3", 0),
				W4: new TriggerProperty<number>("W4", 0),
				W5: new TriggerProperty<number>("W5", 0),
				H1: new TriggerProperty<number>("H1", 0),
				H2: new TriggerProperty<number>("H2", 0),
				H3: new TriggerProperty<number>("H3", 0),
				H4: new TriggerProperty<number>("H4", 0),
				H5: new TriggerProperty<number>("H5", 0),
			}
		};

		this.triggers = {
			triggerOutputs: new TriggerProperty<boolean>("triggerOutputs", false),
			triggerUpdateView: new MultiTriggerEvent("triggerUpdateView"),
			triggerUpdateSize: new TriggerProperty<ControlSize>("triggerUpdateSize", { width: undefined, height: undefined }, calcControlSize)
		};
		this.unsubscripes.addTo = this.triggers.triggerOutputs;
		this.unsubscripes.addTo = this.triggers.triggerUpdateSize;
		this.unsubscripes.addTo = this.triggers.triggerUpdateView;
		this.unsubscripes.addTo = this.state.isAuthoringMode.subscripe(
			() => {
				this.triggers.triggerUpdateView.trigger(this, "isAuthoringMode");
			}
		);
		this.unsubscripes.addTo = this.state.controlSize.subscripe(
			(cs: ControlSize) => {
				this.triggers.triggerUpdateSize.value = cs;
			});
		const setCalcNeeded = () => {
			if (this.state.calcNeeded.value){
				// will be triggered
			} else {
				logger.log("calcNeeded")
				this.state.calcNeeded.value = true;
			}
		};
		[
			this.state.inProps.InX, this.state.inProps.InY, this.state.inProps.InW, this.state.inProps.InH,
			this.state.fxProps.FxX1, this.state.fxProps.FxX2, this.state.fxProps.FxX3, this.state.fxProps.FxX4, this.state.fxProps.FxX5,
			this.state.fxProps.FxY1, this.state.fxProps.FxY2, this.state.fxProps.FxY3, this.state.fxProps.FxY4, this.state.fxProps.FxY5
		].map((tp) => {
			this.unsubscripes.addTo = tp.subscripe(setCalcNeeded);
		});
		const setUpdateOutput = () => {
			this.triggers.triggerUpdateView.trigger(this, "setUpdateOutput");
			this.triggers.triggerOutputs.value = true;
		}
		[
			this.state.resultProps.X1, this.state.resultProps.W1, this.state.resultProps.Y1, this.state.resultProps.H1,
			this.state.resultProps.X2, this.state.resultProps.W2, this.state.resultProps.Y2, this.state.resultProps.H2,
			this.state.resultProps.X3, this.state.resultProps.W3, this.state.resultProps.Y3, this.state.resultProps.H3,
			this.state.resultProps.X4, this.state.resultProps.W4, this.state.resultProps.Y4, this.state.resultProps.H4,
			this.state.resultProps.X5, this.state.resultProps.W5, this.state.resultProps.Y5, this.state.resultProps.H5,
		].map((tp) => {
			this.unsubscripes.addTo = tp.subscripe(setUpdateOutput);
		});
		this.unsubscripes.addTo = this.triggers.triggerOutputs.subscripe(() => {
			this.triggers.triggerOutputs.internalValue = false;
			if (this.triggers.triggerOutputs.hasChanged) {
				if (this.pcfState.notifyOutputChanged) {
					this.pcfState.notifyOutputChanged();
				}
			}
		});
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
		logger.log("init", context.updatedProperties);
		initPCFState(this.pcfState, notifyOutputChanged, state, container);
		this.updateContext(context, "init");
		this.startReact();
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		logger.log("updateView", context.updatedProperties);
		this.updateContext(context, "updateView");
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		const result = {};
		const resultProps = this.state.resultProps;
		for (const name in resultProps) {
			if (Object.prototype.hasOwnProperty.call(resultProps, name)) {
				(result as any)[name] = ((resultProps as any)[name] as TriggerProperty<number>).value as number;
			}
		}
		this.triggers.triggerOutputs.hasChanged = false;
		logger.log("getOutputs", result);
		return result;
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		this.triggers.triggerUpdateView.clear();
		//
		const container = this.pcfState.container;
		if (container) {
			this.pcfState.container = null;
			ReactDOM.unmountComponentAtNode(container);
		}
	}

	startReact() {
		const container = this.pcfState.container;
		if (container) {
			const props: GuidelinesControlViewProps = {
				getTriggers: () => this.triggers,
				getState: () => this.state,
			};
			ReactDOM.render(React.createElement(GuidelinesControlView, props), container);
		}
	}

	updateContext(context: ComponentFramework.Context<IInputs>, mode: "init" | "updateView" | "hotReload") {
		logger.log("updateContext", mode);
		this.pcfState.context = context;
		const resumes = [
			this.triggers.triggerUpdateSize.pause(),
			this.triggers.triggerUpdateView.pause(),
			this.triggers.triggerOutputs.pause(),
		];
		try {
			const ucs = updateContextInit(context, mode, {});

			logger.log("ucs", ucs);
			if (ucs.isInit || ucs.isReload) {
				context.mode.trackContainerResize(true);
			}
			this.state.isAuthoringMode.value = (context.mode.isAuthoringMode || false);
			this.state.controlSize.value = getControlSize(context);
			//if (ucs.isInitAny || ucs.layoutChanged) {}

			//logger.log("parametersChanged", ucs.parametersChanged);
			if (ucs.isInit || ucs.isReload || ucs.parametersChanged || ucs.layoutChanged || ucs.noUpdatedProperties) {
				transferParameters(null, context.parameters, this.state.inProps);
				transferParameters(null, context.parameters, this.state.fxProps);
				//transferParameters(null, context.parameters, this.state.resultProps, (c, s) => { s.internalValue = c.raw; });

				//transferParameters(["InH", "InW", "InX", "InY"], context.parameters, this.state.inProps);
				//transferParameters(["FxX1","FxX2","FxX3","FxX4","FxX5","FxY1","FxY2","FxY3","FxY4","FxY5"], context.parameters, this.state.fxProps);
				//transferParameters(["X1","X2","X3","X4","X5","Y1","Y2","Y3","Y4","Y5","W1","W2","W3","W4","W5","H1","H2","H3","H4","H5"], context.parameters, this.state.resultProps);
			}

			logger.log("this.state.calcNeeded.value", this.state.calcNeeded.value);
			if (this.state.calcNeeded.value || true) {
				this.state.calcNeeded.internalValue = false;
				const controlSize = this.state.controlSize.value;
				const boundsXW = {
					offset: this.state.inProps.InX.value || 0,
					size: this.state.inProps.InW.value || controlSize.width || 0,
				};
				const boundsYH = {
					offset: this.state.inProps.InY.value || 0,
					size: this.state.inProps.InH.value || controlSize.height || 0,
				}
				logger.log("boundsXW", boundsXW);
				logger.log("boundsYH", boundsYH);
				const screenBreaks = [1200, 1800, 2400]; // todo
				const mode = (boundsXW.size < screenBreaks[0]) ? 0
					: (boundsXW.size < screenBreaks[1]) ? 1
						: (boundsXW.size < screenBreaks[2]) ? 2
							: 3;
				this.state.resultProps.X1.value = calcFormula(parseFormula(this.state.fxProps.FxX1.value), mode, boundsXW);
				this.state.resultProps.X2.value = calcFormula(parseFormula(this.state.fxProps.FxX2.value), mode, boundsXW);
				this.state.resultProps.X3.value = calcFormula(parseFormula(this.state.fxProps.FxX3.value), mode, boundsXW);
				this.state.resultProps.X4.value = calcFormula(parseFormula(this.state.fxProps.FxX4.value), mode, boundsXW);
				this.state.resultProps.X5.value = calcFormula(parseFormula(this.state.fxProps.FxX5.value), mode, boundsXW);

				this.state.resultProps.W1.value = this.state.resultProps.X2.value - this.state.resultProps.X1.value;
				this.state.resultProps.W2.value = this.state.resultProps.X3.value - this.state.resultProps.X2.value;
				this.state.resultProps.W3.value = this.state.resultProps.X4.value - this.state.resultProps.X3.value;
				this.state.resultProps.W4.value = this.state.resultProps.X5.value - this.state.resultProps.X4.value;
				this.state.resultProps.W5.value = (boundsXW.offset + boundsXW.size) - this.state.resultProps.X5.value;

				this.state.resultProps.Y1.value = calcFormula(parseFormula(this.state.fxProps.FxY1.value), mode, boundsYH);
				this.state.resultProps.Y2.value = calcFormula(parseFormula(this.state.fxProps.FxY2.value), mode, boundsYH);
				this.state.resultProps.Y3.value = calcFormula(parseFormula(this.state.fxProps.FxY3.value), mode, boundsYH);
				this.state.resultProps.Y4.value = calcFormula(parseFormula(this.state.fxProps.FxY4.value), mode, boundsYH);
				this.state.resultProps.Y5.value = calcFormula(parseFormula(this.state.fxProps.FxY5.value), mode, boundsYH);

				this.state.resultProps.H1.value = this.state.resultProps.Y2.value - this.state.resultProps.Y1.value;
				this.state.resultProps.H2.value = this.state.resultProps.Y3.value - this.state.resultProps.Y2.value;
				this.state.resultProps.H3.value = this.state.resultProps.Y4.value - this.state.resultProps.Y3.value;
				this.state.resultProps.H4.value = this.state.resultProps.Y5.value - this.state.resultProps.Y4.value;
				this.state.resultProps.H5.value = (boundsYH.offset + boundsYH.size) - this.state.resultProps.Y5.value;

				logger.log("x", this.state.resultProps.X1.value, this.state.resultProps.X2.value, this.state.resultProps.X3.value, this.state.resultProps.X4.value, this.state.resultProps.X5.value);
				logger.log("w", this.state.resultProps.W1.value, this.state.resultProps.W2.value, this.state.resultProps.W3.value, this.state.resultProps.W4.value, this.state.resultProps.W5.value);
				logger.log("y", this.state.resultProps.Y1.value, this.state.resultProps.Y2.value, this.state.resultProps.Y3.value, this.state.resultProps.Y4.value, this.state.resultProps.Y5.value);
				logger.log("h", this.state.resultProps.H1.value, this.state.resultProps.H2.value, this.state.resultProps.H3.value, this.state.resultProps.H4.value, this.state.resultProps.H5.value);
			}
		} finally {
			resumes.forEach((r) => r());
		}
	}


	getHotReloadState?(): any {
		return {};
	}

	public hotReload(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement, hotReloadState?: any) {
		this.pcfState.notifyOutputChanged = notifyOutputChanged;
		this.pcfState.state = state;
		this.updateContext(context, "hotReload");
		this.startReact();
	}
}
