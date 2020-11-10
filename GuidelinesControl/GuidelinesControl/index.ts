import * as controls from './controls';
import { enableHotReloadForTypes } from './HotReload';

// development enable HotReload
/*  */
const  featureAllowHotReload=true;
if (featureAllowHotReload){
	enableHotReloadForTypes("http://127.0.0.1:8181/bundle.js", controls, exports)
} else {
	exports = controls;
}
/* */

// Production
/*
exports = controls;
*/