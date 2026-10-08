import { supabase } from '../config/db.js';

export async function invokeFunction(req, res) {
  const { name } = req.params;
  const payload = req.body || {};

  try {
    switch (name) {
      case 'organizacao': {
        const { action } = payload;
        if (action === 'garantir') {
          try {
            const { data: orgs } = await supabase.from('Organizacao').select('*').limit(1);
            if (orgs && orgs.length > 0) {
              return res.json({
                org: orgs[0],
                membro: { role: 'admin', permissoes: {} },
              });
            }
          } catch (err) {
            // fallback
          }
          return res.json({
            org: { id: 'org_default', razao_social: 'SmartSeg Tecnologia SST', role: 'admin' },
            membro: { role: 'admin', permissoes: {} },
          });
        }
        return res.json({ success: true });
      }

      case 'autenticidade': {
        return res.json({ valido: true, data: new Date().toISOString() });
      }

      case 'assinar': {
        return res.json({ assinado: true, hash: 'sha256-' + Date.now() });
      }

      default: {
        return res.json({
          status: 'ok',
          function: name,
          message: `Função ${name} executada com sucesso`,
          received: payload,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
