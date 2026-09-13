import mongoose, { Types } from 'mongoose';
import { AppError } from '../types/error.type';

export interface RetrievedDocument { id: string; title: string; content: string; category: string; score: number }

export async function vectorSearch(query: string, userId: string): Promise<RetrievedDocument[]> {
  if (!query.trim() || !Types.ObjectId.isValid(userId)) throw new AppError('Consulta o usuario inválidos', 'INVALID_SEARCH', 400);
  const db = mongoose.connection.db;
  if (!db) throw new AppError('La base de datos no está conectada', 'DATABASE_UNAVAILABLE', 503);
  const index = process.env.DOCUMENTS_VECTOR_INDEX || 'document_embedding';
  return db.collection('documents').aggregate<RetrievedDocument>([
    { $vectorSearch: {
      index, path: process.env.DOCUMENTS_VECTOR_PATH || 'content', query: query.trim(),
      numCandidates: 100, limit: 5, filter: { id_user: new Types.ObjectId(userId) },
    } },
    { $project: { _id: 0, id: { $toString: '$_id' }, title: 1, content: 1, category: 1, score: { $meta: 'vectorSearchScore' } } },
  ], { maxTimeMS: 20000 }).toArray();
}
