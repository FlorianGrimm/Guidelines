import { ITriggerEvent, Unsubscripe } from "./triggerEvent";

export type ControlSize = {
    width?: number | undefined,
    height?: number | undefined
};

export interface TriggerUpdateControlSize {
    triggerUpdateSize: ITriggerEvent<ControlSize>;
}
export type TriggerUpdateControlSizeProps = {
    getTriggers: (() => TriggerUpdateControlSize);
}
export type TriggerUpdateControlSizeState = {
    controlSize: ControlSize;
}
export type TriggerUpdateControlSizeReactComponent<P extends TriggerUpdateControlSizeProps, S extends TriggerUpdateControlSizeState>
    = React.Component<P, S>
    & {
        controlSize: ControlSize;
    };
export function calcControlSize(controlSizeCurrent: ControlSize, controlSizeNew: ControlSize): [boolean, ControlSize] {
    var isEqual = true;
    /*
    for (const key in controlSizeNew) {
        if (Object.prototype.hasOwnProperty.call(controlSizeNew, key)) {
            if (key === "width"){continue   ;}
            if (key === "height"){continue   ;}
            debugger;
            throw new   Error(`${key} unexpected`);
            
        }
    }
    */
    let { width: widthCurrent, height: heightCurrent } = controlSizeCurrent;
    let { width: widthNew, height: heightNew } = controlSizeNew;

    if (widthNew && (widthNew || 0) != (widthCurrent || 0)) {
        widthCurrent = widthNew;
        isEqual = false;
    }
    if (heightNew && (heightNew || 0) != (heightCurrent || 0)) {
        heightCurrent = heightNew;
        isEqual = false;
    }
    const result = { width: widthCurrent, height: heightCurrent };
    //logger.debug("calcControlSize", controlSizeCurrent,controlSizeNew,result);
    return [isEqual, result];
}
export function wireTriggerUpdateSize<P extends TriggerUpdateControlSizeProps, S extends TriggerUpdateControlSizeState>(
    that: TriggerUpdateControlSizeReactComponent<P, S>,
    props: TriggerUpdateControlSizeProps
): Unsubscripe {
    const triggerUpdateSize = (sender: any, controlSize: ControlSize) => {
        const r = calcControlSize(that.state.controlSize, controlSize);
        if (!r[0]) {
            that.setState({ controlSize: r[1] });
        }
    };
    return props.getTriggers().triggerUpdateSize.subscripe(triggerUpdateSize);
}

export function getControlSize<IInputs = any>(context: ComponentFramework.Context<IInputs>): ControlSize {
    let configuredHeight: number | undefined = undefined;

    // If there is a parameter called height in the manifest, pass it to the the control
    const parametersRecord = (context.parameters as unknown) as Record<
        string,
        ComponentFramework.PropertyTypes.Property
    >;
    if (parametersRecord["height"] && parametersRecord["height"].raw) {
        configuredHeight = parametersRecord["height"].raw;
    }

    const width = context.mode.allocatedWidth == -1 ? undefined : context.mode.allocatedWidth;
    const height = context.mode.allocatedHeight == -1 ? configuredHeight : context.mode.allocatedHeight;
    const controlSize: ControlSize = { width, height };
    return controlSize;
}