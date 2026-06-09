import { connect } from "cloudflare:sockets";

// 🧠 Memória Global do Isolate (Persiste entre requisições no mesmo ciclo de vida do Worker)
let cachedJWKS = null;
let cachedB2Auth = null;
let b2AuthExpiry = 0; // Timestamp de expiração em milissegundos

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      if (pathname === "/" || pathname === "") {
        return new Response(
          "It's Wesus Asset & Communication Proxy Ativo (Quiet Luxury Brevo Engine)",
          { status: 200, headers: corsHeaders() },
        );
      }

      // ────────────────────────────────────────────────────────
      // ROTA A: RECIBO DE INTENÇÃO DE INVESTIMENTO (DIRECT FETCH)
      // ────────────────────────────────────────────────────────
      if (pathname === "/api/notify-lead" && request.method === "POST") {
        const payload = await request.json();

        const record = payload.record;
        if (!record) {
          return new Response("Payload inválido: objeto 'record' em falta.", {
            status: 400,
            headers: corsHeaders(),
          });
        }

        // Query contra o Supabase para buscar o Perfil do Investidor
        const userRes = await fetch(
          `${env.SUPABASE_PROJECT_URL}/rest/v1/utilizadores?id=eq.${record.utilizador_id}&select=*`,
          {
            headers: {
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          },
        );

        if (!userRes.ok) {
          const errText = await userRes.text();
          return new Response(
            `[Supabase Error] Falha ao consultar utilizadores: ${errText}`,
            { status: 500, headers: corsHeaders() },
          );
        }

        const users = await userRes.json();
        if (users.length === 0) {
          return new Response(
            "[Data Error] O UUID do investidor não existe na tabela.",
            { status: 404, headers: corsHeaders() },
          );
        }

        const investor = users[0];

        // Query para apanhar os detalhes da Condição Comercial
        const condRes = await fetch(
          `${env.SUPABASE_PROJECT_URL}/rest/v1/condicoes_comerciais?id=eq.${record.condicao_id}&select=*`,
          {
            headers: {
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          },
        );

        const conds = condRes.ok ? await condRes.json() : [];
        const condition = Array.isArray(conds) ? conds[0] : null;

        const valorFormatado = parseFloat(
          record.valor_pretendido,
        ).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
        const planoNome = condition
          ? condition.nome_plano
          : "Alocação Privada Restrita";
        const taxaRetorno = condition
          ? `${condition.taxa_retorno}%`
          : "Sob Consulta";
        const dataFormatada = new Date(
          record.data_inicio_pretendida,
        ).toLocaleDateString("pt-PT");

        // 📥 1. CONTEÚDO DO CLIENTE INVESTIDOR
        const emailHTMLInvestor = buildEmailTemplate(
          "Registo de Intenção de Alocação",
          `Olá, ${investor.nome_completo}.`,
          `Confirmamos com sucesso o registo da sua intenção de alocação de capital privado no ecossistema <strong>It's Wesus</strong>.`,
          `
            <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Modalidade Escolhida:</strong> ${planoNome}</p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Valor da Alocação:</strong> ${valorFormatado}</p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Taxa de Rentabilidade:</strong> ${taxaRetorno}</p>
            <p style="margin: 0 0 0px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Data Pretendida:</strong> ${dataFormatada}</p>
          `,
          "O seu Gestor de Conta entrará em contacto nas próximas horas para formalizar o aditamento contratual e coordenar a transferência patrimonial segura.",
        );

        // 🏢 2. CONTEÚDO DA EQUIPA DE GESTÃO / ADMIN
        const emailHTMLAdmin = buildEmailTemplate(
          "Nova Lead de Alocação de Capital",
          "Atenção Equipa,",
          "Recebemos uma solicitação de Investimento. Por favor, entre em contacto com este cliente nas próximas horas para coordenar a qualificação e a emissão do aditamento contratual.",
          `
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #E8D08D;"><strong>DADOS DO INVESTIDOR:</strong></p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: rgba(255,255,255,0.7);"><strong>Nome Completo:</strong> ${
              investor.nome_completo
            }</p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: rgba(255,255,255,0.7);"><strong>E-mail de Contacto:</strong> ${
              investor.email
            }</p>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: rgba(255,255,255,0.7);"><strong>Telemóvel:</strong> ${
              investor.telemovel || "Não Fornecido"
            }</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #E8D08D; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;"><strong>CONDIÇÕES APONTADAS:</strong></p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: rgba(255,255,255,0.7);"><strong>Modalidade Escolhida:</strong> ${planoNome}</p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: rgba(255,255,255,0.7);"><strong>Valor de Alocação:</strong> ${valorFormatado}</p>
            <p style="margin: 0 0 0px 0; font-size: 13px; color: rgba(255,255,255,0.7);"><strong>Data Limite Pretendida:</strong> ${dataFormatada}</p>
          `,
          "Este alerta operacional interno foi ativado de forma instantânea pelo sistema do Portal do Investidor após a verificação de segurança na base de dados.",
        );

        // Disparo focado para a caixa de e-mail do Cliente Investidor
        await sendEmailViaBrevo(
          {
            to: investor.email,
            subject: `It's Wesus - Intenção de Alocação Registada`,
            html: emailHTMLInvestor,
          },
          env,
        );

        // 🎯 PONTO CENTRAL: Matriz de e-mails da equipa administrativa.
        const listaEquipa = ["geral@itswesus.com", "andressantos214@gmail.com"];

        for (const emailEquipa of listaEquipa) {
          if (investor.email !== emailEquipa) {
            await sendEmailViaBrevo(
              {
                to: emailEquipa,
                subject: `[ALERTA OPERACIONAL] Solicitação de Investimento - ${investor.nome_completo}`,
                html: emailHTMLAdmin,
              },
              env,
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: "Processado com sucesso." }),
          {
            status: 200,
            headers: corsHeaders(),
          },
        );
      }

      // ────────────────────────────────────────────────────────
      // ROTA B: VERIFICAÇÃO DIÁRIA DE VENCIMENTOS (CRONJOB PROTEGIDO)
      // ────────────────────────────────────────────────────────
      if (pathname === "/api/check-vencimentos" && request.method === "POST") {
        // 🔒 Trava de Segurança: Exige o Header secreto definido nas variáveis Cloudflare
        const cronSecret = request.headers.get("X-Cron-Secret");
        if (!cronSecret || cronSecret !== env.CRON_SECRET) {
          return new Response(
            "Acesso Negado: Chave de validação de Cron inválida ou em falta.",
            {
              status: 401,
              headers: corsHeaders(),
            },
          );
        }

        const contratosRes = await fetch(
          `${env.SUPABASE_PROJECT_URL}/rest/v1/contratos_cliente?status_termo=eq.Ativo em Curso&select=*`,
          {
            headers: {
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          },
        );

        if (!contratosRes.ok)
          return new Response("Erro ao varrer contratos", { status: 500 });
        const contratos = await contratosRes.json();

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        for (const ctr of contratos) {
          const dataVenc = new Date(ctr.data_vencimento);
          dataVenc.setHours(0, 0, 0, 0);

          const diffTime = dataVenc - hoje;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 30 || diffDays === 7) {
            // 🔒 TRAVA DE CRON: Só avança se o investidor desejar receber alertas de vencimento
            const prefRes = await fetch(
              `${env.SUPABASE_PROJECT_URL}/rest/v1/preferencias_conta?utilizador_id=eq.${ctr.utilizador_id}&select=alerta_vencimento`,
              {
                headers: {
                  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                },
              },
            );

            const prefs = prefRes.ok ? await prefRes.json() : [];

            // Se houver configuração explícita de recusa (false), pulamos o disparo do e-mail
            if (prefs.length > 0 && prefs[0].alerta_vencimento === false) {
              console.log(
                `[CRON SKIP] Alertas desativados pelo utilizador: ${ctr.utilizador_id}`,
              );
              continue; // Salta para o próximo contrato da lista
            }

            const userRes = await fetch(
              `${env.SUPABASE_PROJECT_URL}/rest/v1/utilizadores?id=eq.${ctr.utilizador_id}&select=*`,
              {
                headers: {
                  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                },
              },
            );
            const users = await userRes.json();
            const investor = Array.isArray(users) ? users[0] : null;

            if (investor) {
              const capitalFormatado = parseFloat(
                ctr.capital_investido,
              ).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
              const rendimentoFormatado = parseFloat(
                ctr.rendimento_liquido,
              ).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

              const emailHTML = buildEmailTemplate(
                "Aviso de Maturidade de Ativo",
                `Prezado(a) ${investor.nome_completo},`,
                `Informamos que o seu Contrato de Mútuo Privado está próximo do encerramento do ciclo temporal de alocação de liquidez.`,
                `
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Prazo de Liquidação:</strong> Faltam exatamente ${diffDays} dias</p>
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Capital Investido Original:</strong> ${capitalFormatado}</p>
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Rendimento Líquido Gerado:</strong> ${rendimentoFormatado}</p>
                  <p style="margin: 0 0 0px 0; font-size: 14px; color: rgba(255,255,255,0.7);"><strong>Data Exata de Vencimento:</strong> ${dataVenc.toLocaleDateString(
                    "pt-PT",
                  )}</p>
                `,
                "Aceda ao seu Portal do Investidor privado para manifestar a sua instrução de liquidação.",
              );

              await sendEmailViaBrevo(
                {
                  to: investor.email,
                  subject: `It's Wesus - Alerta de Vencimento (${diffDays} Dias)`,
                  html: emailHTML,
                },
                env,
              );
            }
          }
        }
        return new Response(JSON.stringify({ checked: true }), {
          status: 200,
          headers: corsHeaders(),
        });
      }

      // 🔐 VALIDAÇÃO DE SEGURANÇA JWT (PUT, POST, DELETE no Storage)
      if (
        (request.method === "PUT" ||
          request.method === "POST" ||
          request.method === "DELETE") &&
        !pathname.startsWith("/api/")
      ) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response("Acesso Negado: Token não fornecido", {
            status: 401,
            headers: corsHeaders(),
          });
        }
        const token = authHeader.split(" ")[1];

        const isValid = await verifySupabaseJWKS(
          token,
          env.SUPABASE_PROJECT_URL,
        );
        if (!isValid) {
          return new Response("Acesso Negado: Token Inválido ou Expirado", {
            status: 403,
            headers: corsHeaders(),
          });
        }
      }

      // ⚡ MOTOR DE CACHE DE AUTORIZAÇÃO BACKBLAZE B2
      const now = Date.now();
      if (!cachedB2Auth || now >= b2AuthExpiry) {
        const authRes = await fetch(
          "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
          {
            headers: {
              Authorization:
                "Basic " + btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`),
            },
          },
        );
        if (!authRes.ok)
          throw new Error("Falha na autenticação com o cluster Backblaze B2.");

        cachedB2Auth = await authRes.json();
        b2AuthExpiry = now + 12 * 60 * 60 * 1000;
        console.log(
          "[B2 CACHE] Nova chave de autorização gerada e armazenada na Edge.",
        );
      }

      // 📥 OPERAÇÃO 1: DOWNLOAD DE ARQUIVOS (GET)
      if (request.method === "GET") {
        const b2DownloadUrl = `${cachedB2Auth.downloadUrl}/file/${env.B2_BUCKET_NAME}${pathname}`;
        const b2Response = await fetch(b2DownloadUrl, {
          method: "GET",
          headers: { Authorization: cachedB2Auth.authorizationToken },
        });
        if (!b2Response.ok)
          return new Response("Não encontrado", {
            status: 404,
            headers: corsHeaders(),
          });

        const responseHeaders = new Headers(b2Response.headers);
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Cache-Control", "public, max-age=86400");
        return new Response(b2Response.body, {
          status: b2Response.status,
          headers: responseHeaders,
        });
      }

      // 📤 OPERAÇÃO 2: ESCREVER ARQUIVOS (PUT)
      if (request.method === "PUT") {
        const getUploadUrlRes = await fetch(
          `${cachedB2Auth.apiUrl}/b2api/v2/b2_get_upload_url`,
          {
            method: "POST",
            headers: {
              Authorization: cachedB2Auth.authorizationToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ bucketId: env.B2_BUCKET_ID }),
          },
        );

        if (!getUploadUrlRes.ok) {
          const errText = await getUploadUrlRes.text();
          return new Response(
            `[B2 Upload Error] Falha ao obter URL de upload: ${errText}`,
            { status: 500, headers: corsHeaders() },
          );
        }

        const uploadUrlData = await getUploadUrlRes.json();
        const fileName = pathname.startsWith("/")
          ? pathname.substring(1)
          : pathname;
        const fileBuffer = await request.arrayBuffer();

        const b2UploadResponse = await fetch(uploadUrlData.uploadUrl, {
          method: "POST",
          headers: {
            Authorization: uploadUrlData.authorizationToken,
            "X-Bz-File-Name": fileName
              .split("/")
              .map(encodeURIComponent)
              .join("/"),
            "Content-Type": request.headers.get("Content-Type") || "image/webp",
            "X-Bz-Content-Sha1": "do_not_verify",
          },
          body: fileBuffer,
        });

        if (!b2UploadResponse.ok) {
          const errText = await b2UploadResponse.text();
          return new Response(
            `[B2 Storage Error] Erro na escrita física do storage proxy: ${errText}`,
            { status: 500, headers: corsHeaders() },
          );
        }

        return new Response(JSON.stringify({ success: true, path: fileName }), {
          status: 200,
          headers: { ...corsHeaders(), "Content-Type": "application/json" },
        });
      }

      return new Response("Método não permitido", {
        status: 405,
        headers: corsHeaders(),
      });
    } catch (error) {
      return new Response(`Erro Interno no Proxy: ${error.message}`, {
        status: 500,
        headers: corsHeaders(),
      });
    }
  },
};

// ────────────────────────────────────────────────────────
// ✉️ MOTOR HTTP API DO BREVO
// ────────────────────────────────────────────────────────
async function sendEmailViaBrevo({ to, subject, html }, env) {
  if (!env.BREVO_API_KEY)
    throw new Error("Secret BREVO_API_KEY não configurado.");
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "It's Wesus", email: "geral@itswesus.com" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    }),
  });
}

// ────────────────────────────────────────────────────────
// 🎨 TEMPLATE HTML RESPONSIVO PREMIUM
// ────────────────────────────────────────────────────────
function buildEmailTemplate(
  tituloTopico,
  saudacao,
  paragrafoCorpo,
  cardHTML,
  notaRodape,
) {
  const logoUrl =
    "https://andresantos214.github.io/info-page-wesus/img/email-logo-small.png";
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #071326; font-family: Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #071326; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #0B1F3A; border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
              <tr>
                <td align="center" style="padding-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <img src="${logoUrl}" alt="It's Wesus" style="max-height: 200px; width: auto; display: block; margin: 0 auto; border: 0; margin-bottom: -4rem; margin-top:-4rem;" />
                </td>
              </tr>
              <tr>
                <td style="padding-top: 30px;">
                  <h2 style="font-family: Georgia, serif; color: #FFFFFF; font-size: 18px; font-weight: normal; margin: 0 0 16px 0;">${saudacao}</h2>
                  <p style="color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">${paragrafoCorpo}</p>
                </td>
              </tr>
              <tr>
                <td>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <tr><td>${cardHTML}</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td><p style="color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.5; margin: 0 0 30px 0; font-style: italic;">${notaRodape}</p></td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); font-size: 10px;">
                  Este é um canal exclusivo e estritamente confidencial.<br>&copy; 2026 It's Wesus.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

// 🔐 VALIDADOR CRIPTOGRÁFICO DE TOKENS JWT
async function verifySupabaseJWKS(token, projectUrl) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts;

    let pB64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    while (pB64.length % 4) pB64 += "=";
    const payload = JSON.parse(atob(pB64));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp)
      return false;

    let hB64 = headerB64.replace(/-/g, "+").replace(/_/g, "/");
    while (hB64.length % 4) hB64 += "=";
    const header = JSON.parse(atob(hB64));
    const kid = header.kid;

    if (!cachedJWKS) {
      const jwksRes = await fetch(
        `${projectUrl}/auth/v1/.well-known/jwks.json`,
      );
      if (jwksRes.ok) cachedJWKS = await jwksRes.json();
      else return false;
    }

    let jwk = cachedJWKS.keys.find((k) => k.kid === kid);
    if (!jwk) {
      const jwksRes = await fetch(
        `${projectUrl}/auth/v1/.well-known/jwks.json`,
      );
      if (jwksRes.ok) {
        cachedJWKS = await jwksRes.json();
        jwk = cachedJWKS.keys.find((k) => k.kid === kid);
        if (!jwk) return false;
      } else return false;
    }

    let importAlgorithm =
      jwk.alg === "RS256" || jwk.kty === "RSA"
        ? { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } }
        : { name: "ECDSA", namedCurve: "P-256" };

    let verifyAlgorithm =
      jwk.alg === "RS256" || jwk.kty === "RSA"
        ? "RSASSA-PKCS1-v1_5"
        : { name: "ECDSA", hash: { name: "SHA-256" } };

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      importAlgorithm,
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    let b64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const sigBuf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) sigBuf[i] = binary.charCodeAt(i);

    return await crypto.subtle.verify(verifyAlgorithm, cryptoKey, sigBuf, data);
  } catch (e) {
    return false;
  }
}
