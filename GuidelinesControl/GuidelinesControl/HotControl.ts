//import {IInputs, IOutputs} from "./generated/ManifestTypes";
//type IInputs=any;type IOutputs=any;
const consoleDebugEnabled = true;

export interface HotReloadHost<IInputs, IOutputs> extends ComponentFramework.StandardControl<IInputs, IOutputs> {
    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     * @param hotReload if true hot reload instance
     */
    hotReload(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement, hotReload?: boolean): void;
}
export interface HotReloadHostConstructor<IInputs, IOutputs> {
    new(): HotReloadHost<IInputs, IOutputs>;
    namespace: string;
    name: string;
    version: number;
}

type HotReloadState<IInputs, IOutputs> = {
    instance: HotReloadHost<IInputs, IOutputs>,
    context: ComponentFramework.Context<IInputs>;
    notifyOutputChanged?: () => void;
    state?: ComponentFramework.Dictionary,
    container?: HTMLDivElement
};
const keyHotReloadBundle = "#HotReloadBundle";
const keyHotReloadInstance = "#HotReloadInstance";
const keyLocalStoragePrefix = "#HotReload";
const keySocketPrefix = "#WebSocket";

export function enableHotReload<IInputs, IOutputs>(
    type: HotReloadHostConstructor<IInputs, IOutputs>,
    url: string
): HotReloadHostConstructor<IInputs, IOutputs> {
    let result = type;
    try {
        const typeFullName = `${type.namespace}.${type.name}`;
        const hotRepository = getHotRepository();
        if ((hotRepository.get(keyHotReloadBundle) || false) === false) {
            consoleDebugEnabled && console.debug && console.debug("enableHotReload within normal load.", type.namespace, type.name, type.version, url);
            try {
                const jsTxt = getFromLocalStorage(typeFullName);
                evaluateBundleHotReload(jsTxt, url);
            } catch (error) {
            }
            if (url) {
                startWatch(url, typeFullName);
            }
            var typeFromStorage = hotRepository.get<HotReloadHostConstructor<IInputs, IOutputs>>(typeFullName);
            if (typeFromStorage && result.version <= typeFromStorage.version) {
                result = typeFromStorage;
            }

        } else {
            consoleDebugEnabled && console.debug && console.debug("enableHotReload within hot reload.", type.namespace, type.name, type.version, url);
            hotRepository.register(typeFullName, type.version, type);
        }
    } catch (err) {
        console.error("enableHotReload", err);
    }
    return result;
}

export function injectHotReload<IInputs, IOutputs>(
    instance: HotReloadHost<IInputs, IOutputs>
) {
    try {
        const type: HotReloadHostConstructor<IInputs, IOutputs> = (instance as any)?.constructor;
        if (type) {
            consoleDebugEnabled && console.debug && console.debug("injectHotReload", type.namespace, type.name, type.version);

            const typeFullName = `${type.namespace}.${type.name}`;
            const hotRepository = getHotRepository();
            const typeLatest = hotRepository.get<HotReloadHostConstructor<IInputs, IOutputs>>(typeFullName);
            if (typeLatest === null) {
                consoleDebugEnabled && console.debug && console.debug("injectHotReload no type registered.");
                const hotControl = new HotControlWatch(instance);
                hotControl.bind();
            } else if (type === typeLatest) {
                if (hotRepository.get<number>(keyHotReloadInstance) === 1) {
                    consoleDebugEnabled && console.debug && console.debug("injectHotReload latest type used within previous type.");
                } else {
                    consoleDebugEnabled && console.debug && console.debug("injectHotReload latest type used.");
                    const hotControl = new HotControlWatch(instance);
                    hotControl.bind();
                }
            } else {
                consoleDebugEnabled && console.debug && console.debug("injectHotReload previous type used.");
                hotRepository.register(keyHotReloadInstance, 1, 1);
                try {
                    const nextInstance = new typeLatest();
                    hotRepository.register(keyHotReloadInstance, 1, 0)
                    const hotControl = new HotControlRebind<IInputs, IOutputs>(instance, nextInstance);
                    hotControl.bind();
                } catch (error) {
                    hotRepository.register(keyHotReloadInstance, 1, 0)
                }
            }
        } else {
            console.log && console.log("injectHotReload no type found ?");
        }
    } catch (err) {
        console.error("injectHotReload", err);
    }
}

//type Factory<T> = () => T;

function getHotRepository(): HotRepository {
    const root = window as any;
    return (root._HotRepository as HotRepository) || (root._HotRepository = new HotRepository());
}

class HotRepository {

