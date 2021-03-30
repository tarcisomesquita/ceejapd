var usuario = "";

function doGet(e) {
  const saida = ContentService.createTextOutput();
  

  let codigo = '';

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

  const matricula = autentica_usuario(e.parameter.matricula, e.parameter.token);
  //const matricula = '202482';
  
  
  if (! /^[0-9]{6}$/.test(matricula)) {
    UrlFetchApp
    .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
      method: 'POST',
      payload: {'entry.667481942': 'ERRO: avaliacao: doGet: autentica_usuario: ' + matricula}
    });
    
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027' + matricula + '\u0027\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  let linha = gerar_avaliacao(matricula);
  if (! /^[0-9]+$/.test(linha)) {
    UrlFetchApp
    .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
      method: 'POST',
      payload: {'entry.667481942': 'ERRO: avaliacao: doGet: gerar_avaliacao: ' + linha}
    });
    
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = ' + "'" + linha + "'" + '\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  codigo = codigo + gerar_texto(e.parameter.token, linha);
  
  saida.append(codigo);
  saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return saida;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function gerar_texto(token, linha) {
  const geradas = SpreadsheetApp.openById('10U8XeLZCBHBh7lQSXdiMlOMtXVH0KNQnOc7ToA0GD1Y')
    .getRange('GER!' + linha + ':' + linha).getDisplayValues();
  const matricula = geradas[0][1];
  const avaliacao = geradas[0][2];
  const questoes = JSON.parse(geradas[0][3]);
  
  let div_av = '\\n\
<div id="av" style="\
user-select: none; \
background-color: honeydew; \
font-family: sans-serif;\
color: black;\
font-size: 11pt;\
line-height: 16pt;\
text-align: justify;\
margin: 0px; \
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
  
  const fisica_questoes = SpreadsheetApp.openById('18ZGuv2dHnfznVfsfqwsRSA-fI9C4JyFjVWN9ntqx9e0')
    .getDataRange().getDisplayValues();
  
  div_av = div_av + '<div>\\n'; 
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    div_av = div_av + '<p>' + (qnumber + 1) + ') ' + 
      fisica_questoes[questoes.qselecionada[questoes.qordem[qnumber]]][2] + '<br>\\n';
    for (let anumber = 0; anumber < 4; anumber++) {
      div_av = div_av + 
        '<spam  id="q' + qnumber + 'a' + anumber + '">(' + aletra[anumber] + ') ' + 
        fisica_questoes[questoes.qselecionada[questoes.qordem[qnumber]]][questoes.aordem[qnumber][anumber] + 3] + '</spam><br>\\n';
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
    let refazer = new Date(Date.parse(correcao_obj.refazer) + 75600000);\\n\
    document.getElementById("saida").innerHTML = "Refazer após " + refazer.toLocaleString("pt-BR", { timeZone: "UTC" });\\n\
    document.getElementById("saida").style.visibility = "visible";\\n\
  }\\n\
  else document.getElementById("box_nota").style.color = "deepskyblue";\\n\
  document.getElementById("box_nota").style.visibility = "visible";\\n\
};\\n\
\\n\
  ';

  if (String(geradas[0][5]) === "") {
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
    \\n\
    fetch("' + ScriptApp.getService().getUrl() + '?matricula=' + matricula + '&token=' + token + '", {\\n\
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
    let gabarito = JSON.parse(geradas[0][4]);
    let respostas_obj = JSON.parse(geradas[0][5]);
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
"nota":' + String(geradas[0][6]) + ',\
"cores":' + JSON.stringify(cores) + ',\
"refazer":"' + String(geradas[0][7]) + '"\
}' + "' + " + '"' + "'" + '"' + " + '" + ');\\n\
\\n\
  ';
  
  }
  
  script0 = script0 + '\
var info = "avaliacao: ' + matricula + ' ' + avaliacao + '" + \\n\
           "\\\\nuserAgent: " + navigator.userAgent + \\n\
           "\\\\nscreen.width: " + screen.width + \\n\
           "\\\\nscreen.height: " + screen.height + \\n\
           "\\\\ninnerWidth: " + innerWidth + \\n\
           "\\\\ninnerHeight: " + innerHeight + \\n\
           "\\\\ndeviceMemory: " + navigator.deviceMemory + "GiB of RAM"; \\n\
\\n\
document.getElementById("texto").value = info;\\n\
\\n\
document.forms.formlog2.submit();\\n\
  ';

  codigo = codigo + '\
let script0 = document.createElement("script");\n\
script0.text = ' + "'" + script0 + "'" + '\n\
document.getElementsByTagName("body")[0].appendChild(script0);\n\
\n\
';
  
  return codigo;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function fazendo_avaliacao(matricula,avaliacao) {
  let geradas = SpreadsheetApp.openById('10U8XeLZCBHBh7lQSXdiMlOMtXVH0KNQnOc7ToA0GD1Y')
    .getDataRange().getDisplayValues();
  
  let linha = '0';
  for (let i = 0; i < geradas.length; i++) {
    if (geradas[i][1] === matricula && geradas[i][2] === avaliacao) {
      if (geradas[i][5] === '') linha = String(i + 1);
      else {
        let agora = new Date();
        if (agora.getTime() > (Date.parse(geradas[i][7]) + 75600000)) linha = '0';
        else linha = String(i + 1);
      }
    }
  }
  
  return linha;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function qual_avaliacao(matricula) {
  
  const avaliacoes = ['1A','1B','2A','2B','3A','3B'];
  const fazer = [false, false, false, false, false, false];
  
  {
  let matriculado = false;
  let planilha_fazer_em = SpreadsheetApp.openById('1JVcssq8J-lTnVnSoy8yF8o1oOLhzqavcvqw1V6KkygM')
    .getDataRange().getDisplayValues();
  
  for (let i = 0; i < planilha_fazer_em.length; i++) {
    if (planilha_fazer_em[i][0] === matricula) {
      matriculado = true;
      if (/1/.test(planilha_fazer_em[i][11])) { fazer[0] = true; fazer[1] = true;}
      if (/2/.test(planilha_fazer_em[i][11])) { fazer[2] = true; fazer[3] = true;}
      if (/3/.test(planilha_fazer_em[i][11])) { fazer[4] = true; fazer[5] = true;}
      break;
    }
  }
  
  if (! matriculado) return 'Faça matrícula. Acesse <a href="https://bit.ly/ceejapd">https://bit.ly/ceejapd</a> e preencha o "Formulário de rematrícula", depois vá à escola para assinar.';
  }

  let iniciou = false;
  {
  let planilha_fisica = SpreadsheetApp.openById('1VtD0Q3UgqWmGuPqViuEfOcx4uKzExkq_1VOAGF2jnPE')
    .getDataRange().getDisplayValues();
  
  for (let i = 0; i < planilha_fisica.length; i++) {
    if (planilha_fisica[i][0] === matricula) {
      if (planilha_fisica[i][2] === 'OI' || planilha_fisica[i][2] === 'OG') iniciou = true;
      if (parseInt(planilha_fisica[i][1]) > 4) {
        for (let j = 0; j < avaliacoes.length; j++) {
          if (planilha_fisica[i][2] === avaliacoes[j]) fazer[j] = false;
        }
      }
    }
  }
  }

  for (let j = 0; j < avaliacoes.length; j++) {
    if (fazer[j]) {
      if (! iniciou) return 'Para iniciar Física, envie uma mensagem para o WhatsApp (19)9.9296-9405 com sua matrícula e seu nome completo.';
      else return avaliacoes[j];
    }
  }
  
  return 'Você já concluiu Física. Em <a href="https://bit.ly/ceejapd">https://bit.ly/ceejapd</a> clique em "Ver notas (Passaporte)"';
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function gerar_avaliacao(matricula) {
  
  let avaliacao = qual_avaliacao(matricula);
  /*
  if (avaliacao === '3B' && ! (usuario === "sed.decourt@gmail.com" ||  usuario === "tarcisomesquita@gmail.com")) {
    return 'Última deve ser presencial.<br>Agende um horário com o professor.';
  }
  */
  if (! /^[123][AB]$/.test(avaliacao)) return avaliacao;
  
  let linha = fazendo_avaliacao(matricula,avaliacao);
  
  if (linha !== '0') return linha;
  
  let qordem = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    qordem[qnumber] = Math.floor(Math.random() * 10);
    i = 0;
    while (true) {
      if (i == qnumber) break;
      if (qordem[i] == qordem[qnumber]) {
        qordem[qnumber] = Math.floor(Math.random() * 10);
        i = -1;
      }
      i++;
    }
  }
  
  let aordem = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) aordem[qnumber] = [];
  
  for (let qnumber = 0; qnumber < 10; qnumber++) {
    for (let anumber = 0; anumber < 4; anumber++) {
      aordem[qnumber][anumber] = Math.floor(Math.random() * 4);
      i = 0;
      while (true) {
        if (i == anumber) break;
        if (aordem[qnumber][i] == aordem[qnumber][anumber]) {
          aordem[qnumber][anumber] = Math.floor(Math.random() * 4);
          i = -1;
        }
        i++;
      }
    }
  }
  
  let fisica_questoes = SpreadsheetApp.openById('18ZGuv2dHnfznVfsfqwsRSA-fI9C4JyFjVWN9ntqx9e0')
    .getDataRange().getDisplayValues();
  
  let questoes = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) questoes[qnumber] = [];
  
  let n_questoes = [];
  for (let qnumber = 0; qnumber < 10; qnumber++) n_questoes[qnumber] = 0;
  
  for (let i = 0; i < fisica_questoes.length; i++) {
    if (fisica_questoes[i][0] === avaliacao && fisica_questoes[i][8] == 'TRUE') {
      if (fisica_questoes[i][1] === '1') {
        questoes[0][n_questoes[0]] = i;
        n_questoes[0]++;
      }
      else if (fisica_questoes[i][1] === '2') {
        questoes[1][n_questoes[1]] = i;
        n_questoes[1]++;
      }
      else if (fisica_questoes[i][1] === '3') {
        questoes[2][n_questoes[2]] = i;
        n_questoes[2]++;
      }
      else if (fisica_questoes[i][1] === '4') {
        questoes[3][n_questoes[3]] = i;
        n_questoes[3]++;
      }
      else if (fisica_questoes[i][1] === '5') {
        questoes[4][n_questoes[4]] = i;
        n_questoes[4]++;
      }
      else if (fisica_questoes[i][1] === '6') {
        questoes[5][n_questoes[5]] = i;
        n_questoes[5]++;
      }
      else if (fisica_questoes[i][1] === '7') {
        questoes[6][n_questoes[6]] = i;
        n_questoes[6]++;
      }
      else if (fisica_questoes[i][1] === '8') {
        questoes[7][n_questoes[7]] = i;
        n_questoes[7]++;
      }
      else if (fisica_questoes[i][1] === '9') {
        questoes[8][n_questoes[8]] = i;
        n_questoes[8]++;
      }
      else if (fisica_questoes[i][1] === '10') {
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
      if (fisica_questoes[qselecionada[qnumber]][7] === aletra[anumber]) { gabarito_desordenado[qnumber] = anumber; break;};
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
  //return data.toISOString(); // 2021-01-22T11:00:26.678Z
  //return data.toLocaleString('pt-BR', {timeZone: 'UTC'}); // 22/01/2021 11:04:29
  
  let geradas = SpreadsheetApp.openById('10U8XeLZCBHBh7lQSXdiMlOMtXVH0KNQnOc7ToA0GD1Y');
  
  let lastRow = parseInt(geradas.getLastRow());
  geradas.insertRowAfter(lastRow);
  lastRow++;
  geradas.getRange('GER!A' + lastRow).setValue(data.toISOString());
  geradas.getRange('GER!B' + lastRow).setValue(matricula);
  geradas.getRange('GER!C' + lastRow).setValue(avaliacao);
  geradas.getRange('GER!D' + lastRow).setValue(avaliacao_questoes);
  geradas.getRange('GER!E' + lastRow).setValue(JSON.stringify(gabarito));
  
  return String(lastRow);
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function autentica_usuario(matricula_, token) {
  {
    let tokeninfo_obj;
    if (token === "undefined" || token === "") {
      return 'Volte e faça login.';
    }
    else {
      let tokeninfo_url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + token;
      let tokeninfo_resp = UrlFetchApp.fetch(tokeninfo_url,{muteHttpExceptions: true});
      if (tokeninfo_resp.getResponseCode() != 200) return 'Volte e faça login outra vez.';
      
      tokeninfo_obj = JSON.parse(tokeninfo_resp.getContentText());
      usuario = tokeninfo_obj.email;
    }
  }
  
  let matricula = '000000';
  {
    let grupo_alunos = SpreadsheetApp.openById('1RxQVkJiS-4K9DyQ6GKVg9n_hhpIY2Yx-iZSG-Whjawk')
      .getDataRange().getDisplayValues();
    
    for (let i = 0; i < grupo_alunos.length; i++) {
      if (grupo_alunos[i][0] === usuario) {
        matricula = grupo_alunos[i][1];
        break;
      }
    }
    
    if (! /^[0-9]{6}$/.test(matricula)) {
      return 'Erro interno. O número da matrícula de ' + usuario + ' está com formato errado. Informe o professor.';
    }
  }
  
  if (matricula === "000000") return 'Peça ao professor para liberar acesso para ' + usuario;
  
  if (matricula.charAt(2) == '1') return 'Tente outra vez quando estiver no Ensino Médio.';
  
  UrlFetchApp
  .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
    method: 'POST',
    payload: {'entry.667481942': 'avaliacao: autentica_usuario: ' + matricula + ' : ' + usuario}
  });
  
  return matricula;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

/*
doPost: {"linha":"61","resp":"[0,2,3,3,0,0,0,0,0,3]"}
correcao: {"nota":7,"cores":[[7,9,9,9],[9,9,7,9],[9,9,9,7],[9,9,9,7],[7,9,9,9],[8,9,9,9],[8,9,9,9],[8,9,9,9],[7,9,9,9],[9,9,9,7]],"refazer":"2021-02-16T18:56:56.006Z"}
*/
 // '<p>"' + e.postData.type + '" "' + e.postData.contents + '"</p>'
function doPost(e) {
  //return ContentService.createTextOutput("ERRO");
  let output = ContentService.createTextOutput();
  
  let post_obj = JSON.parse(e.postData.contents);
  
  let correcao = corrigir(e.parameter.matricula, e.parameter.token, post_obj.linha, post_obj.resp);
  
  UrlFetchApp
  .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
    method: 'POST',
    payload: {'entry.667481942': 'avaliacao: doPost: correcao: ' + correcao}
  });
  
  output.append('{"data":' + correcao + '}');
  output.setMimeType(ContentService.MimeType.JSON);
  return output; 
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function corrigir(matricula_, token, linha, respostas) {
  const matricula = autentica_usuario(matricula_, token);
  //const matricula = '202482';

  if (! /^[0-9]{6}$/.test(matricula)) {
    return '{"erro":"<p class=\\u0022erro\\u0022>ERRO: ' + matricula + '</p>"}';
  }
  
  var geradas = SpreadsheetApp.openById('10U8XeLZCBHBh7lQSXdiMlOMtXVH0KNQnOc7ToA0GD1Y');
  const matricula_g = geradas.getRange('GER!B' + linha).getDisplayValues();
  const resposta_g = geradas.getRange('GER!F' + linha).getDisplayValues();
  if (matricula_g !== matricula) {
    return '{"erro":"ERRO: ao registrar a resposta. Divergência de matrícula."}';
  }
  if (resposta_g !== "") {
    return '{"erro":"ERRO: ao registrar a resposta. Já havia resposta para a avaliação."}';
  }
  
  geradas.getRange('GER!F' + linha).setValue(respostas);
  
  const respostas_obj = JSON.parse(respostas);
  const gabarito = JSON.parse(geradas.getRange('GER!E' + linha).getDisplayValues());
  var nota = 0;
  var cores = [];
  
  for (var qnumber = 0; qnumber < 10; qnumber++) {
    if (respostas_obj[qnumber] === gabarito[qnumber]) nota++;
  }
  
  geradas.getRange('GER!G' + linha).setValue(nota.toString());
  
  var data = new Date();
  geradas.getRange('GER!H' + linha).setValue(data.toISOString());
  
  var planilha_fisica = SpreadsheetApp.openById('1VtD0Q3UgqWmGuPqViuEfOcx4uKzExkq_1VOAGF2jnPE');
  var lastRow = parseInt(planilha_fisica.getLastRow());
  planilha_fisica.insertRowAfter(lastRow);
  lastRow++;
  
  planilha_fisica.getRange('mkboletim!A' + lastRow).setValue(geradas.getRange('GER!B' + linha).getDisplayValues());
  
  var nota_s = "00" + nota.toString();
  nota_s = nota_s.replace(/^([^,]*)$/, '$1,0');
  nota_s = nota_s.replace(/^.*([0-9]{2},)/, '$1');
 
  planilha_fisica.getRange('mkboletim!B' + lastRow).setValue(nota_s);
  planilha_fisica.getRange('mkboletim!C' + lastRow).setValue(geradas.getRange('GER!C' + linha).getDisplayValues());
  planilha_fisica.getRange('mkboletim!D' + lastRow).setValue(data.toLocaleString("pt-BR").substring(0,16));
    
  
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
  
  var refazer = data.toISOString();
  
  return '{\
"nota":' + nota.toString() + ',\
"cores":' + JSON.stringify(cores) + ',\
"refazer":"' + refazer + '"\
}';
}
