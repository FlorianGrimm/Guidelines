export function getHotRepository(): HotRepository {
    const root = window as any;
    return (root._HotRepository as HotRepository) || (root._HotRepository = new HotRepository());
}

export type Creator = () => any;
export class HotRepository {
    public readonly _Versions: ({ [name: string]: number });
    public readonly _Items: ({ [name: string]: Creator });
    constructor() {
        this._Items = {};
        this._Versions = {};
    }

    register(name: string, version: number, c: Creator): void {
        const oldVersion = (this._Versions[name] || 0);
        if (oldVersion <= version) {
            this._Versions[name] = version;
            this._Items[name] = c;
            console && console.debug && console.debug(`HotRepository.register ${name} ${oldVersion} -> ${version}`);
        }
    }

    get(name: string): Creator | null {
        return this._Items[name] || null;
    }
}