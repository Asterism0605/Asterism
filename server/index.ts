import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { imagesRouter } from './routes/images';

const app = express();
const PORT = process.env.SERVER_PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use(imagesRouter);

app.listen(PORT, () => {
  console.log(`Demo API listening on http://localhost:${PORT}`);
});
