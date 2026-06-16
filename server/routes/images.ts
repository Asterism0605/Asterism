import { Router } from 'express';
import { pool } from '../db';
import { toStyleImage } from '../transform';
import type { ImageRow } from '../transform';

export const imagesRouter = Router();

imagesRouter.get('/api/images', async (_req, res) => {
  const { rows } = await pool.query<ImageRow>('SELECT * FROM images');
  res.json(rows.map(toStyleImage));
});
