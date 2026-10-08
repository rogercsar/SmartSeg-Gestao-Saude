import { createClient } from '@supabase/supabase-js';
import { appParams } from '@/lib/app-params';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mdoffmtawpvmdezcexdx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb2ZmbXRhd3B2bWRlemNleGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Njg1MzUsImV4cCI6MjEwNzA0NDUzNX0.foWqPglxOFqmwYK4Z86q61S7YcpoiYhYhq0YYyVml10';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

// ===== Organização compartilhada =====
// Entidades cujos registros pertencem à organização (e não à pessoa que cadastrou).
export const ENTIDADES_ORG = new Set([
  "Company", "Unidade", "Setor", "CargoFuncao", "Trabalhador", "LotacaoHistorico", "Terceira", "DocumentoTerceiro",
  "Risco", "Medicao", "Equipamento", "ExamePcmso", "ProgramaSST", "Anexo", "Levantamento", "InventarioSnapshot",
  "Atestado", "RelatorioSaude", "Vacina", "EpiItem", "EntregaEpi", "MatrizTreinamento", "Treinamento", "InspecaoChecklist", "PlanoAcao",
  "ModeloChecklist", "MandatoCipa", "ReuniaoCipa", "OcorrenciaAcidente", "RecusaTrabalho", "GeneratedDocument", "TextoTecnico", "AutoInfracao",
  "ComplianceItem", "EventoEsocial", "ContratoCliente", "FolhaMensal", "LancamentoFinanceiro", "Prestador", "InstrumentoPsicossocial", "AplicacaoPsicossocial", "RiscoCatalogo", "ExameCatalogo", "AptidaoCatalogo"
]);

let contextoOrg = null;
let promessaOrg = null;

// Helper HTTP com Bearer token e tratamento de erros
async function request(endpoint, options = {}) {
  const token = window.localStorage.getItem('token') || window.localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const err = new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      err.status = res.status;
      err.data = errorData;
      throw err;
    }
    return await res.json();
  } catch (error) {
    // Se for rota de settings ou auth inicial e não houver backend ativo, providencia fallback limpo
    if (endpoint.includes('public-settings') || endpoint.includes('functions/organizacao')) {
      console.warn(`[SmartSeg API] Aviso na rota ${endpoint}:`, error.message);
    }
    throw error;
  }
}

