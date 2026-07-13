/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono';
import { Layout } from '../components/Layout.jsx';
import { Navbar } from '../components/Navbar.jsx';
import { Form } from '../components/Form.jsx';
import { Footer } from '../components/Footer.jsx';
import { UpdateChecker } from '../components/UpdateChecker.jsx';
import { SingboxConfigBuilder } from '../builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../builders/ClashConfigBuilder.js';
import { SurgeConfigBuilder } from '../builders/SurgeConfigBuilder.js';
import { createTranslator, resolveLanguage } from '../i18n/index.js';
import { encodeBase64, tryDecodeSubscriptionLines } from '../utils.js';
import { APP_NAME, APP_SUBTITLE } from '../constants.js';
import { ShortLinkService } from '../services/shortLinkService.js';
import { ConfigStorageService } from '../services/configStorageService.js';
import { ServiceError, MissingDependencyError } from '../services/errors.js';
import { normalizeRuntime } from '../runtime/runtimeConfig.js';
import { PREDEFINED_RULE_SETS, SING_BOX_CONFIG, SING_BOX_CONFIG_V1_11, generateSubconverterConfig } from '../config/index.js';
import { inspectConversion } from '../services/conversionInspector.js';
import { XrayConfigBuilder } from '../builders/XrayConfigBuilder.js';

const DEFAULT_USER_AGENT = 'curl/7.74.0';

