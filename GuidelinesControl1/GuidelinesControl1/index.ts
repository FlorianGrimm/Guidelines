import React = require("react");
import ReactDOM = require("react-dom");

import { IInputs, IOutputs } from "./generated/ManifestTypes";

import { getHotRepository } from "../../shared/HotRepository";
import { ControlName, Control1Name } from "../../shared/constants";

import ReactFieldControl from "./react-pcf/ReactFieldControl";
import GuidelinesRootControl, { GuidelinesRootControlProps, GuidelinesRootControlState } from "./GuidelinesRootControl";
import { UpdateContextCaller, UpdateContextUpdatedProperties, UpdateContextNextSteps, ControlSize } from "./react-pcf";

type UpdateContextNextStepsMod = {
	authoringModeChanged?: boolean;
	controlSizeChanged: boolean;
	controlSize?: ControlSize;
	calcNeeded: boolean;
} & UpdateContextNextSteps;

const version = 4;

(function () {
	getHotRepository().register(ControlName, version, () => new GuidelinesControl1());
	getHotRepository().register(Control1Name, version, () => new GuidelinesControl1());
})();


export class GuidelinesControl1 extends ReactFieldControl<IInputs, IOutputs> {
	isAuthoringMode: boolean;
	controlSize: ControlSize;

	constructor() {
		super(true);
		this.isAuthoringMode = false;
		this.controlSize = { width: undefined, height: undefined };

		this.diagnosticsService.debug(["GuidelinesControl1", version]);
	}

	init(
		context: ComponentFramework.Context<IInputs>,
		notifyOutputChanged?: () => void,
		state?: ComponentFramework.Dictionary,
		container?: HTMLDivElement
	): void {
		//this.isAuthoringMode = context.mode.isAuthoringMode || false;
		context.mode.trackContainerResize(true);

		super.init(context, notifyOutputChanged, state, container);
	}

	createReactElementAndRender(container: HTMLDivElement) {
		if (this.isAuthoringMode) {
			const props: GuidelinesRootControlProps = {
				getServiceProvider: () => this.serviceProvider,
				controlSize: this.getControlSize()
			};
			var ele = React.createElement(GuidelinesRootControl, props);
			ReactDOM.render(ele, container);
		}
	}

	updateContextNextSteps(caller: UpdateContextCaller, dctUpdatedProperties: UpdateContextUpdatedProperties, nextSteps: UpdateContextNextStepsMod) {
		const isAuthoringMode = this.context.mode.isAuthoringMode || false;
		if (this.isAuthoringMode !== isAuthoringMode) {
			this.isAuthoringMode = isAuthoringMode;
			nextSteps.authoringModeChanged = true;
		}

		const controlSizeChanged = this.hasControlSizeChanged(this.controlSize, this.getControlSize());
		if (controlSizeChanged.changed) {
			nextSteps.controlSizeChanged = true;
			nextSteps.controlSize = controlSizeChanged.controlSize;
		}
	}
	updateContextExecute(caller: UpdateContextCaller, dctUpdatedProperties: UpdateContextUpdatedProperties, nextSteps: UpdateContextNextStepsMod) {
		if (nextSteps.controlSizeChanged) { nextSteps.calcNeeded = true; }
		if (nextSteps.layoutChanged) { nextSteps.updateView = true; }
		if (nextSteps.authoringModeChanged) { nextSteps.updateView = true; }
		if (nextSteps.calcNeeded){
			if (this.calc()){
				nextSteps.updateView=true;
			}
		}
		super.updateContextExecute(caller, dctUpdatedProperties, nextSteps);
	}
	calc() {
		console.log("FxX1.type", this.context.parameters.FxX1.type); // FP
		console.log("FxX2.type", this.context.parameters.FxX2.type);
		return true;
	}

}

/*
Guidelines\GuidelinesControl1\node_modules\pcf-start\bin\pcf-start.js
line 37
// Start server
var options = {
	port: 8181,
	cors: true,

*/