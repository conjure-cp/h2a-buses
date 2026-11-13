import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    ignores: ['dist/**', 'node_modules/**', 'src/assets/fontawesome/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.base,
  {
    files: ['src/components/Card.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  skipFormatting,
)
