/**
 * Desafio Q4 · Confrontos entre supervisores
 * Backend em Google Apps Script ligado à planilha.
 * Páginas: Desafio.html (supervisores) e Admin.html (time de categorias, ?p=admin)
 */

const ABA = { SUP: 'Supervisores', MES: 'Meses', CONF: 'Confrontos', LOG: 'Log' };
// Pilares por cargo (deck Pilares por Cargo). Missões Guiadas só vale nos meses marcados na aba Meses.
const PILARES = {
  Mista: ['Sabores', 'Retornáveis', 'Missões Guiadas', 'Sucos', 'Powerade'],
  Segmentada: ['Sabores', 'Refri Single', 'Powerade', 'Sucos', 'Missões Guiadas']
};
const MISSOES = 'Missões Guiadas';
const PONTOS_VITORIA = 5;
const TZ = 'America/Sao_Paulo';

const CAB = {
  SUP: ['Código', 'Nome', 'Gerência', 'Gerente', 'Rotas mistas', 'Rotas segmentadas', 'Tipo (ajuste)', 'PIN', 'Ativo'],
  MES: ['Mês', 'Nome', 'Abertura', 'Fechamento', 'Status manual', 'Missões Guiadas vale'],
  CONF: ['ID', 'Mês', 'Registrado em', 'Desafiante', 'Desafiado', 'Tipo', 'Pilar', 'Status',
         '% Desafiante', '% Desafiado', 'Vencedor', 'Pontos', 'Origem', 'Motivo cancelamento'],
  LOG: ['Quando', 'Quem', 'Ação', 'Detalhe', 'Resultado']
};

// Base AM_BND_BASE_CLIENTE (SAC, 22/10/2026) — supervisões com supervisor nomeado.
// [código, nome, gerência, gerente, rotas mistas, rotas segmentadas]
const SEED = [
  ["An.1", "Thiago Henrique De Souza Silva", "An", "Jose Filho Pereira Morais", 4, 2],
  ["An.2", "Gustavo De Olvieira Vasconcelo", "An", "Jose Filho Pereira Morais", 7, 0],
  ["An.3", "Lailson Das Neves Campos", "An", "Jose Filho Pereira Morais", 7, 0],
  ["Ap.1", "Samir Daniel De Oliveira Silva", "Ap", "Antonio Da Cunha Neto", 0, 5],
  ["Ap.2", "Marcelo Lucio Da Silva", "Ap", "Antonio Da Cunha Neto", 8, 0],
  ["Ap.3", "Cicero Pereira De Melo Junior", "Ap", "Antonio Da Cunha Neto", 7, 0],
  ["At.1", "Verlane Rodrigues Da Costa", "At", "Alessandro Luis Pereira Passos", 0, 1],
  ["At.2", "Cosmo Matias Dos Santos", "At", "Alessandro Luis Pereira Passos", 0, 1],
  ["Di.1", "Edson Pereira Dos Santos", "Di", "Lucas Tancredo Aiello", 5, 0],
  ["G1.1", "Warley Rodrigues Da Mota", "G1", "Wendel Florencio Dos Santos", 7, 0],
  ["G1.2", "Sergio Alves Da Silva", "G1", "Wendel Florencio Dos Santos", 7, 0],
  ["G1.3", "Larissa Cristine Correia Gonca", "G1", "Wendel Florencio Dos Santos", 0, 3],
  ["G2.1", "Valdecir Mariano Vieira", "G2", "Rodrigo Fernandes De Carvalho", 7, 0],
  ["G2.2", "Edenival Paulo De Almeida Junior", "G2", "Rodrigo Fernandes De Carvalho", 7, 0],
  ["G2.3", "Mateus Henrique Ferreira Da Si", "G2", "Rodrigo Fernandes De Carvalho", 0, 4],
  ["G3.1", "Adival Camilo Da Silva Filho", "G3", "Camila Cristina Venancio", 7, 0],
  ["G3.2", "Joao Felipe Francisco Da Silva", "G3", "Camila Cristina Venancio", 5, 0],
  ["Gu.1", "Julimar Leite Borges", "Gu", "Welquer Joaquim Pereira Dos Sa", 6, 1],
  ["Gu.2", "Vald Fernando De Oliveira Mora", "Gu", "Welquer Joaquim Pereira Dos Sa", 6, 0],
  ["It.2", "Arthur Orlando De Oliveira", "It", "Draus Borges De Oliveira", 5, 0],
  ["Mo.1", "Phablo Ruan Ribeiro Silva", "Mo", "Draus Borges De Oliveira", 5, 0],
  ["Mo.2", "Kayo Hikson Alves Peixoto", "Mo", "Draus Borges De Oliveira", 6, 0],
  ["Pa.1", "Rhay Junival Feitosa Dos Santo", "Pa", "Lucas Tancredo Aiello", 4, 1],
  ["Pa.2", "Marcos Jorgan Santos De Andrad", "Pa", "Lucas Tancredo Aiello", 7, 0],
  ["Pa.3", "Walmys Aires Cardoso", "Pa", "Lucas Tancredo Aiello", 6, 0],
  ["Po.1", "William Ferreira Rosa", "Po", "Welquer Joaquim Pereira Dos Sa", 8, 0],
  ["Ri.1", "Felippe Ferreira Pedroso Trind", "Ri", "Joelson Joi Silva", 6, 0],
  ["Ri.2", "Adriana Talita Bastos Garcia", "Ri", "Joelson Joi Silva", 7, 0],
  ["Rv.1", "Daiane Aparecida Martins De Souza", "Rv", "Hitallo Huggo Afonso Toledo", 5, 1],
  ["Rv.2", "Joflanio Alex De Freitas Perei", "Rv", "Hitallo Huggo Afonso Toledo", 6, 0],
  ["Sl.1", "Luismar Junior", "Sl", "Gilberto Machado De Macedo", 6, 0],
  ["Sl.2", "Guilherme Vieira Barbosa", "Sl", "Gilberto Machado De Macedo", 5, 0],
  ["Ur.1", "Thiago Henrique Aparecido Mend", "Ur", "Joelson Joi Silva", 5, 0],
  ["Ur.2", "Hederlon Marques Dias", "Ur", "Joelson Joi Silva", 5, 0]
];

