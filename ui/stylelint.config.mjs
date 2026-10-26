export default {
  extends: ['stylelint-config-recommended-vue'],
  rules: {
    // 设计系统里的类名带业务前缀与 BEM 变体，不强制 kebab-case 之外的模式。
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    // 页面级样式常按组件顺序覆盖，不强制书写顺序的严格递减。
    'no-descending-specificity': null,
    // Tailwind 指令不是标准 CSS at-rule。
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'screen', 'layer', 'variants', 'responsive', 'theme'],
      },
    ],
    'function-no-unknown': [true, { ignoreFunctions: ['theme'] }],
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['deep', 'global', 'slotted'] },
    ],
    'selector-pseudo-element-no-unknown': [true, { ignorePseudoElements: ['v-deep', 'v-global'] }],
    // 模板内联 style 属性是声明序列，不是规则块，避免误报。
    'no-invalid-position-declaration': null,
    'comment-empty-line-before': null,
    'declaration-empty-line-before': null,
  },
  ignoreFiles: ['dist/**', 'coverage/**', 'src/api/generated/**', 'public/**'],
};
