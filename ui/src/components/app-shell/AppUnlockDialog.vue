<template>
  <n-modal
    :show="showDialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="false"
    transform-origin="center"
    class="unlock-modal"
    :bordered="false"
  >
    <div class="unlock-card">
      <span class="unlock-badge" aria-hidden="true">
        <i-tabler-lock />
      </span>
      <h2 class="unlock-title">解锁控制台</h2>
      <p class="unlock-subtitle">输入 UI 密码以继续访问海豹核心。</p>

      <form class="unlock-form" novalidate @submit.prevent="submit">
        <n-input
          v-model:value="password"
          type="password"
          size="large"
          show-password-on="click"
          placeholder="UI 密码"
          :disabled="authSession.signinMutation.isPending.value"
          :status="errors.password ? 'error' : undefined"
          autofocus
        />
        <p v-if="errors.password" class="unlock-field-error">{{ errors.password }}</p>

        <n-button
          type="primary"
          size="large"
          block
          attr-type="submit"
          :loading="authSession.signinMutation.isPending.value"
        >
          进入控制台
        </n-button>
      </form>

      <p v-if="errorText" class="unlock-server-error">{{ errorText }}</p>

      <p class="unlock-hint">
        密码可在
        <strong>综合设置 → 基本设置</strong>
        中修改。
      </p>
    </div>
  </n-modal>

  <n-modal
    v-model:show="dialogCheckPassword"
    :closable="false"
    preset="card"
    title="建议设置界面密码"
    :mask-closable="false"
    transform-origin="center"
    class="security-modal"
  >
    <p class="security-copy">
      如果服务暴露在公网，请前往 <strong>综合设置 → 基本设置</strong> 设置
      <strong>UI 界面密码</strong>，或改为仅本机访问。
    </p>
    <p class="security-warning">如果不确定这意味着什么，请务必设置一个密码。</p>

    <template #footer>
      <div class="security-actions">
        <n-button type="primary" @click="dialogCheckPassword = false">我已知晓</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { getSdApiV2BaseSecurityCheck } from '@/api';
import { getErrorMessage } from '@/features/auth/error';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { notifyError } from '@/features/feedback/notifyError';

const authSession = useAuthSession();
const message = useMessage();
const dialogCheckPassword = ref(false);
const canSkipSecurityDialog = ref(false);
const hasCheckedSecurity = ref(false);

const schema = toTypedSchema(
  z.object({
    password: z.string().min(1, '请输入 UI 密码'),
  })
);

// 本地校验只拦空值，密码是否正确仍以后端返回为准。
const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { password: '' },
});

const [password] = defineField('password');

const showDialog = computed(() => authSession.needsUnlock.value);
const canCheckSecurity = computed(
  () => authSession.hasAccessToken.value && !authSession.isInitializing.value
);
// 后端对密码错误返回英文 message，这里统一成本地文案，避免中英混排。
const errorText = computed(() => {
  if (!authSession.signinMutation.isError.value) return '';
  const raw = getErrorMessage(authSession.signinMutation.error.value, '密码错误');
  return /invalid password|unauthorized|incorrect/i.test(raw) ? '密码错误，请重新输入' : raw;
});

const submit = handleSubmit(async values => {
  try {
    await authSession.signin({ password: values.password });
  } catch (error) {
    notifyError(error, message, errorText.value || '密码错误');
    resetForm();
    return;
  }

  resetForm();
  message.success('登录成功，欢迎回来');
  void checkPasswordSecurity().catch(() => {
    hasCheckedSecurity.value = false;
  });
});

async function checkPasswordSecurity() {
  if (hasCheckedSecurity.value || !canCheckSecurity.value) return;
  hasCheckedSecurity.value = true;
  try {
    const result = await getSdApiV2BaseSecurityCheck({ throwOnError: true });
    if (!result.data.item) {
      dialogCheckPassword.value = true;
      canSkipSecurityDialog.value = false;
    }
  } catch {
    hasCheckedSecurity.value = false;
  }
}

watch(
  canCheckSecurity,
  canAccess => {
    if (canAccess) {
      void checkPasswordSecurity();
    } else if (!authSession.hasAccessToken.value) {
      hasCheckedSecurity.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Naive 的 card 模态没有内建宽度上限，这里显式收窄，避免在宽屏上铺满。 */
:global(.security-modal) {
  width: min(480px, calc(100vw - 2rem));
}

.unlock-card {
  display: flex;
  width: min(400px, calc(100vw - 2rem));
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--sd-border);
  border-radius: 20px;
  background: var(--sd-bg-elevated);
  box-shadow: var(--sd-shadow-floating);
  padding: 2.25rem 2rem 1.75rem;
  text-align: center;
}

.unlock-badge {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sd-primary-border);
  border-radius: var(--sd-radius-md);
  background: var(--sd-primary-soft);
  color: var(--sd-primary);
  font-size: 22px;
  margin-bottom: 1rem;
}

.unlock-title {
  margin: 0;
  color: var(--sd-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.unlock-subtitle {
  margin: 0.35rem 0 0;
  color: var(--sd-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}

.unlock-form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.4rem;
}

.unlock-field-error {
  margin: -0.15rem 0 0;
  color: var(--sd-error);
  font-size: 0.75rem;
  text-align: left;
}

.unlock-server-error {
  width: 100%;
  margin: 0.75rem 0 0;
  border-radius: var(--sd-radius-sm);
  background: var(--sd-error-soft);
  color: var(--sd-error);
  font-size: 0.75rem;
  line-height: 1.5;
  padding: 0.5rem 0.65rem;
  text-align: left;
}

.unlock-hint {
  margin: 1.1rem 0 0;
  color: var(--sd-text-muted);
  font-size: 0.6875rem;
}

.unlock-hint strong {
  color: var(--sd-text-secondary);
  font-weight: 520;
}

.security-copy {
  margin: 0;
  color: var(--sd-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.7;
}

.security-copy strong {
  color: var(--sd-text-primary);
  font-weight: 560;
}

.security-warning {
  margin: 0.85rem 0 0;
  border-left: 2px solid var(--sd-warning);
  color: var(--sd-warning);
  font-size: 0.8125rem;
  padding-left: 0.6rem;
}

.security-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