    readonly hotControls: HotControl[];
    readonly _Versions: Map<string, number>;
    readonly _Items: Map<string, any>;
    constructor() {
        this.hotControls = [];
        this._Items = new Map();
        this._Versions = new Map();
    }


    register<T>(name: string, version: number, c: T): void {
        const key = `#HotReload#_${name}`;
        const oldVersion = (this._Versions.get(name) || 0);
        if (oldVersion <= version) {
            this._Versions.set(name, version);
            this._Items.set(name, c);
            consoleDebugEnabled && console.debug && console.debug(`HotRepository.register ${name} ${oldVersion} -> ${version}`);
        }
    }

    get<T>(name: string): T | null {
        return (this._Items.get(name) || null);
    }

    getWithVersion<T>(name: string): [T | null, number] {
        return [(this._Items.get(name) || null), (this._Versions.get(name) || 0)];
    }

    addHotControl(hotControl: HotControl) {
        this.hotControls.push(hotControl);
    }
    removeHotControl(hotControl: HotControl) {
        const idx = this.hotControls.indexOf(hotControl);
        if (0 <= idx) {
            this.hotControls.splice(idx, 1);
        }
    }
    foreachHotControl(action: ((hotControl: HotControl) => void)) {
        let idx = 0;
        while (idx < this.hotControls.length) {
            const hotControl = this.hotControls[idx];
            let remove = false;
            if (hotControl === null || hotControl === undefined || !hotControl.isValid()) {
                remove = true;
            } else {
                try {
                    action(hotControl);
                } catch (error) {
                    console.error && console.error(error)
                }
            }
            if (remove) {
                this.hotControls.splice(idx, 1);
            } else {
                idx++;
            }
        }
    }
}

/**
 * enablesHotReload
 */
export function enableHotReload2<IInputs, IOutputs>(
    name: string,
    version: number,
    factory: () => HotReloadHost<IInputs, IOutputs>, //ComponentFramework.StandardControl<IInputs, IOutputs>,
    url: string
): void {
    getHotRepository().register(name, version, factory);
    //http://127.0.0.1:8181/bundle.js
}

function logVisible(controlName: string, message?: any, ...optionalParams: any[]): void {
    if (console && console.debug) {
        console.debug(message, ...optionalParams);
    }
    /*
    if (this.container && this.logVisibleToContainer) {
        this.container.innerText = `${message} ${optionalParams}`;
    }
    */
}

function startWatch(url: string, typeFullName: string) {
    const hotRepository = getHotRepository();
    const keySocket = `${keySocketPrefix}${url}`
    var socket = hotRepository.getWithVersion<WebSocket>(keySocket)[0];
    if (socket === null) {
        const r = /(?<protocol>https?)(\:\/\/127\.0\.0\.1\:)(?<port>[0-9]+)/ig;
        const m = r.exec(url);
        const address = (m && m.groups)
            ? ((m.groups["protocol"] === "http") ? "ws" : "wss") + "://127.0.0.1:" + m.groups["port"] + "/ws"
            : "";
        if (address) {
            socket = new WebSocket(address);
            hotRepository.register(keySocket, 1, socket);
            socket.onmessage = (msg: MessageEvent) => {
                if (msg.data == 'reload') {
                    console.log && console.log('hot reload event received.');
                    hotRepository.foreachHotControl((hotControl) => { hotControl.notification({ event: "hotReload", typeFullName: typeFullName }) });
                    // if (container) {
                    //     container.style.border = "1px solid black";
                    // }
                    fetchBundle(url, typeFullName).then((jsData) => {
                        console.log && console.log('hot reload bundle fetched.');
                        if (jsData){
                            evaluateBundleHotReload(jsData, url);
                        }
                        hotRepository.foreachHotControl((hotControl) => { hotControl.notification({ event: "hotReloaded", typeFullName: typeFullName }) });
                    });
                }
                //window.location.reload();
            };
            socket.onclose = (ev: CloseEvent) => {
                hotRepository.register(keySocket, 1, null);
            };
            socket.onerror = (ev: Event) => {
                hotRepository.register(keySocket, 1, null);
                socket?.close();
            };
        }
    }
}

function getFromLocalStorage(typeFullName: string): string {
    try {
        const keyLocalStorage = `${keyLocalStoragePrefix}${typeFullName}`;
        const jsTxt = window.localStorage.getItem(keyLocalStorage);
        return jsTxt || "";
    } catch (error) {
        return "";
    }
}

