import { base44 } from "@/api/base44Client";

// Envia o arquivo para o armazenamento PRIVADO e devolve um link temporário.
// file_uri: referência permanente (só abre gerando novo link assinado)
// signed_url: link que expira em `expiresIn` segundos (padrão 5 min)
export async function uploadPrivado(file, expiresIn = 300) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: expiresIn });
  return { file_uri, signed_url };
}

export async function linkTemporario(file_uri, expiresIn = 300) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: expiresIn });
  return signed_url;
}
