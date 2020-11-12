import { strictEqual } from "assert";

export type PerAdd = {
    percent: number;
    add: number;
}
export function parseFormula(fx: string): PerAdd[] {
    const result: PerAdd[] = [];
    if (fx) {
        const parsed = fx.replace(/\s/g, "").split(";").filter((v) => v.trim() !== "").map((v) => {
            const a = v.split(":");
            const sizes = (a.length == 1) ? "" : a[0];
            const formula = (a.length == 1) ? a[0] : a[1];
            const sizesSplitted = sizes.split(",").map((s) => s.toLowerCase());
            const isSmall = sizesSplitted.filter((s) => (s == "s" || s == "small")).length != 0;
            const isMedium = sizesSplitted.filter((s) => (s == "m" || s == "medium")).length != 0;
            const isLarge = sizesSplitted.filter((s) => (s == "l" || s == "large")).length != 0;
            const isExtraLarge = sizesSplitted.filter((s) => (s == "xl" || s == "extralarge")).length != 0;
            const containsPercent = formula.indexOf("%") >= 0;
            const formulaSplitted = formula.split("%").map((s) =>{ 
                const n=Number.parseFloat(s);
                return Number.isNaN(n)?0:n;
            });
            const percent = (containsPercent) ? formulaSplitted[0] : 0;
            const add = (containsPercent) ? formulaSplitted[1] : formulaSplitted[0];
            return { isSmall, isMedium, isLarge, isExtraLarge, peradd: { percent, add } as PerAdd };
        });
        if (parsed.length == 1) {
            result.push(parsed[0].peradd);
        } else {
            const small = parsed.filter((p) => p.isSmall);
            const medium = parsed.filter((p) => p.isMedium);
            const large = parsed.filter((p) => p.isLarge);
            const extralarge = parsed.filter((p) => p.isExtraLarge);
            const no = parsed.filter((p) => !p.isSmall && !p.isMedium && !p.isLarge && !p.isExtraLarge).map(p => p.peradd);
            if (small.length > 0) {
                result.push(small[0].peradd);
            }
            if (medium.length > 0) {
                while (result.length <= 1) {
                    result.push(medium[0].peradd);
                }
            }
            if (large.length > 0) {
                while (result.length > 0 && result.length < 2) {
                    result.push(result[result.length - 1]);
                }
                while (result.length <= 2) {
                    result.push(large[0].peradd);
                }
            }
            if (extralarge.length > 0) {
                while (result.length > 0 && result.length < 3) {
                    result.push(result[result.length - 1]);
                }
                while (result.length <= 3) {
                    result.push(extralarge[0].peradd);
                }
            }
            result.push(...no);
        }
    }
    return result;
}
export function calcFormula(formula: PerAdd[], mode: number, bounds: { offset: number, size: number }): number {
    if (formula.length === 0) {
        return 0;
    }
    const peradd = (mode < formula.length)
        ? formula[mode]
        : formula[formula.length - 1];
    
    return (peradd.percent/100)*bounds.size + peradd.add + bounds.offset;
}