export class DiagnosticsService {
    static ServiceName = "DiagnosticsService";
    emmitDebug: boolean;
    
    constructor(emmitDebug?: boolean) {
        this.emmitDebug = emmitDebug ?? false;
    }

    debug(message: string | any[] | (() => string | any[])): void {
        if (this.emmitDebug) {
            if (typeof message === "function") {
                message = message();
            }
            if (typeof message === "string") {
                console.debug(message);
            } else {
                console.debug(...message);
            }
        }
    }

    error(message: string | any[] | (() => string | any[])): void {
        if (typeof message === "function") {
            message = message();
        }
        if (typeof message === "string") {
            console.debug(message);
        } else {
            console.debug(...message);
        }
    }

    showError(container: HTMLDivElement|null, message: string | any[] | (() => string | any[])): void {
        if (typeof message === "function") {
            message = message();
        }
        if (typeof message === "string") {
            console.debug(message);            
        } else {
            console.debug(...message);
            if (typeof message.map === "function"){
                message = " ".concat(...(message.map((i)=> (i == undefined) ? "undefined" : (i == null) ? "null" : (typeof i?.toString === "function") && i.toString())));
            }
        }
        if (container) {
            container.innerText = `${message}`;
        }
    }
}