export function createApp(bindings = {}) {
    const runtime = normalizeRuntime(bindings);
    const services = {
        shortLinks: runtime.kv ? new ShortLinkService(runtime.kv, { shortLinkTtlSeconds: runtime.config.shortLinkTtlSeconds }) : null,
        configStorage: runtime.kv ? new ConfigStorageService(runtime.kv, { configTtlSeconds: runtime.config.configTtlSeconds }) : null
    };

    const app = new Hono();

    const getQuery = (c, name) => c.get('shortLinkParams')?.get(name) ?? c.req.query(name);

    app.use('*', async (c, next) => {
        const acceptLanguage = getRequestHeader(c.req, 'Accept-Language');
        const lang = c.req.query('lang') || acceptLanguage?.split(',')[0] || 'zh-CN';
        c.set('lang', lang);
        c.set('t', createTranslator(lang));
        await next();
    });

    app.get('/', (c) => {
        const t = c.get('t');
        const lang = resolveLanguage(c.get('lang'));
        const subtitle = APP_SUBTITLE[lang] || APP_SUBTITLE['zh-CN'];

        return c.html(
            <Layout title={t('pageTitle')} description={t('pageDescription')} keywords={t('pageKeywords')}>
                <div class="flex flex-col min-h-screen">
                    <Navbar />
                    <main class="flex-1">
                        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-24">
                            <section class="tool-hero rounded-lg px-5 py-5 md:px-8 md:py-6 mb-8">
                                <div class="flex flex-col items-center gap-3 text-center">
                                    <div class="flex flex-wrap justify-center gap-2 text-sm font-semibold">
                                        <span class="format-pill rounded-lg px-3 py-2">Sing-Box</span>
                                        <span class="format-pill rounded-lg px-3 py-2">Clash</span>
                                        <span class="format-pill rounded-lg px-3 py-2">Xray</span>
                                        <span class="format-pill rounded-lg px-3 py-2">Surge</span>
                                    </div>
                                    <div class="max-w-3xl">
                                        <h1 class="text-4xl md:text-6xl font-bold text-gray-950 dark:text-white mb-2 tracking-tight">
                                            {APP_NAME}
                                        </h1>
                                        <p class="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                            {subtitle}
                                        </p>
                                    </div>
                                </div>
                            </section>
                            <Form t={t} lang={lang} />
                        </div>
                    </main>
                    <Footer />
                    <UpdateChecker />
                </div>
            </Layout>
        );
    });

    const singboxHandler = async (c) => {
        setSubscriptionNoCacheHeaders(c);
        try {
            const config = getQuery(c, 'config');
            if (!config) {
                return c.text('Missing config parameter', 400);
            }

            const selectedRules = parseSelectedRules(getQuery(c, 'selectedRules'));
            const customRules = parseJsonArray(getQuery(c, 'customRules'));
            const ua = getQuery(c, 'ua') || getRequestHeader(c.req, 'User-Agent') || DEFAULT_USER_AGENT;
            const groupByCountry = parseBooleanFlag(getQuery(c, 'group_by_country'));
            const includeAutoSelect = getQuery(c, 'include_auto_select') !== 'false';
            const allowInsecure = parseBooleanFlag(getQuery(c, 'allow_insecure'));
            const enableClashUI = parseBooleanFlag(getQuery(c, 'enable_clash_ui'));
            const externalController = getQuery(c, 'external_controller');
            const externalUiDownloadUrl = getQuery(c, 'external_ui_download_url');
            const configId = getQuery(c, 'configId');
            const lang = c.get('lang');

            const requestedSingboxVersion = getQuery(c, 'singbox_version') || getQuery(c, 'sb_version') || getQuery(c, 'sb_ver');
            const requestUserAgent = getRequestHeader(c.req, 'User-Agent');
            const singboxConfigVersion = resolveSingboxConfigVersion(requestedSingboxVersion, requestUserAgent);

            let baseConfig = singboxConfigVersion === '1.11' ? SING_BOX_CONFIG_V1_11 : SING_BOX_CONFIG;
            if (configId) {
                const storage = requireConfigStorage(services.configStorage);
                const storedConfig = await storage.getConfigById(configId);
                if (storedConfig) {
                    baseConfig = storedConfig;
                }
            }

            const builder = new SingboxConfigBuilder(
                config,
                selectedRules,
                customRules,
                baseConfig,
                lang,
                ua,
                groupByCountry,
                enableClashUI,
                externalController,
                externalUiDownloadUrl,
                singboxConfigVersion,
                includeAutoSelect,
                allowInsecure
            );
            await builder.build();
            const userinfo = builder.getSubscriptionUserinfo();
            if (userinfo) {
                c.header('subscription-userinfo', userinfo);
            }
            return c.json(builder.config);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    };
    app.get('/singbox', singboxHandler);

    const clashHandler = async (c) => {
        setSubscriptionNoCacheHeaders(c);
        try {
            const config = getQuery(c, 'config');
            if (!config) {
                return c.text('Missing config parameter', 400);
            }

            const selectedRules = parseSelectedRules(getQuery(c, 'selectedRules'));
            const customRules = parseJsonArray(getQuery(c, 'customRules'));
            const ua = getQuery(c, 'ua') || getRequestHeader(c.req, 'User-Agent') || DEFAULT_USER_AGENT;
            const groupByCountry = parseBooleanFlag(getQuery(c, 'group_by_country'));
            const includeAutoSelect = getQuery(c, 'include_auto_select') !== 'false';
            const allowInsecure = parseBooleanFlag(getQuery(c, 'allow_insecure'));
            const enableClashUI = parseBooleanFlag(getQuery(c, 'enable_clash_ui'));
            const externalController = getQuery(c, 'external_controller');
            const externalUiDownloadUrl = getQuery(c, 'external_ui_download_url');
            const configId = getQuery(c, 'configId');
            const lang = c.get('lang');

            let baseConfig;
            if (configId) {
                const storage = requireConfigStorage(services.configStorage);
                baseConfig = await storage.getConfigById(configId);
            }

            const builder = new ClashConfigBuilder(
                config,
                selectedRules,
                customRules,
                baseConfig,
                lang,
                ua,
                groupByCountry,
                enableClashUI,
                externalController,
                externalUiDownloadUrl,
                includeAutoSelect,
                allowInsecure
            );
            await builder.build();
            const userinfo = builder.getSubscriptionUserinfo();
            const headers = { 'Content-Type': 'text/yaml; charset=utf-8' };
            if (userinfo) {
                headers['subscription-userinfo'] = userinfo;
            }
            return c.text(builder.formatConfig(), 200, headers);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    };
    app.get('/clash', clashHandler);

    const surgeHandler = async (c) => {
        setSubscriptionNoCacheHeaders(c);
        try {
            const config = getQuery(c, 'config');
            if (!config) {
                return c.text('Missing config parameter', 400);
            }

            const selectedRules = parseSelectedRules(getQuery(c, 'selectedRules'));
            const customRules = parseJsonArray(getQuery(c, 'customRules'));
            const ua = getQuery(c, 'ua') || getRequestHeader(c.req, 'User-Agent') || DEFAULT_USER_AGENT;
            const groupByCountry = parseBooleanFlag(getQuery(c, 'group_by_country'));
            const includeAutoSelect = getQuery(c, 'include_auto_select') !== 'false';
            const allowInsecure = parseBooleanFlag(getQuery(c, 'allow_insecure'));
            const configId = getQuery(c, 'configId');
            const lang = c.get('lang');

            let baseConfig;
            if (configId) {
                const storage = requireConfigStorage(services.configStorage);
                baseConfig = await storage.getConfigById(configId);
            }

            const builder = new SurgeConfigBuilder(
                config,
                selectedRules,
                customRules,
                baseConfig,
                lang,
                ua,
                groupByCountry,
                includeAutoSelect,
                allowInsecure
            );
            builder.setSubscriptionUrl(c.req.url);
            await builder.build();

            const userinfo = builder.getSubscriptionUserinfo();
            if (userinfo) {
                c.header('subscription-userinfo', userinfo);
            }
            return c.text(builder.formatConfig());
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    };
    app.get('/surge', surgeHandler);

    app.get('/subconverter', (c) => {
        try {
            const rawSelectedRules = c.req.query('selectedRules');
            let selectedRules;

            if (!rawSelectedRules) {
                selectedRules = PREDEFINED_RULE_SETS.balanced;
            } else if (PREDEFINED_RULE_SETS[rawSelectedRules]) {
                selectedRules = PREDEFINED_RULE_SETS[rawSelectedRules];
            } else {
                try {
                    const parsed = JSON.parse(rawSelectedRules);
                    if (Array.isArray(parsed)) {
                        selectedRules = parsed;
                    } else {
                        return c.text('Invalid selectedRules: must be a preset name (minimal, balanced, comprehensive) or a JSON array', 400);
                    }
                } catch {
                    return c.text(`Invalid selectedRules: "${rawSelectedRules}" is not a valid preset name or JSON array. Valid presets: minimal, balanced, comprehensive`, 400);
                }
            }

            const includeAutoSelect = c.req.query('include_auto_select') !== 'false';
            const groupByCountry = parseBooleanFlag(c.req.query('group_by_country'));
            const customRules = parseJsonArray(c.req.query('customRules'));
            const lang = c.get('lang');

            const config = generateSubconverterConfig({
                selectedRules,
                customRules,
                lang,
                includeAutoSelect,
                groupByCountry
            });

            return c.text(config, 200, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    const xrayHandler = async (c) => {
        setSubscriptionNoCacheHeaders(c);
        const inputString = getQuery(c, 'config');
        if (!inputString) {
            return c.text('Missing config parameter', 400);
        }

        if (getQuery(c, 'format') === 'json') {
            try {
                const builder = new XrayConfigBuilder(
                    inputString,
                    c.get('lang'),
                    getQuery(c, 'ua') || getRequestHeader(c.req, 'User-Agent'),
                    parseBooleanFlag(getQuery(c, 'allow_insecure'))
                );
                const { config } = await builder.build();
                return c.json(config, 200, { 'Content-Disposition': 'attachment; filename="xray.json"' });
            } catch (error) {
                return handleError(c, error, runtime.logger);
            }
        }

        const proxylist = inputString.split('\n');
        const finalProxyList = [];
        let subscriptionUserinfo;
        const userAgent = getQuery(c, 'ua') || getRequestHeader(c.req, 'User-Agent') || DEFAULT_USER_AGENT;
        const headers = {
            'User-Agent': userAgent,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        for (const proxy of proxylist) {
            const trimmedProxy = proxy.trim();
            if (!trimmedProxy) continue;

            if (trimmedProxy.startsWith('http://') || trimmedProxy.startsWith('https://')) {
                try {
                    const response = await fetch(trimmedProxy, {
                        method: 'GET',
                        headers,
                        cache: 'no-store',
                        cf: { cacheTtl: 0 }
                    });
                    const fetchedUserinfo = response.headers.get('subscription-userinfo');
                    if (fetchedUserinfo && subscriptionUserinfo === undefined) {
                        subscriptionUserinfo = fetchedUserinfo;
                    }
                    const text = await response.text();
                    let processed = tryDecodeSubscriptionLines(text, { decodeUriComponent: true });
                    if (!Array.isArray(processed)) processed = [processed];
                    finalProxyList.push(...processed.filter(item => typeof item === 'string' && item.trim() !== ''));
                } catch (e) {
                    runtime.logger.warn('Failed to fetch the proxy', e);
                }
            } else {
                let processed = tryDecodeSubscriptionLines(trimmedProxy);
                if (!Array.isArray(processed)) processed = [processed];
                finalProxyList.push(...processed.filter(item => typeof item === 'string' && item.trim() !== ''));
            }
        }

        const finalString = finalProxyList.join('\n');
        if (!finalString) {
            return c.text('Missing config parameter', 400);
        }

        const responseHeaders = {};
        if (subscriptionUserinfo) {
            responseHeaders['subscription-userinfo'] = subscriptionUserinfo;
        }

        return c.text(encodeBase64(finalString), 200, responseHeaders);
    };
    app.get('/xray', xrayHandler);

    const createShortLink = async ({ url, shortCode, target = '', ttl }) => {
        if (!url) {
            throw new ServiceError('Missing URL parameter', 400);
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new ServiceError('Invalid URL parameter', 400);
        }

        if (target && !['s', 'b', 'c', 'x', 'xj'].includes(target)) {
            throw new ServiceError('Invalid short link target', 400);
        }

        const shortLinks = requireShortLinkService(services.shortLinks);
        return shortLinks.createShortLink(parsedUrl.search, shortCode, target, ttl);
    };

    app.get('/shorten-v2', async (c) => {
        try {
            const code = await createShortLink({
                url: c.req.query('url'),
                shortCode: c.req.query('shortCode'),
                target: c.req.query('target') || '',
                ttl: c.req.query('ttl')
            });
            return c.text(code);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    app.post('/shorten-v2', async (c) => {
        try {
            const { url, shortCode, target, ttl } = await c.req.json();
            const code = await createShortLink({ url, shortCode, target, ttl });
            return c.text(code);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    const serveShortLink = (target, handler) => async (c) => {
        setSubscriptionNoCacheHeaders(c);
        try {
            const code = c.req.param('code');
            const shortLinks = requireShortLinkService(services.shortLinks);
            const originalParam = await shortLinks.resolveShortCode(code, target);
            if (!originalParam) return c.text('Short URL not found', 404);
            c.set('shortLinkParams', new URLSearchParams(originalParam));
            return handler(c);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    };

    app.get('/s/:code', serveShortLink('s', surgeHandler));
    app.get('/b/:code', serveShortLink('b', singboxHandler));
    app.get('/c/:code', serveShortLink('c', clashHandler));
    app.get('/x/:code', serveShortLink('x', xrayHandler));
    app.get('/xj/:code', serveShortLink('xj', xrayHandler));

    app.get('/short-links', async (c) => {
        try {
            requireShortLinkAdminAccess(c, runtime);
            const shortLinks = requireShortLinkService(services.shortLinks);
            return c.json({ links: await shortLinks.listShortLinks() });
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    app.delete('/short-links/:code', async (c) => {
        try {
            requireShortLinkAdminAccess(c, runtime);
            const shortLinks = requireShortLinkService(services.shortLinks);
            await shortLinks.deleteShortLink(c.req.param('code'), c.req.query('target') || '');
            return c.json({ deleted: true });
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    app.post('/config', async (c) => {
        try {
            const { type, content } = await c.req.json();
            const storage = requireConfigStorage(services.configStorage);
            const configId = await storage.saveConfig(type, content);
            return c.text(configId);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return c.text(`Invalid format: ${error.message}`, 400);
            }
            return handleError(c, error, runtime.logger);
        }
    });

    app.post('/inspect', async (c) => {
        try {
            const { input, userAgent, allowInsecure = false } = await c.req.json();
            if (!input || typeof input !== 'string') {
                return c.json({ total: 0, parseIssues: [{ reason: '请输入订阅链接或节点内容' }], targets: [] }, 400);
            }
            return c.json(await inspectConversion(input, {
                lang: c.get('lang'),
                userAgent,
                allowInsecure: parseBooleanFlag(allowInsecure)
            }));
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    app.get('/resolve', async (c) => {
        try {
            const shortUrl = c.req.query('url');
            const t = c.get('t');
            if (!shortUrl) return c.text(t('missingUrl'), 400);

            let urlObj;
            try {
                urlObj = new URL(shortUrl);
            } catch {
                return c.text(t('invalidShortUrl'), 400);
            }
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length < 3) return c.text(t('invalidShortUrl'), 400);

            const prefix = pathParts[1];
            const shortCode = pathParts[2];
            if (!['b', 'c', 'x', 'xj', 's'].includes(prefix)) return c.text(t('invalidShortUrl'), 400);

            const shortLinks = requireShortLinkService(services.shortLinks);
            const originalParam = await shortLinks.resolveShortCode(shortCode, prefix);
            if (!originalParam) return c.text(t('shortUrlNotFound'), 404);

            const mapping = { b: 'singbox', c: 'clash', x: 'xray', xj: 'xray', s: 'surge' };
            const originalUrl = `${urlObj.origin}/${mapping[prefix]}${originalParam}`;
            return c.json({ originalUrl });
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    app.get('/favicon.ico', async (c) => {
        if (!runtime.assetFetcher) {
            return c.notFound();
        }
        try {
            return await runtime.assetFetcher(c.req.raw);
        } catch (error) {
            runtime.logger.warn('Asset fetch failed', error);
            return c.notFound();
        }
    });

    return app;
}

export function parseSelectedRules(raw) {
    if (!raw) return [];

    // 首先检查是否是预设名称 (minimal, balanced, comprehensive)
    // 这确保向后兼容主分支的 API 行为
    if (typeof raw === 'string' && PREDEFINED_RULE_SETS[raw]) {
        return PREDEFINED_RULE_SETS[raw];
    }

    // 尝试解析为 JSON 数组
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        // 解析失败，回退到 minimal 预设
        console.warn(`Failed to parse selectedRules: ${raw}, falling back to minimal`);
        return PREDEFINED_RULE_SETS.minimal;
    }
}

function parseJsonArray(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function parseBooleanFlag(value) {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null) return false;
    return ['true', '1'].includes(String(value).trim().toLowerCase());
}

function setSubscriptionNoCacheHeaders(c) {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    c.header('CDN-Cache-Control', 'no-store');
    c.header('Cloudflare-CDN-Cache-Control', 'no-store');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    c.header('Vary', 'User-Agent');
}

function parseSemverLike(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const match = trimmed.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
    if (!match) {
        return null;
    }
    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: match[3] ? Number(match[3]) : 0
    };
}

function isSingboxLegacyConfig(version) {
    if (!version || Number.isNaN(version.major) || Number.isNaN(version.minor)) {
        return false;
    }
    if (version.major !== 1) {
        return version.major < 1;
    }
    return version.minor < 12;
}

function resolveSingboxConfigVersion(requestedVersion, userAgent) {
    const normalizedRequested = typeof requestedVersion === 'string' ? requestedVersion.trim().toLowerCase() : '';
    if (normalizedRequested && normalizedRequested !== 'auto') {
        if (normalizedRequested === 'legacy') return '1.11';
        if (normalizedRequested === 'latest') return '1.12';
        const parsed = parseSemverLike(normalizedRequested);
        if (parsed) {
            return isSingboxLegacyConfig(parsed) ? '1.11' : '1.12';
        }
    }

    if (typeof userAgent === 'string' && userAgent) {
        const uaMatch = userAgent.match(/sing-box\/(\d+\.\d+(?:\.\d+)?)/i) || userAgent.match(/sing-box\s+(\d+\.\d+(?:\.\d+)?)/i);
        const versionString = uaMatch?.[1];
        const parsed = versionString ? parseSemverLike(versionString) : null;
        if (parsed) {
            return isSingboxLegacyConfig(parsed) ? '1.11' : '1.12';
        }
    }

    return '1.12';
}

function getRequestHeader(request, name) {
    if (!request || !name) {
        return undefined;
    }

    try {
        const value = request.header(name);
        if (value !== undefined) {
            return value;
        }
    } catch {
        // Fallback if HonoRequest.header cannot read from the raw request.
    }

    const headers = request.raw?.headers;
    if (!headers) {
        return undefined;
    }

    if (typeof headers.get === 'function') {
        return headers.get(name) ?? headers.get(name.toLowerCase()) ?? undefined;
    }

    if (typeof headers === 'object') {
        const lowerName = name.toLowerCase();
        const headerValue = headers[lowerName] ?? headers[name];
        if (Array.isArray(headerValue)) {
            return headerValue[0];
        }
        return headerValue;
    }

    return undefined;
}

function requireShortLinkService(service) {
    if (!service) {
        throw new MissingDependencyError('Short link functionality is unavailable');
    }
    return service;
}

function requireShortLinkAdminAccess(c, runtime) {
    const expectedToken = runtime.config.shortLinkAdminToken;
    if (!expectedToken) {
        throw new ServiceError('Short link management is disabled. Set the SHORT_LINK_ADMIN_TOKEN secret first.', 503);
    }
    const authorization = getRequestHeader(c.req, 'Authorization') || '';
    const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const suppliedToken = bearerToken || c.req.query('token') || '';
    if (suppliedToken !== expectedToken) {
        throw new ServiceError('Short link management token is invalid.', 403);
    }
}

function requireConfigStorage(service) {
    if (!service) {
        throw new MissingDependencyError('Config storage functionality is unavailable');
    }
    return service;
}

function handleError(c, error, logger) {
    if (error instanceof ServiceError) {
        return c.text(error.message, error.status);
    }
    logger.error?.('Unhandled error', error);
    return c.text(`Error: ${error.message}`, 500);
}
