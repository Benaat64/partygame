export function socketOptions(env = process.env) {
  const origins = (env.CLIENT_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean).map(value => {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('CLIENT_ORIGINS doit contenir des origines HTTP(S), sans chemin.');
    }
    return url.origin;
  });
  return origins.length ? { cors: { origin: origins, methods: ['GET', 'POST'] } } : {};
}
