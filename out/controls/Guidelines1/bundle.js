var pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./Guidelines1/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../shared/HotRepository.ts":
/*!**********************************!*\
  !*** ../shared/HotRepository.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.HotRepository = exports.getHotRepository = void 0;\n\nfunction getHotRepository() {\n  var root = window;\n  return root._HotRepository || (root._HotRepository = new HotRepository());\n}\n\nexports.getHotRepository = getHotRepository;\n\nvar HotRepository =\n/** @class */\nfunction () {\n  function HotRepository() {\n    this._Items = {};\n    this._Versions = {};\n  }\n\n  HotRepository.prototype.register = function (name, version, c) {\n    if ((this._Versions[name] || 0) <= version) {\n      this._Versions[name] = version;\n      this._Items[name] = c;\n    }\n  };\n\n  HotRepository.prototype.get = function (name) {\n    return this._Items[name] || null;\n  };\n\n  return HotRepository;\n}();\n\nexports.HotRepository = HotRepository;\n\n//# sourceURL=webpack://pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad/../shared/HotRepository.ts?");

/***/ }),

/***/ "../shared/constants.ts":
/*!******************************!*\
  !*** ../shared/constants.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.ControlName = void 0;\nexports.ControlName = \"pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad.Guidelines\";\n\n//# sourceURL=webpack://pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad/../shared/constants.ts?");

/***/ }),

/***/ "./Guidelines1/index.ts":
/*!******************************!*\
  !*** ./Guidelines1/index.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.Guidelines1 = void 0;\n\nvar HotRepository_1 = __webpack_require__(/*! ../../shared/HotRepository */ \"../shared/HotRepository.ts\");\n\nvar constants_1 = __webpack_require__(/*! ../../shared/constants */ \"../shared/constants.ts\");\n\n(function () {\n  console && console.log && console.log(\"register\", constants_1.ControlName);\n  HotRepository_1.getHotRepository().register(constants_1.ControlName, 1, function () {\n    return new Guidelines1();\n  });\n})();\n\nvar Guidelines1 =\n/** @class */\nfunction () {\n  /**\r\n   * Empty constructor.\r\n   */\n  function Guidelines1() {}\n  /**\r\n   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.\r\n   * Data-set values are not initialized here, use updateView.\r\n   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.\r\n   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.\r\n   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.\r\n   * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.\r\n   */\n\n\n  Guidelines1.prototype.init = function (context, notifyOutputChanged, state, container) {\n    // Add control initialization code\n    container.innerText = \"1 1\";\n  };\n  /**\r\n   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.\r\n   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions\r\n   */\n\n\n  Guidelines1.prototype.updateView = function (context) {// Add code to update control view\n  };\n  /**\r\n   * It is called by the framework prior to a control receiving new data.\r\n   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”\r\n   */\n\n\n  Guidelines1.prototype.getOutputs = function () {\n    return {};\n  };\n  /**\r\n   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.\r\n   * i.e. cancelling any pending remote calls, removing listeners, etc.\r\n   */\n\n\n  Guidelines1.prototype.destroy = function () {// Add code to cleanup control if necessary\n  };\n\n  return Guidelines1;\n}();\n\nexports.Guidelines1 = Guidelines1;\n\n//# sourceURL=webpack://pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad/./Guidelines1/index.ts?");

/***/ })

/******/ });
if (window.ComponentFramework && window.ComponentFramework.registerControl) {
	ComponentFramework.registerControl('FlorianGrimm.Guidelines1', pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad.Guidelines1);
} else {
	var FlorianGrimm = FlorianGrimm || {};
	FlorianGrimm.Guidelines1 = pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad.Guidelines1;
	pcf_tools_652ac3f36e1e4bca82eb3c1dc44e6fad = undefined;
}