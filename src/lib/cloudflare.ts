import { getCloudflareContext } from '../cloudflare';

// Função para criar o contexto do Cloudflare
export function getCloudflareContext() {
  // @ts-ignore
  const ctx = process.platformContext;
  if (!ctx) {
    throw new Error('Cloudflare context not available');
  }
  
  return {
    DB: ctx.env.DB,
    env: ctx.env,
  };
}
