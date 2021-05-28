const disciplina = 'Física'; // AQUI
let usuario = '';
let p_disciplina = '';
let atendimentos;
let atendimentos_values;
let geradas;
let geradas_values;
let geradas_row;
let questoes_values;

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const erro = (mensagem) => {
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `ERRO: ${mensagem}: avaliacao: ${disciplina}: ${usuario}`}
    }
  );
  
  let codigo = `
document.getElementById('page').remove();
let p0 = document.createElement('p');
p0.setAttribute('class','erro');
p0.innerHTML = '${mensagem}';
document.getElementsByTagName('body')[0].appendChild(p0);
`;
  let saida = ContentService.createTextOutput();
  saida.append(codigo);
  saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return saida;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const erro_post = (mensagem) => {
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `ERRO: ${mensagem}: avaliacao: ${disciplina}: ${usuario}`}
    }
  );
  
  let saida = ContentService.createTextOutput();
  saida.append(`{"data":{"erro":"<p class=\\u0022erro\\u0022>ERRO: ${mensagem}.</p>"}}`);
  saida.setMimeType(ContentService.MimeType.JSON);
  return saida;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const autentica_usuario = (matricula_param, token) => {
  let tokeninfo_resp = UrlFetchApp.fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    {muteHttpExceptions: true}
  );
  if (tokeninfo_resp.getResponseCode() != 200) return 'Precisa fazer login.';
  let tokeninfo_obj = JSON.parse(tokeninfo_resp.getContentText());
  if (tokeninfo_obj.aud !== '330234016508-6d6d97vqrtofusi7f85c9t1iu6nmtced.apps.googleusercontent.com') {
    return 'Falhou a autenticação.';
  }
  usuario = tokeninfo_obj.email;
  tokeninfo_resp = null;
  tokeninfo_obj = null;
  
  let matricula = '000000';
  let grupos = [
    '1SxsnhlhJE-qZcNz0KI7Y0N8AVsD4JjhE_dNb-uBV_cw', // professores
    '1xCz5u-Vh9Dr3rNr7Sm4wq0VnoCwYSLttOAh1WVrnEag', // secretaria
    '1RxQVkJiS-4K9DyQ6GKVg9n_hhpIY2Yx-iZSG-Whjawk'  // alunos
  ];
  
  for (let i=0; i < grupos.length; i++) {
    let grupo_values = SpreadsheetApp.openById(grupos[i]).getDataRange().getDisplayValues();
    
    for (let j=0; j < grupo_values.length; j++) {
      if (grupo_values[j][0] === usuario) {
        if (i < 2) {
          matricula = matricula_param;
          if (i == 0) {p_disciplina = grupo_values[j][3];}
          else {p_disciplina = 'SEC';}
        }
        else { matricula = grupo_values[j][1]; p_disciplina = 'ALU';}
        break;
      }
    }
    
    if (matricula !== '000000') break;
  }
  
  if (! /^[0-9]{6}$/.test(matricula)) {
    return `Erro interno. O número da matrícula ${matricula} de ${usuario} está com formato errado. Informe o professor.`;
  }
  
  if (matricula === '000000') return `${usuario}, seu email não está cadastrado no sistema da escola. Seu professor pode atualizar seu email. Whatsapp do professor de Física é (19)99296-9405.`;
  
  if (matricula.charAt(2) == '1') return 'Tente outra vez quando estiver no Ensino Médio.';
  
  return matricula;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const qual_avaliacao = (matricula, avaliacao_param) => {

  // AQUI NÍVEL
  const avaliacoes = ['1A','1B','2A','2B','3A','3B'];
  const fazer = [false, false, false, false, false, false];
  
  let matriculado = false;
  let planilha_fazer_em = SpreadsheetApp.openById('1JVcssq8J-lTnVnSoy8yF8o1oOLhzqavcvqw1V6KkygM')
    .getDataRange().getDisplayValues(); // AQUI NÍVEL
  
  for (let i = 0; i < planilha_fazer_em.length; i++) {
    if (planilha_fazer_em[i][0] === matricula) {
      matriculado = true;
      
      // AQUI 11
      if (/CON/.test(planilha_fazer_em[i][11])) return 'CON';
      if (/1/.test(planilha_fazer_em[i][11])) { fazer[0] = true; fazer[1] = true;}
      if (/2/.test(planilha_fazer_em[i][11])) { fazer[2] = true; fazer[3] = true;}
      if (/3/.test(planilha_fazer_em[i][11])) { fazer[4] = true; fazer[5] = true;}
      break;
    }
  }
  
  if (! matriculado) return 'Avise seu professor que sua matricula não está na planilha Fazer.';
  
  matriculado = null;
  planilha_fazer_em = null;
  
  let solicitada = 0;
  for (let i = 0; i < avaliacoes.length; i++) {
    if (avaliacao_param === avaliacoes[i]) {
      solicitada = i;
      if (! fazer[i]) {return `Segundo a secretaria, você não precisa fazer a avaliação ${avaliacao_param}.`;}
      break;
    }
  }
  
  let iniciou = false;
  
  for (let i = 0; i < atendimentos_values.length; i++) {
    if (atendimentos_values[i][0] === matricula) {
      if (atendimentos_values[i][2] === 'OI' || atendimentos_values[i][2] === 'OG') iniciou = true;
      if (parseInt(atendimentos_values[i][1]) > 4) {
        for (let j = 0; j < avaliacoes.length; j++) {
          if (atendimentos_values[i][2] === avaliacoes[j]) fazer[j] = false;
        }
      }
    }
  }
  
  for (let j = 0; j < avaliacoes.length; j++) {
    if (fazer[j]) {
      if (! iniciou) return `Para iniciar ${disciplina}, envie uma mensagem para o WhatsApp (19)9.9296-9405 com sua matrícula e seu nome completo.`; // AQUI whatsapp
      else {
        if (solicitada <= j) {
          return avaliacoes[solicitada];
        }
        else {
          return `Precisa fazer a avaliação ${avaliacoes[j]} antes da ${avaliacoes[solicitada]}.`;
        }
      }
    }
  }
  
  return `Você já concluiu ${disciplina}. Em <a href="https://bit.ly/ceejapd">https://bit.ly/ceejapd</a> clique em "Ver notas (Passaporte)"`;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const fazendo_avaliacao = (matricula, avaliacao) => {
  let linha = '0';
  let agora = new Date();
  for (let i = 0; i < geradas_values.length; i++) {
    if (geradas_values[i][1] === matricula && geradas_values[i][2] === avaliacao) {
      geradas_row = [
        geradas_values[i][0], 
        geradas_values[i][1], 
        geradas_values[i][2], 
        geradas_values[i][3], 
        geradas_values[i][4], 
        geradas_values[i][5], 
        geradas_values[i][6], 
        geradas_values[i][7] 
      ];
      
      if (geradas_values[i][5] === '') {
        if (
          (agora.getTime() - 3*3600*1000 - Date.parse(geradas_values[i][0])) > 2*3600*1000 
          &&
          (p_disciplina === 'ALU' || p_disciplina === 'Física') // AQUI disciplina
        ) {
          let row = [
            "'" + geradas_values[i][0], 
            "'" + geradas_values[i][1], 
            "'" + geradas_values[i][2], 
            "'" + geradas_values[i][3], 
            "'" + geradas_values[i][4], 
            "'[6,6,6,6,6,6,6,6,6,6]", 
            "'0", 
            "'" + new Date(Date.parse(geradas_values[i][0]) + 2*3600*1000 + 1).toISOString()
          ];
          geradas.getRange(`GER!${i+1}:${i+1}`).setValues([row]);
          geradas.getRange(`GER!${i+1}:${i+1}`).setNumberFormat('@');
          geradas_row = row;
          
          linha = 'Expirou o tempo 2 horas. Tente outra vez.';
        }
        else linha = String(i + 1);
      }
      else {
        if (p_disciplina === 'ALU' || p_disciplina === 'Física') { // AQUI disciplina
          if (
            parseInt(geradas_values[i][6]) < 5 && 
            (agora.getTime() - 3*3600*1000 - Date.parse(geradas_values[i][7])) > 20*3600*1000
          ) linha = '0';
          else linha = String(i + 1);
        }
        else linha = String(i + 1);
      }
    }
  }
  
  return linha;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const gerar_avaliacao = (matricula, avaliacao) => {
  
  // AQUI usuario
  if (avaliacao === '3B' && ! (usuario === "sed.decourt@gmail.com" ||  usuario === "tarcisomesquita@gmail.com")) {
    return '3B é presencial.<br>Agende um horário com o professor.';
  }
  
  let qordem = [0,1,2,3,4,5,6,7,8,9];
  let q = [true,true,true,true,true,true,true,true,true,true];
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    let resto_q = 0;
    for (let j=0; j < 10; j++) {
      if (q[j]) resto_q++;
    }
    
    for (;;) {
      let resto_q2 = 0;
      let s_q = Math.floor(Math.random() * resto_q);
      for (let j=0; j < 10; j++) {
        if (q[j]) {
          if (s_q == resto_q2) {
            qordem[qnumber] = j;
            q[j] = false;
            break;
          }
          resto_q2++;
        }
      }
      if (qordem[qnumber] != undefined) break;
    }
  }
  

  let aordem = [[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6],[6,6,6,6]];
  
  // Quantas vezes uma letra foi escolhida para cada alternativa. [a,b,c,d]
  let n_letras = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    let letras_disponiveis = [[true,true,true,true],[true,true,true,true],[true,true,true,true],[true,true,true,true]];
    for (let i=0; i < 4; i++) {
      for (let j=0; j < 4; j++) {
        if (n_letras[i][j] == 4) letras_disponiveis[i][j] = false;
      }
    }
    
    for (;;) {
      let n_a = [0,0,0,0]; // 0 significa que já fez
      for (let i=0; i < 4; i++) {
        for (let j=0; j < 4; j++) {
          if (letras_disponiveis[i][j]) n_a[i]++;
        }
      }
      
      let menor;
      for (let j=0; j < 4; j++) {
        if (n_a[j] != 0) {menor = j; break;}
      }
      if (menor == undefined) break; // já escolheu todas as alternativas
      
      for (let j=1; j < 4; j++) {
        if (n_a[j] != 0 && n_a[j] < n_a[menor]) menor = j;
      }
      
      let s_a = Math.floor(Math.random() * n_a[menor]);
      let s_a2 = 0;
      for (let j=0; j < 4; j++) {
        if (letras_disponiveis[menor][j]) {
          if (s_a == s_a2) {
            aordem[qnumber][menor] = j;
            n_letras[menor][j]++;
            for (let i=0; i < 4; i++) {
              letras_disponiveis[i][j] = false; // tira a letra das outras alternativas
              letras_disponiveis[menor][i] = false; // tira todas as letras da alternativa atual
            }
            break;
          }
          s_a2++;
        }
      }
    }
  }
  
  
  let questoes = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) questoes[qnumber] = [];
  
  let n_questoes = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) n_questoes[qnumber] = 0;
  
  for (let i = 0; i < questoes_values.length; i++) {
    if (questoes_values[i][0] === avaliacao && questoes_values[i][8] == 'TRUE') {
      if (questoes_values[i][1] === '1') {
        questoes[0][n_questoes[0]] = i;
        n_questoes[0]++;
      }
      else if (questoes_values[i][1] === '2') {
        questoes[1][n_questoes[1]] = i;
        n_questoes[1]++;
      }
      else if (questoes_values[i][1] === '3') {
        questoes[2][n_questoes[2]] = i;
        n_questoes[2]++;
      }
      else if (questoes_values[i][1] === '4') {
        questoes[3][n_questoes[3]] = i;
        n_questoes[3]++;
      }
      else if (questoes_values[i][1] === '5') {
        questoes[4][n_questoes[4]] = i;
        n_questoes[4]++;
      }
      else if (questoes_values[i][1] === '6') {
        questoes[5][n_questoes[5]] = i;
        n_questoes[5]++;
      }
      else if (questoes_values[i][1] === '7') {
        questoes[6][n_questoes[6]] = i;
        n_questoes[6]++;
      }
      else if (questoes_values[i][1] === '8') {
        questoes[7][n_questoes[7]] = i;
        n_questoes[7]++;
      }
      else if (questoes_values[i][1] === '9') {
        questoes[8][n_questoes[8]] = i;
        n_questoes[8]++;
      }
      else if (questoes_values[i][1] === '10') {
        questoes[9][n_questoes[9]] = i;
        n_questoes[9]++;
      }
    }
  }
  
  let aletra = [];
  aletra[0] = 'a'; aletra[1] = 'b'; aletra[2] = 'c'; aletra[3] = 'd';
  
  let qselecionada = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    let qrandom = Math.floor(Math.random() * questoes[qnumber].length);
    qselecionada[qnumber] = questoes[qnumber][qrandom];
  }
  
  let avaliacao_questoes = '\
  {' +
