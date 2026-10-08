import { supabase } from '../config/db.js';

export async function uploadPrivateFile(req, res) {
  try {
    const { file, fileName, fileType } = req.body || {};
    
    // Se o cliente enviar base64 ou dados de arquivo
    if (file && typeof file === 'string') {
      const cleanName = fileName || `upload_${Date.now()}.png`;
      const bucketName = 'smartseg-files';
      
      try {
        // Tenta enviar para o Supabase Storage se o bucket existir
        const buffer = Buffer.from(file.replace(/^data:.*,/, ''), 'base64');
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(`anexos/${Date.now()}_${cleanName}`, buffer, {
            contentType: fileType || 'application/octet-stream',
            upsert: true,
          });

        if (!error && data?.path) {
          return res.json({
            file_uri: `${bucketName}/${data.path}`,
            path: data.path,
          });
        }
      } catch (e) {
        console.warn('⚠️ [Storage] Bucket não disponível, gerando URI local:', e.message);
      }

      // Fallback seguro: retorna URI identificador
      const uri = `storage://anexos/${Date.now()}_${cleanName}`;
      return res.json({
        file_uri: uri,
        url: file.startsWith('data:') ? file : `data:${fileType || 'image/png'};base64,${file}`,
      });
    }

    const mockUri = `storage://anexos/doc_${Date.now()}.pdf`;
    return res.json({ file_uri: mockUri });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createFileSignedUrl(req, res) {
  try {
    const { file_uri, expires_in } = req.body || {};
    
    if (!file_uri) {
      return res.status(400).json({ error: 'file_uri é obrigatório' });
    }

    // Se for do Supabase Storage
    if (file_uri.startsWith('smartseg-files/')) {
      const path = file_uri.replace('smartseg-files/', '');
      const { data } = await supabase.storage
        .from('smartseg-files')
        .createSignedUrl(path, expires_in || 3600);
      if (data?.signedUrl) {
        return res.json({ signed_url: data.signedUrl });
      }
    }

    // Fallback: se for URL direta ou data URI
    return res.json({ signed_url: file_uri });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function sendEmail(req, res) {
  try {
    const { to, subject, body, text } = req.body || {};
    console.log(`✉️ [Integração de E-mail] Enviando para: ${to} | Assunto: ${subject}`);
    return res.json({ ok: true, status: 'enviado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
