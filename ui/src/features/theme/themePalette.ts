import { generate } from '@ant-design/colors';
import type { GlobalThemeOverrides } from 'naive-ui';
import type { ResolvedTheme } from './themeState';

export type ThemeColorKey = 'primary' | 'success' | 'warning' | 'error';
export type ThemePalette = Record<ThemeColorKey, string>;

type ComponentColorKey = ThemeColorKey | 'info';

export const THEME_COLOR_KEYS: ThemeColorKey[] = ['primary', 'success', 'warning', 'error'];

// 应用仅维护四种有彩语义。info 是组件库兼容名称，始终映射到 primary。
export const DEFAULT_THEME_PALETTE: ThemePalette = {
  primary: '#2f5fe0',
  success: '#16794a',
  warning: '#9a6408',
  error: '#cf2f36',
};
// 深色下提亮语义色，保证在近黑表面上仍有足够对比。
export const DARK_THEME_PALETTE: ThemePalette = {
  primary: '#6f96ff',
  success: '#4fbd86',
  warning: '#d8a24a',
  error: '#f2757a',
};
const componentColorKeys: ComponentColorKey[] = ['primary', 'info', 'success', 'warning', 'error'];
const darkBackground = '#0f131c';

export function paletteFor(theme: ResolvedTheme): ThemePalette {
  return theme === 'dark' ? DARK_THEME_PALETTE : DEFAULT_THEME_PALETTE;
}

const colorTokenNames: Record<
  ComponentColorKey,
  {
    base: keyof NonNullable<GlobalThemeOverrides['common']>;
    hover: keyof NonNullable<GlobalThemeOverrides['common']>;
    pressed: keyof NonNullable<GlobalThemeOverrides['common']>;
    suppl: keyof NonNullable<GlobalThemeOverrides['common']>;
  }
> = {
  primary: {
    base: 'primaryColor',
    hover: 'primaryColorHover',
    pressed: 'primaryColorPressed',
    suppl: 'primaryColorSuppl',
  },
  info: {
    base: 'infoColor',
    hover: 'infoColorHover',
    pressed: 'infoColorPressed',
    suppl: 'infoColorSuppl',
  },
  success: {
    base: 'successColor',
    hover: 'successColorHover',
    pressed: 'successColorPressed',
    suppl: 'successColorSuppl',
  },
  warning: {
    base: 'warningColor',
    hover: 'warningColorHover',
    pressed: 'warningColorPressed',
    suppl: 'warningColorSuppl',
  },
  error: {
    base: 'errorColor',
    hover: 'errorColorHover',
    pressed: 'errorColorPressed',
    suppl: 'errorColorSuppl',
  },
};

function getPaletteColor(key: ComponentColorKey, theme: ResolvedTheme): string {
  const palette = paletteFor(theme);
  return key === 'info' ? palette.primary : palette[key];
}

function getGeneratedColor(color: string, index: number, theme: ResolvedTheme): string {
  const colors =
    theme === 'dark'
      ? generate(color, { theme: 'dark', backgroundColor: darkBackground })
      : generate(color);
  return colors[index] ?? color;
}

function hexToRgb(color: string): [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(start: string, end: string, ratio: number): string {
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);
  return rgbToHex(
    startRgb.map((value, index) => value + (endRgb[index] - value) * ratio) as [
      number,
      number,
      number,
    ]
  );
}

