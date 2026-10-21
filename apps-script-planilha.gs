/**
 * Recebe os cadastros da LP "Black Friday Infinita Direito Bancário"
 * e grava na planilha do Google.
 *
 * Como publicar (uma vez só):
 * 1. Abra a planilha > Extensões > Apps Script.
 * 2. Apague o que estiver no editor, cole este arquivo inteiro e salve.
 * 3. Implantar > Nova implantação > tipo "App da Web".
 *    Executar como: Eu  ·  Quem pode acessar: Qualquer pessoa.
 * 4. Autorize o acesso e copie a "URL do app da Web" (termina em /exec).
 * 5. Cole essa URL em CONFIG.endpoint no index.html.
 */
var PLANILHA_ID = '1-I32EFtG1SCXla9rLvehCd5Eh-IEVgAOtK-lR52gLDU';
var ABA = 'Cadastros';
var COLUNAS = ['recebido_em', 'nome', 'email', 'whatsapp', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'pagina', 'campanha', 'enviado_em'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var p = (e && e.parameter) || {};
    if (!p.nome || !p.email || !p.whatsapp) return resposta({ ok: false, erro: 'campos obrigatórios' });

    var ss = SpreadsheetApp.openById(PLANILHA_ID);
    var aba = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    }
    var linha = COLUNAS.map(function (c) {
      if (c === 'recebido_em') return new Date();
      // apóstrofo evita que o Sheets converta o WhatsApp em número
      if (c === 'whatsapp') return "'" + String(p.whatsapp);
      return p[c] || '';
    });
    aba.appendRow(linha);
    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
