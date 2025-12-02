import type { SslMode } from '@mathesar/api/rpc/servers';

export interface SslModeOption {
  value: SslMode;
  labelKey: string;
}

/**
 * SSL mode options with i18n label keys.
 * Use with svelte-i18n's $_ function to get translated labels.
 */
export const sslModeOptions: SslModeOption[] = [
  { value: 'prefer', labelKey: 'ssl_mode_prefer' },
  { value: 'require', labelKey: 'ssl_mode_require' },
  { value: 'disable', labelKey: 'ssl_mode_disable' },
];
