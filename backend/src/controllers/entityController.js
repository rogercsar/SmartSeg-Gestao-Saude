import crypto from 'crypto';
import { supabase } from '../config/db.js';

function sanitizeTableName(name) {
  if (!name || typeof name !== 'string') return null;
  return name.replace(/[^a-zA-Z0-9_]/g, '') || null;
}

export async function listEntities(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  if (!tableName) return res.status(400).json({ message: 'Nome da entidade inválido' });

  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

  try {
    let query = supabase.from(tableName).select('*');

    if (req.query.order) {
      const isDesc = req.query.order.startsWith('-');
      let col = req.query.order.replace(/^[+-]/, '').replace(/[^a-zA-Z0-9_]/g, '');
      if (col === 'created_date') col = 'created_at';
      if (col === 'updated_date') col = 'updated_at';
      if (col) {
        query = query.order(col, { ascending: !isDesc });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.warn(`[Supabase] Aviso ao listar ${tableName}:`, error.message);
      return res.json([]);
    }
    return res.json(data || []);
  } catch (err) {
    return res.json([]);
  }
}

export async function filterEntities(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  if (!tableName) return res.status(400).json({ message: 'Nome da entidade inválido' });

  const { filtro = {}, limit = 100, sort } = req.body;
  const safeLimit = Math.min(parseInt(limit) || 100, 1000);

  try {
    let query = supabase.from(tableName).select('*');

    for (const [key, val] of Object.entries(filtro)) {
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && val.$in && Array.isArray(val.$in)) {
          query = query.in(key, val.$in);
        } else {
          query = query.eq(key, val);
        }
      }
    }

    if (sort) {
      const isDesc = String(sort).startsWith('-');
      let col = String(sort).replace(/^[+-]/, '').replace(/[^a-zA-Z0-9_]/g, '');
      if (col === 'created_date') col = 'created_at';
      if (col === 'updated_date') col = 'updated_at';
      if (col) query = query.order(col, { ascending: !isDesc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(safeLimit);

    const { data, error } = await query;
    if (error) {
      console.warn(`[Supabase] Aviso ao filtrar ${tableName}:`, error.message);
      return res.json([]);
    }
    return res.json(data || []);
  } catch (err) {
    return res.json([]);
  }
}

export async function countEntities(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  if (!tableName) return res.status(400).json({ message: 'Nome da entidade inválido' });

  const { filtro = {} } = req.body;

  try {
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

    for (const [key, val] of Object.entries(filtro)) {
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && val.$in && Array.isArray(val.$in)) {
          query = query.in(key, val.$in);
        } else {
          query = query.eq(key, val);
        }
      }
    }

    const { count, error } = await query;
    if (error) return res.json({ count: 0 });
    return res.json({ count: count || 0 });
  } catch (err) {
    return res.json({ count: 0 });
  }
}

export async function getEntity(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  const { id } = req.params;
  if (!tableName || !id) return res.status(400).json({ message: 'Parâmetros inválidos' });

  try {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error || !data) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createEntity(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  if (!tableName) return res.status(400).json({ message: 'Nome da entidade inválido' });

  const data = { ...req.body };
  if (!data.id) data.id = crypto.randomUUID();
  data.created_at = new Date();
  data.updated_at = new Date();

  try {
    const { data: created, error } = await supabase.from(tableName).insert([data]).select().single();
    if (error) {
      console.error(`[Supabase] Erro ao criar em ${tableName}:`, error.message);
      return res.status(500).json({ message: error.message });
    }
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function bulkCreateEntities(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  const { items = [] } = req.body;
  if (!tableName || !Array.isArray(items)) return res.status(400).json({ message: 'Lista inválida' });

  const prepared = items.map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    created_at: new Date(),
    updated_at: new Date(),
  }));

  try {
    const { data: created, error } = await supabase.from(tableName).insert(prepared).select();
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(201).json(created || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function updateEntity(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  const { id } = req.params;
  if (!tableName || !id) return res.status(400).json({ message: 'Parâmetros inválidos' });

  const data = { ...req.body };
  delete data.id;
  data.updated_at = new Date();

  try {
    const { data: updated, error } = await supabase.from(tableName).update(data).eq('id', id).select().single();
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function deleteEntity(req, res) {
  const tableName = sanitizeTableName(req.params.entity);
  const { id } = req.params;
  if (!tableName || !id) return res.status(400).json({ message: 'Parâmetros inválidos' });

  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    return res.json({ message: 'Excluído com sucesso', id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
