function doGet(e) {
  const saida = ContentService.createTextOutput();
  

  let codigo = '';

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

  const matricula = autentica_usuario(e.parameter.token);
    
  if (! /^[0-9]{6}$/.test(matricula)) {
    UrlFetchApp
    .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
      method: 'POST',
      payload: {'entry.667481942': 'ERRO: relatorio: doGet: autentica_usuario: ' + matricula}
    });
    
    codigo = codigo + '\
document.getElementById("page").remove();\n\
let p0 = document.createElement("p");\n\
p0.setAttribute("class","erro");\n\
p0.innerHTML = \u0027' + matricula + '\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(p0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  
  // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
  
  let planilhas_id = [
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
  
  let disciplinas = ["POR","ING","ART","MAT","HIS","GEO","FIL","SOC","BIO","QUI","FIS"];
  
  let hoje = new Date();
  let ano = (hoje.getYear() - 100 + 2000).toString();
  let documento = '';
  
  for (let i = 0; i < planilhas_id.length; i++) {
    planilha = SpreadsheetApp.openById(planilhas_id[i]).getDataRange().getDisplayValues();
    let atendimento = 0;
    let concluiu_ef = 0;
    let concluiu_em = 0;
    for (let j = 1; j < planilha.length; j++) {
      if (planilha[j][3].substring(6, 10) == ano) {
        if (planilha[j][2] != 'CON') {
          atendimento++;
        }
        else if (planilha[j][2] == 'CON') {
          if (planilha[j][0].charAt(2) == "1") concluiu_ef++;
          else concluiu_em++;
        }
      }
    }
    documento = documento + disciplinas[i] + '\\nAtendimentos: ' + atendimento + '\\nConcluintes EF: ' + concluiu_ef  + '\\nConcluintes EM: ' + concluiu_em + '\\n\\n';
  }
  
  codigo = codigo + '\
document.getElementById("page").remove();\n\
let pre0 = document.createElement("pre");\n\
pre0.innerHTML = \u0027' + documento + '\u0027;\n\
document.getElementsByTagName("body")[0].appendChild(pre0);\n\
';
    saida.append(codigo);
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

function autentica_usuario(token) {
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
      if (tokeninfo_obj.aud !== '330234016508-6d6d97vqrtofusi7f85c9t1iu6nmtced.apps.googleusercontent.com') {
        return 'ERRO: falhou a autenticação.';
      }
      usuario = tokeninfo_obj.email;
    }
  }
  
  let matricula = '000000';
  {
    let grupo_secretaria = SpreadsheetApp.openById('1xCz5u-Vh9Dr3rNr7Sm4wq0VnoCwYSLttOAh1WVrnEag')
      .getDataRange().getDisplayValues();
    
    for (let i = 0; i < grupo_secretaria.length; i++) {
      if (grupo_secretaria[i][0] === usuario) {
        matricula = '502000';
        break;
      }
    }
  }
  
  if (matricula === "000000") return usuario + ', este serviço é de uso exclusivo da secretaria.';
  
  UrlFetchApp
  .fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSeH6hDfEOI6jvgDsdkuuUeah_FU3dPGxZZr-sBBkIjj4Hkwog/formResponse', {
    method: 'POST',
    payload: {'entry.667481942': 'relatorio: autentica_usuario: ' + usuario}
  });
  
  return matricula;
}
