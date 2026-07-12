import { generateWebPath } from '../utils.js';
import { MissingDependencyError } from './errors.js';

export class ShortLinkService {
    constructor(kv, options = {}) {
        this.kv = kv;
        this.options = options;
    }

    ensureKv() {
        if (!this.kv) {
            throw new MissingDependencyError('Short link service requires a KV store');
        }
        return this.kv;
    }

    async createShortLink(queryString, providedCode, target = '') {
        const kv = this.ensureKv();
        const shortCode = providedCode || generateWebPath();
        const ttl = this.options.shortLinkTtlSeconds;
        const putOptions = ttl ? { expirationTtl: ttl } : undefined;
        await kv.put(target ? `${target}:${shortCode}` : shortCode, queryString, putOptions);
        return shortCode;
    }

    async resolveShortCode(code, target = '') {
        const kv = this.ensureKv();
        if (target) {
            const targetedValue = await kv.get(`${target}:${code}`);
            if (targetedValue) return targetedValue;
        }
        // Keep short links created before target-specific keys working.
        return kv.get(code);
    }
}
