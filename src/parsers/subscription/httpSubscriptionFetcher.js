import { decodeBase64 } from '../../utils.js';
import { parseSubscriptionContent } from './subscriptionContentParser.js';

const SUBSCRIPTION_URI_PATTERN = /^(ss|vmess|vless|hysteria|hysteria2|hy2|trojan|tuic|anytls|socks|socks4|socks5|naive|naive\+https|shadowtls|shadow-tls|http|https):\/\//i;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export class SubscriptionFetchError extends Error {
    constructor(message, code = 'fetch_failed') {
        super(message);
        this.name = 'SubscriptionFetchError';
        this.code = code;
    }
}

function isPrivateHostname(hostname) {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
    if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;
    const values = ipv4.slice(1).map(Number);
    if (values.some(value => value > 255)) return true;
    const [first, second] = values;
    return first === 0 || first === 10 || first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168);
}

function validateSubscriptionUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new SubscriptionFetchError('Subscription URL is invalid', 'invalid_url');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new SubscriptionFetchError('Subscription URL must use HTTP or HTTPS', 'invalid_scheme');
    }
    if (isPrivateHostname(url.hostname)) {
        throw new SubscriptionFetchError('Private network subscription URLs are not allowed', 'private_address');
    }
    return url;
}

async function readResponseText(response) {
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
        throw new SubscriptionFetchError('Subscription response is larger than 2 MB', 'response_too_large');
    }

    if (!response.body) {
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
            throw new SubscriptionFetchError('Subscription response is larger than 2 MB', 'response_too_large');
        }
        return text;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_RESPONSE_BYTES) {
                throw new SubscriptionFetchError('Subscription response is larger than 2 MB', 'response_too_large');
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const content = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        content.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder().decode(content);
}

async function fetchSubscriptionResponse(urlValue, userAgent) {
    const initialUrl = validateSubscriptionUrl(urlValue);

    const headers = new Headers();
    if (userAgent) headers.set('User-Agent', userAgent);
    headers.set('Cache-Control', 'no-cache');
    headers.set('Pragma', 'no-cache');
    let currentUrl = initialUrl;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response;
        try {
            response = await fetch(currentUrl, {
                method: 'GET',
                headers,
                redirect: 'manual',
                signal: controller.signal,
                cache: 'no-store',
                cf: { cacheTtl: 0 }
            });
        } catch (error) {
            if (error?.name === 'AbortError') {
                throw new SubscriptionFetchError('Subscription request timed out after 10 seconds', 'timeout');
            }
            throw new SubscriptionFetchError('Subscription request failed', 'network_error');
        } finally {
            clearTimeout(timeout);
        }

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location) throw new SubscriptionFetchError('Subscription redirect is missing a location', 'invalid_redirect');
            if (redirectCount === MAX_REDIRECTS) {
                throw new SubscriptionFetchError('Subscription has too many redirects', 'too_many_redirects');
            }
            currentUrl = validateSubscriptionUrl(new URL(location, currentUrl).toString());
            continue;
        }
        if (!response.ok) {
            throw new SubscriptionFetchError(`Subscription server returned HTTP ${response.status}`, 'http_error');
        }

        const result = {
            content: decodeContent(await readResponseText(response)),
            url: currentUrl.toString(),
            subscriptionUserinfo: response.headers.get('subscription-userinfo') || undefined,
            cached: false
        };
        return result;
    }

    throw new SubscriptionFetchError('Subscription request failed', 'fetch_failed');
}

function hasSubscriptionUriLine(content) {
    return content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .some(line => SUBSCRIPTION_URI_PATTERN.test(line));
}

function isLikelyTomlConfig(content) {
    return /^\s*\[[^\]]+\]\s*$/m.test(content) && /^\s*[A-Za-z0-9_.-]+\s*=/.test(content);
}

function isPlainSubscriptionContent(content) {
    if (!content || typeof content !== 'string') {
        return false;
    }
    return detectFormat(content) !== 'unknown' ||
        hasSubscriptionUriLine(content) ||
        isLikelyTomlConfig(content);
}

function decodeUriComponentIfNeeded(text) {
    const trimmed = text.trim();
    if (!trimmed.includes('%')) {
        return trimmed;
    }

    try {
        return decodeURIComponent(trimmed).trim();
    } catch (urlError) {
        console.warn('Failed to URL decode the text:', urlError);
        return trimmed;
    }
}

function normalizeBase64Candidate(text) {
    const compact = text.replace(/\s+/g, '');
    if (!compact || !/^[A-Za-z0-9+/_-]*={0,2}$/.test(compact)) {
        return null;
    }
    if (/=/.test(compact.replace(/={0,2}$/, ''))) {
        return null;
    }

    const withoutPadding = compact.replace(/=+$/, '');
    if (withoutPadding.length % 4 === 1) {
        return null;
    }

    const normalized = withoutPadding.replace(/-/g, '+').replace(/_/g, '/');
    return normalized + '='.repeat((4 - normalized.length % 4) % 4);
}

/**
 * Decode content only when the payload proves it is an encoded subscription.
 * @param {string} text - Raw text content
 * @returns {string} - Decoded content
 */
function decodeContent(text) {
    const urlDecodedText = decodeUriComponentIfNeeded(text);
    if (isPlainSubscriptionContent(urlDecodedText)) {
        return urlDecodedText;
    }

    const base64Candidate = normalizeBase64Candidate(urlDecodedText);
    if (!base64Candidate) {
        return urlDecodedText;
    }

    try {
        const decodedText = decodeUriComponentIfNeeded(decodeBase64(base64Candidate));
        if (isPlainSubscriptionContent(decodedText)) {
            return decodedText;
        }
    } catch (e) {
        return urlDecodedText;
    }

    return urlDecodedText;
}

/**
 * Detect the format of subscription content
 * @param {string} content - Decoded subscription content
 * @returns {'clash'|'singbox'|'surge'|'unknown'} - Detected format
 */
function detectFormat(content) {
    const trimmed = content.trim();

    // Try JSON (Sing-Box format)
    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.outbounds || parsed.inbounds || parsed.route) {
                return 'singbox';
            }
        } catch {
            // Not valid JSON
        }
    }

    // Try YAML (Clash format) - check for proxies: key
    if (trimmed.includes('proxies:')) {
        return 'clash';
    }

    if (/\[(General|Proxy|Rule|Proxy Group)\]/i.test(trimmed)) {
        return 'surge';
    }

    return 'unknown';
}

/**
 * Fetch subscription content from a URL and parse it
 * @param {string} url - The subscription URL to fetch
 * @param {string} userAgent - Optional User-Agent header
 * @returns {Promise<object|string[]|null>} - Parsed subscription content
 */
export async function fetchSubscription(url, userAgent) {
    try {
        const result = await fetchSubscriptionResponse(url, userAgent);
        return parseSubscriptionContent(result.content);
    } catch (error) {
        console.error('Error fetching or parsing HTTP(S) content:', error);
        return null;
    }
}

/**
 * Fetch subscription content and detect its format without parsing
 * @param {string} url - The subscription URL to fetch
 * @param {string} userAgent - Optional User-Agent header
 * @returns {Promise<{content: string, format: 'clash'|'singbox'|'surge'|'unknown', url: string, subscriptionUserinfo?: string}|null>}
 */
export async function fetchSubscriptionWithFormat(url, userAgent) {
    const result = await fetchSubscriptionResponse(url, userAgent);
    return { ...result, format: detectFormat(result.content) };
}
