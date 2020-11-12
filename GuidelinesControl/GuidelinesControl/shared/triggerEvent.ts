import logger from "./logger";

export type CallbackHandler<E = any> = (evt: E, sender: any) => void | boolean;
export type Unsubscripe = (() => Unsubscripe);
export type Resume = () => void;

export interface ITriggerEvent<E = any> {
    subscripe(cbh: CallbackHandler<E>): Unsubscripe;
    unsubscripe(cbh: CallbackHandler<E>): void;
    trigger(sender: any, evt: E): void;
    clear(): void;
    pause(): Resume;
    block(action: () => void): void;
}
function unsubscripeEmpty() { return unsubscripeEmpty; }

export class Unsubscripes {
    items: (Unsubscripe | ITriggerEvent)[];
    /**
     *
     */
    constructor() {
        this.items = [];
    }
    push(unsubscripe: (Unsubscripe | ITriggerEvent)): void {
        this.items.push(unsubscripe)
    }
    set addTo(unsubscripe: (Unsubscripe | ITriggerEvent)) {
        this.items.push(unsubscripe)
    }
    unsubscripe() {
        this.items.splice(0, this.items.length).forEach((u) => {
            if (typeof u === "function") {
                u();
            } else if (typeof u === "object" && typeof u.clear === "function") {
                u.clear();
            }
        });
    }
}

export class SingleTriggerEvent<E = any> implements ITriggerEvent<E> {
    cbh: CallbackHandler<E> | null;
    paused: number;
    lastEvent: { sender: any, evt: E } | null;

    constructor() {
        this.cbh = null;
        this.paused = 0;
        this.lastEvent = null;
    }

    subscripe(cbh: CallbackHandler<E>): Unsubscripe {
        this.cbh = cbh;
        return () => { this.unsubscripe(cbh); return unsubscripeEmpty; };
    }

    unsubscripe(cbh: CallbackHandler<E>): void {
        if (this.cbh === cbh) {
            this.cbh == null;
        }
    }

    trigger(sender: any, evt: E): void {
        const cbh = this.cbh;
        if (cbh) {
            if (this.paused == 0) {
                let result: void | boolean = false;
                try {
                    result = cbh(evt, sender);
                } catch (error) {
                    logger.error(error);
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

export class MultiTriggerEvent<E = any> implements ITriggerEvent<E> {
    cbhs: CallbackHandler<E>[];
    paused: number;
    lastEvent: { sender: any, evt: E } | null;
    name: string;

    constructor(name: string) {
        this.name = name;
        this.cbhs = [];
        this.paused = 0;
        this.lastEvent = null;
    }

    subscripe(cbh: CallbackHandler<E>): Unsubscripe {
        if (cbh) {
            this.cbhs.push(cbh);
            return () => { this.unsubscripe(cbh); return unsubscripeEmpty; }
        } else {
            return unsubscripeEmpty;
        }
    }

    unsubscripe(cbh: CallbackHandler<E>): void {
        const idx = this.cbhs.indexOf(cbh);
        this.cbhs.splice(idx, 1);
    }

    trigger(sender: any, evt: E): void {
        const cbhs = this.cbhs;
        if (cbhs.length > 0) {
            if (this.paused == 0) {
                logger.log("MultiTriggerEvent", this.name);
                let idx = 0;
                while (idx < cbhs.length) {
                    const cbh = cbhs[idx];
                    let result: void | boolean = false;
                    try {
                        result = cbh(evt, sender);
                    } catch (error) {
                        logger.error(error);
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


export class TriggerProperty<T = any> implements ITriggerEvent<T> {
    cbhs: CallbackHandler<T>[];
    hasChanged: boolean;
    isTriggerPending: boolean;
    isPaused: number;
    internalValue: T;
    isEqual: ((a: T, b: T) => (boolean | [boolean, T])) | null;
    name: string;

    constructor(name: string, value: T, isEqual?: ((a: T, b: T) => (boolean | [boolean, T])) | null | undefined) {
        this.name = name;
        this.cbhs = [];
        this.isPaused = 0;
        this.isTriggerPending = false;
        this.internalValue = value;
        this.isEqual = isEqual || null;
    }

    get value(): T {
        return this.internalValue;
    }

    set value(v: T) {
        let isEq = false;
        if (this.isEqual === null) {
            isEq = (this.internalValue === v);
        } else {
            const e = this.isEqual(this.internalValue, v);
            if (typeof e === "boolean") {
                isEq = e;
            } else {
                [isEq, v] = e;
            }
        }
        if (isEq) {
            // logger.log("set value same value", this.name, v);
            return;
        } else {
            this.internalValue = v;
            this.hasChanged = true;
            this.isTriggerPending = true;
            if (this.isPaused === 0) {
                logger.log("set value trigger", this.name, v);
                this.internalTrigger(this, v);
            } else {
                logger.log("set value paused", this.name, v);
            }
        }
    }

    subscripe(cbh: CallbackHandler<T>): Unsubscripe {
        if (cbh) {
            this.cbhs.push(cbh);
            return () => { this.unsubscripe(cbh); return unsubscripeEmpty; }
        } else {
            return unsubscripeEmpty;
        }
    }

    unsubscripe(cbh: CallbackHandler<T>): void {
        const idx = this.cbhs.indexOf(cbh);
        this.cbhs.splice(idx, 1);
    }
    trigger(sender: any, v: T): void {
        let isEq = false;
        if (this.isEqual === null) {
            isEq = (this.internalValue === v);
        } else {
            const e = this.isEqual(this.internalValue, v);
            if (typeof e === "boolean") {
                isEq = e;
            } else {
                [isEq, v] = e;
            }
        }
        this.internalValue = v;
        if (!isEq) {
            this.hasChanged = true;
        }
        //
        this.internalTrigger(sender, v);
    }
    internalTrigger(sender: any, v: T): void {
        const cbhs = this.cbhs;
        if (cbhs.length > 0) {
            if (this.isPaused == 0) {
                for (let watchdog = 0; (watchdog === 0) || (this.isTriggerPending && watchdog < 10); watchdog++) {
                    if (watchdog === 9) {
                        throw new Error("endless triggers");
                    } else if (watchdog > 0) {
                        logger.log("looping trigger", this.name);
                    }
                    this.isTriggerPending = false;
                    this.isPaused++;
                    try {
                        let idx = 0;
                        while (idx < cbhs.length) {
                            const cbh = cbhs[idx];
                            let result: void | boolean = false;
                            try {
                                result = cbh(v, sender);
                            } catch (error) {
                                logger.error(error);
                                throw error;
                            }
                            if (result === true) {
                                cbhs.splice(idx, 1);
                            } else {
                                idx++;
                            }
                        }
                    } finally {
                        this.isPaused--;
                    }
                }
            } else {
                // paused
                this.isTriggerPending = true;
            }
        }
    }

    clear() {
        if (0 < this.cbhs.length) {
            this.cbhs.splice(0, this.cbhs.length)
        }
    }

    pause(): Resume {
        this.isPaused++;
        return () => {
            this.isPaused--;
            if (this.isPaused == 0) {
                if (this.isTriggerPending) {
                    logger.log("TriggerProperty resume triggers", this.name);
                    this.internalTrigger(this, this.value);
                } else {
                    logger.log("TriggerProperty resume silence", this.name);
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