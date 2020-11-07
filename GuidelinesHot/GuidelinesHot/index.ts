import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { getHotRepository } from "../../shared/HotRepository";

import { ControlName } from "../../shared/constants";

export class GuidelinesHot implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	public impl: ComponentFramework.StandardControl<IInputs, IOutputs> | null;
	logVisibleToContainer = true;
	container: HTMLDivElement | null;
	sideLoadControlName: string;
	sideLoadUrl: string;
	socket: WebSocket | null;

	constructor() {
		this.impl = null;
		this.container = null;
		this.socket = null;
		this.sideLoadControlName = "";
		console.log("GuidelinesHot 1.3.2");
	}

	logVisible(message?: any, ...optionalParams: any[]): void {
		if (console && console.debug) {
			console.debug(message, ...optionalParams);
		}
		if (this.container && this.logVisibleToContainer) {
			this.container.innerText = `${message} ${optionalParams}`;
		}
	}

	public startImplementation(
		jsCode: string,
		context: ComponentFramework.Context<IInputs>,
		notifyOutputChanged: () => void,
		state: ComponentFramework.Dictionary,
		container: HTMLDivElement): boolean {
		if (this.impl === null) {
			try {
				(new Function(jsCode))();
			} catch (error) {
				console.error("jsCode", error);
				this.logVisible(`bundle error ${error}`);
				return false;
			}
			try {
				const sideLoadUrl = this.sideLoadUrl;
				let sideLoadControlName = this.sideLoadControlName || "";
				if (!sideLoadControlName || (sideLoadControlName === "default")) { sideLoadControlName = ControlName; }
				const factory = getHotRepository().get(sideLoadControlName);
				if (factory) {
					this.logVisible(`Hot ${sideLoadUrl} factory ${sideLoadControlName}.`);
					const impl: (ComponentFramework.StandardControl<IInputs, IOutputs> | null) = factory() || null;
					if (impl) {
						this.impl = impl;
						this.logVisible(`Hot ${sideLoadUrl} start implementation ${sideLoadControlName}.`);
						this.logVisibleToContainer = false;
						impl.init(context, notifyOutputChanged, state, container);
						return true;
					} else {
						this.logVisible(`Hot ${sideLoadUrl} no implementation ${sideLoadControlName}.`);
					}
				} else {
					this.logVisible(`Hot ${sideLoadUrl} factory not set or unknown ${sideLoadControlName}.`);
				}
			} catch (error) {
				console.log("error init impl", error);
				this.impl = null;
			}
			return false;
		} else {
			return true;
		}
	}

	public fetchBundle(sideLoadUrl: string): Promise<string> {
		if (sideLoadUrl) {
			return fetch(sideLoadUrl, { mode: "cors", cache: "no-cache" })
				.then((response) => {
					if (response.status == 200) {
						//this.logVisible(`Hot ${sideLoadUrl} download OK Status:${response.status}`);
						return response.text();
					} else {
						this.logVisible(`Hot ${sideLoadUrl} download ?? Status:${response.status}`);
						return "";
					}
				}, (reason) => {
					this.logVisible(`Hot ${sideLoadUrl} Error: ${reason}`);
					return "";
				}).then(data => {
					if (data) {
						//this.logVisible(`Hot ${sideLoadUrl} downloaded`);
						window.localStorage.setItem(ControlName, data);
						return data;
					} else {
						this.logVisible(`Hot ${sideLoadUrl} downloaded no data`);
						return "";
					}
				})
		} else {
			return Promise.resolve("");
		}
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(
		context: ComponentFramework.Context<IInputs>,
		notifyOutputChanged: () => void,
		state: ComponentFramework.Dictionary,
		container: HTMLDivElement) {
		this.container = container;
		this.logVisible("Hot");

		this.sideLoadControlName = context.parameters.SideLoadControlName?.raw || "";


		const sideLoadUrl = context.parameters.SideLoadUrl?.raw || "";
		this.sideLoadUrl = sideLoadUrl;

		// Add control initialization code
		this.logVisible(`Hot ${sideLoadUrl}`);
		{
			const jsTxt = window.localStorage.getItem(ControlName);
			if (jsTxt) {
				this.logVisible(`Hot ${sideLoadUrl} from localStorage`);
				this.startImplementation(jsTxt, context, notifyOutputChanged, state, container);
			}
		}
		{
			if (sideLoadUrl && (sideLoadUrl.startsWith("https://") || sideLoadUrl.startsWith("http://"))) {
				this.fetchBundle(sideLoadUrl).then((data) => {
					if (this.impl) {
						this.logVisible(`Hot ${sideLoadUrl} already loaded`);
					} else if (data) {
						this.logVisible(`Hot ${sideLoadUrl} eval downloaded`);
						this.startImplementation(data, context, notifyOutputChanged, state, container);
					} else {
						this.logVisible(`Hot ${sideLoadUrl} nothing eval`);
					}
					return "";
				});

				if (this.socket === null) {
					const r = /(?<a>https?)(\:\/\/127\.0\.0\.1\:)(?<b>[0-9]+)/ig;
					const m = r.exec(sideLoadUrl);
					const address = (m && m.groups)
						? ((m.groups["a"] === "http") ? "ws" : "wss") + "://127.0.0.1:" + m.groups["b"] + "/ws"
						: "";
					if (address) {
						var socket = new WebSocket(address);
						this.socket = socket;
						socket.onmessage = (msg: MessageEvent) => {
							if (msg.data == 'reload') {
								console.log('hot reload');
								if (container) {
									container.style.border = "1px solid black";
								}
								this.fetchBundle(sideLoadUrl).then(()=>{
									if (container) {
										container.style.border = "1px solid red";
									}	
								});
							}
							//window.location.reload();
						};
						socket.onclose = (ev: CloseEvent) => {
							this.socket = null;
						};
						socket.onerror = (ev: Event) => {
							this.socket = null;
						};
					}
				}
			}
		}
	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		// Add code to update control view
		this.impl?.updateView(context);
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		const impl = this.impl;
		if (impl && impl.getOutputs) {
			return impl.getOutputs();
		}
		return ({} as IOutputs);
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		this.impl?.destroy();
		this.impl = null;
	}
}