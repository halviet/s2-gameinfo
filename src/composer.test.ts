import {describe, it, expect} from 'vitest'
import {composeKeyValues} from "./composer";
import {KVObject} from "./types";

describe('composeKeyValues', () => {
    it('single block', () => {
        const kvObj: KVObject = {Block: {}};
        expect(composeKeyValues(kvObj, "Root")).toEqual('"Root"\n{\n\t"Block"\n\t{\n\t}\n}');
    });

    it('string value', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeKeyValues(kvObj, "Root")).toEqual('"Root"\n{\n\t"key" "value"\n}');
    });

    it('number value', () => {
        const kvObj: KVObject = {key: 10};
        expect(composeKeyValues(kvObj, "Root")).toEqual('"Root"\n{\n\t"key" 10\n}');
    });

    it('boolean value', () => {
        const kvObj: KVObject = {key: true};
        expect(composeKeyValues(kvObj, "Root")).toEqual('"Root"\n{\n\t"key" 1\n}');
    });

    it('condition value', () => {
        const kvObj: KVObject = {key: ["value", " $COND "]};
        expect(composeKeyValues(kvObj, "Root")).toEqual('"Root"\n{\n\t"key" "value" [ $COND ]\n}');
    });
})