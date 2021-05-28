let usuario = '';

const autentica_usuario = (matricula_param, token) => {
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
  let grupos = [
    '1SxsnhlhJE-qZcNz0KI7Y0N8AVsD4JjhE_dNb-uBV_cw', // professores
    '1xCz5u-Vh9Dr3rNr7Sm4wq0VnoCwYSLttOAh1WVrnEag', // secretaria
    '1RxQVkJiS-4K9DyQ6GKVg9n_hhpIY2Yx-iZSG-Whjawk'  // alunos
  ];
  
  for (let i=0; i < grupos.length; i++) {
    let planilha = SpreadsheetApp.openById(grupos[i]).getDataRange().getDisplayValues();
    
    for (let j=0; j < planilha.length; j++) {
      if (planilha[j][0] === usuario) {
        if (i < 2) { matricula = matricula_param;}
        else { matricula = planilha[j][1];}
        break;
      }
    }
    
    if (matricula !== '000000') break;
  }
  
  if (! /^[0-9]{6}$/.test(matricula)) {
    return `Erro interno. O número da matrícula de ${usuario}, "${matricula}", está com formato errado. Informe o professor.`;
  }
  
  if (matricula === '000000') return `${usuario}, seu email não está cadastrado no sistema da escola. Seu professor pode atualizar seu email. Whatsapp do professor de Física é (19)99296-9405.`;
  
  return matricula;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const erro = (mensagem) => {
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `ERRO: ${mensagem}: passaporte: ${usuario}`}
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

const doGet = (e) => {
  if (e.parameter.token === undefined || e.parameter.matricula === undefined) return erro('Faltou argumento');
  
  const matricula = autentica_usuario(e.parameter.matricula, e.parameter.token);
  if (! /^[0-9]{6}$/.test(matricula)) return erro(matricula);
  
  let nivel = '';
  if (matricula.charAt(2) === '2' || matricula.charAt(2) === '3') nivel = 'Médio';
  else if (matricula.charAt(2) === '1') nivel = 'Fundamental';
  else return erro(`Não identifiquei se "${matricula}" é Fundamental ou Médio.`);
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

  let planilha_matrix = SpreadsheetApp.openById('1KYgD88LJxLnNdl78Ew4Bj0rXcY5I2beJLXZuTuSYByo').getDataRange().getDisplayValues();
  
  let a_nome = 'Nenhum';
  let a_rg = 'Nenhum';
  let documento = `Matrícula: ${matricula}`;
  
  for (let i=0; i < planilha_matrix.length; i++) {
    if (planilha_matrix[i][0] === matricula) {
      if (a_nome !== 'Nenhum' || a_rg !== 'Nenhum') return erro(`${matricula} aparece mais de uma vez em matrix. Avise a secretaria.`);
      
      a_nome = planilha_matrix[i][1];
      a_rg = planilha_matrix[i][3];
      documento = `${documento}\\nNome: ${a_nome}\\nRG: ${a_rg}`;
    }
  }
  
  if (a_nome === 'Nenhum' || a_rg === 'Nenhum') return erro(`${matricula} não está matriculado.`);
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
  
  // Planilha matricula
  let planilha = SpreadsheetApp.openById('19101yYYqJnzGy1D5WaalQzzCLqjEWY6QoISzLFo7BZI').getDataRange().getDisplayValues();
  
  for (let j=0; j < planilha.length; j++) {
    if (planilha[j][1] === matricula) {
      documento = `${documento}\\nWhatsApp: ${planilha[j][17]}\\nEmail: ${planilha[j][19]}`;
    }
  }
  documento = `${documento}\\n`;
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

  // Planilha Fazer
  if (nivel === 'Médio') {
    planilha = SpreadsheetApp.openById('1JVcssq8J-lTnVnSoy8yF8o1oOLhzqavcvqw1V6KkygM').getDataRange().getDisplayValues();
  }
  else if (nivel === 'Fundamental') {
    planilha = SpreadsheetApp.openById('11XsRlFLF27D_pF-FX9uNCRC75_dBEXBlqlzBw5yGvrc').getDataRange().getDisplayValues();
  }
  else return erro('Erro interno 2');
  
  let fazer = [];
  for (let j=0; j < planilha.length; j++) {
    if (planilha[j][0] === matricula) {
      if (fazer.length > 0) return erro(`Planilha Fazer tem mais de um registro de ${matricula}`);
      else fazer = planilha[j];
    }
  }
  
  if (fazer.length === 0) return erro('Aluno não está na planilha Fazer.');
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
  let planilhas_id = [];
  let disciplinas = [];
  if (nivel == 'Médio') {
    planilhas_id = [
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
    
    disciplinas = ['POR','ING','ART','MAT','HIS','GEO','FIL','SOC','BIO','QUI','FIS'];
  }
  else if (nivel === 'Fundamental') {
    planilhas_id = [
      '1p0vObP7be6FWWBpGsW-6NWmB73iAEQ4MG7j6kPd259s',
      '1wz2y20iD4gloCyXq-0j4OMEbgiNDZ5O6ktkv-KmcVVw',
      '1nCfiMAwyQ5KnZQmYedb1WUHv-CnpKoxNxNugmqZWejQ',
      '1b-MQrIAH__qddtDw-QN90wpsQVBL-WTVAgjczqIoR34',
      '1NaZeuw2QK28gdYQ1R-elLFXR1YxAh9l0Tym9O0Ez0jY',
      '1i-huEQ2siM4xsr8bPM9AZhm7eIUEMYxSoys1CdeRYZM',
      '1STmnIhQnosxZDHuDeZjWZkYSK7vNRsxQbeRfoS93Zw4'
    ];
  
    disciplinas = ['POR','ING','ART','MAT','HIS','GEO','CIE'];
  }
  else return erro('Erro interno 3.');
  
  for (let i=0; i < planilhas_id.length; i++) {
    documento = `${documento}\\n\\n${disciplinas[i]} Fazer: ${fazer[i+1]}`;
    planilha = SpreadsheetApp.openById(planilhas_id[i]).getDataRange().getDisplayValues();
    for (let j=0; j < planilha.length; j++) {
      if (planilha[j][0] === matricula) {
        documento = `${documento}\\n${planilha[j][3]}\\t${planilha[j][2]}\\t${planilha[j][1]}`; // .split(' ')[0]
      }
    }
  }
  
  UrlFetchApp.fetch(
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', 
    {
      method: 'POST',
      payload: {'entry.667481942': `passaporte: ${matricula}: ${usuario}`}
    }
  );

  const saida = ContentService.createTextOutput();
  
  let codigo = `
document.getElementById('page').remove();

let pre0 = document.createElement('pre');
pre0.innerHTML = '${documento}';
document.getElementsByTagName('body')[0].appendChild(pre0);
`;
  saida.append(codigo);
  saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return saida;
}
