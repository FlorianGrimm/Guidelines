import * as React from "react";
import { createUseStyles } from 'react-jss';
export type GuidelinesControlViewLineProps = {
    x1: number; x2: number;
    y1: number; y2: number;
    offsetX:number; offsetY:number; text:string;
};
const useStyles = createUseStyles({
    line: {
        stroke: "lightblue",
        strokeDasharray: "4 8"

    }
});
export default function GuidelinesControlViewLine(props: GuidelinesControlViewLineProps)  {
    const classes = useStyles();
    return (
    <>
        <text x={Math.max(props.x1 - props.offsetX, props.x1 + props.offsetX)} y={Math.max(props.y1 - props.offsetY, props.y1 + props.offsetY)}>{props.text}</text>
        <line x1={props.x1} y1={props.y1} x2={props.x2} y2={props.y2} className={classes.line} ></line>
        <text x={Math.min(props.x2 + props.offsetX, props.x2 - props.offsetX)} y={Math.max(props.y2 - props.offsetY, props.y2 + props.offsetY)}>{props.text}</text>
    </>);
}