/**
 * Recebe os cadastros da LP "Black Friday Infinita Direito Bancário"
 * e grava na aba "LEADS PÁGINA" da planilha
 * "INSCRITOS E LEAD SCORE | BLACK FRIDAY 2026 | ANDRESSA BACELLAR".
 *
 * Preenche só: Data, Nome, Email, WhatsApp, Source, Medium, Campaign, Content, Term.
 * "Classificação" e "Comprou?" ficam intocadas (pode ter fórmula nelas).
 * As colunas são achadas pelo NOME no cabeçalho (linha 1), então a ordem pode mudar.
 *
 * Como publicar (uma vez só):
 * 1. Abra a planilha > Extensões > Apps Script.
 * 2. Apague o que estiver no editor, cole este arquivo inteiro e salve.
 * 3. Implantar > Nova implantação > tipo "App da Web".
 *    Executar como: Eu  ·  Quem pode acessar: Qualquer pessoa.
 * 4. Autorize o acesso e copie a "URL do app da Web" (termina em /exec).
 */
var PLANILHA_ID = '1-I32EFtG1SCXla9rLvehCd5Eh-IEVgAOtK-lR52gLDU';
var ABA = 'LEADS PÁGINA';

// cabeçalho da planilha  ->  campo enviado pela página
var MAPA = {
  'Data': '_agora',
  'Nome': 'nome',
  'Email': 'email',
  'WhatsApp': 'whatsapp',
  'Source': 'utm_source',
  'Medium': 'utm_medium',
  'Campaign': 'utm_campaign',
  'Content': 'utm_content',
  'Term': 'utm_term'
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var p = (e && e.parameter) || {};
    if (!p.nome || !p.email || !p.whatsapp) return resposta({ ok: false, erro: 'campos obrigatórios' });

    var aba = SpreadsheetApp.openById(PLANILHA_ID).getSheetByName(ABA);
    if (!aba) return resposta({ ok: false, erro: 'aba "' + ABA + '" não encontrada' });

    var ultimaCol = aba.getLastColumn();
    var cabecalho = aba.getRange(1, 1, 1, ultimaCol).getValues()[0]
      .map(function (h) { return String(h).trim(); });

    // próxima linha = depois do último preenchido na coluna "Data"
    // (assim fórmulas arrastadas em Classificação/Comprou? não empurram o cadastro pra baixo)
    var colData = cabecalho.indexOf('Data') + 1 || 1;
    var valoresData = aba.getRange(1, colData, Math.max(aba.getLastRow(), 1), 1).getValues();
    var linha = valoresData.length;
    while (linha > 1 && valoresData[linha - 1][0] === '') linha--;
    linha++;

    // grava tudo de uma vez (uma chamada só = mais rápido), do 1º ao último campo mapeado;
    // colunas não mapeadas no meio do caminho mantêm o que já tinham
    var cols = [];
    cabecalho.forEach(function (h, i) { if (MAPA[h]) cols.push(i); });
    var ini = Math.min.apply(null, cols), fim = Math.max.apply(null, cols);
    var faixa = aba.getRange(linha, ini + 1, 1, fim - ini + 1);
    var valores = faixa.getValues()[0];
    for (var i = ini; i <= fim; i++) {
      var campo = MAPA[cabecalho[i]];
      if (!campo) continue;
      var valor;
      if (campo === '_agora') valor = new Date();
      else if (campo === 'whatsapp') valor = "'" + String(p.whatsapp); // apóstrofo: não vira número
      else valor = p[campo] || '';
      valores[i - ini] = valor;
    }
    faixa.setValues([valores]);

    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Abre no navegador a URL /exec para checar se está publicado
function doGet() {
  return resposta({ ok: true, status: 'online' });
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