// Cria gerenciador genérico para qualquer entidade REST
function createEntityHandler(nome) {
  return {
    async list(order = '-created_at', limit = 100) {
      try {
        const query = new URLSearchParams({ order: String(order), limit: String(limit) }).toString();
        const data = await request(`/entities/${nome}?${query}`);
        return Array.isArray(data) ? data : data.items || [];
      } catch (err) {
        console.warn(`[SmartSeg] Falha ao listar ${nome}:`, err.message);
        return [];
      }
    },
    async filter(filtro = {}, options = {}) {
      try {
        const res = await request(`/entities/${nome}/filter`, {
          method: 'POST',
          body: JSON.stringify({ filtro, ...options }),
        });
        return Array.isArray(res) ? res : res.items || [];
      } catch (err) {
        console.warn(`[SmartSeg] Falha ao filtrar ${nome}:`, err.message);
        return [];
      }
    },
    async get(id) {
      return request(`/entities/${nome}/${id}`);
    },
    async create(dados) {
      return request(`/entities/${nome}`, {
        method: 'POST',
        body: JSON.stringify(dados),
      });
    },
    async bulkCreate(lista) {
      return request(`/entities/${nome}/bulk`, {
        method: 'POST',
        body: JSON.stringify({ items: lista }),
      });
    },
    async update(id, dados) {
      return request(`/entities/${nome}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
    },
    async delete(id) {
      return request(`/entities/${nome}/${id}`, {
        method: 'DELETE',
      });
    },
    async count(filtro = {}) {
      try {
        const res = await request(`/entities/${nome}/count`, {
          method: 'POST',
          body: JSON.stringify({ filtro }),
        });
        return typeof res === 'number' ? res : res.count || 0;
      } catch {
        return 0;
      }
    },
  };
}

// Handler de Autenticação desvinculado do Base44
export const auth = {
  async me() {
    // 1. Verifica sessão ativa no Supabase (ex: via Google OAuth)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
          role: 'admin',
          org_id: 'org_default',
        };
      }
    } catch (e) {
      // continua para fallback
    }

    const token = window.localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');
    try {
      return await request('/auth/me');
    } catch {
      // Fallback para usuário autenticado padrão em ambiente de transição
      return {
        id: 'usr-admin-1',
        email: 'admin@smartseg.com.br',
        name: 'Administrador',
        role: 'admin',
      };
    }
  },
  async login(credenciais) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credenciais),
    });
    if (res?.token) {
      this.setToken(res.token);
    }
    return res;
  },
  async loginViaEmailPassword(email, password) {
    return this.login({ email, password });
  },
  async register(dados) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  async verifyOtp(dados) {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  async resendOtp(email) {
    return request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async resetPasswordRequest(email) {
    return request('/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(dados) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  setToken(token) {
    if (token) {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('access_token', token);
    } else {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('access_token');
    }
  },
  async logout(redirectUrl) {
    this.setToken(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.href = '/login';
    }
  },
  redirectToLogin(returnUrl) {
    const query = returnUrl ? `?returnTo=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/login${query}`;
  },
  async loginWithProvider(provider = 'google', returnTo = '/') {
    try {
      const redirectUrl = `${window.location.origin}${returnTo && returnTo.startsWith('/') ? returnTo : '/'}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase(),
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('[Supabase OAuth] Erro ao iniciar login:', err);
      alert(`Login com ${provider}: ${err.message}\nCertifique-se de que o provedor Google está ativado no Supabase (Authentication -> Providers -> Google).`);
    }
  },
};

// Funções remotas e integrações de servidor
export const functions = {
  async invoke(nome, payload = {}) {
    try {
      const data = await request(`/functions/${nome}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { data };
    } catch (err) {
      // Fallback gracioso para a função de organização inicial caso o backend ainda esteja subindo
      if (nome === 'organizacao' && payload.action === 'garantir') {
        return {
          data: {
            org: { id: 'org_default', nome: 'Organização Padrão', role: 'admin' },
            membro: { role: 'admin', permissoes: {} },
          },
        };
      }
      throw err;
    }
  },
};

// Gerenciamento do App
export const app = {
  async getPublicSettings() {
    try {
      return await request('/app/public-settings');
    } catch {
      return {
        id: 'smartseg',
        name: 'SmartSeg',
        public_settings: {
          allow_registration: true,
        },
      };
    }
  },
};

export const users = {
  async inviteUser(email, role) {
    return request('/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },
};

// Garante o contexto da organização
export function obterOrganizacao(forcar = false) {
  if (contextoOrg && !forcar) return Promise.resolve(contextoOrg);
  if (!promessaOrg || forcar) {
    promessaOrg = functions.invoke("organizacao", { action: "garantir" })
      .then((r) => { contextoOrg = r?.data || null; return contextoOrg; })
      .catch((e) => { 
        promessaOrg = null; 
        contextoOrg = { org: { id: 'org_default', nome: 'Minha Empresa' }, membro: { role: 'admin' } };
        return contextoOrg; 
      });
  }
  return promessaOrg;
}

export const organizacaoAtual = () => contextoOrg;

async function comOrg(dados) {
  const ctx = await obterOrganizacao();
  const org_id = ctx?.org?.id;
  if (!org_id) return dados;
  return Array.isArray(dados) ? dados.map((d) => ({ org_id, ...d })) : { org_id, ...dados };
}

// Proxy transparente para entidades
const entitiesProxy = new Proxy({}, {
  get(cache, nome) {
    if (!cache[nome]) {
      const handler = createEntityHandler(nome);
      if (ENTIDADES_ORG.has(nome)) {
        cache[nome] = new Proxy(handler, {
          get(target, metodo) {
            if (metodo === 'create') {
              return async (dados, ...resto) => target.create(await comOrg(dados), ...resto);
            }
            if (metodo === 'bulkCreate') {
              return async (lista, ...resto) => target.bulkCreate(await comOrg(lista), ...resto);
            }
            return target[metodo];
          },
        });
      } else {
        cache[nome] = handler;
      }
    }
    return cache[nome];
  },
});

// Exporta o cliente unificado (mantém nome base44 para compatibilidade total com as 240+ páginas)
export const base44 = {
  entities: entitiesProxy,
  functions,
  auth,
  app,
  users,
};

export const apiClient = base44;
export default base44;
