import * as controls from './controls';
 
import { enableHotReloadForTypes } from './shared/HotReload';

// development enable HotReload
//"http://127.0.0.1:8181/bundle.js", 
/*
    window.localStorage.setItem("HotReload#GuidelinesControl#enabled", "On");
    window.localStorage.setItem("HotReload#GuidelinesControl#Url", "http://127.0.0.1:8181/bundle.js");

    window.localStorage.setItem("HotReload#GuidelinesControl#enabled", "Off");
    window.localStorage.setItem("HotReload#GuidelinesControl#Url", "http://127.0.0.1:8181/bundle.js");

*/
enableHotReloadForTypes(
    "GuidelinesControl",
    controls, 
    exports);

// Production
/*
Object.defineProperty(exports, "__esModule", { value: true });
for (const key in controls) {
    Object.defineProperty(exports, key, { enumerable: true, value: (controls as any)[key] });    
}
*/