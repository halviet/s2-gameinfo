import {describe, it, expect} from 'vitest'
import {parseGI} from "./parser";
import {KVValue} from "./types";

describe('parseGI', () => {
    it('single block', () => {
        const gi = kvBlock("GameInfo", kvBlock("Test"));
        expect(parseGI(gi)).toStrictEqual({Test: {}});
    });

    it('multiple blocks', () => {
        const gi = kvBlock("GameInfo", kvBlock("Test1", ""), kvBlock("Test2"));
        expect(parseGI(gi)).toStrictEqual({Test1: {}, Test2: {}});
    });

    it('quoted key', () => {
        const gi = kvBlock("GameInfo", kvPair('"test"', 1));
        expect(parseGI(gi)).toStrictEqual({test: 1});
    });

    it('unquoted key', () => {
        const gi = kvBlock("GameInfo", kvPair("test", 1));
        expect(parseGI(gi)).toStrictEqual({test: 1});
    });

    it('string value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", "value"));
        expect(parseGI(gi)).toStrictEqual({test: "value"});
    });

    it('number value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", 10));
        expect(parseGI(gi)).toStrictEqual({test: 10});
    });

    it('condition value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", '"value" [ $COND ]'));
        expect(parseGI(gi, {parseConditionals: true})).toStrictEqual({test: ["value", " $COND "]});
    });

    it('do not parse condition value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", '"value" [ $COND ]'));
        expect(parseGI(gi, {parseConditionals: false})).toStrictEqual({test: "value"});
    });

    it('on parseConditionals: true - should throw Error: Expected closing \']\' for condition', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"value" [ $COND `));
        expect(() => parseGI(gi, {parseConditionals: true})).toThrowError(/Expected closing ']' for condition/);
    });

    it('on parseConditionals: false - should throw Error: Expected closing \']\' for condition', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"value" [ $COND `));
        expect(() => parseGI(gi, {parseConditionals: false})).toThrowError(/Expected closing ']' for condition/);
    });

    it('with comment', () => {
        const gi = kvBlock("GameInfo", kvPair("test", "value // Test comment"));
        expect(parseGI(gi)).toStrictEqual({test: "value"});
    });

    it('with multi-line comment', () => {
        const gi = kvBlock("GameInfo", `/* Test\nComment */`, kvPair("test", "value"));
        expect(parseGI(gi)).toStrictEqual({test: "value"});
    });

    it('handle value with "/"', () => {
        const gi = kvBlock("GameInfo", kvPair("test", "value/value"));
        expect(parseGI(gi)).toStrictEqual({test: "value/value"});
    });

    it('handle value with "*"', () => {
        const gi = kvBlock("GameInfo", kvPair("test", "value_*VALUE*"));
        expect(parseGI(gi)).toStrictEqual({test: "value_*VALUE*"});
    });

    it('single kv', () => {
        const gi = kvPair("test", "value");
        expect(parseGI(gi)).toStrictEqual({test: "value"});
    });

    it('empty key', () => {
        const gi = kvBlock("GameInfo", "test");
        expect(parseGI(gi)).toStrictEqual({test: true});
    });

    it('duplicated key', () => {
        const gi = kvBlock("GameInfo",
            kvPair("test", "value"),
            kvPair("test", "value2"),
        );
        expect(parseGI(gi)).toStrictEqual({test: ["value", "value2"]});
    });

    it('duplicated key with object value', () => {
        const gi = kvBlock("GameInfo",
            kvPair("test", "value"),
            kvBlock("test",
                kvPair("test", "value")
            )
        );
        expect(parseGI(gi)).toStrictEqual({test: ["value", {test: "value"}]});
    });

    it('override on duplicate, keepDuplicates: false', () => {
        const gi = kvBlock("GameInfo",
            kvPair("test", "value"),
            kvPair("test", "value2"),
        );
        expect(parseGI(gi, {overrideDuplicates: true, keepDuplicates: false})).toStrictEqual({test: "value2"});
    });

    it('do not override on duplicate, keepDuplicates: false', () => {
        const gi = kvBlock("GameInfo",
            kvPair("test", "value"),
            kvPair("test", "value2"),
        );
        expect(parseGI(gi, {overrideDuplicates: false, keepDuplicates: false})).toStrictEqual({test: "value"});
    });

    it('single \\', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"test\\value"`));
        expect(parseGI(gi)).toStrictEqual({test: "test\\value"});
    });

    it('escaped \\\\', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"test\\\\value"`));
        expect(parseGI(gi)).toStrictEqual({test: "test\\value"});
    });

    it('escaped \"', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"\\"value\\""`));
        expect(parseGI(gi)).toStrictEqual({test: '\"value\"'});
    });

    it('escaped \\n', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"value\\n"`));
        expect(parseGI(gi)).toStrictEqual({test: "value\n"});
    });

    it('escaped \\t', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"value\\t"`));
        expect(parseGI(gi)).toStrictEqual({test: "value\t"});
    });

    it('should throw Error: Unterminated string', () => {
        const gi = kvBlock("GameInfo", kvPair("test", `"value`));
        expect(() => parseGI(gi)).toThrowError("Unterminated string");
    });
})

function kvBlock(key: string, ...content: string[]): string {
    let block = `${key}\n{\n`;

    content.forEach((v) => {
        block += `${v}\n`;
    });
    block += "}";

    return block;
}

function kvPair(key: string, value: KVValue): string {
    return `${key} ${value}`;
}
