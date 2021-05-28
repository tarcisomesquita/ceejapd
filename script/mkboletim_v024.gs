/*
Software: mkboletim
Autor: Tarciso Mesquita de Oliveira
Licença: (CC BY 4.0) https://creativecommons.org/licenses/by/4.0/deed.pt_BR

Este web app, chamado mkboletim, tem a função de gerar um arquivo no formato pdf 1.4 contendo
o boletim do aluno que concluiu uma disciplina no CEEJA Paulo Decourt.
mkboletim guarda os dados dos boletins gerados na planilha Boletins. Esses dados podem ser acessados
pela secretaria usando o web app mkboletim_file.
mkboletim também marca na planilha Fazer que o aluno concluiu a disciplina e avisa a secretaria e o aluno
por email quando o aluno conclui todas as disciplinas, ou seja, quando conclui o curso.

mkboletim autentica o usuário usando um token gerado no login à uma conta Google e a planilha grupo_professores.

Sendo um web app, este software inicia pela função doGet.

Optei por retornar o arquivo usando ContentService.createTextOutput(), porém ContentService 
não possui o tipo MIME application/pdf, então optei por retornar um código javascript que cria  
um link contendo o arquivo pdf numa data url.

Não usei o HtmlService.createHtmlOutput() por que ele gera um iframe que restringe minhas ações.

Este web app é chamado pela página https://tarcisomesquita.github.io/ceejapd/index.html ao importar script.

Referências:
https://developers.google.com/apps-script/guides/web
https://developers.google.com/identity/sign-in/web/backend-auth
https://developers.google.com/apps-script/guides/v8-runtime
https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/pdf_reference_archives/PDFReference.pdf
*/

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

let usuario = '';

const autentica_usuario = (token) => {
  let tokeninfo_resp = UrlFetchApp.fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    {muteHttpExceptions: true}
  );
  if (tokeninfo_resp.getResponseCode() != 200) return 'Precisa fazer login.';
  
  let tokeninfo_obj = JSON.parse(tokeninfo_resp.getContentText());
  usuario = tokeninfo_obj.email;
  if (tokeninfo_obj.aud !== '330234016508-6d6d97vqrtofusi7f85c9t1iu6nmtced.apps.googleusercontent.com') {
    return 'Falhou a autenticação.';
  }
  
  tokeninfo_resp = null;
  tokeninfo_obj = null;

  let matricula = '000000';
  let grupo_professores = SpreadsheetApp.openById('1SxsnhlhJE-qZcNz0KI7Y0N8AVsD4JjhE_dNb-uBV_cw')
    .getDataRange().getDisplayValues();
  
  for (let i=0; i < grupo_professores.length; i++) {
    if (grupo_professores[i][0] === usuario) {
      matricula = '502000';
      break;
    }
  }
  grupo_professores = null;

  if (matricula === '000000') return 'Este serviço é de uso exclusivo dos professores.';
  
  return matricula;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const erro = (mensagem) => {
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `ERRO: mkboletim: ${mensagem}: ${usuario}`}
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


