import { GuidelinesControl, featureAllowHotReload } from './GuidelinesControl';

// development enable HotReload
/* */
import { enableHotReload } from './HotControl';
const control = (featureAllowHotReload)
	? enableHotReload(GuidelinesControl, "http://127.0.0.1:8181/bundle.js")
	: GuidelinesControl
	;
export { control as GuidelinesControl };
/* */

// Production
/*
export { GuidelinesControl};
*/