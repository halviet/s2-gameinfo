import {describe, it, expect} from 'vitest'
import {composeGI} from "./composer";
import {KVObject} from "./types";

describe('composeGI', () => {
    it('single block', () => {
        const kvObj: KVObject = {Block: {}};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"Block"\n\t{\n\t}\n}');
    });

    it('string value', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" "value"\n}');
    });

    it('number value', () => {
        const kvObj: KVObject = {key: 10};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" 10\n}');
    });

    it('boolean value: true', () => {
        const kvObj: KVObject = {key: true};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" 1\n}');
    });

    it('boolean value: false', () => {
        const kvObj: KVObject = {key: false};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" 0\n}');
    });

    it('condition value', () => {
        const kvObj: KVObject = {key: ["value", " $COND "]};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" "value" [ $COND ]\n}');
    });

    it('quoted value, {quoteValues: "always"}', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj, {
            quoteValues: 'always',
        })).toEqual('"GameInfo"\n{\n\t"key" "value"\n}');
    });

    it('unquoted value, {quoteValues: "never"}', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj, {
            quoteValues: 'never',
        })).toEqual('"GameInfo"\n{\n\t"key" value\n}');
    });

    it('auto quote value, {quoteValues: "auto"}', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj, {
            quoteValues: 'auto',
        })).toEqual('"GameInfo"\n{\n\t"key" value\n}');
    });

    it('auto quote empty value, {quoteValues: "auto"}', () => {
        const kvObj: KVObject = {key: ""};
        expect(composeGI(kvObj, {
            quoteValues: 'auto',
        })).toEqual('"GameInfo"\n{\n\t"key" ""\n}');
    });

    it('auto quote value starting with number, {quoteValues: "auto"}', () => {
        const kvObj: KVObject = {key: "0value"};
        expect(composeGI(kvObj, {
            quoteValues: 'auto',
        })).toEqual('"GameInfo"\n{\n\t"key" "0value"\n}');
    });

    it('value with "/"', () => {
        const kvObj: KVObject = {key: "value/value"};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" "value/value"\n}');
    });

    it('value with "*"', () => {
        const kvObj: KVObject = {key: "value_*VALUE*"};
        expect(composeGI(kvObj)).toEqual('"GameInfo"\n{\n\t"key" "value_*VALUE*"\n}');
    });

    it('quoted key, {quoteKeys: "always"}', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj, {
            quoteKeys: 'always',
        })).toEqual('"GameInfo"\n{\n\t"key" "value"\n}');
    });

    it('unquoted key, {quoteKeys: "never"}', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj, {
            quoteKeys: 'never',
        })).toEqual('GameInfo\n{\n\tkey "value"\n}');
    });

    it('auto quote key, {quoteKeys: "auto"}', () => {
        const kvObj: KVObject = {key: "value"};
        expect(composeGI(kvObj, {
            quoteKeys: 'auto',
        })).toEqual('GameInfo\n{\n\tkey "value"\n}');
    });

    it('auto quote key with spaces, {quoteKeys: "auto"}', () => {
        const kvObj: KVObject = {"key test": "value"};
        expect(composeGI(kvObj, {
            quoteKeys: 'auto',
        })).toEqual('GameInfo\n{\n\t"key test" "value"\n}');
    });
})