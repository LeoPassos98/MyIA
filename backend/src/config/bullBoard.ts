// backend/src/config/bullBoard.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bull';

export interface BullBoardConfig {
  basePath: string;
  username: string;
  password: string;
}

export const bullBoardConfig: BullBoardConfig = {
  basePath: process.env.BULL_BOARD_PATH || '/admin/queues',
  username: process.env.BULL_BOARD_USERNAME || 'admin',
  password: process.env.BULL_BOARD_PASSWORD || 'admin123'
};

export function setupBullBoard(queues: Queue[]): ExpressAdapter {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(bullBoardConfig.basePath);

  createBullBoard({
    queues: queues.map(queue => new BullAdapter(queue)),
    serverAdapter
  });

  return serverAdapter;
}
