import { Router } from 'express';

export function createHealthRouter(mlService) {
  const router = Router();

  router.get('/health', async (_request, response) => {
    response.json({
      status: 'ok',
      service: 'mine-subsidence-backend',
      mlService: await mlService.health()
    });
  });

  return router;
}