function fetchBundle(url: string, typeFullName: string): Promise<string> {
    if (url) {
        return fetch(url, { mode: "cors", cache: "no-cache" })
            .then((response) => {
                if (response.status == 200) {
                    //this.logVisible(`Hot ${sideLoadUrl} download OK Status:${response.status}`);
                    return response.text();
                } else {
                    logVisible(typeFullName, `Hot ${url} download ?? Status:${response.status}`);
                    return "";
                }
            }, (reason) => {
                logVisible(typeFullName, `Hot ${url} Error: ${reason}`);
                return "";
            }).then(data => {
                if (data) {
                    //this.logVisible(`Hot ${sideLoadUrl} downloaded`);
                    const keyLocalStorage = `${keyLocalStoragePrefix}${typeFullName}`;
                    window.localStorage.setItem(keyLocalStorage, data);
                    return data;
                } else {
                    logVisible(typeFullName, `Hot ${url} downloaded no data`);
                    return "";
                }
            })
    } else {
        return Promise.resolve("");
    }
}

function evaluateBundleHotReload(jsData: string, url: string) {
    if (jsData) {
        const hotRepository = getHotRepository();
        if ((hotRepository.get(keyHotReloadBundle) || 0) === 0) {
            try {
                consoleDebugEnabled && console.debug && console.debug("hot reload evaluateBundleHotReload enter");
                hotRepository.register(keyHotReloadBundle, 1, 1);
                // the new bundle.js is evaluated now
                (new Function(jsData))();
                hotRepository.register(keyHotReloadBundle, 1, 0);
                consoleDebugEnabled && console.debug && console.debug("hot reload evaluateBundleHotReload exit");
            } catch (error) {
                hotRepository.register(keyHotReloadBundle, 1, 0);
                console.error("hot reload evaluateBundleHotReload error", url, error)
            }
        }
    }
    return null;
}

class HotControl<IInputs = any, IOutputs = any> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    info: {
        context?: ComponentFramework.Context<IInputs>;
        notifyOutputChanged?: () => void;
        state?: ComponentFramework.Dictionary;
        container?: HTMLDivElement;
    };

    constructor() {
        this.info = {};
        getHotRepository().addHotControl(this);
    }

    isValid() { return true; }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
        this.info = { context, notifyOutputChanged, state, container };
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.info.context = context;
    }

    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        this.info = {};
        getHotRepository().removeHotControl(this);
    }

    getTypeFullName(): string { return ""; }

    isHotReloadAllowed(): null | HotReloadState<IInputs, IOutputs> {
        return null;
    }

    notification(
        arg: { event: "hotReload"; typeFullName: string; }
            | { event: "hotReloaded"; typeFullName: string; }
    ) {
        const typeFullName = this.getTypeFullName();
        if (typeFullName) {
            consoleDebugEnabled && console.debug && console.debug("notification", arg.event, arg.typeFullName, typeFullName);
            if (this.info.container && arg.event === "hotReload" && arg.typeFullName === typeFullName) {
                this.info.container.style.border = "1px solid yellow";
                return;
            }
            if (this.info.container && arg.event === "hotReloaded" && arg.typeFullName === typeFullName) {
                this.info.container.style.border = "1px solid red";
                const reloadArgs = this.isHotReloadAllowed();
                if (reloadArgs !== null) {
                    this.hotReload(typeFullName, reloadArgs)
                }
                // this.info.container.getAttribute("data-id")
                return;
            }
        }
    }

    hotReload(typeFullName: string, reloadArgs: HotReloadState<IInputs, IOutputs>) {
        if (reloadArgs.instance) {
            const typeLatest = getHotRepository().get<HotReloadHostConstructor<IInputs, IOutputs>>(typeFullName);
            const type: HotReloadHostConstructor<IInputs, IOutputs> = (reloadArgs.instance as any).constructor;
            if (type && typeLatest && type !== typeLatest) {
                reloadArgs.instance.destroy();

                const nextInstance = new typeLatest();
                nextInstance.hotReload(reloadArgs.context, reloadArgs.notifyOutputChanged!, reloadArgs.state!, reloadArgs.container!);
                const hotControl = new HotControlRebind(reloadArgs.instance, nextInstance);
                hotControl.bind();
            }
        }
    }
}
class HotControlWatch<IInputs = any, IOutputs = any> extends HotControl<IInputs, IOutputs> {
    instance: HotReloadHost<IInputs, IOutputs> | null;

    //instanceInit: ((context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) => void) | null;

    constructor(instance: HotReloadHost<IInputs, IOutputs>) {
        super();
        this.instance = instance;
    }

    isValid() { return this.instance !== null; }


    getTypeFullName(): string {
        const type: HotReloadHostConstructor<IInputs, IOutputs> = (this.instance as any)?.constructor;
        if (type) {
            const typeFullName = `${type.namespace}.${type.name}`;
            return typeFullName;
        } else {
            return "";
        }
    }

