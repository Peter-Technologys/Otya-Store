interface OtyaSecretsStoreSecret {
  get(): Promise<string>
}

declare interface CloudflareEnvExtensions {
  TELEGRAM_BOT_TOKEN?: OtyaSecretsStoreSecret
  TELEGRAM_WEBHOOK_SECRET?: OtyaSecretsStoreSecret
}