/* ---------------- Web app ---------------- */

function doGet(e) {
  const admin = e && e.parameter && e.parameter.p === 'admin';
  return HtmlService.createHtmlOutputFromFile(admin ? 'Admin' : 'Desafio')
    .setTitle(admin ? 'Desafio Q4 · Admin' : 'Desafio Q4 · Confrontos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Chamadas vindas de páginas hospedadas fora do Apps Script (ex.: GitHub Pages).
// Corpo: {"fn":"apiEstado","args":[...]} enviado como text/plain.
const API_PUBLICA = ['apiEstado', 'apiLogin', 'apiDesafiar', 'apiAdminLogin', 'apiAdminDados', 'apiAdminSalvarMes',
  'apiAdminSalvarSup', 'apiAdminNovoSup', 'apiAdminNovoPin', 'apiAdminCancelar', 'apiAdminResultado', 'apiAdminManual'];
const API_FN = { apiEstado, apiLogin, apiDesafiar, apiAdminLogin, apiAdminDados, apiAdminSalvarMes,
  apiAdminSalvarSup, apiAdminNovoSup, apiAdminNovoPin, apiAdminCancelar, apiAdminResultado, apiAdminManual };

function doPost(e) {
  let saida;
  try {
    const req = JSON.parse(e.postData.contents);
    if (API_PUBLICA.indexOf(req.fn) < 0) throw new Error('Função não permitida.');
    saida = API_FN[req.fn].apply(null, Array.isArray(req.args) ? req.args : []);
  } catch (err) {
    saida = { ok: false, erro: 'Requisição inválida: ' + (err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(saida)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Menu da planilha ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Desafio Q4')
    .addItem('Configurar planilha (1ª vez)', 'configurar')
    .addItem('Mostrar senha do admin', 'mostrarSenha')
    .addItem('Gerar nova senha do admin', 'novaSenha')
    .addToUi();
}

function configurar() {
  const ss = SpreadsheetApp.getActive();
  const sup = criarAba_(ss, ABA.SUP, CAB.SUP);
  const mes = criarAba_(ss, ABA.MES, CAB.MES);
  const conf = criarAba_(ss, ABA.CONF, CAB.CONF);
  criarAba_(ss, ABA.LOG, CAB.LOG);

  if (sup.getLastRow() < 2) {
    const rows = SEED.map(r => [r[0], r[1], r[2], r[3], r[4], r[5], '', novoPin_(), true]);
    sup.getRange(2, 1, rows.length, 1).setNumberFormat('@');
    sup.getRange(2, 8, rows.length, 1).setNumberFormat('@');
    sup.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  const nSup = Math.max(sup.getLastRow() - 1, 1);
  sup.getRange(2, 7, nSup + 50, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Mista', 'Segmentada'], true).setAllowInvalid(false).build());
  sup.getRange(2, 9, nSup + 50, 1).insertCheckboxes();

  if (mes.getLastRow() < 2) {
    const linhas = [
      ['2026-10', 'Outubro',  new Date(2026, 9, 22, 8, 0),  new Date(2026, 9, 24, 23, 59), ''],
      ['2026-11', 'Novembro', new Date(2026, 10, 1, 8, 0), new Date(2026, 10, 5, 23, 59), ''],
      ['2026-12', 'Dezembro', new Date(2026, 11, 1, 8, 0), new Date(2026, 11, 5, 23, 59), '']
    ];
    mes.getRange(2, 1, 3, 1).setNumberFormat('@');
    mes.getRange(2, 1, 3, 5).setValues(linhas);
  }
  mes.getRange(2, 3, 20, 2).setNumberFormat('dd/mm/yyyy hh:mm');
  const nMes = Math.max(mes.getLastRow() - 1, 1);
  const colF = mes.getRange(2, 6, nMes, 1);
  const ids = mes.getRange(2, 1, nMes, 1).getValues();
  const atuais = colF.getValues();
  colF.setValues(atuais.map((v, i) => [v[0] === '' ? String(ids[i][0]) !== '2026-10' : v[0]]));
  colF.insertCheckboxes();
  mes.getRange(2, 5, 20, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Aberto', 'Travado', 'Encerrado'], true).build());
  conf.getRange('A:B').setNumberFormat('@');
  conf.getRange('C:C').setNumberFormat('dd/mm/yyyy hh:mm:ss');

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_SENHA')) props.setProperty('ADMIN_SENHA', gerarSenha_());
  SpreadsheetApp.getUi().alert('Planilha pronta.\n\nSenha do admin: ' + props.getProperty('ADMIN_SENHA') +
    '\n\nAgora publique em Implantar > Nova implantação > App da Web.');
}

function mostrarSenha() {
  SpreadsheetApp.getUi().alert('Senha do admin: ' + (PropertiesService.getScriptProperties().getProperty('ADMIN_SENHA') || 'rode Configurar planilha'));
}

function novaSenha() {
  const s = gerarSenha_();
  PropertiesService.getScriptProperties().setProperty('ADMIN_SENHA', s);
  SpreadsheetApp.getUi().alert('Nova senha do admin: ' + s);
}

/* ---------------- API pública (supervisores) ---------------- */

function apiEstado(mesId) {
  return seguro_(() => {
    const agora = new Date();
    const meses = lerMeses_().map(m => pubMes_(m, agora));
    if (!meses.length) throw new Error('Nenhum mês cadastrado.');
    const id = meses.some(m => m.id === mesId) ? mesId : mesPadrao_(meses, agora);
    const sups = lerSup_();
    const confs = lerConf_();
    const ocup = ocupados_(confs, id);
    const mapa = nomes_(sups);
    return {
      agora: agora.getTime(),
      meses: meses,
      mesId: id,
      pilares: PILARES,
      sup: sups.filter(s => s.ativo).map(s => ({ cod: s.cod, nome: s.nome, ger: s.ger, tipo: s.tipo, livre: !ocup.has(s.cod) })),
      confrontos: confs.filter(c => c.mes === id && c.status !== 'Cancelado')
        .sort((a, b) => a.registrado - b.registrado)
        .map((c, i) => pubConf_(c, mapa, i + 1)),
      placar: placar_(confs, sups)
    };
  });
}

function apiLogin(cod, pin) {
  return seguro_(() => {
    const s = checarPin_(cod, pin);
    log_(s.cod, 'Login', '', 'OK');
    return { sv: { cod: s.cod, nome: s.nome, ger: s.ger, tipo: s.tipo } };
  });
}

function apiDesafiar(cod, pin, mesId, alvo, pilar) {
  return seguro_(() => {
    const s = checarPin_(cod, pin);
    const detalhe = s.cod + ' x ' + alvo + ' · ' + pilar + ' · ' + mesId;
    return comTrava_(() => {
      try {
        const c = registrar_(mesId, s.cod, alvo, pilar, 'Portal', true);
        log_(s.cod, 'Desafio', detalhe, 'Registrado');
        return { confronto: c };
      } catch (err) {
        log_(s.cod, 'Desafio', detalhe, 'Recusado: ' + err.message);
        throw err;
      }
    });
  });
}

/* ---------------- API admin ---------------- */

function apiAdminLogin(senha) {
  return seguro_(() => {
    const p = PropertiesService.getScriptProperties().getProperty('ADMIN_SENHA');
    if (!p) throw new Error('Rode "Configurar planilha" no menu Desafio Q4 antes de entrar.');
    const cache = CacheService.getScriptCache();
    const t = Number(cache.get('tent_admin') || 0);
    if (t >= 5) throw new Error('Muitas tentativas erradas. Espere 15 minutos.');
    if (String(senha).trim() !== p) {
      cache.put('tent_admin', String(t + 1), 900);
      log_('admin', 'Login admin', '', 'Senha incorreta');
      throw new Error('Senha incorreta.');
    }
    cache.remove('tent_admin');
    const token = Utilities.getUuid();
    cache.put('adm_' + token, '1', 21600);
    log_('admin', 'Login admin', '', 'OK');
    return { token: token };
  });
}

function apiAdminDados(token) {
  return seguro_(() => {
    checarToken_(token);
    const agora = new Date();
    const sups = lerSup_();
    const mapa = nomes_(sups);
    const confs = lerConf_();
    const porMes = {};
    const ordenados = confs.slice().sort((a, b) => a.registrado - b.registrado);
    const conf = ordenados.map(c => {
      if (c.status !== 'Cancelado') porMes[c.mes] = (porMes[c.mes] || 0) + 1;
      return pubConf_(c, mapa, c.status === 'Cancelado' ? null : porMes[c.mes]);
    });
    const logSh = aba_(ABA.LOG);
    const nLog = logSh.getLastRow() - 1;
    const log = nLog > 0 ? logSh.getRange(Math.max(2, logSh.getLastRow() - 199), 1, Math.min(nLog, 200), 5).getValues()
      .reverse().map(r => ({ quando: r[0] instanceof Date ? r[0].getTime() : null, quem: String(r[1]), acao: String(r[2]), detalhe: String(r[3]), resultado: String(r[4]) })) : [];
    return {
      agora: agora.getTime(),
      url: ScriptApp.getService().getUrl(),
      pilares: PILARES,
      planilha: SpreadsheetApp.getActive().getUrl(),
      meses: lerMeses_().map(m => Object.assign(pubMes_(m, agora), { manual: m.manual })),
      sup: sups.map(s => ({ cod: s.cod, nome: s.nome, ger: s.ger, gerente: s.gerente, m: s.m, s: s.s, ajuste: s.ajuste,
        tipoRegra: s.tipoRegra, tipo: s.tipo, pin: s.pin, ativo: s.ativo })),
      confrontos: conf,
      placar: placar_(confs, sups),
      log: log
    };
  });
}

function apiAdminSalvarMes(token, m) {
  return seguro_(() => {
    checarToken_(token);
    return comTrava_(() => {
      const mes = lerMeses_().find(x => x.id === m.id);
      if (!mes) throw new Error('Mês não encontrado.');
      if (!m.abertura || !m.fechamento || m.fechamento <= m.abertura) throw new Error('O fechamento precisa ser depois da abertura.');
      if (['', 'Aberto', 'Travado', 'Encerrado'].indexOf(m.manual) < 0) throw new Error('Status inválido.');
      aba_(ABA.MES).getRange(mes.linha, 3, 1, 4).setValues([[new Date(m.abertura), new Date(m.fechamento), m.manual, !!m.missoes]]);
      log_('admin', 'Mês', m.id + ' · ' + fmt_(m.abertura) + ' a ' + fmt_(m.fechamento) + ' · ' + (m.manual || 'automático') + ' · Missões ' + (m.missoes ? 'vale' : 'não vale'), 'Salvo');
      return {};
    });
  });
}

function apiAdminSalvarSup(token, d) {
  return seguro_(() => {
    checarToken_(token);
    return comTrava_(() => {
      const s = lerSup_().find(x => x.cod === d.cod);
      if (!s) throw new Error('Supervisão não encontrada.');
      const ajuste = d.ajuste === 'Mista' || d.ajuste === 'Segmentada' ? d.ajuste : '';
      if (ajuste !== s.ajuste) {
        const aberto = lerMeses_().map(m => pubMes_(m, new Date())).find(m => m.status === 'Aberto');
        if (aberto) throw new Error('Com ' + aberto.nome + ' aberto, o tipo dos supervisores fica travado.');
      }
      const nome = String(d.nome || '').trim();
      if (!nome) throw new Error('Informe o nome.');
      const sh = aba_(ABA.SUP);
      sh.getRange(s.linha, 2).setValue(nome);
      sh.getRange(s.linha, 7).setValue(ajuste);
      sh.getRange(s.linha, 9).setValue(!!d.ativo);
      log_('admin', 'Supervisor', s.cod + ' · ' + nome + ' · ajuste: ' + (ajuste || 'regra') + ' · ' + (d.ativo ? 'ativo' : 'inativo'), 'Salvo');
      return {};
    });
  });
}

function apiAdminNovoSup(token, d) {
  return seguro_(() => {
    checarToken_(token);
    return comTrava_(() => {
      const cod = String(d.cod || '').replace(/^Sv\./i, '').replace(/\s/g, '');
      if (!cod || !String(d.nome || '').trim()) throw new Error('Informe código e nome.');
      if (lerSup_().some(x => x.cod === cod)) throw new Error('Já existe a supervisão ' + cod + '.');
      const sh = aba_(ABA.SUP);
      const linha = sh.getLastRow() + 1;
      sh.getRange(linha, 1).setNumberFormat('@');
      sh.getRange(linha, 8).setNumberFormat('@');
      const pin = novoPin_();
      sh.getRange(linha, 1, 1, 9).setValues([[cod, String(d.nome).trim(), String(d.ger || '').trim(), String(d.gerente || '').trim(),
        Number(d.m) || 0, Number(d.s) || 0, '', pin, true]]);
      sh.getRange(linha, 9).insertCheckboxes().setValue(true);
      log_('admin', 'Supervisor', 'Novo: ' + cod, 'Criado');
      return { pin: pin };
    });
  });
}

function apiAdminNovoPin(token, cod) {
  return seguro_(() => {
    checarToken_(token);
    return comTrava_(() => {
      const s = lerSup_().find(x => x.cod === cod);
      if (!s) throw new Error('Supervisão não encontrada.');
      const pin = novoPin_();
      aba_(ABA.SUP).getRange(s.linha, 8).setValue(pin);
      CacheService.getScriptCache().remove('tent_' + cod);
      log_('admin', 'PIN', 'Novo PIN para ' + cod, 'Gerado');
      return { pin: pin };
    });
  });
}

function apiAdminCancelar(token, id, motivo) {
  return seguro_(() => {
    checarToken_(token);
    motivo = String(motivo || '').trim();
    if (motivo.length < 5) throw new Error('Escreva o motivo do cancelamento.');
    return comTrava_(() => {
      const c = lerConf_().find(x => x.id === id);
      if (!c) throw new Error('Confronto não encontrado.');
      if (c.status === 'Cancelado') throw new Error('Esse confronto já está cancelado.');
      const sh = aba_(ABA.CONF);
      sh.getRange(c.linha, 8).setValue('Cancelado');
      sh.getRange(c.linha, 9, 1, 4).clearContent();
      sh.getRange(c.linha, 14).setValue(motivo);
      log_('admin', 'Cancelamento', id + ' (' + c.a + ' x ' + c.b + ') · ' + motivo, 'Cancelado');
      return {};
    });
  });
}

function apiAdminResultado(token, id, pa, pb) {
  return seguro_(() => {
    checarToken_(token);
    return comTrava_(() => {
      const c = lerConf_().find(x => x.id === id);
      if (!c) throw new Error('Confronto não encontrado.');
      if (c.status === 'Cancelado') throw new Error('Confronto cancelado não recebe resultado.');
      const sh = aba_(ABA.CONF);
      const vazio = (pa === '' || pa === null) && (pb === '' || pb === null);
      if (vazio) {
        sh.getRange(c.linha, 9, 1, 4).clearContent();
        log_('admin', 'Resultado', id + ' · limpo', 'Salvo');
        return {};
      }
      const a = num_(pa), b = num_(pb);
      if (isNaN(a) || isNaN(b)) throw new Error('Informe o % sobre a meta dos dois supervisores.');
      const venc = a > b ? c.a : b > a ? c.b : 'Empate';
      const pts = venc === 'Empate' ? 0 : PONTOS_VITORIA;
      sh.getRange(c.linha, 9, 1, 4).setValues([[a, b, venc, pts]]);
      log_('admin', 'Resultado', id + ' · ' + c.a + ' ' + a + '% x ' + c.b + ' ' + b + '% · ' + venc, 'Salvo');
      return {};
    });
  });
}

function apiAdminManual(token, mesId, a, b, pilar) {
  return seguro_(() => {
    checarToken_(token);
    return comTrava_(() => {
      const c = registrar_(mesId, a, b, pilar, 'Admin', false);
      log_('admin', 'Desafio manual', a + ' x ' + b + ' · ' + pilar + ' · ' + mesId, 'Registrado');
      return { confronto: c };
    });
  });
}

/* ---------------- Regras ---------------- */

function registrar_(mesId, codA, codB, pilar, origem, exigirJanela) {
  const agora = new Date();
  const mes = lerMeses_().find(m => m.id === mesId);
  if (!mes) throw new Error('Mês não encontrado.');
  const st = statusMes_(mes, agora);
  if (exigirJanela && st !== 'Aberto') {
    throw new Error(st === 'Em breve'
      ? 'Os desafios de ' + mes.nome + ' abrem em ' + fmt_(mes.abertura) + '.'
      : 'Os desafios de ' + mes.nome + ' já fecharam.');
  }
  if (!exigirJanela && st === 'Encerrado') throw new Error(mes.nome + ' já está encerrado.');
  const sups = lerSup_();
  const A = sups.find(s => s.cod === codA && s.ativo);
  const B = sups.find(s => s.cod === codB && s.ativo);
  if (!A || !B) throw new Error('Supervisão não encontrada ou inativa.');
  if (A.cod === B.cod) throw new Error('Não dá para desafiar a si mesmo.');
  if (A.tipo !== B.tipo) throw new Error(B.cod + ' é ' + B.tipo + '. Supervisor ' + A.tipo + ' só desafia ' + A.tipo + '.');
  const validos = PILARES[A.tipo] || [];
  if (validos.indexOf(pilar) < 0) throw new Error('Pilar inválido para ' + A.tipo + '. Escolha: ' + validos.join(', ') + '.');
  if (pilar === MISSOES && !mes.missoes) throw new Error('Missões Guiadas não vale para confronto em ' + mes.nome + '. Escolha outro pilar.');
  const confs = lerConf_();
  const ocup = ocupados_(confs, mesId);
  if (ocup.has(A.cod)) throw new Error((origem === 'Portal' ? 'Você já está' : A.cod + ' já está') + ' em um confronto em ' + mes.nome + '.');
  if (ocup.has(B.cod)) throw new Error(B.cod + ' já está em um confronto em ' + mes.nome + '. Escolha outro supervisor.');

  const doMes = confs.filter(c => c.mes === mesId).length;
  const id = mesId + '-' + ('0' + (doMes + 1)).slice(-2);
  const sh = aba_(ABA.CONF);
  const linha = sh.getLastRow() + 1;
  sh.getRange(linha, 1, 1, 2).setNumberFormat('@');
  sh.getRange(linha, 1, 1, 14).setValues([[id, mesId, agora, A.cod, B.cod, A.tipo, pilar, 'Ativo', '', '', '', '', origem, '']]);
  SpreadsheetApp.flush();
  const ordem = confs.filter(c => c.mes === mesId && c.status !== 'Cancelado').length + 1;
  return pubConf_({ id: id, mes: mesId, registrado: agora.getTime(), a: A.cod, b: B.cod, tipo: A.tipo, pilar: pilar,
    status: 'Ativo', pa: null, pb: null, venc: '', pts: null, origem: origem, motivo: '' }, nomes_(sups), ordem);
}

function statusMes_(m, agora) {
  if (m.manual) return m.manual;
  if (!m.abertura || !m.fechamento) return 'Em breve';
  if (agora < m.abertura) return 'Em breve';
  if (agora <= m.fechamento) return 'Aberto';
  return 'Travado';
}

function mesPadrao_(meses, agora) {
  const aberto = meses.find(m => m.status === 'Aberto');
  if (aberto) return aberto.id;
  const iniciados = meses.filter(m => m.abertura && m.abertura <= agora.getTime());
  return (iniciados.length ? iniciados[iniciados.length - 1] : meses[0]).id;
}

function ocupados_(confs, mesId) {
  const set = new Set();
  confs.forEach(c => { if (c.mes === mesId && c.status !== 'Cancelado') { set.add(c.a); set.add(c.b); } });
  return set;
}

function placar_(confs, sups) {
  const ativos = {};
  sups.forEach(s => ativos[s.cod] = s);
  const p = {};
  const linha = cod => p[cod] || (p[cod] = { cod: cod, nome: ativos[cod] ? ativos[cod].nome : cod, tipo: ativos[cod] ? ativos[cod].tipo : '', pontos: 0, vitorias: 0, confrontos: 0 });
  confs.forEach(c => {
    if (c.status === 'Cancelado') return;
    linha(c.a).confrontos++; linha(c.b).confrontos++;
    if (c.venc && c.venc !== 'Empate' && p[c.venc]) { p[c.venc].pontos += c.pts || PONTOS_VITORIA; p[c.venc].vitorias++; }
  });
  return Object.keys(p).map(k => p[k]).sort((x, y) => y.pontos - x.pontos || y.vitorias - x.vitorias || x.cod.localeCompare(y.cod));
}

/* ---------------- Leitura ---------------- */

function lerSup_() {
  const sh = aba_(ABA.SUP);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 9).getValues().map((r, i) => {
    const s = {
      linha: i + 2, cod: String(r[0]).trim(), nome: String(r[1]).trim(), ger: String(r[2]).trim(), gerente: String(r[3]).trim(),
      m: Number(r[4]) || 0, s: Number(r[5]) || 0, ajuste: String(r[6]).trim(), pin: String(r[7]).trim(),
      ativo: r[8] === true || String(r[8]).toUpperCase() === 'TRUE'
    };
    s.tipoRegra = s.m >= s.s ? 'Mista' : 'Segmentada';
    s.tipo = s.ajuste === 'Mista' || s.ajuste === 'Segmentada' ? s.ajuste : s.tipoRegra;
    return s;
  }).filter(s => s.cod);
}

function lerMeses_() {
  const sh = aba_(ABA.MES);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 6).getValues().map((r, i) => ({
    linha: i + 2,
    id: r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, 'yyyy-MM') : String(r[0]).trim(),
    nome: String(r[1]).trim(),
    abertura: r[2] instanceof Date ? r[2] : null,
    fechamento: r[3] instanceof Date ? r[3] : null,
    manual: String(r[4]).trim(),
    missoes: r[5] === true || String(r[5]).toUpperCase() === 'TRUE'
  })).filter(m => m.id);
}

function lerConf_() {
  const sh = aba_(ABA.CONF);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 14).getValues().map((r, i) => ({
    linha: i + 2, id: String(r[0]).trim(),
    mes: r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM') : String(r[1]).trim(),
    registrado: r[2] instanceof Date ? r[2].getTime() : 0,
    a: String(r[3]).trim(), b: String(r[4]).trim(), tipo: String(r[5]).trim(), pilar: String(r[6]).trim(),
    status: String(r[7]).trim() || 'Ativo',
    pa: r[8] === '' ? null : Number(r[8]), pb: r[9] === '' ? null : Number(r[9]),
    venc: String(r[10]).trim(), pts: r[11] === '' ? null : Number(r[11]),
    origem: String(r[12]).trim(), motivo: String(r[13]).trim()
  })).filter(c => c.id);
}

function pubMes_(m, agora) {
  return { id: m.id, nome: m.nome, abertura: m.abertura ? m.abertura.getTime() : null,
    fechamento: m.fechamento ? m.fechamento.getTime() : null, status: statusMes_(m, agora), missoes: m.missoes };
}

function pubConf_(c, mapa, ordem) {
  return { id: c.id, mes: c.mes, ordem: ordem, registrado: c.registrado, a: c.a, b: c.b,
    nomeA: mapa[c.a] || c.a, nomeB: mapa[c.b] || c.b, tipo: c.tipo, pilar: c.pilar, status: c.status,
    pa: c.pa, pb: c.pb, venc: c.venc, pts: c.pts, origem: c.origem, motivo: c.motivo };
}

function nomes_(sups) { const m = {}; sups.forEach(s => m[s.cod] = s.nome); return m; }

/* ---------------- Utilitários ---------------- */

function seguro_(fn) {
  try { return Object.assign({ ok: true }, fn()); }
  catch (e) { return { ok: false, erro: e && e.message ? e.message : String(e) }; }
}

function comTrava_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Muita gente registrando ao mesmo tempo. Tente de novo em alguns segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}

function checarPin_(cod, pin) {
  cod = String(cod || '').trim();
  const cache = CacheService.getScriptCache();
  const k = 'tent_' + cod;
  const t = Number(cache.get(k) || 0);
  if (t >= 5) throw new Error('Muitas tentativas erradas. Espere 15 minutos ou fale com o time de categorias.');
  const s = lerSup_().find(x => x.cod === cod);
  if (!s || !s.ativo) throw new Error('Supervisão não encontrada.');
  if (String(pin || '').trim() !== s.pin) {
    cache.put(k, String(t + 1), 900);
    log_(cod, 'Login', '', 'PIN incorreto');
    throw new Error('PIN incorreto.');
  }
  cache.remove(k);
  return s;
}

function checarToken_(token) {
  if (!token || CacheService.getScriptCache().get('adm_' + token) !== '1') throw new Error('Sessão expirada. Entre de novo.');
}

function aba_(nome) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nome);
  if (!sh) throw new Error('Aba "' + nome + '" não existe. Rode "Configurar planilha" no menu Desafio Q4.');
  return sh;
}

function criarAba_(ss, nome, cab) {
  let sh = ss.getSheetByName(nome);
  if (!sh) sh = ss.insertSheet(nome);
  sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#F40009').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  return sh;
}

function log_(quem, acao, detalhe, resultado) {
  try { aba_(ABA.LOG).appendRow([new Date(), quem, acao, detalhe, resultado]); } catch (e) { /* log nunca derruba a operação */ }
}

function novoPin_() { return ('000' + Math.floor(Math.random() * 10000)).slice(-4); }

function gerarSenha_() {
  const c = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}

function num_(v) { return Number(String(v).replace('%', '').replace(',', '.').trim()); }

function fmt_(d) { return Utilities.formatDate(new Date(d), TZ, "dd/MM 'às' HH'h'mm"); }
