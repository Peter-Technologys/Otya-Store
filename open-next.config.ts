import { defineCloudflareConfig } from '@opennextjs/cloudflare'
export default defineCloudflareConfig({
  worker: {
    entrypoint: './src/index.js',
  },
})