const gerar_pdf = (
  data_criacao, 
  matricula, 
  p_disciplina, 
  inicio, 
  final, 
  media, 
  a_nome, 
  a_rg, 
  p_nome, 
  p_rg, 
  nivel, 
  b_s
) => {
    const grade = `% linhas verticais
66 212 m
66 526 l
112 212 m
112 526 l
189 212 m
189 509 l
230 212 m
230 526 l
307 212 m
307 509 l
348 212 m
348 526 l
425 212 m
425 509 l
466 212 m
466 526 l
530 212 m
530 526 l

% linhas horizontais
66 212 m
530 212 l
66 228.5 m
530 228.5 l
66 245.0 m
530 245.0 l
66 261.5 m
530 261.5 l
66 278.0 m
530 278.0 l
66 294.5 m
530 294.5 l
66 311.0 m
530 311.0 l
66 327.5 m
530 327.5 l
66 344.0 m
530 344.0 l
66 360.5 m
530 360.5 l
66 377 m
530 377 l
66 393.5 m
530 393.5 l
66 410 m
530 410 l
66 426.5 m
530 426.5 l
66 443 m
530 443 l
66 459.5 m
530 459.9 l
66 476 m
530 476 l
66 492.5 m
530 492.5 l
112 509 m
466 509 l
66 525.5 m
530 525.5 l
S

% Cabeçalho
BT
  156 756 Td
  /F1 14 Tf
  (SECRETARIA DE ESTADO DA EDUCAÇÃO) Tj
  23 -24 Td
  /F1 12 Tf
  (DIRETORIA REGIONAL CAMPINAS LESTE) Tj
  45 -22 Td
  (CEEJA PAULO DECOURT) Tj
  6 -12 Td
  /F1 7 Tf
  (Ato Legal de Criação: 28232 de 03/03/1988) Tj
  -98 -12 Td
  /F1 9 Tf
  (Rua Amélia Bueno Camargo, s/n - Jardim Santana - Campinas - SP - CEP 13088-649) Tj
  43 -15 Td
  (Telefax: (019)3289-0822   email:e980156a@educacao.sp.gov.br) Tj
ET\n`;
  
  let offset = [];
  let pdf = '%PDF-1.4\n%üüüü\n';
  
  offset[0] = pdf.length + 1;
  pdf = `${pdf}
1 0 obj
<<
  /Title (Boletim de ${p_disciplina} do aluno ${matricula})
  /Author (${p_nome})
  /Subject (documento escolar)
  /Keywords (CEEJA, atividade, nota)
  /Creator (mkboletim)
  /Producer (Tarciso Mesquita)
  /CreationDate (${data_criacao})
>>
endobj\n`;
  
  offset[1] = pdf.length + 1;
  pdf = `${pdf}
2 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
  /Encoding /WinAnsiEncoding
>>
endobj\n`;
  
  offset[2] = pdf.length + 1;
  pdf = `${pdf}
3 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica,Bold
  /Encoding /WinAnsiEncoding
>>
endobj\n`;
  
  offset[3] = pdf.length + 1;
  pdf = `${pdf}
4 0 obj
<<
  /Type /Catalog
  /Pages 5 0 R
>>
endobj\n`;
  
  offset[4] = pdf.length + 1;
  pdf =`${pdf}
5 0 obj
<<
  /Type /Pages
  /Kids [6 0 R]
  /Count 1
>>
endobj\n`;
  
  offset[5] = pdf.length + 1;
  pdf =`${pdf}
6 0 obj
<<
  /Type /Page
  /Parent 5 0 R
  /MediaBox [ 0 0 595.28 841.89 ]
  /Resources
  <<
    /Font
    <<
      /F1 2 0 R
      /F2 3 0 R
    >>
  >>
  /Contents 7 0 R
>>
endobj\n`;
  
  let stream = `${grade}
% nível
BT
  240 625 Td
  /F1 12 Tf
  (Boletim Ensino ) Tj
  /F2 12 Tf
  (${nivel}) Tj
ET

% aluno
BT
  66 581 Td
  /F1 11 Tf
  (Nome: ) Tj
  /F2 11 Tf
  (${a_nome}) Tj

  230 -22 Td
  /F1 11 Tf
  (Início: ) Tj
  /F2 11 Tf
  (${inicio}) Tj
  145 0 Td
  /F1 11 Tf
  (Matrícula: ) Tj
  /F2 11 Tf
  (${matricula}) Tj
  /F1 11 Tf
  -375.5 0 Td
  (RG: ) Tj
  /F2 11 Tf
  (${a_rg}) Tj

  /F1 11 Tf
  0 -22 Td
  (Disciplina: ) Tj
  /F2 11 Tf
  (${p_disciplina}) Tj
ET

% header notas
BT
  76 505 Td
  /F1 11 Tf
  (U. E.) Tj
  400 0 Td
  (Conceito) Tj

  -332.5 8.5 Td
  (Avaliação 1) Tj
  118 0 Td
  (Avaliação 2) Tj
  118 0 Td
  (Avaliação 3) Tj

  -241 -17 Td
  (Data) Tj
  58.5 0 Td
  (Nota) Tj
  60 0 Td
  (Data) Tj
  58.5 0 Td
  (Nota) Tj
  60 0 Td
  (Data) Tj
  58.5 0 Td
  (Nota) Tj
ET

% notas
BT
  487 496.5 Td`;

  let b = JSON.parse(b_s);
  
  for (let linha=0; linha < b.length; linha++) {
    stream = `${stream}
  -405 -16.5 Td
  /F1 11 Tf
  (${b[linha][0]}) Tj
  41 0 Td
  /F2 11 Tf
  (${b[linha][1]}) Tj
  76 0 Td
  (${b[linha][2]}) Tj
  42 0 Td
  (${b[linha][3]}) Tj
  76 0 Td
  (${b[linha][4]}) Tj
  42 0 Td
  (${b[linha][5]}) Tj
  76 0 Td
  (${b[linha][6]}) Tj
  52 0 Td
  (${b[linha][7]}) Tj`;
  }
  
  stream = `${stream}
ET

% final
BT
  66 180 Td
  /F1 11 Tf
  (Conceito final: ) Tj
  /F2 11 Tf
  (${media}) Tj
  378 0 Td
  /F1 11 Tf
  (Final: ) Tj
  /F2 11 Tf
  (${final}) Tj

  /F1 11 Tf
  -378 -50 Td
  (Orientador de aprendizagem: ) Tj
  /F2 11 Tf
  (${p_nome}) Tj

  /F1 11 Tf
  0 -22 Td
  (RG: ) Tj
  /F2 11 Tf
  (${p_rg}) Tj
   
ET`;
  
  offset[6] = pdf.length + 1;
  pdf =`${pdf}
7 0 obj
<<
  /Length ${stream.length + 1}
>>
stream
${stream}
endstream
endobj\n`;
  
  let offset_xref = pdf.length + 1;
  pdf = `${pdf}
xref
0 ${offset.length}
0000000000 65535 f`;
  
  for (let i=0; i < offset.length; i++) {
    pdf = `${pdf}
${('00000000' + String(offset[i])).slice(-10)} 00000 n`;
  }
  
  pdf = `${pdf}
trailer <<
  /Root 4 0 R
  /Info 1 0 R
  /Size ${offset.length}
>>
startxref
${offset_xref}
%%EOF`;
  
  let data_pdf = 'data:application/pdf;base64,' + 
    Utilities.base64Encode(Utilities.newBlob('').setDataFromString(pdf, 'ISO-8859-15').getBytes());
  
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `mkboletim: ${matricula}: ${usuario}: SUCESSO`}
    }
  );
  
  let codigo = `
document.getElementById('page').remove();
let h = document.createElement('h1');
h.innerHTML = '<a download="${matricula}.pdf" href="${data_pdf}">Baixar o boletim</a>';
document.getElementsByTagName('body')[0].appendChild(h);
let hh = document.createElement('h1');
hh.innerHTML = '<a href="${data_pdf}">Ver o boletim</a>';
document.getElementsByTagName('body')[0].appendChild(hh);
`;
  let saida = ContentService.createTextOutput();
  saida.append(codigo);
  saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return saida;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const doGet = (e) => {
  if (e.parameter.token === undefined || e.parameter.matricula === undefined) return erro('Faltou argumento');
  
  let matricula = autentica_usuario(e.parameter.token);
  
  if (! /^[0-9]{6}$/.test(matricula)) return erro(matricula);
  
  let grupo_professores = SpreadsheetApp.openById('1SxsnhlhJE-qZcNz0KI7Y0N8AVsD4JjhE_dNb-uBV_cw').getDataRange().getDisplayValues();
  
  let [p_nome, p_rg, p_disciplina, p_planilha_id] = ['Nenhum', 'Nenhum', 'Nenhum', 'Nenhum'];
  
  for (let i=0; i < grupo_professores.length; i++) {
    if (grupo_professores[i][0] === usuario) {
      [usuario, p_nome, p_rg, p_disciplina] = grupo_professores[i];
      break;
    }
  }
  grupo_professores = null;
  
  let planilhas_id = [
    '1p0vObP7be6FWWBpGsW-6NWmB73iAEQ4MG7j6kPd259s',
    '1wz2y20iD4gloCyXq-0j4OMEbgiNDZ5O6ktkv-KmcVVw',
    '1nCfiMAwyQ5KnZQmYedb1WUHv-CnpKoxNxNugmqZWejQ',
    '1b-MQrIAH__qddtDw-QN90wpsQVBL-WTVAgjczqIoR34',
    '1NaZeuw2QK28gdYQ1R-elLFXR1YxAh9l0Tym9O0Ez0jY',
    '1i-huEQ2siM4xsr8bPM9AZhm7eIUEMYxSoys1CdeRYZM',
    '1EmKLpiyIDhV0AWknIR9We1hoKQsdkDlF41st5qC0-0g',
    '1Jds1uI09zsqP6UCCp4KwFEhZKNMWHYbRf_pfk5uk1zY',
    '1STmnIhQnosxZDHuDeZjWZkYSK7vNRsxQbeRfoS93Zw4',
    '1ovFQCKMX5-6GahRbwsULe5WA0wb2yx_8a7n4XpbDHc8',
    '1VtD0Q3UgqWmGuPqViuEfOcx4uKzExkq_1VOAGF2jnPE'
  ];
  
  let disciplinas = ['Língua Portuguesa', 'Inglês', 'Arte', 'Matemática', 'História', 'Geografia', 'Filosofia', 'Sociologia', 'Biologia', 'Química', 'Física'];
  
  for (let i=0; i < disciplinas.length; i++) {
    if (disciplinas[i] === p_disciplina) {
      p_planilha_id = planilhas_id[i];
      break;
    }
  }
  planilhas_id = null;
  disciplinas = null;
  
  if (p_nome === 'Nenhum' ||
      p_rg === 'Nenhum' ||
      p_disciplina === 'Nenhum' ||
      p_planilha_id === 'Nenhum') {
    return erro('Há erro na planilha grupo_professores.');
  }
  
  matricula = e.parameter.matricula;
  if (matricula === '') return erro('Faltou digitar o número da matrícula.');
  
  if (! /^[0-9]{6}$/.test(matricula)) {
    return erro(`O número da matrícula "${matricula}" não tem o formado de 6 dígitos. Ex.: "202201".`);
  }
  
  let nivel = '';
  if (matricula.charAt(2) === '2' || matricula.charAt(2) === '3') {
    nivel = 'Médio';
  }
  else if (matricula.charAt(2) === '1') {
    nivel = 'Fundamental';
  }
  else {
    return erro(`Não sei se "${matricula}" é do Fundamental ou Médio.`);
  }
  
  if (p_disciplina === 'Biologia' && nivel === 'Fundamental') {
    p_disciplina = 'Ciências';
  }
  
  // = = = = = = = = seleciona os registros do aluno da matricula = = = = = = = = = = = = = = = 
  
  let atendimentos = SpreadsheetApp.openById(p_planilha_id).getDataRange().getDisplayValues();
  p_planilha_id = null;

  let linha_atendimentos = [];
  let passaporte = [];
  for (let i=0; i < atendimentos.length; i++) {
    if (atendimentos[i][0] === matricula) {
       passaporte.push(atendimentos[i]);
       linha_atendimentos.push(i + 1);
    }
  }
  atendimentos = null;
  
  let p_len = passaporte.length - 1;
  if (p_len === -1) return erro(`"${matricula}" não está na planilha de atendimentos.`);
  
  let inicio = '';
  if ( (passaporte[0][2] === 'OI' || passaporte[0][2] === 'OG') && (passaporte[0][1] === '' || passaporte[0][1] === '-')) {
    inicio = passaporte[0][3].split(' ')[0];
  }
  else {
    return erro(`Não é OI, o primeiro registro de "${matricula}". LINHA: ${linha_atendimentos[0]}`);
  }
  
  let final = '';
  if ( passaporte[p_len][2] === 'CON') {
    if (passaporte[p_len][1] === '' || passaporte[p_len][1] === '-') {
      if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4} [0-9]{2}:[0-9]{2}$/.test(passaporte[p_len][3])) {
        final = passaporte[p_len][3].split(' ')[0];
      }
      else {
        return erro(`No registro CON deve ter data no formato dd/mm/aaaa hh:mm. LINHA: ${linha_atendimentos[p_len]}`);
      }
    }
    else {
      return erro(`No registro CON a coluna Nota tem que ficar vazia. LINHA: ${linha_atendimentos[p_len]}`);
    }
  }
  else {
    return erro(`Não é CON, o último registro de "${matricula}". LINHA: ${linha_atendimentos[p_len]}`);
  }
  
  p_len = null;
  
  let avaliacoes = [];
  let linha_planilha2 = [];
  for (let i=0 ; i < passaporte.length; i++) {
    if (passaporte[i][1] !== '' && passaporte[i][1] !== '-') {
      if (/^[0-9,]+$/.test(passaporte[i][1])) {
        if (passaporte[i][2] === '') {
          return erro(`${matricula} está sem o nome da atividade. LINHA: ${linha_atendimentos[i]}`);
        }
        avaliacoes.push(passaporte[i]);
        linha_planilha2.push(linha_atendimentos[i]);
      }
      else {
        return erro(`Na coluna Nota pode haver apenas números e vírgula. LINHA: ${linha_atendimentos[i]}`);
      }
    }
  }
  passaporte = null;
  linha_atendimentos = null;

  if (avaliacoes.length === 0) {
    return erro(`${matricula} iniciou em ${inicio} mas não fez avaliação.`);
  }
  
  // = = = = = = = = seleciona as atividades com nota = = = = = = = = = = = = = = = 
  
  let atividade = [];
  let data = [];
  let nota = [];
  let conceito = [];
  let b = [];
  let linha = 0;
  let media = 0.0;
  let n = 0;
  
  data[linha] = [];
  nota[linha] = [];
  conceito[linha] = '';
  let j = 0;
  
  for (let i=0; i < avaliacoes.length; i++) {
    if ( (j != 0 || conceito[linha - 1] === '--,-') && (atividade[linha] !== avaliacoes[i][2]) ) {
      return erro(`A atividade "${avaliacoes[i][2]}" está antes de fechar a atividade "${atividade[linha]}". LINHA: ${linha_planilha2[i]}`);
    }
    else {
      atividade[linha] = avaliacoes[i][2];
    }
    
    if (atividade[linha] == atividade[linha - 1] && conceito[linha - 1] != '--,-') {
      return erro(`Tem atividade "${atividade[linha]}" depois dela já ter sido fechada. LINHA: ${linha_planilha2[i]}`);
    }
    
    data[linha][j] = avaliacoes[i][3].split(' ')[0];
    nota[linha][j] = avaliacoes[i][1];
    
    if (avaliacoes[i][3].split(' ')[1] === null) {
      return erro(`Tem atividade "${atividade[linha]}" sem horário. LINHA: ${linha_planilha2[i]}`);
    }
    
    if (parseFloat(nota[linha][j]) >= 5) {
      conceito[linha] = nota[linha][j];
      if (nota[linha][j] != '--,-') {
        media = media + parseFloat(nota[linha][j].replace(',', '.'));
        n = n + 1;
      }
      if (j < 2) {
        for (j = j + 1; j < 3; j++) {
          data[linha][j] = '--/--/----';
          nota[linha][j] = '--,-';
        }
      }
      
      b[linha] = [
        atividade[linha], 
        data[linha][0], nota[linha][0], 
        data[linha][1], nota[linha][1], 
        data[linha][2], nota[linha][2], 
        conceito[linha]
      ];
      
      j = 0;
      linha++;
      conceito[linha] = '';
      data[linha] = [];
      nota[linha] = [];
    }
    else {
      if (i === (avaliacoes.length - 1)) {
        return erro(`A atividade "${atividade[linha]}" não tem nota >= 5. LINHA: ${linha_planilha2[i]}`);
      }
      
      j++;
      if (j == 3) {
        conceito[linha] = '--,-';
        
        b[linha] = [
          atividade[linha], 
          data[linha][0], nota[linha][0], 
          data[linha][1], nota[linha][1], 
          data[linha][2], nota[linha][2], 
          conceito[linha]
        ];
        
        j = 0;
        linha++;
        conceito[linha] = '';
        data[linha] = [];
        nota[linha] = [];
        atividade[linha] = atividade[linha - 1];
      }
    }
  }
  avaliacoes = null;
  linha_planilha2 = [];
  
  atividade = null;
  data = null;
  nota = null;
  conceito = null;
  linha = null;

  // = = = = = = = = calcula o conceito final = = = = = = = = = = = = = = = 
  
  media = Math.round(media / n);
  let media_s = '00' + media.toString(); media_s = media_s.slice(-2);
  media = null;
  n = null;
  
  // = = = = = = = = pega nome e rg na planilha matrix = = = = = = = = = = = = = = = 
  
  let planilha_matrix = SpreadsheetApp.openById('1KYgD88LJxLnNdl78Ew4Bj0rXcY5I2beJLXZuTuSYByo').getDataRange().getDisplayValues();
  
  let a_nome = 'Nenhum';
  let a_rg = 'Nenhum';
  
  for (let i=0; i < planilha_matrix.length; i++) {
    if (planilha_matrix[i][0] === matricula) {
      if (a_nome !== 'Nenhum' || a_rg !== 'Nenhum') {
        return erro(`${matricula} aparece mais de uma vez em matrix. Avise a secretaria.`);
      }
      
      [ , a_nome, , a_rg] = planilha_matrix[i];
    }
  }
  planilha_matrix = null;
  
  if (a_nome === 'Nenhum' || a_rg === 'Nenhum') {
    return erro(`${matricula} não está em matrix. Avise a secretaria.`);
  }
  
  
  // = = = = = = = = cria o arquivo pdf = = = = = = = = = = = = = = = 
  
  let hoje = new Date();
  let ano = (hoje.getYear() - 100 + 2000).toString(); // use Date.prototype.getFullYear()
  let mes = hoje.getMonth() + 1;
      mes = '00' + mes.toString(); mes = mes.slice(-2);
  let dia = '00' + hoje.getDate().toString(); dia = dia.slice(-2);
  let horas = '00' + hoje.getHours().toString(); horas = horas.slice(-2);
  let minutos = '00' + hoje.getMinutes().toString(); minutos = minutos.slice(-2);
  let segundos = '00' + hoje.getSeconds().toString(); segundos = segundos.slice(-2);
  let data_criacao =  `D:${ano}${mes}${dia}${horas}${minutos}${segundos}-03'00'`;
  hoje = null;
  ano = null;
  mes = null;
  dia = null;
  horas =  null;
  minutos = null;
  segundos = null;
  
  let row = [data_criacao, matricula, p_disciplina, inicio, final, media_s, a_nome, a_rg, p_nome, p_rg, nivel, JSON.stringify(b)];
  let boletins = SpreadsheetApp.openById('19yUQLnuBKYhs4Evt3iJeYAVf5mxmA8SBhpuzncTfubw');
  boletins.appendRow(row);
  
  let lastRow = parseInt(boletins.getLastRow());
  boletins.getRange('BOL!' + lastRow + ':' + lastRow).setNumberFormat('@');
  boletins.insertRowAfter(lastRow);
  
  row = null;
  boletins = null;
  lastRow = null;
  
  // = = = = = = = = = = = = = insere CON na planilha Fazer = = = = = = = = = = = = =
  
  let planilha_fazer = [];
  let coluna = '';
  
  if (nivel === 'Médio') {
    planilha_fazer = SpreadsheetApp.openById('1JVcssq8J-lTnVnSoy8yF8o1oOLhzqavcvqw1V6KkygM');

    if (p_disciplina === 'Língua Portuguesa') coluna = 'B';
    else if (p_disciplina === 'Inglês') coluna = 'C';
    else if (p_disciplina === 'Arte') coluna = 'D';
    else if (p_disciplina === 'Matemática') coluna = 'E';
    else if (p_disciplina === 'História') coluna = 'F';
    else if (p_disciplina === 'Geografia') coluna = 'G';
    else if (p_disciplina === 'Filosofia') coluna = 'H';
    else if (p_disciplina === 'Sociologia') coluna = 'I';
    else if (p_disciplina === 'Biologia') coluna = 'J';
    else if (p_disciplina === 'Química') coluna = 'K';
    else if (p_disciplina === 'Física') coluna = 'L';
  }
  else if (nivel === 'Fundamental') {
    planilha_fazer = SpreadsheetApp.openById('11XsRlFLF27D_pF-FX9uNCRC75_dBEXBlqlzBw5yGvrc');

    if (p_disciplina === 'Língua Portuguesa') coluna = 'B';
    else if (p_disciplina === 'Inglês') coluna = 'C';
    else if (p_disciplina === 'Arte') coluna = 'D';
    else if (p_disciplina === 'Matemática') coluna = 'E';
    else if (p_disciplina === 'História') coluna = 'F';
    else if (p_disciplina === 'Geografia') coluna = 'G';
    else if (p_disciplina === 'Ciências') coluna = 'H';
  }
  else {
    return erro('nivel não existe');
  }
  
  let planilha_fazer_values = planilha_fazer.getDataRange().getDisplayValues();
  
  for (let i=0; i < planilha_fazer_values.length; i++) {
    if (planilha_fazer_values[i][0] === matricula) {
      let linha_fazer = planilha_fazer_values[i];
      linha_fazer[coluna.charCodeAt(0) - 65] = 'CON';
      planilha_fazer.getRange(coluna + (i + 1)).setValue('CON');
      
      let concluinte = false;
      for (let j=1; j < linha_fazer.length; j++) {
        if (linha_fazer[j] === 'CON' || linha_fazer[j] === 'ENEM' || linha_fazer[j] === 'ENCC') {concluinte = true}
        else {concluinte = false; break};
      }
      
      if (concluinte) {
        let grupo_alunos = SpreadsheetApp.openById('1RxQVkJiS-4K9DyQ6GKVg9n_hhpIY2Yx-iZSG-Whjawk').getDataRange().getDisplayValues();
        let copia = '';
        for (let j=0; j < grupo_alunos.length; j++) {
          if (grupo_alunos[j][1] === matricula) { copia = grupo_alunos[j][0]; break;}
        }
        if (copia === '') { copia = 'tarcisomesquita@gmail.com'}
        
        MailApp.sendEmail(
         'boletimceejapd@gmail.com', 
          `${matricula} concluiu o curso`, 
          `
  Parabéns! Você concluiu o curso.
  
  Assim que todos os professores enviarem os boletins para a secretaria, seu prontuário será remetido para análise de documentos. Caso haja alguma inconsistência, entraremos em contato.
  
  Não há necessidade de entrar em contato com os professores a partir de agora. Quando o histórico estiver pronto, publicaremos no facebook da escola.
  O histórico será entregue somente após a publicação dele em Diário Oficial.
  `, 
          {
            name: 'CEEJA Paulo Decourt',
            cc: copia
          }
        );
      }
      linha_fazer = null;
      break;
    }
  }
  planilha_fazer = null;
  planilha_fazer_values = null;
  coluna = null;
  
  return gerar_pdf(
    data_criacao, 
    matricula, 
    p_disciplina, 
    inicio, 
    final, 
    media_s, 
    a_nome, 
    a_rg, 
    p_nome, 
    p_rg, 
    nivel, 
    JSON.stringify(b)
  );
;
}
