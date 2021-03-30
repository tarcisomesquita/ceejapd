function doGet(e) {
  const saida = ContentService.createTextOutput();
  
  let codigo = '\
document.getElementById("page").remove();\n\
\n\
';
  
  const matricula = autentica_usuario(e.parameter.matricula, e.parameter.token);
  
  if (! /^[0-9]{6}$/.test(matricula)) {
    UrlFetchApp
    .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
      method: 'POST',
      payload: {'entry.667481942': 'passaporte>doGet>autentica_usuario: ' + matricula}
    });
    
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027' + matricula + '\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  let nivel = '';
  if (matricula.charAt(2) == "2" || matricula.charAt(2) == "3") {
    nivel = "Médio";
  }
  else if (matricula.charAt(2) == "1") {
    nivel = "Fundamental";
  }
  else {
    UrlFetchApp
    .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
      method: 'POST',
      payload: {'entry.667481942': 'passaporte>doGet>: Não identifiquei se ' + matricula + ' é Fundamental ou Médio'}
    });
    
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027Não identifiquei se ' + matricula + ' é Fundamental ou Médio.\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

  let planilha_matrix = SpreadsheetApp.openById('1KYgD88LJxLnNdl78Ew4Bj0rXcY5I2beJLXZuTuSYByo').getDataRange().getDisplayValues();
  
  let a_nome = 'Nenhum';
  let a_rg = 'Nenhum';
  let documento = 'Matrícula: ' + matricula + '\\n';
  
  for (var i = 0; i < planilha_matrix.length; i++) {
    if (planilha_matrix[i][0] == matricula) {
      if (a_nome != 'Nenhum' || a_rg != 'Nenhum') {
        codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027ERRO: ' + matricula + ' aparece mais de uma vez em matrix. Avise a secretaria.\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
        saida.append(codigo);
        saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
        return saida;
      }
      
      a_nome = planilha_matrix[i][1];
      a_rg = planilha_matrix[i][3];
      documento = documento + "Nome: " + a_nome + "\\n" + "RG: " + a_rg + "\\n";
    }
  }
  
  if (a_nome === 'Nenhum' || a_rg === 'Nenhum') {
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027ERRO: ' + matricula + ' não está maticulado.\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
  
  // Planilha matricula
  planilha = SpreadsheetApp.openById("19101yYYqJnzGy1D5WaalQzzCLqjEWY6QoISzLFo7BZI").getDataRange().getDisplayValues();
  
  for (j = 1; j < planilha.length; j++) {
    if (planilha[j][1] === matricula) {
      documento = documento + "WhatsApp: " + planilha[j][17] + "\\n" + "Email: " + planilha[j][19] + "\\n";
    }
  }
  documento = documento + "\\n\\n";
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

  // Planilha Fazer
  if (nivel == "Médio") {
    planilha = SpreadsheetApp.openById("1JVcssq8J-lTnVnSoy8yF8o1oOLhzqavcvqw1V6KkygM").getDataRange().getDisplayValues();
  }
  else if (nivel == "Fundamental") {
    planilha = SpreadsheetApp.openById("11XsRlFLF27D_pF-FX9uNCRC75_dBEXBlqlzBw5yGvrc").getDataRange().getDisplayValues();
  }
  else {
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027Erro interno 2.\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  var fazer = [];
  for (j = 1; j < planilha.length; j++) {
    if (planilha[j][0] === matricula) {
      fazer = planilha[j];
    }
  }
  
  if (fazer.length == 0) {
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027ERRO: aluno não está na planilha Fazer.\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
  let planilhas_id = [];
  let disciplinas = [];
  if (nivel == "Médio") {
    planilhas_id = [
      "1p0vObP7be6FWWBpGsW-6NWmB73iAEQ4MG7j6kPd259s",
      "1wz2y20iD4gloCyXq-0j4OMEbgiNDZ5O6ktkv-KmcVVw",
      "1nCfiMAwyQ5KnZQmYedb1WUHv-CnpKoxNxNugmqZWejQ",
      "1b-MQrIAH__qddtDw-QN90wpsQVBL-WTVAgjczqIoR34",
      "1NaZeuw2QK28gdYQ1R-elLFXR1YxAh9l0Tym9O0Ez0jY",
      "1i-huEQ2siM4xsr8bPM9AZhm7eIUEMYxSoys1CdeRYZM",
      "1EmKLpiyIDhV0AWknIR9We1hoKQsdkDlF41st5qC0-0g",
      "1Jds1uI09zsqP6UCCp4KwFEhZKNMWHYbRf_pfk5uk1zY",
      "1STmnIhQnosxZDHuDeZjWZkYSK7vNRsxQbeRfoS93Zw4",
      "1ovFQCKMX5-6GahRbwsULe5WA0wb2yx_8a7n4XpbDHc8",
      "1VtD0Q3UgqWmGuPqViuEfOcx4uKzExkq_1VOAGF2jnPE"
    ];
    
    disciplinas = ["POR","ING","ART","MAT","HIS","GEO","FIL","SOC","BIO","QUI","FIS"];
  }
  else if (nivel == "Fundamental") {
    planilhas_id = [
      "1p0vObP7be6FWWBpGsW-6NWmB73iAEQ4MG7j6kPd259s",
      "1wz2y20iD4gloCyXq-0j4OMEbgiNDZ5O6ktkv-KmcVVw",
      "1nCfiMAwyQ5KnZQmYedb1WUHv-CnpKoxNxNugmqZWejQ",
      "1b-MQrIAH__qddtDw-QN90wpsQVBL-WTVAgjczqIoR34",
      "1NaZeuw2QK28gdYQ1R-elLFXR1YxAh9l0Tym9O0Ez0jY",
      "1i-huEQ2siM4xsr8bPM9AZhm7eIUEMYxSoys1CdeRYZM",
      "1STmnIhQnosxZDHuDeZjWZkYSK7vNRsxQbeRfoS93Zw4"
    ];
  
    disciplinas = ["POR","ING","ART","MAT","HIS","GEO","CIE"];
  }
  else {
    codigo = codigo + '\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027Erro interno 3.\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  for (let i = 0; i < planilhas_id.length; i++) {
    documento = documento + disciplinas[i] + " Fazer: " + fazer[i+1] + '\\n';
    planilha = SpreadsheetApp.openById(planilhas_id[i]).getDataRange().getDisplayValues();
    for (j = 1; j < planilha.length; j++) {
      if (planilha[j][0] == matricula) {
        documento = documento + planilha[j][3] + "\\t" + planilha[j][2] + "\\t" + planilha[j][1] + "\\n"; // .split(" ")[0]
      }
    }
    documento = documento + "\\n";
  }


  codigo = codigo + '\
let pre0 = document.createElement("pre");\n\
pre0.innerHTML = \u0027' + documento + '\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(pre0);\n\
';
  saida.append(codigo);
  saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return saida;

}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function autentica_usuario(matricula_, token) {
  let usuario = '';
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
  
  let matricula = "000000";
  {
    let grupos = [
      '1SxsnhlhJE-qZcNz0KI7Y0N8AVsD4JjhE_dNb-uBV_cw', // professores
      '1xCz5u-Vh9Dr3rNr7Sm4wq0VnoCwYSLttOAh1WVrnEag', // secretaria
      '1RxQVkJiS-4K9DyQ6GKVg9n_hhpIY2Yx-iZSG-Whjawk'  // alunos
    ];
    
    for (let n = 0; n < grupos.length; n++) {
      let planilha = SpreadsheetApp.openById(grupos[n]).getDataRange().getDisplayValues();
      
      for (let l = 0; l < planilha.length; l++) {
        if (planilha[l][0] === usuario) {
          if (n < 2) { matricula = matricula_;}
          else { matricula = planilha[l][1];}
          break;
        }
      }

      if (matricula !== "000000") break;
    }
    
    if (! /^[0-9]{6}$/.test(matricula)) {
      return 'Erro interno. O número da matrícula ' + matricula + ' de ' + usuario + ' está com formato errado. Informe o professor.';
    }
  }
  
  if (matricula === "000000") return 'Peça ao professor para liberar acesso para ' + usuario;
  
  UrlFetchApp
  .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
    method: 'POST',
    payload: {'entry.667481942': 'passaporte>autentica_usuario: ' + matricula + ' : ' + usuario}
  });
  
  return matricula;
}