function relativeLuminance(color: string): number {
  return hexToRgb(color)
    .map(channel => channel / 255)
    .map(channel => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getAccessibleSemanticColor(color: string, theme: ResolvedTheme): string {
  const background = theme === 'dark' ? '#0f131c' : '#ffffff';
  const target = theme === 'dark' ? '#ffffff' : '#101724';
  if (contrastRatio(color, background) >= 4.5) return color;

  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixHex(color, target, step / 20);
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return target;
}

function getButtonTextColor(background: string): string {
  return contrastRatio('#ffffff', background) >= contrastRatio('#111827', background)
    ? '#ffffff'
    : '#111827';
}

function createStatusColorOverrides(
  key: ComponentColorKey,
  theme: ResolvedTheme
): NonNullable<GlobalThemeOverrides['common']> {
  const color = getPaletteColor(key, theme);
  const tokenNames = colorTokenNames[key];
  const accessibleColor = getAccessibleSemanticColor(color, theme);
  const accessibleHoverColor = getAccessibleSemanticColor(
    getGeneratedColor(color, 4, theme),
    theme
  );
  const accessiblePressedColor = getAccessibleSemanticColor(
    getGeneratedColor(color, 6, theme),
    theme
  );

  return {
    [tokenNames.base]: accessibleColor,
    [tokenNames.hover]: accessibleHoverColor,
    [tokenNames.pressed]: accessiblePressedColor,
    [tokenNames.suppl]: accessibleHoverColor,
  };
}

function createButtonColorOverrides(
  key: ComponentColorKey,
  theme: ResolvedTheme
): Record<string, string> {
  const color = getPaletteColor(key, theme);
  const typeName = `${key[0].toUpperCase()}${key.slice(1)}`;
  const accessibleColor = getAccessibleSemanticColor(color, theme);
  const accessibleHoverColor = getAccessibleSemanticColor(
    getGeneratedColor(color, 4, theme),
    theme
  );
  const accessiblePressedColor = getAccessibleSemanticColor(
    getGeneratedColor(color, 6, theme),
    theme
  );
  const buttonTextColor = getButtonTextColor(accessibleColor);
  const buttonHoverTextColor = getButtonTextColor(accessibleHoverColor);
  const buttonPressedTextColor = getButtonTextColor(accessiblePressedColor);

  return {
    [`color${typeName}`]: accessibleColor,
    [`colorHover${typeName}`]: accessibleHoverColor,
    [`colorPressed${typeName}`]: accessiblePressedColor,
    [`colorFocus${typeName}`]: accessibleHoverColor,
    [`colorDisabled${typeName}`]: accessibleColor,
    [`textColor${typeName}`]: buttonTextColor,
    [`textColorHover${typeName}`]: buttonHoverTextColor,
    [`textColorPressed${typeName}`]: buttonPressedTextColor,
    [`textColorFocus${typeName}`]: buttonHoverTextColor,
    [`textColorDisabled${typeName}`]: buttonTextColor,
    [`textColorText${typeName}`]: accessibleColor,
    [`textColorTextHover${typeName}`]: accessibleHoverColor,
    [`textColorTextPressed${typeName}`]: accessiblePressedColor,
    [`textColorTextFocus${typeName}`]: accessibleHoverColor,
    [`textColorTextDisabled${typeName}`]: accessibleColor,
    [`textColorGhost${typeName}`]: accessibleColor,
    [`textColorGhostHover${typeName}`]: accessibleHoverColor,
    [`textColorGhostPressed${typeName}`]: accessiblePressedColor,
    [`textColorGhostFocus${typeName}`]: accessibleHoverColor,
    [`textColorGhostDisabled${typeName}`]: accessibleColor,
  } as Record<string, string>;
}

function createCommonOverrides(theme: ResolvedTheme): NonNullable<GlobalThemeOverrides['common']> {
  const common = componentColorKeys.reduce<Record<string, string>>(
    (result, key) => {
      return {
        ...result,
        ...createStatusColorOverrides(key, theme),
      };
    },
    {
      borderRadius: 'var(--sd-radius-md)',
      borderRadiusSmall: 'var(--sd-radius-sm)',
      fontFamily: 'var(--sd-font-sans)',
      fontFamilyMono: 'var(--sd-font-code)',
      fontWeightStrong: '600',
      lineHeight: '1.6',
      heightTiny: '24px',
      heightSmall: '28px',
      heightMedium: '32px',
      heightLarge: '36px',
      // Naive 会对部分颜色做 alpha 计算，这里必须给可解析的具体色值，
      // 不能使用 var()（seemly/rgba 无法解析 CSS 变量）。
      textColorBase: theme === 'dark' ? '#f2f5fa' : '#101724',
      textColor1: theme === 'dark' ? '#f2f5fa' : '#101724',
      textColor2: theme === 'dark' ? '#a5afc0' : '#4d596c',
      textColor3: theme === 'dark' ? '#6d7788' : '#838e9f',
      textColorDisabled: theme === 'dark' ? '#6d7788' : '#838e9f',
      placeholderColor: theme === 'dark' ? '#6d7788' : '#838e9f',
      borderColor: theme === 'dark' ? '#1e2531' : '#e2e6ee',
      dividerColor: theme === 'dark' ? '#171d27' : '#eceff4',
      hoverColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.055)' : 'rgba(15, 23, 36, 0.045)',
      pressedColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 36, 0.075)',
      inputColor: theme === 'dark' ? '#151b26' : '#f1f3f8',
      inputColorDisabled: theme === 'dark' ? '#161c28' : '#eef1f6',
      modalColor: theme === 'dark' ? '#0f131c' : '#ffffff',
      popoverColor: theme === 'dark' ? '#121722' : '#ffffff',
      cardColor: theme === 'dark' ? '#0f131c' : '#ffffff',
      bodyColor: theme === 'dark' ? '#090c13' : '#f2f4f8',
      tableColor: 'transparent',
      tableHeaderColor: 'transparent',
      tagColor: theme === 'dark' ? '#151b26' : '#f1f3f8',
      scrollbarColor: theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(16,23,36,0.18)',
      scrollbarColorHover: theme === 'dark' ? 'rgba(255,255,255,0.24)' : 'rgba(16,23,36,0.3)',
      boxShadow1: theme === 'dark'
        ? '0 1px 2px rgba(0,0,0,0.4), 0 10px 28px -18px rgba(0,0,0,0.6)'
        : '0 1px 2px rgba(16,23,36,0.04), 0 8px 24px -16px rgba(16,23,36,0.16)',
      boxShadow2: theme === 'dark'
        ? '0 1px 2px rgba(0,0,0,0.5), 0 16px 40px -16px rgba(0,0,0,0.7)'
        : '0 1px 2px rgba(16,23,36,0.05), 0 12px 32px -12px rgba(16,23,36,0.18)',
      boxShadow3: theme === 'dark'
        ? '0 1px 2px rgba(0,0,0,0.5), 0 16px 40px -16px rgba(0,0,0,0.7)'
        : '0 1px 2px rgba(16,23,36,0.05), 0 12px 32px -12px rgba(16,23,36,0.18)',
    }
  );

  return common;
}

