import { html } from 'hono/html'
import { APP_KEYWORDS } from '../constants.js';

export const Layout = (props) => {
  const { title, children } = props
  return html`
    <!DOCTYPE html>
    <html lang="en" x-data="appData()">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <meta name="description" content="Convert and optimize your subscription links easily" />
        <meta name="keywords" content="${APP_KEYWORDS}" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.10/dist/cdn.min.js" onerror="window.__alpineFailed=true"></script>
        <script>
          window.__alpineLoaded = false;
          document.addEventListener('alpine:init', () => { window.__alpineLoaded = true; });
          window.addEventListener('DOMContentLoaded', () => {
            if (window.__alpineFailed || !window.__alpineLoaded) {
              console.error('Failed to initialize Alpine.js. Interactive features are disabled.');
              const warning = document.createElement('div');
              warning.className = 'fixed bottom-4 right-4 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg shadow';
              warning.textContent = '加载 Alpine.js 失败，页面交互功能不可用，请刷新或检查网络。';
              document.body.appendChild(warning);
            }
          });
        </script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  primary: {
                    50: '#eefbf6',
                    100: '#d7f5e8',
                    200: '#b3ead5',
                    300: '#7fd7bb',
                    400: '#42bd9b',
                    500: '#199b7d',
                    600: '#0f7f69',
                    700: '#0d6557',
                    800: '#0e5148',
                    900: '#0d433c',
                    950: '#062824',
                  },
                  accent: {
                    50: '#fff8eb',
                    100: '#fdeac6',
                    200: '#f9d58e',
                    300: '#f0b84f',
                    400: '#df9826',
                    500: '#be7817',
                    600: '#985b14',
                    700: '#774414',
                    800: '#613817',
                    900: '#523018',
                  },
                  gray: {
                    850: '#1f2937',
                    900: '#111827',
                    950: '#0d1110',
                  }
                },
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          :root {
            --page-bg: #f7f8f3;
            --page-bg-soft: #edf2ed;
            --surface: rgba(255, 255, 252, 0.88);
            --surface-strong: #ffffff;
            --surface-muted: #eef3ee;
            --border: rgba(67, 83, 72, 0.18);
            --border-strong: rgba(31, 46, 38, 0.26);
            --ink: #17221d;
            --muted: #66746c;
            --primary: #0f7f69;
            --primary-strong: #0b6756;
            --accent: #be7817;
            --shadow: 0 18px 50px rgba(31, 46, 38, 0.10);
          }

          html.dark {
            --page-bg: #0d1110;
            --page-bg-soft: #121b18;
            --surface: rgba(18, 25, 23, 0.86);
            --surface-strong: #151d1a;
            --surface-muted: #101715;
            --border: rgba(172, 192, 179, 0.15);
            --border-strong: rgba(202, 216, 207, 0.24);
            --ink: #edf5ef;
            --muted: #9baaa1;
            --primary: #42bd9b;
            --primary-strong: #7fd7bb;
            --accent: #f0b84f;
            --shadow: 0 22px 60px rgba(0, 0, 0, 0.34);
          }

          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            position: relative;
            min-height: 100vh;
            color: var(--ink);
            background:
              linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-soft) 54%, var(--page-bg) 100%);
          }

          body::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -2;
            background-image:
              linear-gradient(rgba(15, 127, 105, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(190, 120, 23, 0.07) 1px, transparent 1px);
            background-size: 36px 36px;
            mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.84), rgba(0, 0, 0, 0.16));
            opacity: 0.65;
            pointer-events: none;
          }

          .dark body::before,
          html.dark body::before {
            background-image:
              linear-gradient(rgba(66, 189, 155, 0.11) 1px, transparent 1px),
              linear-gradient(90deg, rgba(240, 184, 79, 0.08) 1px, transparent 1px);
            opacity: 0.42;
          }

          body::after {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -1;
            opacity: 0.72;
            pointer-events: none;
            background:
              linear-gradient(90deg, rgba(15, 127, 105, 0.06), transparent 24%, transparent 74%, rgba(190, 120, 23, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.55), transparent 34%);
          }

          .dark body::after,
          html.dark body::after {
            opacity: 0.32;
            background:
              linear-gradient(90deg, rgba(66, 189, 155, 0.08), transparent 26%, transparent 76%, rgba(240, 184, 79, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 36%);
          }

          ::selection {
            background: rgba(15, 127, 105, 0.22);
          }

          [x-cloak] { display: none !important; }

          .rounded-2xl,
          .rounded-xl {
            border-radius: 0.5rem !important;
          }

          .surface-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            box-shadow: var(--shadow);
            backdrop-filter: blur(18px);
          }

          .surface-card:hover {
            border-color: var(--border-strong);
            box-shadow: 0 22px 64px rgba(31, 46, 38, 0.14);
          }

          html.dark .surface-card:hover {
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
          }

          .tool-nav {
            background: color-mix(in srgb, var(--surface-strong) 88%, transparent);
            border-bottom: 1px solid var(--border);
            box-shadow: 0 10px 30px rgba(31, 46, 38, 0.08);
          }

          .tool-hero {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--border);
            background:
              linear-gradient(135deg, color-mix(in srgb, var(--surface-strong) 88%, transparent), color-mix(in srgb, var(--surface-muted) 82%, transparent));
            box-shadow: var(--shadow);
          }

          .tool-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(15, 127, 105, 0.11), transparent 36%),
              linear-gradient(180deg, transparent, rgba(190, 120, 23, 0.08));
            pointer-events: none;
          }

          .tool-hero > * {
            position: relative;
          }

          .format-pill {
            border: 1px solid var(--border);
            background: color-mix(in srgb, var(--surface-strong) 74%, transparent);
            color: var(--muted);
          }

          .action-primary {
            border: 1px solid rgba(255, 255, 255, 0.24) !important;
            background: linear-gradient(135deg, #0f7f69 0%, #1b7f94 58%, #be7817 100%) !important;
            color: #fff !important;
            box-shadow: 0 16px 36px rgba(15, 127, 105, 0.26) !important;
          }

          .action-primary:hover {
            filter: saturate(1.05) brightness(1.03);
            box-shadow: 0 18px 44px rgba(15, 127, 105, 0.34) !important;
          }

          .action-secondary {
            background: var(--surface) !important;
            border: 1px solid var(--border) !important;
            color: var(--ink) !important;
          }

          .soft-input {
            background: color-mix(in srgb, var(--surface-muted) 76%, transparent) !important;
            border-color: var(--border) !important;
            color: var(--ink) !important;
          }

          input[type="text"],
          input[readonly],
          textarea,
          select {
            background: color-mix(in srgb, var(--surface-muted) 76%, transparent) !important;
            border-color: var(--border) !important;
            color: var(--ink) !important;
          }

          input:focus,
          textarea:focus,
          select:focus {
            border-color: color-mix(in srgb, var(--primary) 62%, white) !important;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent) !important;
            outline: none !important;
          }

          .icon-tile {
            background: color-mix(in srgb, var(--primary) 12%, var(--surface-strong));
            color: var(--primary);
            border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent);
          }
        </style>
        <script>
          function appData() {
            return {
              darkMode: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
              toggleDarkMode() {
                this.darkMode = !this.darkMode;
                localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
                if (this.darkMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              },
              init() {
                if (this.darkMode) {
                  document.documentElement.classList.add('dark');
                }
              }
            }
          }

          // Version update checker Alpine.js component
          function updateChecker(currentVersion, apiUrl) {
            return {
              currentVersion: currentVersion,
              latestVersion: '',
              showUpdateToast: false,
              i18n: {
                newVersionAvailable: getUpdateI18n('newVersionAvailable'),
                currentVersion: getUpdateI18n('currentVersion'),
                viewRelease: getUpdateI18n('viewRelease'),
                updateGuide: getUpdateI18n('updateGuide'),
                later: getUpdateI18n('later')
              },
              init() {
                // Check for updates after a short delay to not block initial render
                setTimeout(() => this.checkForUpdates(), 3000);
              },
              async checkForUpdates() {
                try {
                  // Check if user dismissed this version before
                  const dismissedVersion = localStorage.getItem('sublink_dismissed_version');
                  const lastCheck = localStorage.getItem('sublink_last_version_check');
                  const now = Date.now();
                  
                  // Only check once per hour to avoid rate limiting
                  if (lastCheck && (now - parseInt(lastCheck)) < 3600000) {
                    const cachedVersion = localStorage.getItem('sublink_latest_version');
                    if (cachedVersion && cachedVersion !== dismissedVersion && this.compareVersions(cachedVersion, this.currentVersion) > 0) {
                      this.latestVersion = cachedVersion;
                      this.showUpdateToast = true;
                    }
                    return;
                  }

                  const response = await fetch(apiUrl, {
                    headers: { 'Accept': 'application/vnd.github.v3+json' }
                  });
                  
                  if (!response.ok) return;
                  
                  const data = await response.json();
                  const latestVersion = (data.tag_name || '').replace(/^v/, '');
                  
                  // Cache the result
                  localStorage.setItem('sublink_latest_version', latestVersion);
                  localStorage.setItem('sublink_last_version_check', now.toString());
                  
                  // Compare versions
                  if (latestVersion && latestVersion !== dismissedVersion && this.compareVersions(latestVersion, this.currentVersion) > 0) {
                    this.latestVersion = latestVersion;
                    this.showUpdateToast = true;
                  }
                } catch (error) {
                  console.debug('Version check failed:', error.message);
                }
              },
              compareVersions(v1, v2) {
                const parts1 = v1.split('.').map(Number);
                const parts2 = v2.split('.').map(Number);
                for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                  const p1 = parts1[i] || 0;
                  const p2 = parts2[i] || 0;
                  if (p1 > p2) return 1;
                  if (p1 < p2) return -1;
                }
                return 0;
              },
              dismissUpdate() {
                this.showUpdateToast = false;
                localStorage.setItem('sublink_dismissed_version', this.latestVersion);
              }
            }
          }

          // i18n helper for update checker
          function getUpdateI18n(key) {
            const lang = navigator.language || 'en-US';
            const translations = {
              'zh-CN': {
                newVersionAvailable: '发现新版本',
                currentVersion: '当前版本',
                viewRelease: '查看更新',
                updateGuide: '更新指南',
                later: '稍后提醒'
              },
              'zh-TW': {
                newVersionAvailable: '發現新版本',
                currentVersion: '當前版本',
                viewRelease: '查看更新',
                updateGuide: '更新指南',
                later: '稍後提醒'
              },
              'en-US': {
                newVersionAvailable: 'New Version Available',
                currentVersion: 'Current',
                viewRelease: 'View Release',
                updateGuide: 'Update Guide',
                later: 'Later'
              },
              'fa': {
                newVersionAvailable: 'نسخه جدید موجود است',
                currentVersion: 'نسخه فعلی',
                viewRelease: 'مشاهده نسخه',
                updateGuide: 'راهنمای به‌روزرسانی',
                later: 'بعداً'
              },
              'ru': {
                newVersionAvailable: 'Доступна новая версия',
                currentVersion: 'Текущая',
                viewRelease: 'Посмотреть',
                updateGuide: 'Руководство по обновлению',
                later: 'Позже'
              }
            };
            const langKey = Object.keys(translations).find(k => lang.startsWith(k.split('-')[0])) || 'en-US';
            return translations[langKey][key] || translations['en-US'][key];
          }
        </script>
      </head>
      <body class="bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
        ${children}
      </body>
    </html>
  `
}
