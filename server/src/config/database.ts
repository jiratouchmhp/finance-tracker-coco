import { Sequelize } from 'sequelize';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../data/coco-tracker.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('[DB] SQLite connection established');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('[DB] Models synchronized');
  } catch (error: unknown) {
    console.error('[DB] Connection failed:', error);
    process.exit(1);
  }
}
