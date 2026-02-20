import type {KVValue, KVObject, ParseOptions} from './types';

export class KeyValuesParser {
    private pos = 0;
    private readonly content: string;
    private options: ParseOptions;

    constructor(content: string, options: ParseOptions = {}) {
        this.content = content;
        this.options = {
            overrideDuplicates: true,
            parseConditionals: true,
            ...options
        };
    }

    parse(): KVObject {
        this.skipWhitespace();
        const rootKey = this.parseKey();
        const rootValue = this.parseValue();

        // If root has a single key (like "GameInfo"), return its content
        if (typeof rootValue === 'object' && !Array.isArray(rootValue) && rootKey) {
            return rootValue;
        }

        // Otherwise wrap it
        return { [rootKey]: rootValue } as KVObject;
    }

    private parseKey(): string {
        this.skipWhitespace();

        // Handle quoted or unquoted keys
        if (this.peek() === '"') {
            return this.parseQuotedString();
        }

        // Unquoted key: read until whitespace, {, or }
        const start = this.pos;
        while (this.pos < this.content.length) {
            const char = this.peek();
            if (char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '{' || char === '}') {
                break;
            }
            this.pos++;
        }

        const key = this.content.slice(start, this.pos);
        if (!key) throw new Error(`Expected key at position ${this.pos}`);
        return key;
    }

    private parseValue(): KVValue {
        this.skipWhitespace();
        const char = this.peek();

        // Block value { ... }
        if (char === '{') {
            return this.parseBlock();
        }

        // String/number/boolean value
        const val = this.parseScalar();

        if (this.checkForConditional()) {
            if (this.options.parseConditionals) return [val, this.parseConditional()] as KVValue;
            else this.skipConditional();
        }

        return val;
    }

    private parseBlock(): KVObject {
        this.consume('{');
        const obj: KVObject = {};

        while (true) {
            this.skipWhitespace();
            if (this.peek() === '}') break;

            const key = this.parseKey();
            this.skipWhitespace();

            // Handle empty blocks or keys without values (like in hidden_maps)
            if (this.peek() === '}') {
                obj[key] = true; // Flag-style empty value
                break;
            }

            const value = this.parseValue();

            if (key in obj && !this.options.overrideDuplicates) {
                continue;
            }

            obj[key] = value;
        }

        this.consume('}');
        return obj;
    }

    private parseScalar(): KVValue {
        this.skipWhitespace();

        // Quoted string
        if (this.peek() === '"') {
            return this.parseQuotedString();
        }

        // Unquoted value: read until whitespace, }, or newline
        const start = this.pos;
        while (this.pos < this.content.length) {
            const char = this.peek();
            if (char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '}') {
                break;
            }
            this.pos++;
        }

        const raw = this.content.slice(start, this.pos).trim();

        // Try to parse as number
        if (/^-?\d+(\.\d+)?$/.test(raw)) {
            return parseFloat(raw);
        }

        // Try to parse as boolean
        if (raw === 'true' || raw === '1') return true;
        if (raw === 'false' || raw === '0') return false;

        return raw;
    }

    private parseQuotedString(): string {
        this.consume('"');
        let result = '';

        while (this.pos < this.content.length) {
            const char = this.content[this.pos];

            if (char === '"') {
                this.pos++;
                return result;
            }

            if (char === '\\') {
                this.pos++;
                const next = this.content[this.pos];
                switch (next) {
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    case 'n': result += '\n'; break;
                    case 't': result += '\t'; break;
                    default: result += next;
                }
                this.pos++;
            } else {
                result += char;
                this.pos++;
            }
        }

        throw new Error('Unterminated string');
    }

    private skipWhitespace(): void {
        while (this.pos < this.content.length) {
            const char = this.content[this.pos];

            // Skip whitespace
            if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
                this.pos++;
                continue;
            }

            // Skip single-line comments
            if (char === '/' && this.content[this.pos + 1] === '/') {
                while (this.pos < this.content.length && this.content[this.pos] !== '\n') {
                    this.pos++;
                }
                continue;
            }

            // Skip multi-line comments
            if (char === '/' && this.content[this.pos + 1] === '*') {
                this.pos += 2;
                while (this.pos < this.content.length) {
                    if (this.content[this.pos] === '*' && this.content[this.pos + 1] === '/') {
                        this.pos += 2;
                        break;
                    }
                    this.pos++;
                }
                continue;
            }

            break;
        }
    }

    private peek(): string {
        return this.content[this.pos] || '';
    }

    private consume(expected: string): void {
        if (this.peek() !== expected) {
            throw new Error(`Expected '${expected}' at position ${this.pos}, got '${this.peek()}'`);
        }
        this.pos++;
    }

    private checkForConditional(): boolean {
        this.skipWhitespace();
        return this.peek() === '[';
    }

    private skipConditional() {
        while (this.pos < this.content.length) {
            const char = this.content[this.pos];

            // Check for new line
            if (char === '\n' || char === '\r') {
                throw new Error(`Expected closing ']' for condition at position ${this.pos}, but got new line`);
            }

            if (char != ']') {
                this.pos++;
                continue;
            }

            break;
        }

        this.consume(']');
    }

    private parseConditional(): KVValue {
        this.consume('[');

        // Conditional: read until "]"
        const start = this.pos;
        while (this.pos < this.content.length) {
            const char = this.peek();

            if (char === ']') {
                break;
            }

            if (char === '\n' || char === '\r' || char === '}') {
                throw new Error(`Expected closing ']' for condition at position ${this.pos}, but got new line`);
            }

            this.pos++;
        }

        const cond = this.content.slice(start, this.pos);
        this.consume(']');

        return cond;
    }
}

export function parseKeyValues(content: string, options?: ParseOptions): KVObject {
    return new KeyValuesParser(content, options).parse();
}