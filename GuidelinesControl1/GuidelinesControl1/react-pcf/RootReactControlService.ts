import { EventDispatcher } from 'ste-events';
import { ControlSize } from './ControlSize';
import ReactControl from './ReactControl';

export class RootReactControlService<IInputs = any, IOutputs = any> {
    static ServiceName = "RootReactControlService";
    public onControlSizeChanged = new EventDispatcher<any, ControlSize>();
    public onUpdateView = new EventDispatcher<any, string | undefined>();
    public reactControl: ReactControl<IInputs, IOutputs>;

    constructor(reactControl: ReactControl<IInputs, IOutputs>) {
        this.reactControl = reactControl;
    }
}
