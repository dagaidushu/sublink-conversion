/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME, GITHUB_REPO, DOCS_URL } from '../constants.js';

export const Navbar = () => {
    return (
        <nav class="fixed top-0 w-full tool-nav backdrop-blur-xl z-50 transition-all duration-300">
            <div class="max-w-6xl mx-auto px-4 sm:px-6">
                <div class="flex items-center justify-between h-16">
                    <a href="#" class="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-300 transition-colors">
                        <span class="w-9 h-9 rounded-lg icon-tile flex items-center justify-center">
                            <img src="/favicon.ico" alt={APP_NAME + ' logo'} class="w-5 h-5" />
                        </span>
                        <span>{APP_NAME}</span>
                    </a>
                    <div class="flex items-center gap-2">
                        <a
                            href={DOCS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="h-9 px-3 format-pill rounded-lg text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center gap-2"
                        >
                            <i class="fas fa-book"></i>
                            <span class="hidden sm:inline">Docs</span>
                        </a>
                        <a
                            href={GITHUB_REPO}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="h-9 px-3 format-pill rounded-lg text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center gap-2"
                        >
                            <i class="fab fa-github"></i>
                            <span class="hidden sm:inline">GitHub</span>
                        </a>
                        <button
                            class="w-9 h-9 rounded-lg format-pill hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center justify-center"
                            x-on:click="toggleDarkMode()"
                            aria-label="Toggle dark mode"
                        >
                            <i class="fas" x-bind:class="darkMode ? 'fa-sun' : 'fa-moon'"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
