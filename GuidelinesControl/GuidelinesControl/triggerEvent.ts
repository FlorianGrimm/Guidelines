export type CallbackHandler<S = any, E = any> = (sender: S, evt: E) => void | boolean;
export type Unsubscripe = (() => Unsubscripe);
export type Resume = () => void;

export interface ITriggerEvent<S = any, E = any> {
    subscripe(cbh: CallbackHandler<S, E>): Unsubscripe;
    unsubscripe(cbh: CallbackHandler<S, E>): void;
    trigger(sender: S, evt: E): void;
    clear(): void;
    pause(): Resume;
    block(action: () => void): void;
}
function unsubscripeEmpty() { return unsubscripeEmpty; }
export class SingleTriggerEvent<S = any, E = any> implements ITriggerEvent<S, E> {
    cbh: CallbackHandler<S, E> | null;
    paused: number;
    lastEvent: { sender: S, evt: E } | null;

    constructor() {
        this.cbh = null;
        this.paused = 0;
        this.lastEvent = null;
    }

    subscripe(cbh: CallbackHandler<S, E>): Unsubscripe {
        this.cbh = cbh;
        return () => { this.unsubscripe(cbh); return unsubscripeEmpty; };
    }

    unsubscripe(cbh: CallbackHandler<S, E>): void {
        if (this.cbh === cbh) {
            this.cbh == null;
        }
    }

    trigger(sender: S, evt: E): void {
        const cbh = this.cbh;
        if (cbh) {
            if (this.paused == 0) {
                let result: void | boolean = false;
                try {
                    result = cbh(sender, evt);
                } catch (error) {
                    console.error && console.error(error);
                    throw error;
                }
                if (result === true) {
                    this.cbh = null;
                }
            } else {
                this.lastEvent = { sender: sender, evt: evt };
            }
        }
    }

    clear(): void {
        this.cbh = null;
    }

    pause(): Resume {
        this.paused++;
        return () => {
            this.paused--;
            if (this.paused == 0) {
                const lastEvent = this.lastEvent;
                if (lastEvent) {
                    this.lastEvent = null;
                    this.trigger(lastEvent.sender, lastEvent.evt);
                }
            }
        };
    }

    block(action: () => void): void {
        const resume = this.pause();
        try {
            action();
        } finally {
            resume();
        }
    }
}

export class MultiTriggerEvent<S = any, E = any> implements ITriggerEvent<S, E> {
    cbhs: CallbackHandler<S, E>[];
    paused: number;
    lastEvent: { sender: S, evt: E } | null;

    constructor() {
        this.cbhs = [];
        this.paused = 0;
        this.lastEvent = null;
    }

    subscripe(cbh: CallbackHandler<S, E>): Unsubscripe {
        if (cbh) {
            this.cbhs.push(cbh);
            return () => { this.unsubscripe(cbh); return unsubscripeEmpty; }
        } else {
            return unsubscripeEmpty;
        }
    }

    unsubscripe(cbh: CallbackHandler<S, E>): void {
        const idx = this.cbhs.indexOf(cbh);
        this.cbhs.splice(idx, 1);
    }

    trigger(sender: S, evt: E): void {
        const cbhs = this.cbhs;
        if (cbhs.length > 0) {
            if (this.paused == 0) {
                let idx = 0;
                while (idx < cbhs.length) {
                    const cbh = cbhs[idx];
                    let result: void | boolean = false;
                    try {
                        result = cbh(sender, evt);
                    } catch (error) {
                        console.error && console.error(error);
                        throw error;
                    }
                    if (result === true) {
                        cbhs.splice(idx, 1);
                    } else {
                        idx++;
                    }
                }
            } else {
                this.lastEvent = { sender: sender, evt: evt };
            }
        }
    }

    clear() {
        if (0 < this.cbhs.length) {
            this.cbhs.splice(0, this.cbhs.length)
        }
    }

    pause(): Resume {
        this.paused++;
        return () => {
            this.paused--;
            if (this.paused == 0) {
                const lastEvent = this.lastEvent;
                if (lastEvent) {
                    this.lastEvent = null;
                    this.trigger(lastEvent.sender, lastEvent.evt);
                }
            }
        };
    }
    
    block(action: () => void): void {
        const resume = this.pause();
        try {
            action();
        } finally {
            resume();
        }
    }
}