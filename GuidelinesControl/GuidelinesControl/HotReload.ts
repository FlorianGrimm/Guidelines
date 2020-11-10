//import {IInputs, IOutputs} from "./generated/ManifestTypes";

import { type } from "os";

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
     * @param hotReloadState the state from getHotReloadState
     */
    hotReload(context: ComponentFramework.Context<IInputs>, notifyOutputChanged?: () => void, state?: ComponentFramework.Dictionary, container?: HTMLDivElement, hotReloadState?:any): void;

    /**
     * Called before the control willbe destroyed and hotReload-ed.
     */
    getHotReloadState?(): any;
}

export interface HotReloadHostConstructor<IInputs = any, IOutputs = any> {
    new(): HotReloadHost<IInputs, IOutputs>;
    namespace: string;
    name: string;
    version: number;
}


function logVisible(url: string, message?: any, ...optionalParams: any[]): void {
    consoleDebugEnabled && console.debug && console.debug(message, ...optionalParams);
    
    // TODO
    /*
    if (this.container && this.logVisibleToContainer) {
        this.container.innerText = `${message} ${optionalParams}`;
    }
    */
}
// this singleton exists on th global scope so it's visible in all loaded versions.
function getHotRepository(): HotRepository {
    const root = window as any;
    return (root._HotRepository as HotRepository) || (root._HotRepository = new HotRepository());
}

/*
type HotReloadState<IInputs, IOutputs> = {
    instance: HotReloadHost<IInputs, IOutputs>,
    context: ComponentFramework.Context<IInputs>;
    notifyOutputChanged?: () => void;
    state?: ComponentFramework.Dictionary,
    container?: HTMLDivElement
};
*/
const keyLocalStoragePrefix = "HotReload";

type HotReloadHostConstructorDictionary = { [name: string]: HotReloadHostConstructor };
export function enableHotReloadForTypes<Types extends HotReloadHostConstructorDictionary>(
    url: string,
    types: Types,
    moduleExports: Types
) {
    getHotRepository().enableHotReloadForTypes(url, types, moduleExports);
}


function getOrAddByKey<K, V>(
    map: Map<K, V>,
    key: K,
    factory: ((key: K) => V),
    update?: ((key: K, value: V) => void)
): [boolean, V] {
    if (map.has(key)) {
        const result = map.get(key);
        if (result !== undefined) {
            if (update){
                update(key, result);
            }
            return [false, result];
        }
    }
    {
        const result = factory(key);
        map.set(key, result);
        return [true, result];
    }
}
class HotRepositoryForUrl {
    reloadGuard: number;
    readonly url: string;
    readonly typesByExportName: Map<string, HotRepositoryForType>;
    socket: WebSocket | null;

    constructor(url: string) {
        this.reloadGuard = 0;
        this.typesByExportName = new Map();
        this.url = url;
        this.socket = null;
    }

    registerType<IInputs, IOutputs>(
        exportName: string,
        type: HotReloadHostConstructor<IInputs, IOutputs>
    ): [boolean, HotRepositoryForType<IInputs, IOutputs>] {
        const result = getOrAddByKey(
            this.typesByExportName,
            exportName,
            () => new HotRepositoryForType<IInputs, IOutputs>(this, exportName, type),
            (en, instance) => instance.update(type)
        );
        return result;
    }

    enableHotReloadForTypes<Types extends HotReloadHostConstructorDictionary>(
        types: Types,
        moduleExports: Types
    ) {
        if (this.reloadGuard === 0) {
            consoleDebugEnabled && console.debug && console.debug("enableHotReload within normal load.", this.url, Object.keys(types));
            if (this.url) {
                try {
                    const jsTxt = this.getFromLocalStorage();
                    this.evaluateBundleHotReload(jsTxt);
                } catch (error) {
                }
                this.fetchBundle()
                this.startWatch();
            }
        }
        for (const exportName in types) {
            if (Object.prototype.hasOwnProperty.call(types, exportName)) {
                const type = types[exportName];
                if (typeof type == "function" && type.prototype) {
                    const hotRepositoryForType = this.getByExportName(exportName);
                    if (hotRepositoryForType) {
                        hotRepositoryForType.setModuleExport(moduleExports, type);
                        continue;
                    }
                }
            }
        }
    }

    getFromLocalStorage(): string {
        try {
            const keyLocalStorage = `${keyLocalStoragePrefix}${this.url}`;
            const jsTxt = window.localStorage.getItem(keyLocalStorage);
            return jsTxt || "";
        } catch (error) {
            return "";
        }
    }

    guardReloadBundle(guard: number, block: number, action: () => void): boolean {
        if (this.reloadGuard === guard) {
            this.reloadGuard = block;
            try {
                action();
            } finally {
                this.reloadGuard = guard;
            }
            return true;
        } else {
            return false;
        }
    }

