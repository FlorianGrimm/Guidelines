import ReactControl from "./ReactControl";


export default class ReactFieldControl<IInputs, IOutputs> extends ReactControl<IInputs, IOutputs> {
    constructor() {
        super();
    }

    init(
        context: ComponentFramework.Context<IInputs>, 
        notifyOutputChanged?: () => void, 
        state?: ComponentFramework.Dictionary, 
        container?: HTMLDivElement
        ): void {
        super.init(context,notifyOutputChanged,state,container);
    }
    updateView(
        context: ComponentFramework.Context<IInputs>
        ): void {
        super.updateView(context);
    }
    destroy(): void {
        super.destroy();
    }
}