//import assert = require('assert');

import assert = require("assert");
import { parseFormula } from "../formula";

describe("parseFormula", () => {
    test("empty formula", () => {
      assert.deepStrictEqual(parseFormula(""), [])
    });

    test("1%+1", () => {
      assert.deepStrictEqual(parseFormula("1%+1"), [{percent:1, add:1}])
    });

    test("1%+1;2%+2", () => {
      assert.deepStrictEqual(parseFormula("1%+1;2%+2"), [{percent:1, add:1},{percent:2, add:2}])
    });
    test("Small:1%+1;2%+2", () => {
      assert.deepStrictEqual(parseFormula("Small:1%+1;2%+2"), [{percent:1, add:1},{percent:2, add:2}])
    });
    test("Small:1%+1;Large:2%+2", () => {
      assert.deepStrictEqual(parseFormula("Small:1%+1;Large:2%+2"), [{percent:1, add:1},{percent:1, add:1},{percent:2, add:2}])
    });
    test("Small:1%+1;ExtraLarge:2%+2", () => {
      assert.deepStrictEqual(parseFormula("Small:1%+1;ExtraLarge:2%+2"), [{percent:1, add:1},{percent:1, add:1},{percent:1, add:1},{percent:2, add:2}])
    });
    test("Medium:1%+1;Large:2%+2", () => {
      assert.deepStrictEqual(parseFormula("Medium:1%+1;Large:2%+2"), [{percent:1, add:1},{percent:1, add:1},{percent:2, add:2}])
    });
    test("Medium:2%+2;Large:3%+3;Small:1%+1;ExtraLarge:4%+4", () => {
      assert.deepStrictEqual(parseFormula("Medium:2%+2;Large:3%+3;Small:1%+1;ExtraLarge:4%+4"), [{percent:1, add:1},{percent:2, add:2},{percent:3, add:3},{percent:4, add:4}])
    });


  });