    getByExportName(name: string) {
        return this.typesByExportName.get(name);
    }

    startWatch() {
        let socket = this.socket;
        if (socket === null) {
            const r = /(?<protocol>https?\:)(?<url>\/\/[^:/]+)(?<port>(\:[0-9]+)?)/ig;
            //const r = /(?<protocol>https?\:)(?<url>\/\/127\.0\.0\.1)(?<port>(\:[0-9]+)?)/ig;
            const m = r.exec(this.url);
            const address = (m && m.groups)
                ? ((m.groups["protocol"] === "http:") ? "ws:" : "wss:") + m.groups["url"] + m.groups["port"] + "/ws"
                : "";
            if (address) {
                consoleDebugEnabled && console.debug && console.debug("start socket", address)
                socket = this.socket = new WebSocket(address);
                socket.onmessage = (msg: MessageEvent) => {
                    if (msg.data == 'reload') {
                        this.fetchAndApply();
                    }
                };
                socket.onclose = (ev: CloseEvent) => {
                    this.socket = null;
                };
                socket.onerror = (ev: Event) => {
                    this.socket = null;
                    socket?.close();
                };
            }
        }
    }
    fetchAndApply(){
        getHotRepository().foreachHotControl((hotControl) => { hotControl.notification({ event: "hotReload", url: this.url }) });
        this.fetchBundle().then((jsData) => {
            console.log && console.log('hot reload bundle fetched.');
            if (this.evaluateBundleHotReload(jsData)) {
                getHotRepository().foreachHotControl((hotControl) => { hotControl.notification({ event: "hotReloaded", url: this.url }) });
            }
        });
    }
    fetchBundle(): Promise<string> {
        return fetch(this.url, { mode: "cors", cache: "no-cache" })
            .then((response) => {
                if (response.status == 200) {
                    //this.logVisible(`Hot ${sideLoadUrl} download OK Status:${response.status}`);
                    return response.text();
                } else {
                    logVisible(this.url, `Hot ${this.url} download ?? Status:${response.status}`);
                    return "";
                }
            }, (reason) => {
                logVisible(this.url, `Hot ${this.url} Error: ${reason}`);
                return "";
            }).then(data => {
                if (data) {
                    //this.logVisible(`Hot ${sideLoadUrl} downloaded`);
                    const keyLocalStorage = `${keyLocalStoragePrefix}${this.url}`;
                    let oldData = "";
                    try {
                        oldData = window.localStorage.getItem(keyLocalStorage)||"";
                    } catch (error) {
                    }
                    if (oldData == data){
                        return "";
                    } else {
                        window.localStorage.setItem(keyLocalStorage, data);
                        return data;
                    }
                } else {
                    logVisible(this.url, `Hot ${this.url} downloaded no data`);
                    return "";
                }
            });
    }
    evaluateBundleHotReload(jsData: string) {
        if (jsData) {
            this.guardReloadBundle(0, 1, () => {
                try {
                    consoleDebugEnabled && console.debug && console.debug("hot reload evaluateBundleHotReload enter");
                    // the new bundle.js is evaluated now
                    (new Function(jsData))();
                    consoleDebugEnabled && console.debug && console.debug("hot reload evaluateBundleHotReload exit");
                } catch (error) {
                    console.error("hot reload evaluateBundleHotReload error", this.url, error);
                    return;
                }
            });
            return true;
        } else {
            return false;
        }
    }

}
class HotRepositoryForType<IInputs = any, IOutputs = any> {
    hotRepositoryForUrl: HotRepositoryForUrl;
    exportName: string;
    type: HotReloadHostConstructor<IInputs, IOutputs>;
    wrappedType: HotReloadHostConstructor<IInputs, IOutputs>;
    name: string;
    namespace: string;
    version: number;

    constructor(hotRepositoryForUrl: HotRepositoryForUrl, exportName: string, type: HotReloadHostConstructor<IInputs, IOutputs>) {
        this.hotRepositoryForUrl = hotRepositoryForUrl;
        this.exportName = exportName;
        this.type = type;
        this.name = type.name;
        this.namespace = type.namespace || "";
        this.version = type.version || 0;
        this.wrappedType = this.generateHotReloadHostType(type);
    }

    update(nextType: HotReloadHostConstructor<IInputs, IOutputs>): HotReloadHostConstructor<IInputs, IOutputs> {
        if ((this.hotRepositoryForUrl.guardReloadBundle)
            || (this.type && nextType && this.type.version <= nextType.version)) {
            this.type = nextType;
            return nextType;
        } else {
            return this.type;
        }
    }

