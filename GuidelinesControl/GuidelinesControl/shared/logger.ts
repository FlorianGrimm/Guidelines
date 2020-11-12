class Logger {
    enableDebug: boolean;
    enableLog: boolean;
    enableError: boolean;
    constructor(enableDebug: boolean, enableLog: boolean, enableError: boolean) {
        this.enableDebug = enableDebug;
        this.enableLog = enableLog;
        this.enableError = enableError;
    }

    debug(message?: any, ...optionalParams: any[]): void {
        this.enableDebug && console.debug && console.debug(message, ...optionalParams);
    }

    log(message?: any, ...optionalParams: any[]): void {
        this.enableLog && console.log && console.log(message, ...optionalParams);
    }

    error(message?: any, ...optionalParams: any[]): void {
        this.enableLog && console.error && console.error(message, ...optionalParams);
    }
}
const enableDefault = false;
let cfg={enableDebug:enableDefault, enableLog:enableDefault, enableError:enableDefault};
try {
    const loggerJson = window.localStorage.getItem("GuidelinesControl#Logger");
    if (loggerJson && typeof loggerJson === "string") {
        const loggerCfg = JSON.parse(loggerJson);
        if (typeof loggerCfg === "object"){
            if (loggerCfg.enableDebug){ cfg.enableDebug=true;}
            if (loggerCfg.enableLog){ cfg.enableLog=true;}
            if (loggerCfg.enableError){ cfg.enableError=true;}
        }
    }
} catch (error) {
}
/*
window.localStorage.setItem('GuidelinesControl#Logger', '{enableDebug:true, enableLog:true, enableError:true}')
*/
const logger = new Logger(cfg.enableDebug, cfg.enableLog, cfg.enableError);
export default logger;