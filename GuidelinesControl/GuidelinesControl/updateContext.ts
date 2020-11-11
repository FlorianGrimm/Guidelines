
export type UpdateContextCaller = "init" | "updateView";
export type UpdateContextNextSteps = {
    updateView: boolean;
    layoutChanged: boolean;
    parametersChanged: boolean;
    entityIdChanged: boolean;
    datasetChanged: string[]
};
export type UpdateContextUpdatedProperties = { [updatedProperty: string]: boolean; };