    isHotReloadAllowed(): null | HotReloadState<IInputs, IOutputs> {
        if (typeof this.instance?.hotReload === "function" && this.info.container) {
            //var id = this.info.container.getAttribute("data-id");
            const { context, notifyOutputChanged, state, container } = this.info;
            if (context) {
                return { instance: this.instance, context, notifyOutputChanged, state, container };
            }

        }
        return null;
    }

    bind() {
        consoleDebugEnabled && console.debug && console.debug("hot reload HotControlWatch bind");
        if (this.instance) {

            const instanceInit = this.instance.init;
            this.instance.init = (context, notifyOutputChanged, state, container) => {
                this.info = { context, notifyOutputChanged, state, container };
                instanceInit.call(this.instance, context, notifyOutputChanged, state, container);
            };
            const instanceUpdateView = this.instance.updateView;
            this.instance.updateView = (context) => {
                this.info.context = context;
                instanceUpdateView.call(this.instance, context);
            };

            const instanceDestroy = this.instance.destroy;
            this.destroy = () => {
                if (this.instance) {
                    delete (this.instance as any).destroy;
                    delete (this.instance as any).init;
                    delete (this.instance as any).updateView;
                    instanceDestroy.call(this.instance);
                }
                this.instance = null;
                this.info = {};
                getHotRepository().removeHotControl(this);
            }
        }
    }

    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        this.instance = null;
        this.info = {};
        getHotRepository().removeHotControl(this);
    }
}
class HotControlRebind<IInputs = any, IOutputs = any> extends HotControl<IInputs, IOutputs> {
    nextInstance: HotReloadHost<IInputs, IOutputs> | null;
    previousInstance: HotReloadHost<IInputs, IOutputs> | null;
    info: {
        context?: ComponentFramework.Context<IInputs>;
        notifyOutputChanged?: () => void;
        state?: ComponentFramework.Dictionary;
        container?: HTMLDivElement;
    };

    constructor(previousInstance: HotReloadHost<IInputs, IOutputs>, nextInstance: HotReloadHost<IInputs, IOutputs>) {
        super();
        this.nextInstance = nextInstance;
        this.previousInstance = previousInstance;
    }

    isValid() { return this.nextInstance !== null; }

    getTypeFullName(): string {
        const type: HotReloadHostConstructor<IInputs, IOutputs> = (this.nextInstance as any)?.constructor;
        if (type) {
            const typeFullName = `${type.namespace}.${type.name}`;
            return typeFullName;
        } else {
            return "";
        }
    }

    isHotReloadAllowed(): null | HotReloadState<IInputs, IOutputs> {
        if (typeof this.nextInstance?.hotReload === "function" && this.info.container) {
            const { context, notifyOutputChanged, state, container } = this.info;
            if (context) {
                return { instance: this.nextInstance, context, notifyOutputChanged, state, container };
            }
        }
        return null;
    }

    bind() {
        consoleDebugEnabled && console.debug && console.debug("hot reload HotControlRebind bind");
        const previousInstance = this.previousInstance;
        if (previousInstance) {
            previousInstance.destroy = () => this.destroy();
            previousInstance.init = (context, notifyOutputChanged, state, container) => this.init(context, notifyOutputChanged, state, container);
            previousInstance.updateView = (context) => this.updateView(context);
            if (typeof this.nextInstance?.getOutputs === "function") {
                previousInstance.getOutputs = () => this.getOutputs();
            }

            this.destroy = () => {
                delete (previousInstance as any).destroy;
                delete (previousInstance as any).init;
                delete (previousInstance as any).updateView;
                delete (previousInstance as any).getOutputs;

                this.nextInstance?.destroy();

                this.nextInstance = null;
                this.info = {};
                getHotRepository().removeHotControl(this);
            };
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
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged?: () => void, state?: ComponentFramework.Dictionary, container?: HTMLDivElement) {
        this.info = { context, notifyOutputChanged, state, container };
        // container.innerText = "HotReload"
        this.nextInstance?.init(context, notifyOutputChanged, state, container);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.info.context = context;
        this.nextInstance?.updateView(context);
    }

    /** 
     * It is called by the framework prior to a control receiving new data. 
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        if (this.nextInstance && this.nextInstance.getOutputs) {
            return this.nextInstance.getOutputs();
        } else {
            return {} as IOutputs;
        }
    }

    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
        this.nextInstance?.destroy();
        this.nextInstance = null;
        this.info = {};
        getHotRepository().removeHotControl(this);
    }
}