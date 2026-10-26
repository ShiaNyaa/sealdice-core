import { addIcon } from '@iconify/vue';
import activity from '@iconify-icons/tabler/activity';
import adjustments from '@iconify-icons/tabler/adjustments-horizontal';
import archive from '@iconify-icons/tabler/archive';
import book2 from '@iconify-icons/tabler/book-2';
import books from '@iconify-icons/tabler/books';
import cards from '@iconify-icons/tabler/cards';
import command from '@iconify-icons/tabler/command';
import dice5 from '@iconify-icons/tabler/dice-5';
import fileCode from '@iconify-icons/tabler/file-code';
import home from '@iconify-icons/tabler/home';
import infoCircle from '@iconify-icons/tabler/info-circle';
import menu from '@iconify-icons/tabler/menu-2';
import messageCog from '@iconify-icons/tabler/message-cog';
import messages from '@iconify-icons/tabler/messages';
import packages from '@iconify-icons/tabler/packages';
import photo from '@iconify-icons/tabler/photo';
import plug from '@iconify-icons/tabler/plug-connected';
import puzzle from '@iconify-icons/tabler/puzzle';
import settings from '@iconify-icons/tabler/settings';
import settingsExclamation from '@iconify-icons/tabler/settings-exclamation';
import shield from '@iconify-icons/tabler/shield-exclamation';
import tool from '@iconify-icons/tabler/tool';
import userCancel from '@iconify-icons/tabler/user-cancel';
import usersGroup from '@iconify-icons/tabler/users-group';

/**
 * 只注册导航会用到的图标数据：@iconify/vue 在运行时按名称取图标，
 * 这里显式离线注册，避免内网部署时向公共 API 请求图标。
 */
const navigationIcons = {
  activity,
  'adjustments-horizontal': adjustments,
  archive,
  'book-2': book2,
  books,
  cards,
  command,
  'dice-5': dice5,
  'file-code': fileCode,
  home,
  'info-circle': infoCircle,
  'menu-2': menu,
  'message-cog': messageCog,
  messages,
  packages,
  photo,
  'plug-connected': plug,
  puzzle,
  settings,
  'settings-exclamation': settingsExclamation,
  'shield-exclamation': shield,
  tool,
  'user-cancel': userCancel,
  'users-group': usersGroup,
} as const;

export type NavigationIconName = keyof typeof navigationIcons;

for (const [name, data] of Object.entries(navigationIcons)) {
  addIcon(`tabler:${name}`, data);
}

export function resolveNavigationIcon(name?: string): string {
  if (name && name in navigationIcons) return `tabler:${name}`;
  return 'tabler:menu-2';
}
