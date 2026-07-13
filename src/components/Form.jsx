/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { PREDEFINED_RULE_SETS, UNIFIED_RULES } from '../config/index.js';
import { CustomRules } from './CustomRules.jsx';
import { TextareaWithActions } from './TextareaWithActions.jsx';
import { ValidatedTextarea } from './ValidatedTextarea.jsx';
import { formLogicFn } from './formLogic.js';

const LINK_FIELDS = [
  { key: 'xray', labelKey: 'xrayLink', mode: 'passthrough' },
  { key: 'xrayJson', label: 'Xray JSON', mode: 'converted' },
  { key: 'singbox', labelKey: 'singboxLink', mode: 'converted' },
  { key: 'clash', labelKey: 'clashLink', mode: 'converted' },
  { key: 'surge', labelKey: 'surgeLink', mode: 'converted' }
];

export const Form = (props) => {
  const { t, lang } = props;

  const translations = {
    processing: t('processing'),
    convert: t('convert'),
    saveConfigSuccess: t('saveConfigSuccess'),
    saveConfig: t('saveConfig'),
    savingConfig: t('savingConfig'),
    configContentRequired: t('configContentRequired'),
    configSaveFailed: t('configSaveFailed'),
    confirmClearConfig: t('confirmClearConfig'),
    confirmClearAll: t('confirmClearAll'),
    errorGeneratingLinks: t('errorGeneratingLinks'),
    shortenLinks: t('shortenLinks'),
    shortening: t('shortening'),
    alreadyShortened: t('alreadyShortened'),
    shortenFailed: t('shortenFailed'),
    customShortCode: t('customShortCode'),
    optional: t('optional'),
    customShortCodePlaceholder: t('customShortCodePlaceholder'),
    showFullLinks: t('showFullLinks')
  };

  const scriptContent = `
    window.APP_TRANSLATIONS = ${JSON.stringify(translations)};
    window.PREDEFINED_RULE_SETS = ${JSON.stringify(PREDEFINED_RULE_SETS)};
    window.APP_LANG = ${JSON.stringify(lang || 'zh-CN')};
    if (typeof __name === 'undefined') { var __name = function(fn) { return fn; }; }
    (${formLogicFn.toString()})();
  `;

  return (
    <div x-data="formData()" x-init="init()" class="max-w-5xl mx-auto">
      <form {...{'x-on:submit.prevent': 'submitForm'}} class="space-y-8">

      {/* Input Section */}
      <div class="surface-card p-6 transition-all duration-300 hover:shadow-md group">
        <TextareaWithActions
          id="input"
          name="input"
          label={t('shareUrls')}
          labelPrefix={
            <span class="w-8 h-8 rounded-lg icon-tile flex items-center justify-center">
              <i class="fas fa-link text-sm"></i>
            </span>
          }
          model="input"
          rows={5}
          placeholder={t('urlPlaceholder')}
          required
          labelActionsWrapperClass="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          labelActions={[
            {
              key: 'paste',
              icon: 'fas fa-paste',
              label: t('paste'),
              hideLabelOnMobile: true,
              className:
                'px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1',
              title: t('paste'),
              attrs: {
                'x-on:click': "navigator.clipboard.readText().then(text => input = text).catch(() => {})"
              }
            },
            {
              key: 'clear',
              icon: 'fas fa-times',
              label: t('clear'),
              hideLabelOnMobile: true,
              className:
                'px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1',
              title: t('clear'),
              attrs: {
                'x-on:click': "input = ''",
                'x-show': 'input'
              }
            }
          ]}
        />
      </div>

      {/* Advanced Options Toggle */}
      <div 
        class="surface-card flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" 
        x-on:click="showAdvanced = !showAdvanced"
        role="button"
        tabindex="0"
        {...{
          'x-on:keydown.enter.prevent': 'showAdvanced = !showAdvanced',
          'x-on:keydown.space.prevent': 'showAdvanced = !showAdvanced'
        }}
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg icon-tile flex items-center justify-center">
            <i class="fas fa-sliders-h"></i>
          </div>
          <span class="font-semibold text-gray-900 dark:text-white">{t('advancedOptions')}</span>
        </div>
        <div 
          class="w-8 h-8 flex items-center justify-center rounded-lg format-pill transition-transform duration-300" 
          x-bind:class="{'rotate-180': showAdvanced}"
        >
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>

  {/* Advanced Options Content */ }
  <div x-show="showAdvanced" {...{'x-transition:enter': 'transition ease-out duration-300', 'x-transition:enter-start': 'opacity-0 transform -translate-y-4', 'x-transition:enter-end': 'opacity-100 transform translate-y-0', 'x-transition:leave': 'transition ease-in duration-200', 'x-transition:leave-start': 'opacity-100 transform translate-y-0', 'x-transition:leave-end': 'opacity-0 transform -translate-y-4'}} class="space-y-6">

    {/* Rule Selection */ }
    <div class="surface-card p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="fas fa-filter text-gray-400"></i>
          {t('ruleSelection')}
        </h3>
        <select x-model="selectedPredefinedRule" x-on:change="applyPredefinedRule()" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        <option value="custom">{t('custom')}</option>
        <option value="minimal">{t('minimal')}</option>
        <option value="balanced">{t('balanced')}</option>
        <option value="comprehensive">{t('comprehensive')}</option>
      </select>
          </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {UNIFIED_RULES.map((rule) => (
      <label class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
        <input
          type="checkbox"
          value={rule.name}
          x-model="selectedRules" 
                    x-on:change="selectedPredefinedRule = 'custom'"
        class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {t(`outboundNames.${rule.name}`)}
        </span>
      </label>
    ))}
  </div>

          </div>

  {/* Custom Rules Component */ }
  <CustomRules t={t} />

    {/* General Options */ }
    <div class="surface-card p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i class="fas fa-cog text-gray-400"></i>
              {t('generalSettings')}
            </h3>
            
            <div class="space-y-4">
              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span class="font-medium text-gray-700 dark:text-gray-300">{t('groupByCountry')}</span>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="groupByCountry" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span class="font-medium text-gray-700 dark:text-gray-300">{t('includeAutoSelect')}</span>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="includeAutoSelect" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span>
                  <span class="block font-medium text-gray-700 dark:text-gray-300">{t('allowInsecure')}</span>
                  <span class="block mt-1 text-xs text-amber-700 dark:text-amber-300">{t('allowInsecureTip')}</span>
                </span>
                <div class="relative inline-flex items-center cursor-pointer flex-none">
                  <input type="checkbox" x-model="allowInsecure" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span class="font-medium text-gray-700 dark:text-gray-300">{t('enableClashUI')}</span>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="enableClashUI" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <div
                x-show="enableClashUI"
                {...{
                  'x-transition:enter': 'transition ease-out duration-200',
                  'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
                  'x-transition:enter-end': 'opacity-100 transform translate-y-0',
                  'x-transition:leave': 'transition ease-in duration-150',
                  'x-transition:leave-start': 'opacity-100 transform translate-y-0',
                  'x-transition:leave-end': 'opacity-0 transform -translate-y-2'
                }}
                class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('externalController')}</label>
                  <input type="text" x-model="externalController" class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('externalControllerPlaceholder')} />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('externalUiDownloadUrl')}</label>
                  <input type="text" x-model="externalUiDownloadUrl" class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('externalUiDownloadUrlPlaceholder')} />
                </div>
              </div>
          </div>
          </div>

  {/* Subconverter External Config */}
  <div class="surface-card p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
      <i class="fas fa-file-export text-gray-400"></i>
      {t('subconverterConfigTitle')}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('subconverterConfigDesc')}</p>
    <div class="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <p class="font-mono text-sm text-gray-600 dark:text-gray-400 break-all" x-text="getSubconverterUrl()"></p>
    </div>
    <div class="mt-3 flex justify-end">
      <button
        type="button"
        x-on:click="copySubconverterUrl()"
        class="px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        x-bind:class="subconverterCopied ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
      >
        <i class="fas" x-bind:class="subconverterCopied ? 'fa-check' : 'fa-copy'"></i>
        <span x-text={`subconverterCopied ? '${t('copiedSubconverterUrl')}' : '${t('copySubconverterUrl')}'`}></span>
      </button>
    </div>
  </div>

  {/* Base Config */ }
  <div class="surface-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="fas fa-file-code text-gray-400"></i>
                {t('baseConfigSettings')}
              </h3>
              <select x-model="configType" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="singbox">SingBox (JSON)</option>
                <option value="clash">Clash (YAML)</option>
                <option value="surge">Surge (JSON/INI)</option>
              </select>
          </div>
            
            <ValidatedTextarea
              id="configEditor"
              name="configEditor"
              model="configEditor"
              rows={5}
              placeholder="Paste your custom config here..."
              variant="mono"
              containerClass="mt-0 group"
              labelWrapperClass="flex items-center justify-end mb-2"
              labelActionsWrapperClass="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              pasteLabel={t('paste')}
              clearLabel={t('clear')}
              validation={{
                button: {
                  key: 'validate-config',
                  label: t('validateConfig'),
                  className:
                    'px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2',
                  attrs: {
                    'x-on:click': 'validateBaseConfig()'
                  }
                },
                success: {
                  show: "configValidationState === 'success'",
                  textExpr: 'configValidationMessage'
                },
                error: {
                  show: "configValidationState === 'error'",
                  textExpr: 'configValidationMessage'
                }
              }}
              inlineActionsWrapperClass="absolute bottom-4 right-4 flex gap-2"
              preserveLabelSpace={false}
            />
            
            <div class="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                x-on:click="saveBaseConfig()" 
                x-bind:disabled="savingConfig"
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i class="fas" x-bind:class="savingConfig ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                <span x-text="savingConfig ? savingConfigText : saveConfigText">{t('saveConfig')}</span>
              </button>
              <button type="button" x-on:click="clearBaseConfig()" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm" >
  { t('clearConfig') }
              </button>
          </div>
          </div >

  {/* User Agent */ }
  <div class="surface-card p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i class="fas fa-user-secret text-gray-400"></i>
              {t('UASettings')}
            </h3>
            <input 
              type="text" 
              x-model="customUA" 
              class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              placeholder="curl/7.74.0" 
            />
          </div>
        </div>

  {/* Action Buttons */ }
  <div class="flex flex-col sm:flex-row gap-4">
          <button 
            type="submit" 
            class="action-primary flex-1 py-3.5 px-6 rounded-lg font-bold transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            x-bind:disabled="loading"
          >
            <i class="fas fa-sync-alt" x-bind:class="loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
            <span x-text="loading ? processingText : convertText">{t('convert')}</span>
          </button>

  <button
    type="button" 
            x-on:click="clearAll()"
