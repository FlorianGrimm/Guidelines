import logger from "./logger";

import { TriggerProperty } from "./triggerEvent";

export type UpdateContextCaller = "init" | "updateView" | "hotReload";
export type UpdateContextStateIncoming = {
    isInit: boolean;
    isUpdateView: boolean;
    isReload: boolean;
    noUpdatedProperties: boolean;
    dctUpdatedProperties: UpdateContextUpdatedProperties;
};
export type UpdateContextStateDerived = UpdateContextStateIncoming & {
    updateView: boolean;
    layoutChanged: boolean;
    parametersChanged: boolean;
    entityIdChanged: boolean;
    datasetChanged: string[]
};
export type UpdateContextUpdatedProperties = { [updatedProperty: string]: boolean; };

export function updateContextInit<IInputs, T>(
    context: ComponentFramework.Context<IInputs>,
    mode: UpdateContextCaller,
    state: (T & Partial<UpdateContextStateIncoming>)): UpdateContextStateDerived & T {
    const isInit = mode === "init";
    const isUpdateView = mode === "updateView";
    const isReload = mode === "hotReload";

    const updatedProperties: string[] = [];
    updatedProperties.push(...context.updatedProperties);
    const noUpdatedProperties = (!updatedProperties || updatedProperties.length === 0);

    state.isInit = isInit;
    state.isUpdateView = isUpdateView;
    state.isReload = isReload;
    state.noUpdatedProperties = noUpdatedProperties;
    const stateNSP: Partial<UpdateContextStateDerived> = state;

    stateNSP.updateView = false;
    stateNSP.layoutChanged = false;
    stateNSP.parametersChanged = false;
    stateNSP.entityIdChanged = false;
    stateNSP.datasetChanged = [];

    const dctUpdatedProperties: UpdateContextUpdatedProperties = {};
    updatedProperties.forEach((p) => { dctUpdatedProperties[p] = true; });
    stateNSP.dctUpdatedProperties = dctUpdatedProperties;

    const nextSteps = state as UpdateContextStateDerived & T;
    if (dctUpdatedProperties["layout"] || isInit || isReload) {
        dctUpdatedProperties["layout"] = false;
        nextSteps.layoutChanged = true;
    }
    if (dctUpdatedProperties["viewportSizeMode"]) {
        dctUpdatedProperties["viewportSizeMode"] = false;
        nextSteps.layoutChanged = true;
    }
    if (dctUpdatedProperties["parameters"] || isInit || isReload) {
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

    return nextSteps;
}

export function transferParameters<
    N extends Extract<keyof C, keyof S>,
    C extends { [Name in keyof C extends keyof S?string:never ]: ComponentFramework.PropertyTypes.Property },
    S extends { [Name in keyof S extends keyof C?string:never]: TriggerProperty<any> }
/*
    N extends ((keyof C) & (keyof S)),
    
    C extends {[name in keyof C]: (C[name] extends ComponentFramework.PropertyTypes.Property ? C[name]:never)},
    S extends {[name in keyof S]: (S[name] extends TriggerProperty<any> ? S[name] : never)}
*/
>(
    names: N[] | null,
    contextParameters: C,
    stateProperties: S,
    setAction?:(contextParameter :ComponentFramework.PropertyTypes.Property, stateProperty: TriggerProperty<any> )=>void
): void {
    if (names === null) {
        names = [];
        for (const name in stateProperties) {
            if (typeof name === "string") {
                if (Object.prototype.hasOwnProperty.call(stateProperties, name)) {
                    names.push(name as unknown as N);
                }
            }
        }
    }

    logger.log("transferParameters names", names);
    
    for (let idx=0;idx<names.length;idx++){
        let name = names[idx];
        const contextParameter = contextParameters[name];// as ComponentFramework.PropertyTypes.Property;
        const stateProperty = stateProperties[name];// as TriggerProperty<any>;
        if (contextParameter && stateProperty){
            if (setAction){
                setAction(contextParameter, stateProperty);
            } else {
                logger.log("transferParameters", name, stateProperty.value, contextParameter.raw )
                stateProperty.value = contextParameter.raw;
            }
        }
    }
}