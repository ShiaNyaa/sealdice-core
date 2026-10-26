import { globalIgnores } from 'eslint/config'
import {
  configureVueProject,
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

configureVueProject({ scriptLangs: ['ts', 'tsx'] })

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/dev-dist/**',
    '**/coverage/**',
    '**/src/api/generated/**',
    '**/vendor/fake-qq-ui/**',
  ]),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  ...pluginOxlint.configs['flat/recommended'],
  skipFormatting,

  {
    name: 'app/vue-tsx',
    rules: {
      'vue/block-order': [
        'error',
        {
          order: ['template', 'script', 'style'],
        },
      ],
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: ['ts', 'tsx'],
          },
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  {
    name: 'app/file-route-pages',
    files: ['src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    // Vue Bits / Inspira UI 以单文件源码形式引入，组件名保持上游命名。
    name: 'app/vendor-motion-components',
    files: ['src/components/bits/**/*.vue', 'src/components/inspira/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
