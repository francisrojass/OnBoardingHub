import app from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';
import { syncTemplatesWithDB } from './modules/sandbox-templates/template.service';

app.listen(ENV.PORT, async () => {
  logger.info(`Server running on http://localhost:${ENV.PORT}`);
  logger.info(`Health check: http://localhost:${ENV.PORT}/api/health`);

  // Auto-sync: read docker/sandboxes/*/metadata.json → upsert Box records
  try {
    const count = await syncTemplatesWithDB();
    logger.info(`🔄 Sync completado: ${count} boxes sincronizadas desde templates`);
  } catch (err: any) {
    logger.error(`Error en sync de templates: ${err.message}`);
  }
});
