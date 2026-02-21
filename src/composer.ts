import {KVValue, KVObject, ComposeOptions, KVPrimitive, isKVCond} from './types';

export class KeyValuesComposer {
    private options: Required<ComposeOptions>;
    private level = 0;

    constructor(options: ComposeOptions = {}) {
        this.options = {
            rootKey: 'GameInfo',
            indent: '\t',
            lineEnding: '\n',
            quoteKeys: 'always',
            quoteValues: 'always',
            ...options
        };
    }

    compose(obj: KVObject): string {
        const lines: string[] = [];
        this.composeNode(this.options.rootKey, obj, lines);
        return lines.join(this.options.lineEnding);
    }

    private composeNode(key: string, value: KVValue, lines: string[]): void {
        const indent = this.options.indent.repeat(this.level);
        const formattedKey = this.formatKey(key);

        if (this.isObject(value)) {
            // Block value { ... }
            lines.push(`${indent}${formattedKey}`);
            lines.push(`${indent}{`);
            this.level++;

            for (const [childKey, childValue] of Object.entries(value)) {
                this.composeNode(childKey, childValue, lines);
            }

            this.level--;
            lines.push(`${indent}}`);
            return;
        }

        // Check for KVCond or KVDuplicate
        if (Array.isArray(value)) {
            // KVCond value
            if (isKVCond(value)) {
                const formattedValue = this.formatValue(value[0] as KVPrimitive);
                lines.push(`${indent}${formattedKey} ${formattedValue} [${this.escapeString(value[1])}]`);
                return;
            }

            // KVDuplicate value
            // Doesn't work if one of value items is KVObject
            value.forEach(v => {
                if (this.isObject(v)) {
                    throw new Error(`Duplicated key "${key}" contains an object`);
                }

                const formattedValue = this.formatValue(v as KVPrimitive);
                lines.push(`${indent}${formattedKey} ${formattedValue}`);
            })

            return;
        }

        // Primitive value
        const formattedValue = this.formatValue(value as KVPrimitive);
        lines.push(`${indent}${formattedKey} ${formattedValue}`);
    }

    private isObject(value: KVValue): value is KVObject {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    private formatKey(key: string): string {
        switch (this.options.quoteKeys) {
            case 'always':
                return `"${this.escapeString(key)}"`;
            case 'never':
                return key;
            case 'auto':
            default:
                return this.needsQuoting(key) ? `"${this.escapeString(key)}"` : key;
        }
    }

    private formatValue(value: KVPrimitive): string {
        if (typeof value === 'boolean') {
            return value ? '1' : '0';
        }

        if (typeof value === 'number') {
            return value.toString();
        }

        // String value
        switch (this.options.quoteValues) {
            case 'always':
                return `"${this.escapeString(value)}"`;
            case 'never':
                return value;
            case 'auto':
            default:
                return this.needsQuoting(value) ? `"${this.escapeString(value)}"` : value;
        }
    }

    private needsQuoting(str: string): boolean {
        // Empty string needs quotes
        if (str === '') return true;

        // Contains whitespace, braces, or quotes
        if (/[\s{}[\]"']/.test(str)) return true;

        // Starts with number but isn't purely numeric (would confuse parser)
        if (/^\d/.test(str) && !/^\d+(\.\d+)?$/.test(str)) return true;

        // Reserved words that might confuse parser
        const reserved = ['true', 'false', 'null', 'undefined'];
        return reserved.includes(str.toLowerCase());
    }

    private escapeString(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
    }
}

// Composes GameInfo file
export function composeGI(
    obj: KVObject,
    options?: ComposeOptions
): string {
    return new KeyValuesComposer(options).compose(obj);
}