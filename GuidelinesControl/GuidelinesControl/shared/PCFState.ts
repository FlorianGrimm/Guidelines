export type PCFState<IInputs, IOutputs>={
	notifyOutputChanged: (() => void) | null;
	state: ComponentFramework.Dictionary | null;
	container: HTMLDivElement | null;
    context: ComponentFramework.Context<IInputs> | null;
//    outputs:IOutputs;
}
export function emptyPCFState<IInputs, IOutputs>():PCFState<IInputs, IOutputs>{
    return {
        notifyOutputChanged:null,
        state:null,
        container:null,
        context:null
    };
}
export function initPCFState<IInputs, IOutputs>(pcfState:PCFState<IInputs, IOutputs>,notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement, ) {
    pcfState.notifyOutputChanged = notifyOutputChanged || null;
    pcfState.state = state || null;
    pcfState.container=container;
}