// 侧边栏与顶栏改为浅色壳：菜单文字走正文色，选中态只留极淡底色。
const sharedMenuOverrides: NonNullable<GlobalThemeOverrides['Menu']> = {
  itemTextColor: 'var(--sd-text-secondary)',
  itemTextColorHover: 'var(--sd-text-primary)',
  itemTextColorActive: 'var(--sd-text-primary)',
  itemTextColorActiveHover: 'var(--sd-text-primary)',
  itemTextColorChildActive: 'var(--sd-text-primary)',
  itemTextColorChildActiveHover: 'var(--sd-text-primary)',
  itemIconColor: 'var(--sd-text-muted)',
  itemIconColorHover: 'var(--sd-text-secondary)',
  itemIconColorActive: 'var(--sd-primary)',
  itemIconColorActiveHover: 'var(--sd-primary)',
  itemIconColorChildActive: 'var(--sd-primary)',
  itemIconColorChildActiveHover: 'var(--sd-primary)',
  itemIconColorCollapsed: 'var(--sd-text-secondary)',
  itemIconColorCollapsedInverted: 'var(--sd-text-secondary)',
  arrowColor: 'var(--sd-text-muted)',
  arrowColorHover: 'var(--sd-text-secondary)',
  arrowColorActive: 'var(--sd-text-secondary)',
  arrowColorChildActive: 'var(--sd-text-secondary)',
  arrowColorChildActiveHover: 'var(--sd-text-primary)',
  itemColorHover: 'var(--sd-bg-sidebar-hover)',
  itemColorActive: 'var(--sd-bg-sidebar-selected)',
  itemColorActiveHover: 'var(--sd-bg-sidebar-selected-strong)',
  itemColorActiveCollapsed: 'var(--sd-bg-sidebar-selected)',
  itemHeight: '36px',
  borderRadius: 'var(--sd-radius-md)',
  fontSize: '0.8125rem',
};

const sharedLayoutOverrides: NonNullable<GlobalThemeOverrides['Layout']> = {
  color: 'var(--sd-bg-shell)',
  siderColor: 'var(--sd-bg-sidebar)',
  headerColor: 'var(--sd-bg-shell)',
  footerColor: 'var(--sd-bg-shell)',
  colorEmbedded: 'var(--sd-bg-page)',
};const sharedSwitchOverrides: NonNullable<GlobalThemeOverrides['Switch']> = {
  railColor: 'var(--sd-border)',
  railColorActive: 'var(--sd-primary)',
  loadingColor: 'var(--sd-primary)',
  buttonColor: 'var(--sd-text-inverse)',
  buttonBoxShadow: 'none',
  boxShadowFocus: '0 0 0 3px var(--sd-primary-border)',
  railHeightSmall: '18px',
  railHeightMedium: '20px',
  railHeightLarge: '24px',
  railWidthSmall: '30px',
  railWidthMedium: '36px',
  railWidthLarge: '44px',
  buttonHeightSmall: '14px',
  buttonHeightMedium: '16px',
  buttonHeightLarge: '20px',
  buttonWidthSmall: '14px',
  buttonWidthMedium: '16px',
  buttonWidthLarge: '20px',
  buttonWidthPressedSmall: '18px',
  buttonWidthPressedMedium: '20px',
  buttonWidthPressedLarge: '24px',
};

