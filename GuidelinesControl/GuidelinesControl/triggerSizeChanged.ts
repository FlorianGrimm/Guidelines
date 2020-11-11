import { ITriggerEvent, Unsubscripe } from "./triggerEvent";

export type ControlSize={
    width?: number | undefined,
    height?: number | undefined
};

export interface TriggerUpdateControlSize{
    triggerUpdateSize: ITriggerEvent<any,ControlSize>;
}
export type TriggerUpdateControlSizeProps = {
    getHost: (()=>TriggerUpdateControlSize);
}
export type TriggerUpdateControlSizeState = {
    controlSize: ControlSize;
}
export type TriggerUpdateControlSizeReactComponent<P extends TriggerUpdateControlSizeProps, S extends TriggerUpdateControlSizeState>
    = React.Component<P, S>
    & {
        controlSize: ControlSize;
    };

export function wireTriggerUpdateView<P extends TriggerUpdateControlSizeProps, S extends TriggerUpdateControlSizeState>(
    that: TriggerUpdateControlSizeReactComponent<P, S>,
    props: TriggerUpdateControlSizeProps
) : Unsubscripe {
    const triggerUpdateSize = (sender:any, controlSize:ControlSize) => {
        var changed = false;
        let { width, height } = that.state.controlSize;

        if (controlSize.width && (controlSize.width || 0) != (width || 0)) {
            width = controlSize.width;
            changed = true;
        }
        if (controlSize.height && (controlSize.height || 0) != (height || 0)) {
            height = controlSize.height;
            changed = true;
        }
        if (changed) {
            that.setState({ controlSize: { width: width, height: height } });
        }
    };
    return props.getHost().triggerUpdateSize.subscripe(triggerUpdateSize);
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

    const width = context.mode.allocatedWidth == -1 ? undefined :context.mode.allocatedWidth;
    const height = context.mode.allocatedHeight == -1 ? configuredHeight : context.mode.allocatedHeight;
    const controlSize: ControlSize = { width, height };
    return controlSize;
}