class="action-secondary px-6 py-3.5 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
  >
  <i class="fas fa-trash-alt"></i>
{ t('clear') }
          </button>
        </div>
      </form>

  {/* Results Section */ }
  <div x-cloak x-show="generatedLinks" x-data="{ copied: null }" {...{'x-transition:enter': 'transition ease-out duration-500', 'x-transition:enter-start': 'opacity-0 transform translate-y-8', 'x-transition:enter-end': 'opacity-100 transform translate-y-0'}} class="mt-12">
    <div class="surface-card p-6 mb-8 transition-all duration-300 hover:shadow-md">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
            <i class="fas fa-link text-sm"></i>
          </span>
          {t('subscriptionLinks')}
        </h2>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <i class="fas fa-desktop text-primary-600"></i>
          <span>客户端</span>
          <select x-model="clientPreset" class="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="all">全部格式</option>
            <option value="v2rayn">v2rayN</option>
            <option value="singbox">Sing-box</option>
            <option value="mihomo">Mihomo / Clash</option>
            <option value="surge">Surge</option>
          </select>
        </label>
      </div>

      <div class="mt-6 space-y-4">
        {LINK_FIELDS.map((field) => (
          <div class="relative group" key={field.key} x-show={`isLinkVisible('${field.key}')`}>
            <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>{field.label || t(field.labelKey)}</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {field.mode === 'passthrough' ? t('rawSubscription') : t('convertedConfig')}
              </span>
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                readonly
                x-bind:value={`shortenedLinks?.${field.key} || generatedLinks?.${field.key}`}
                class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:border-transparent transition-all duration-200 font-mono text-sm"
                x-bind:class="shortenedLinks ? 'text-primary-600 dark:text-primary-400 font-semibold focus:ring-primary-500' : 'text-gray-600 dark:text-gray-400 focus:ring-green-500'"
              />
              <button
                type="button"
                x-on:click={`navigator.clipboard.writeText((shortenedLinks || generatedLinks)?.${field.key}); copied = '${field.key}'; setTimeout(() => copied = null, 2000)`}
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                x-bind:class={`{
                  'hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400': !shortenedLinks,
                  'hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400': shortenedLinks,
                  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': !shortenedLinks && copied === '${field.key}',
                  'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400': shortenedLinks && copied === '${field.key}'
                }`}
              >
                <i class="fas" x-bind:class={`copied === '${field.key}' ? 'fa-check' : 'fa-copy'`}></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div x-show="inspecting || conversionReport" class="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 p-4">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="fas fa-list-check text-primary-600"></i>
            {t('conversionReport')}
          </h3>
          <i x-show="inspecting" class="fas fa-spinner fa-spin text-primary-600"></i>
        </div>
        <div x-show="conversionReport?.overrides?.allowInsecure" class="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <i class="fas fa-triangle-exclamation mr-1"></i>
          {t('insecureOverrideWarning')}
        </div>
        <div x-show="conversionReport" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <template x-for="target in conversionReport?.targets || []" x-bind:key="target.key">
            <div x-show="isReportVisible(target.key)" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <span class="text-sm font-medium text-gray-900 dark:text-white" x-text="target.label"></span>
                  <span x-show="target.mode === 'passthrough'" class="ml-2 text-[11px] text-gray-500 dark:text-gray-400">{t('rawSubscription')}</span>
                  <span x-show="target.mode !== 'passthrough'" class="ml-2 text-[11px] text-gray-500 dark:text-gray-400">{t('convertedConfig')}</span>
                </div>
                <button
                  type="button"
                  x-show="(target.warnings || []).length || target.skipped.length"
                  x-on:click="expandedReportTarget = expandedReportTarget === target.key ? null : target.key"
                  class="shrink-0 text-xs font-medium text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-100"
                >
                  <span x-show="expandedReportTarget !== target.key">{t('reportShowDetails')}</span>
                  <span x-show="expandedReportTarget === target.key">{t('reportHideDetails')}</span>
                </button>
              </div>
              <div class="mt-2 grid grid-cols-3 gap-2 text-xs">
                <span class="text-emerald-700 dark:text-emerald-300">{t('reportSuccess')}: <b x-text="target.success ?? target.converted"></b></span>
                <span class="text-amber-700 dark:text-amber-300">{t('reportWarnings')}: <b x-text="target.warningCount ?? (target.warnings || []).length"></b></span>
                <span class="text-red-700 dark:text-red-300">{t('reportSkipped')}: <b x-text="target.skipped.length"></b></span>
              </div>
              <p x-show="!(target.warnings || []).length && !target.skipped.length" class="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{t('reportAllCompatible')}</p>
              <div x-show="expandedReportTarget === target.key" class="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                <template x-for="item in [...(target.warnings || []), ...target.skipped]" x-bind:key="`${item.name}-${item.code}`">
                  <div class="text-xs leading-5">
                    <span class="font-medium text-gray-800 dark:text-gray-200" x-text="`${item.name} (${item.type})`"></span>
                    <p class="text-gray-600 dark:text-gray-400" x-text="item.reason"></p>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
        <div x-show="conversionReport?.parseIssues?.length" class="mt-3 text-xs text-red-600 dark:text-red-300">
          <span class="font-semibold">{t('parseIssues')}:</span>
          <span x-text="conversionReport?.parseIssues?.map(item => item.reason).join('；')"></span>
        </div>
      </div>

      {/* Shortening Controls */}
      <div class="mt-6">
        <div class="flex flex-col items-center gap-3">
          <div class="w-full max-w-md">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              {t('customShortCode')} <span class="text-gray-400">({t('optional')})</span>
            </label>
            <input
              type="text"
              x-model="customShortCode"
              placeholder={t('customShortCodePlaceholder')}
              class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-center"
            />
          </div>
          <label class="w-full max-w-md">
            <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">短链接有效期</span>
            <select x-model="shortLinkTtl" class="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="">永久有效</option>
              <option value="86400">1 天</option>
              <option value="604800">7 天</option>
              <option value="2592000">30 天</option>
            </select>
          </label>
        </div>
        <div class="flex justify-center mt-4">
          <button
            type="button"
            x-on:click="shortenedLinks ? shortenedLinks = null : shortenLinks()"
            x-bind:disabled="!shortenedLinks && shortening"
            class="px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
            x-bind:class="shortenedLinks
              ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              : 'action-primary disabled:opacity-50 disabled:cursor-not-allowed'"
          >
            <i
              class="fas"
              x-bind:class="shortenedLinks ? 'fa-expand-alt' : (shortening ? 'fa-spinner fa-spin' : 'fa-compress-alt')"
            ></i>
            <span
              x-text="shortenedLinks ? showFullLinksText : (shortening ? shorteningText : shortenLinksText)"
            ></span>
          </button>
        </div>
      </div>

      <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5">
        <div class="flex flex-col sm:flex-row sm:items-end gap-3">
          <label class="flex-1">
            <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">短链接管理令牌</span>
            <input type="password" x-model="shortLinkAdminToken" autocomplete="off" class="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </label>
          <button type="button" x-on:click="loadManagedShortLinks()" x-bind:disabled="managingShortLinks" title="查看短链接" class="w-10 h-10 rounded-lg format-pill hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 flex items-center justify-center">
            <i class="fas" x-bind:class="managingShortLinks ? 'fa-spinner fa-spin' : 'fa-rotate-right'"></i>
          </button>
        </div>
        <p x-show="shortLinkManagerError" class="mt-3 text-sm text-red-600 dark:text-red-300" x-text="shortLinkManagerError"></p>
        <div x-show="managedShortLinks.length" class="mt-4 space-y-2">
          <template x-for="entry in managedShortLinks" x-bind:key="`${entry.target}:${entry.code}`">
            <div class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
              <span class="font-mono text-gray-900 dark:text-white" x-text="`/${entry.target}/${entry.code}`"></span>
              <span class="ml-auto text-xs text-gray-500 dark:text-gray-400" x-text="entry.expiresAt ? `到期：${new Date(entry.expiresAt).toLocaleString()}` : '永久有效'"></span>
              <button type="button" x-on:click="deleteManagedShortLink(entry)" title="删除短链接" class="w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </div>
  );
};