export function createThemeOverrides(theme: ResolvedTheme): GlobalThemeOverrides {
  const overrides: GlobalThemeOverrides = {
    common: createCommonOverrides(theme),
    Button: {
      ...(componentColorKeys.reduce<Record<string, string>>(
        (result, key) => ({
          ...result,
          ...createButtonColorOverrides(key, theme),
        }),
        {}
      ) as NonNullable<GlobalThemeOverrides['Button']>),
      fontWeight: '500',
      borderRadiusTiny: 'var(--sd-radius-xs)',
      borderRadiusSmall: 'var(--sd-radius-sm)',
      borderRadiusMedium: 'var(--sd-radius-sm)',
      borderRadiusLarge: 'var(--sd-radius-sm)',
      heightTiny: '24px',
      heightSmall: '28px',
      heightMedium: '32px',
      heightLarge: '36px',
    },
    Card: {
      borderRadius: 'var(--sd-radius-lg)',
      color: 'var(--sd-bg-elevated)',
      borderColor: 'var(--sd-border)',
      paddingMedium: '20px 22px',
    },
    Input: {
      borderRadius: 'var(--sd-radius-sm)',
      color: theme === 'dark' ? '#151b26' : '#f1f3f8',
      colorFocus: theme === 'dark' ? '#0f131c' : '#ffffff',
      border: '1px solid transparent',
      borderHover: theme === 'dark' ? '1px solid #1e2531' : '1px solid #e2e6ee',
      borderFocus: `1px solid ${paletteFor(theme).primary}`,
      boxShadowFocus: `0 0 0 3px ${theme === 'dark' ? 'rgba(111,150,255,0.18)' : 'rgba(47,95,224,0.12)'}`,
    },
    Tabs: {
      tabFontWeightActive: '600',
      tabTextColorActiveLine: theme === 'dark' ? '#f2f5fa' : '#101724',
      tabTextColorHoverLine: theme === 'dark' ? '#f2f5fa' : '#101724',
      barColor: paletteFor(theme).primary,
    },
    Menu: sharedMenuOverrides,
    Layout: sharedLayoutOverrides,
    Switch: sharedSwitchOverrides,
    Dialog: {
      borderRadius: 'var(--sd-radius-lg)',
      color: 'var(--sd-bg-elevated)',
      padding: '22px 24px',
    },
    Drawer: {
      color: 'var(--sd-bg-sidebar)',
      borderRadius: '0',
    },
    Dropdown: {
      color: 'var(--sd-bg-elevated)',
      borderRadius: 'var(--sd-radius-md)',
    },
    Popover: {
      color: 'var(--sd-bg-elevated)',
      borderRadius: 'var(--sd-radius-md)',
    },
    Tag: {
      borderRadius: 'var(--sd-radius-xs)',
    },
    DataTable: {
      thColor: 'transparent',
      tdColor: 'transparent',
      tdColorHover: theme === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(15,23,36,0.045)',
      hoverColor: theme === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(15,23,36,0.045)',
      borderColor: theme === 'dark' ? '#171d27' : '#eceff4',
      thFontWeight: '500',
      thTextColor: 'var(--sd-text-muted)',
    },
  };

  return overrides;
}

export function syncDocumentThemePalette(root: HTMLElement | undefined): void {
  if (!root) return;

  const theme = root.dataset?.theme === 'dark' ? 'dark' : 'light';
  const palette = paletteFor(theme);
  const resolvedColors = Object.fromEntries(
    THEME_COLOR_KEYS.map(key => [key, getAccessibleSemanticColor(palette[key], theme)])
  ) as ThemePalette;

  for (const key of THEME_COLOR_KEYS) {
    root.style.setProperty(`--sd-${key}`, resolvedColors[key]);
  }

  // 兼容组件库的 info API；它不是独立语义色。
  root.style.setProperty('--sd-info', resolvedColors.primary);
  root.style.setProperty('--sd-accent', resolvedColors.primary);
  root.style.setProperty(
    '--sd-accent-strong',
    getAccessibleSemanticColor(getGeneratedColor(palette.primary, 6, theme), theme)
  );
}
