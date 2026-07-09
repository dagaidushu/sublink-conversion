/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME, GITHUB_REPO, DOCS_URL, APP_VERSION } from '../constants.js';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer class="mt-12 py-8 border-t border-gray-200/70 dark:border-gray-800/80 bg-white/35 dark:bg-gray-950/30 backdrop-blur-sm">
            <div class="max-w-6xl mx-auto px-4 sm:px-6">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-600 dark:text-gray-400 text-center md:text-left">
                        <span class="text-sm">© {currentYear} {APP_NAME}. All rights reserved.</span>
                        <span class="hidden md:inline text-gray-300 dark:text-gray-700">|</span>
                        <a
                            href={`${GITHUB_REPO}/releases/tag/v${APP_VERSION}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs px-2 py-0.5 rounded-lg format-pill hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-mono"
                            title={`View release notes for v${APP_VERSION}`}
                        >
                            v{APP_VERSION}
                        </a>
                    </div>

                    <div class="flex items-center gap-6">
                        <a
                            href={DOCS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            aria-label="Documentation"
                        >
                            <i class="fas fa-book text-lg"></i>
                        </a>
                        <a
                            href={GITHUB_REPO}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            aria-label="GitHub"
                        >
                            <i class="fab fa-github text-lg"></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