'"qselecionada":' + JSON.stringify(qselecionada) + 
',"qordem":' + JSON.stringify(qordem) + 
',"aordem":' + JSON.stringify(aordem) + 
'}';
  
  let gabarito_desordenado = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    for (let anumber = 0; anumber < 4; anumber++) {
      if (questoes_values[qselecionada[qnumber]][7] === aletra[anumber]) { gabarito_desordenado[qnumber] = anumber; break;};
    }
  }
  
  let gabarito_ordem_questoes = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    gabarito_ordem_questoes[qnumber] = gabarito_desordenado[qordem[qnumber]];
  }
  
  let gabarito = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    for (let anumber = 0; anumber < 4; anumber++) {
      if (aordem[qnumber][anumber] == gabarito_ordem_questoes[qnumber]) gabarito[qnumber] = anumber;
    }
  }
  
  let data = new Date();
  
  let row = [
    "'" + new Date(data.getTime() - 3*3600*1000).toISOString(),
    "'" + matricula,
    "'" + avaliacao,
    "'" + avaliacao_questoes,
    "'" + JSON.stringify(gabarito), 
    '', 
    '', 
    ''
  ];
  geradas.appendRow(row);
  geradas_row = row;
  
  let lastRow = parseInt(geradas.getLastRow());
  geradas.getRange(`GER!${lastRow}:${lastRow}`).setNumberFormat('@');
  geradas.insertRowAfter(lastRow);
  
  return String(lastRow);
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const gerar_texto = (linha) => {
  const matricula = geradas_row[1];
  const avaliacao = geradas_row[2];
  const questoes = JSON.parse(geradas_row[3]);
  
  // AQUI disciplina
  let div_av = '\\n\
<div id="av" style="\
user-select: none;\
background-color: honeydew;\
font-family: sans-serif;\
color: black;\
font-size: 11pt;\
line-height: 16pt;\
text-align: justify;\
margin: 0px;\
padding: 10px;\
">\\n\
\\n\
<div style="text-align:center; font-weight:bold">\\n\
<p>CEEJA Paulo Decourt</p>\\n\
<p>Física: avaliação ' + avaliacao + ' para ' + matricula + '</p>\\n\
</div>\\n\
\\n\
';
  
  const aletra = ['a','b','c','d'];
  
  div_av = div_av + '<div>\\n'; 
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    div_av = div_av + '<p>' + (qnumber + 1) + ') ' + 
      questoes_values[questoes.qselecionada[questoes.qordem[qnumber]]][2] + '<br>\\n';
    for (let anumber = 0; anumber < 4; anumber++) {
      div_av = div_av + 
        '<spam  id="q' + qnumber + 'a' + anumber + '">(' + aletra[anumber] + ') ' + 
        questoes_values[questoes.qselecionada[questoes.qordem[qnumber]]][questoes.aordem[qnumber][anumber] + 3] + '</spam><br>\\n';
    }
    div_av = div_av + '</p>\\n';
  }
  div_av = div_av + '\
</div>\\n\
\\n\
<div style="text-align:center;">\\n\
<button id="botao" style="padding: 14px 40px; background-color:#008CBA; border: 2px solid #f44336; border-radius: 8px; color:white; font-size:20px; font-weight:bold">corrigir</button>\\n\
</div>\\n\
\\n\
<div id="saida"  style="text-align:center; position: fixed; top:50%; width:100%; color:red; border-color:blue; border-width:1px; background-color:#FFFFAA; visibility: hidden;"></div>\\n\
\\n\
<div id="box_nota" style="text-align: center; position: fixed; top: 30px; right: 30px; z-index: 2; color: orangered; visibility: hidden;"></div>\\n\
\\n\
<iframe id="hiddenFrame" name="hiddenFrame" style="visibility:hidden"></iframe>\\n\
<form id="formlog2" enctype="application/x-www-form-urlencoded" action="https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse" method="POST" target="hiddenFrame">\\n\
<input id="texto" name="entry.667481942" type="hidden">\\n\
</form>\\n\
\\n\
</div>\\n\
';
  
  let codigo = '\
document.getElementById("page").remove();\n\
let div0 = document.createElement("div");\n\
div0.innerHTML = \u0027' + div_av + '</div>\u0027\n\
document.getElementsByTagName("body")[0].appendChild(div0);\n\
  ';
  
  let script0 = '\
function set_nota(correcao) {\\n\
  document.getElementById("saida").style.visibility = "hidden";\\n\
  let correcao_obj = JSON.parse(correcao);\\n\
  if (correcao_obj.erro != undefined) {\\n\
    document.getElementById("saida").innerHTML = correcao_obj.erro;\\n\
    document.getElementById("saida").style.visibility = "visible";\\n\
     return;\\n\
  }\\n\
  \\n\
  for (let qnumber = 0; qnumber < 10; qnumber++) {\\n\
    for (let anumber = 0; anumber < 4; anumber++) {\\n\
      if (correcao_obj.cores[qnumber][anumber] == 7) {\\n\
        spam_id="q" + qnumber + "a" + anumber;\\n\
        document.getElementById(spam_id).style.backgroundColor = "limegreen";\\n\
      }\\n\
      else if (correcao_obj.cores[qnumber][anumber] == 8) {\\n\
        spam_id="q" + qnumber + "a" + anumber;\\n\
        document.getElementById(spam_id).style.backgroundColor = "tomato";\\n\
      }\\n\
    }\\n\
  }\\n\
  document.getElementById("box_nota").innerHTML = "nota<h1>" + correcao_obj.nota + "</h1>";\\n\
  if (correcao_obj.nota < 5) {\\n\
    document.getElementById("box_nota").style.color = "orangered";\\n\
    \\n\
    let refazer = new Date(Date.parse(correcao_obj.refazer) + 20*3600*1000);\\n\
    document.getElementById("saida").innerHTML = "Refazer após " + refazer.toLocaleString("pt-BR", { timeZone: "UTC" });\\n\
    document.getElementById("saida").style.visibility = "visible";\\n\
  }\\n\
  else document.getElementById("box_nota").style.color = "deepskyblue";\\n\
  document.getElementById("box_nota").style.visibility = "visible";\\n\
};\\n\
\\n\
  ';

  if (String(geradas_row[5]) === "") {
    // AQUI avaliacao_v
    script0 = script0 + '\
function classifique(alt_id) {\\n\
  const q = parseInt(alt_id.charAt(1));\\n\
  for (let a = 0; a < 4; a++) {\\n\
    document.getElementById("q" + q + "a" + a).style.backgroundColor = "honeydew";\\n\
  }\\n\
  document.getElementById(alt_id).style.backgroundColor = "yellow";\\n\
}\\n\
\\n\
function ler_respostas() {\\n\
  let respostas = [];\\n\
  for (let qnumber = 0; qnumber < 10; qnumber++) {\\n\
    respostas[qnumber] = 6;\\n\
    for (let anumber = 0; anumber < 4; anumber++) {\\n\
      if (document.getElementById("q" + qnumber + "a" + anumber).style.backgroundColor == "yellow") respostas[qnumber] = anumber;\\n\
    }\\n\
  }\\n\
  return JSON.stringify(respostas);\\n\
}\\n\
\\n\
function enviar_escolha() {\\n\
  if (window.confirm("Você realmente quer corrigir? Se a nota for menor que 5, terá que ESPERAR um dia para tentar outra vez.")) {\\n\
    document.getElementById("botao").style.visibility = "hidden";\\n\
    \\n\
    for (let qnumber = 0; qnumber < 10; qnumber++) {\\n\
      for (let anumber = 0; anumber < 4; anumber++) {\\n\
        document.getElementById("q" + qnumber + "a" + anumber).setAttribute("onclick","");\\n\
      }\\n\
    }\\n\
    document.getElementById("saida").innerHTML = "Aguarde. Corrigindo agora...";\\n\
    document.getElementById("saida").style.visibility = "visible";\\n\
    \\n\
    fetch("https://script.google.com/macros/s/" + avaliacao_v + "/exec?token=" + token, {\\n\
      method: "POST",\\n\
      mode: "cors",\\n\
      credentials: "omit",\\n\
      headers: {\\n\
        "Content-Type": "text/plain;charset=utf-8"\\n\
      },\\n\
      body: \\u0027{"linha":"' + linha + '","resp":"\\u0027 + ler_respostas() + \\u0027"}\\u0027,\\n\
    })\\n\
    .then(response => response.json())\\n\
    .then(data => {\\n\
      set_nota(JSON.stringify(data.data));\\n\
    })\\n\
    .catch((error) => {\\n\
      console.error("Error:", error);\\n\
    });\\n\
    \\n\
  }\\n\
  return;\\n\
}\\n\
\\n\
\\n\
for (let qnumber = 0; qnumber < 10; qnumber++) {\\n\
  for (let anumber = 0; anumber < 4; anumber++) {\\n\
    const spam_id = "q" + qnumber + "a" + anumber;\\n\
    document.getElementById(spam_id).setAttribute("onclick","classifique(\\u0027" + spam_id + "\\u0027)");\\n\
  }\\n\
}\\n\
\\n\
document.getElementById("botao").setAttribute("onclick","enviar_escolha()");\\n\
\\n\
  ';
  }
  // caso esteja com nota < 5
  else {
    let gabarito = JSON.parse(geradas_row[4]);
    let respostas_obj = JSON.parse(geradas_row[5]);
    let cores = [];
    
    for (let qnumber = 0; qnumber < 10; qnumber++) {
      cores[qnumber] = [];
      for (let anumber = 0; anumber < 4; anumber++) {
        if (respostas_obj[qnumber] != 6) {
          if (anumber == respostas_obj[qnumber] && anumber == gabarito[qnumber]) cores[qnumber][anumber] = 7;
          else if (anumber == respostas_obj[qnumber]) cores[qnumber][anumber] = 8;
          else cores[qnumber][anumber] = 9;
        }
        else {
          cores[qnumber][anumber] = 9;
        }
      }
    }
    
    script0 = script0 + '\
document.getElementById("botao").style.visibility = "hidden";\\n\
\\n\
for (let qnumber = 0; qnumber < 10; qnumber++) {\\n\
  for (let anumber = 0; anumber < 4; anumber++) {\\n\
    document.getElementById("q" + qnumber + "a" + anumber).setAttribute("onclick","");\\n\
  }\\n\
}\\n\
\\n\
set_nota(' + "' + " + '"' + "'" + '"' + " + '" + '{\
"nota":' + String(geradas_row[6]) + ',\
"cores":' + JSON.stringify(cores) + ',\
"refazer":"' + String(geradas_row[7]) + '"\
}' + "' + " + '"' + "'" + '"' + " + '" + ');\\n\
\\n\
  ';
  
  }
  
  codigo = codigo + '\
let script0 = document.createElement("script");\n\
script0.text = ' + "'" + script0 + "'" + '\n\
document.getElementsByTagName("body")[0].appendChild(script0);\n\
\n\
';
  
  return codigo;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const doGet = (e) => {
  if (e.parameter.token === undefined || e.parameter.matricula === undefined || e.parameter.avaliacao === undefined) {
    return erro('Faltou argumento');
  }
  
  const matricula = autentica_usuario(e.parameter.matricula, e.parameter.token);
  if (! /^[0-9]{6}$/.test(matricula)) return erro(matricula);
  
  atendimentos = SpreadsheetApp.openById('1VtD0Q3UgqWmGuPqViuEfOcx4uKzExkq_1VOAGF2jnPE'); // AQUI
  atendimentos_values = atendimentos.getDataRange().getDisplayValues();
  geradas = SpreadsheetApp.openById('10U8XeLZCBHBh7lQSXdiMlOMtXVH0KNQnOc7ToA0GD1Y'); // AQUI
  geradas_values = geradas.getDataRange().getDisplayValues();
  
  let concluiu = false;
  let avaliacao = qual_avaliacao(matricula, e.parameter.avaliacao);
  if (avaliacao === 'CON') concluiu = true;
  else if (! /^[123][AB]$/.test(avaliacao)) return erro(avaliacao);
  
  if (concluiu) avaliacao = e.parameter.avaliacao;
  
  let linha = fazendo_avaliacao(matricula, avaliacao);
  if (linha === '0' && concluiu) return erro(`${matricula} não fez a avaliação ${avaliacao}.`);
  
  questoes_values = SpreadsheetApp.openById('18ZGuv2dHnfznVfsfqwsRSA-fI9C4JyFjVWN9ntqx9e0').getDataRange().getDisplayValues(); // AQUI
  
  if (linha === '0' && ! concluiu) {
    if (p_disciplina === 'ALU' || p_disciplina === 'Física') {
      linha = 'repetir';
      while (linha === 'repetir') linha = gerar_avaliacao(matricula, avaliacao);
    }
    else return erro(`Você não tem permissão para gerar a avaliação ${avaliacao} para ${matricula}.`);
  }

  if (! /^[0-9]+$/.test(linha)) return erro(linha);
  
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `avaliacao: ${disciplina}: ${matricula}: ${e.parameter.avaliacao}: ${usuario}`}
    }
  );
  
  const saida = ContentService.createTextOutput();
  saida.append(gerar_texto(linha));
  saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return saida;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const corrigir = (token, linha, respostas) => {
  const matricula = autentica_usuario('507070', token);
  if (! /^[0-9]{6}$/.test(matricula)) return matricula;
  
  atendimentos = SpreadsheetApp.openById('1VtD0Q3UgqWmGuPqViuEfOcx4uKzExkq_1VOAGF2jnPE'); // AQUI
  geradas = SpreadsheetApp.openById('10U8XeLZCBHBh7lQSXdiMlOMtXVH0KNQnOc7ToA0GD1Y'); // AQUI
  geradas_values = geradas.getDataRange().getDisplayValues();
  
  let data = new Date();
  
  let linha_n = parseInt(linha) - 1;
  const data_g = geradas_values[linha_n][0];
  const matricula_g = geradas_values[linha_n][1];
  const avaliacao_g = geradas_values[linha_n][2];
  const questoes_g = geradas_values[linha_n][3];
  const gabarito_g = geradas_values[linha_n][4];
  let resposta_g = geradas_values[linha_n][5];
  let nota_g = '';
  let data_correcao_g = new Date(data.getTime() - 3*3600*1000).toISOString();
  
  if (p_disciplina !== 'ALU' && p_disciplina !== 'Física') return `Você não tem permissão para corrigir a avaliação ${avaliacao_g} de ${matricula_g}.`; // AQUI disciplina
  
  if (matricula_g !== matricula && p_disciplina !== 'Física') return `Linha ${linha}: Ao registrar a resposta. Divergência de matrícula.`; // AQUI disciplina
  if (resposta_g !== '') return `Linha ${linha}: Ao registrar a resposta. Já havia resposta para a avaliação.`;

  let row;
  if (data.getTime() - 3*3600*1000 - Date.parse(data_g) > 2*3600*1000) {
    nota_g = "0";
    resposta_g = "[6,6,6,6,6,6,6,6,6,6]";
    row = ["'" + data_g, 
      "'" + matricula_g, 
      "'" + avaliacao_g, 
      "'" + questoes_g, 
      "'" + gabarito_g, 
      "'" + resposta_g, 
      "'" + nota_g, 
      "'" + data_correcao_g
    ];
    
    geradas.getRange(`GER!${linha}:${linha}`).setValues([row]);
    geradas.getRange(`GER!${linha}:${linha}`).setNumberFormat('@');
    
    return 'Expirou o tempo 2 horas.'
  }
  
  resposta_g = respostas;
  
  const respostas_obj = JSON.parse(respostas);
  const gabarito = JSON.parse(gabarito_g);
  let nota = 0;
  let cores = [];
  
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    if (respostas_obj[qnumber] === gabarito[qnumber]) nota++;
  }
  nota_g = nota.toString();
  
  let nota_s = "00" + nota.toString();
  nota_s = nota_s.replace(/^([^,]*)$/, '$1,0');
  nota_s = nota_s.replace(/^.*([0-9]{2},)/, '$1');
  
  row = [
    "'" + matricula_g,
    "'" + nota_s,
    "'" + avaliacao_g,
    "'" + data.toLocaleString("pt-BR").substring(0,16)
  ];
  
  atendimentos.appendRow(row);

  let lastRow = parseInt(atendimentos.getLastRow());
  atendimentos.getRange('mkboletim!' + lastRow + ':' + lastRow).setNumberFormat('@');

  if (nota < 5) { atendimentos.getRange('mkboletim!B' + lastRow).setFontColor('#FF0000');}
  else          { atendimentos.getRange('mkboletim!B' + lastRow).setFontColor('#000000');}
  
  atendimentos.insertRowAfter(lastRow);
  
  row = ["'" + data_g, 
    "'" + matricula_g, 
    "'" + avaliacao_g, 
    "'" + questoes_g, 
    "'" + gabarito_g, 
    "'" + resposta_g, 
    "'" + nota_g, 
    "'" + data_correcao_g
  ];
  geradas.getRange(`GER!${linha}:${linha}`).setValues([row]);
  
  lastRow = parseInt(geradas.getLastRow());
  geradas.getRange(`GER!${lastRow}:${lastRow}`).setNumberFormat('@');
  geradas.insertRowAfter(lastRow);
  
  for (var qnumber = 0; qnumber < 10; qnumber++) {
    cores[qnumber] = [];
    for (var anumber = 0; anumber < 4; anumber++) {
      if (respostas_obj[qnumber] != 6) {
        if (anumber == respostas_obj[qnumber] && anumber == gabarito[qnumber]) cores[qnumber][anumber] = 7;
        else if (anumber == respostas_obj[qnumber]) cores[qnumber][anumber] = 8;
        else cores[qnumber][anumber] = 9;
      }
      else {
        cores[qnumber][anumber] = 9;
      }
    }
  }
  
  var refazer = new Date(data.getTime() - 3*3600*1000).toISOString();
  
  UrlFetchApp
  .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
    method: 'POST',
    payload: {'entry.667481942': `avaliacao: ${disciplina}: ${matricula_g}: ${nota_s}: ${avaliacao_g}: ${usuario}`}
  });

  return '{\
"nota":' + nota.toString() + ',\
"cores":' + JSON.stringify(cores) + ',\
"refazer":"' + refazer + '"\
}';
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

/*
doPost: {"linha":"61","resp":"[0,2,3,3,0,0,0,0,0,3]"}
correcao: {"nota":7,"cores":[[7,9,9,9],[9,9,7,9],[9,9,9,7],[9,9,9,7],[7,9,9,9],[8,9,9,9],[8,9,9,9],[8,9,9,9],[7,9,9,9],[9,9,9,7]],"refazer":"2021-02-16T18:56:56.006Z"}
*/
 // '<p>"' + e.postData.type + '" "' + e.postData.contents + '"</p>'
const doPost = (e) => {
  if (e.parameter.token === undefined || e.postData.contents === undefined || 
      ! /^\{"linha":"[0-9]+","resp":"\[([0-36],){9}[0-36]\]"\}$/.test(e.postData.contents) ) {
    return erro_post('Faltou parâmetro');
  }
  
  let post_obj = JSON.parse(e.postData.contents);
  
  let correcao = corrigir(e.parameter.token, post_obj.linha, post_obj.resp);
  if (! /^[{]["][n]/.test(correcao)) return erro_post(correcao);
  
  let output = ContentService.createTextOutput();
  output.append('{"data":' + correcao + '}');
  output.setMimeType(ContentService.MimeType.JSON);
  return output; 
}