    generateHotReloadHostType<IInputs, IOutputs>(
        type: HotReloadHostConstructor<IInputs, IOutputs>
    ) {
        const hotRepositoryForType: HotRepositoryForType = this;
        const result = function () {
            const resultType = (hotRepositoryForType.type) || type;
            const that = new (resultType as any)();
            const hotControl = new HotControl(that, hotRepositoryForType);
            getHotRepository().addHotControl(hotControl);
            return hotControl;
        } as any;
        Object.defineProperty(result, "name", { value: type.name });
        Object.defineProperty(result, "namespace", { value: type.namespace });
        Object.defineProperty(result, "version", { value: type.version });
        function __(this: object) { this.constructor = result; }
        __.prototype = type.prototype;
        result.prototype = new (__ as any)();

        return result as HotReloadHostConstructor<IInputs, IOutputs>;
    }

    setModuleExport<IInputs, IOutputs>(
        moduleExports: object,
        type: HotReloadHostConstructor<IInputs, IOutputs>
    ) {
        //const c = this.generateHotReloadHostType(type);
        const hotRepositoryForType: HotRepositoryForType = this;
        Object.defineProperty(moduleExports, this.exportName, {
            enumerable: true,
            get: function get() {
                return hotRepositoryForType.wrappedType;
            }
        });
    }
}
class HotRepository {
    readonly hotControls: HotControl[];
    readonly typesByUrl: Map<string, HotRepositoryForUrl>;
    constructor() {
        this.hotControls = [];
        this.typesByUrl = new Map();
    }

    registerTypes<Types extends HotReloadHostConstructorDictionary>(url: string, types: Types): HotRepositoryForUrl {
        const [created, result] = getOrAddByKey(
            this.typesByUrl,
            url,
            (u) => new HotRepositoryForUrl(url));
        for (const name in types) {
            if (Object.prototype.hasOwnProperty.call(types, name)) {
                const type = types[name];
                if (typeof type == "function" && type.prototype) {
                    const activeType = result.registerType(name, type);
                }
            }
        }
        return result;
    }

    enableHotReloadForTypes<Types extends HotReloadHostConstructorDictionary>(
        url: string,
        types: Types,
        moduleExports: Types
    ) {
        try {
            const hotRepositoryForUrl = this.registerTypes(url, types);
            hotRepositoryForUrl.enableHotReloadForTypes(types, moduleExports);
        } catch (err) {
            console.error && console.error("enableHotReload", err);
        }
    }

    getTypesByUrl(url: string): HotRepositoryForUrl | undefined {
        return this.typesByUrl.get(url);
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

class HotControl<IInputs = any, IOutputs = any> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    info: {
        context?: ComponentFramework.Context<IInputs>;
        notifyOutputChanged?: () => void;
        state?: ComponentFramework.Dictionary;
        container?: HTMLDivElement;
    };
    instance: HotReloadHost<IInputs, IOutputs> | null;
    hotRepositoryForType: HotRepositoryForType;
    getOutputs?: () => IOutputs;

    constructor(instance: HotReloadHost<IInputs, IOutputs>, hotRepositoryForType: HotRepositoryForType) {
        this.info = {};
        this.instance = instance;
        this.hotRepositoryForType = hotRepositoryForType;

        if (typeof instance?.getOutputs === "function") {
            this.getOutputs = () => {
                return this.instance!.getOutputs!();
            }
        }
    }

    isValid() { return this.instance !== null; }

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
        this.instance?.init(context, notifyOutputChanged, state, container);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.info.context = context;
        this.instance?.updateView(context);
    }

    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        this.instance?.destroy();
        this.instance = null;
        this.info = {};
        getHotRepository().removeHotControl(this);
    }

    notification(
        arg: { event: "hotReload"; url: string; }
            | { event: "hotReloaded"; url: string; }
    ) {
        const url = this.hotRepositoryForType.hotRepositoryForUrl.url;
        const container = this.info.container;
        consoleDebugEnabled && console.debug && console.debug("notification", arg.event, arg.url, url);
        if (container && arg.event === "hotReload" && arg.url === url) {
            container.style.border = "1px solid yellow";
            return;
        }
        if (container && arg.event === "hotReloaded" && arg.url === url) {
            container.style.border = "1px solid red";
            try {
                const instance = this.instance;
                if (instance && (typeof instance.hotReload === "function")) {
                    const typeLatest = this.hotRepositoryForType.type;
                    const type: HotReloadHostConstructor<IInputs, IOutputs> = (this.instance as any).constructor;
                    const { context, notifyOutputChanged, state } = this.info;
                    if (type && typeLatest && type !== typeLatest && context) {
                        const hotReloadState=instance.getHotReloadState && instance.getHotReloadState();
                        this.destroy();

                        const nextInstance = new typeLatest();
                        const hotControl = new HotControl(nextInstance, this.hotRepositoryForType);
                        getHotRepository().addHotControl(hotControl);
                        nextInstance.hotReload(context, notifyOutputChanged, state, container, hotReloadState);
                    }
                    container.style.border = "";
                }
            } catch (error) {
                console.error && console.error("hot reload failed", error);
            }
        }
    }
}