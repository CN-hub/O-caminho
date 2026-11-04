/* =====================================================================
   O CAMINHO - Administração (somente perfil "admin")
   Criado e desenvolvido por Cleilton Nascimento - Todos os direitos reservados.
   ===================================================================== */
(function () {
  'use strict';

  const OC = window.OC, S = OC.S, esc = OC.esc, api = OC.api, $ = OC.$, toast = OC.toast, seguro = OC.seguro, modal = OC.modal, fechaModal = OC.fechaModal;
  S.admTab = 'minuto';

  const ABAS = [['minuto', 'Minuto de Sabedoria'], ['midias', 'PDF e MP3'], ['importar', 'Importar Bíblia'], ['estudos', 'Estudos'], ['usuarios', 'Usuários']];
  const ADM = {};
  const optLivros = (sel) => S.livros.map((l) => `<option value="${l.id}" ${Number(sel) === l.id ? 'selected' : ''}>${esc(l.nome)}</option>`).join('');
  const optCaps = (livroId, zero) => {
    const l = S.livros.find((x) => x.id === Number(livroId)); if (!l) return '';
    let o = zero ? '<option value="0">Livro inteiro</option>' : '';
    for (let c = 1; c <= l.capitulos; c++) o += `<option value="${c}">Capítulo ${c}</option>`;
    return o;
  };

  OC.views.admin = () => {
    if (S.user.perfil !== 'admin') { $('#conteudo').innerHTML = '<p>Acesso restrito ao administrador.</p>'; return; }
    $('#conteudo').innerHTML = `<h1>Administração</h1>
      <div class="tabs" role="group" aria-label="Seções da administração">${ABAS.map((a) => `<button type="button" class="btn small ${S.admTab === a[0] ? '' : 'sec'}" data-act="admTab" data-t="${a[0]}" aria-pressed="${S.admTab === a[0]}">${a[1]}</button>`).join('')}</div>
      <div id="admCorpo"><div class="loading"><div class="spinner"></div>Carregando...</div></div>`;
    seguro(OC.carregaLivros().then(() => ADM[S.admTab]()));
  };
  OC.A.admTab = (el) => { S.admTab = el.dataset.t; OC.views.admin(); };

  /* ---------------------------- Minuto de Sabedoria ------------------------- */
  ADM.minuto = () => seguro(api('minuto_lista').then((d) => {
    S.admMinuto = d.itens;
    $('#admCorpo').innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Passagens cadastradas (${d.itens.length})</h2>
      <button type="button" class="btn small" data-act="novoMinuto">+ Nova passagem</button></div>
      <p class="muted">Passagens <strong>sem data</strong> entram no rodízio automático (uma por dia). Passagens <strong>com data</strong> aparecem somente naquele dia.</p>
      <ul class="list">${d.itens.map((i) => `<li class="item"><div class="info"><strong>${esc(i.referencia)}</strong>
        ${i.data_exibicao ? `<span class="pill">${esc(OC.brData(i.data_exibicao))}</span>` : '<span class="pill">rodízio</span>'}<br><small class="muted">${esc(i.texto.slice(0, 110))}${i.texto.length > 110 ? '…' : ''}</small></div>
        <div class="acts"><button type="button" class="btn sec small" data-act="editarMinuto" data-id="${i.id}">Editar</button>
        <button type="button" class="btn sec small" data-act="excluirMinuto" data-id="${i.id}">Excluir</button></div></li>`).join('')}</ul></div>`;
  }));
  function formMinuto(i) {
    modal(i ? 'Editar passagem' : 'Nova passagem', `<form data-form="minuto"><input type="hidden" name="id" value="${i ? i.id : 0}">
      <div class="field"><label for="mRef">Referência (ex.: Salmos 23:1)</label><input type="text" id="mRef" name="referencia" value="${esc(i ? i.referencia : '')}" required maxlength="80"></div>
      <div class="field"><label for="mTxt">Texto da passagem</label><textarea id="mTxt" name="texto" required>${esc(i ? i.texto : '')}</textarea></div>
      <div class="field"><label for="mRefl">Reflexão (opcional)</label><textarea id="mRefl" name="reflexao" style="min-height:80px">${esc(i && i.reflexao ? i.reflexao : '')}</textarea></div>
      <div class="field"><label for="mData">Data fixa (deixe em branco para entrar no rodízio)</label><input type="date" id="mData" name="data_exibicao" value="${esc(i && i.data_exibicao ? i.data_exibicao : '')}"></div>
      <button class="btn" type="submit">Salvar</button></form>`);
  }
  OC.A.novoMinuto = () => formMinuto(null);
  OC.A.editarMinuto = (el) => formMinuto(S.admMinuto.find((x) => String(x.id) === el.dataset.id));
  OC.A.excluirMinuto = (el) => { if (!confirm('Excluir esta passagem?')) return; seguro(api('minuto_excluir', { body: { id: Number(el.dataset.id) } }).then(() => { toast('Passagem excluída.'); ADM.minuto(); })); };
  OC.F.minuto = (f) => seguro(api('minuto_salvar', { body: { id: Number(f.id.value), referencia: f.referencia.value, texto: f.texto.value, reflexao: f.reflexao.value, data_exibicao: f.data_exibicao.value } })
    .then(() => { fechaModal(); toast('Passagem salva.'); ADM.minuto(); }));

  /* ------------------------------- PDF e MP3 ------------------------------- */
  ADM.midias = () => seguro(api('midias_listar').then((d) => {
    $('#admCorpo').innerHTML = `<div class="card"><h2>Enviar PDF ou áudio MP3</h2>
      <form data-form="upload"><div class="grid-2">
        <div class="field"><label for="uTipo">Tipo de arquivo</label><select id="uTipo" name="tipo"><option value="audio">Áudio MP3</option><option value="pdf">PDF</option></select></div>
        <div class="field"><label for="uLivro">Livro</label><select id="uLivro" name="livro" data-chg="uLivro">${optLivros(1)}</select></div>
        <div class="field"><label for="uCap">Capítulo</label><select id="uCap" name="capitulo">${optCaps(1, true)}</select></div>
        <div class="field"><label for="uArq">Arquivo</label><input type="file" id="uArq" name="arquivo" accept=".mp3,.pdf,audio/mpeg,application/pdf" required></div></div>
        <p class="muted">Se já existir um arquivo do mesmo tipo para esse capítulo, ele será substituído.</p>
        <button class="btn" type="submit" id="uBtn">Enviar arquivo</button></form></div>
      <div class="card"><h2>Arquivos enviados</h2>
        <ul class="list">${d.midias.length ? d.midias.map((m) => `<li class="item"><div class="info"><strong>${m.tipo === 'audio' ? '🎧' : '📄'} ${esc(m.livro)} ${m.capitulo > 0 ? m.capitulo : '(livro inteiro)'}</strong><br><small class="muted">${esc(m.nome_original)}</small></div>
          <div class="acts"><button type="button" class="btn sec small" data-act="excluirMidia" data-id="${m.id}">Excluir</button></div></li>`).join('') : '<li class="muted">Nenhum arquivo enviado ainda.</li>'}</ul></div>`;
  }));
  OC.C.uLivro = (el) => { $('#uCap').innerHTML = optCaps(el.value, true); };
  OC.F.upload = (f) => {
    const fd = new FormData(f);
    const btn = $('#uBtn'); btn.disabled = true; btn.textContent = 'Enviando… aguarde';
    seguro(api('upload_midia', { form: fd }).then(() => { toast('Arquivo enviado.'); ADM.midias(); })).finally(() => { btn.disabled = false; btn.textContent = 'Enviar arquivo'; });
  };
  OC.A.excluirMidia = (el) => { if (!confirm('Excluir este arquivo?')) return; seguro(api('midia_excluir', { body: { id: Number(el.dataset.id) } }).then(() => { toast('Arquivo excluído.'); ADM.midias(); })); };

  /* ----------------------------- Importar Bíblia ---------------------------- */
  ADM.importar = () => {
    $('#admCorpo').innerHTML = `<div class="card"><h2>Importar o texto da Bíblia</h2>
      <p>Envie um arquivo com <strong>uma linha por versículo</strong> (extensão .csv, .txt ou .json). Formatos aceitos:</p>
      <ul>
        <li><code>João;3;16;Porque Deus amou o mundo...</code> (separado por ponto e vírgula, vírgula ou tabulação: livro, capítulo, versículo, texto)</li>
        <li><code>João 3:16 Porque Deus amou o mundo...</code></li>
        <li>JSON no formato <code>[{"livro":"João","capitulo":3,"versiculo":16,"texto":"..."}]</code> ou o formato comum de “books/chapters”.</li>
      </ul>
      <p class="muted">Use uma tradução que você tenha direito de usar (por exemplo, Almeida Revista e Corrigida de domínio público). Versículos já existentes são atualizados, nunca duplicados.</p>
      <form data-form="importar"><div class="field"><label for="iArq">Arquivo da Bíblia</label><input type="file" id="iArq" name="arq" accept=".csv,.txt,.json,text/plain,application/json" required></div>
        <button class="btn" type="submit" id="iBtn">Importar</button></form>
      <div id="iProg" style="margin-top:1rem" aria-live="polite"></div></div>`;
  };

  function analisaTexto(texto) {
    const linhas = [];
    texto.replace(/^﻿/, '').split(/\r?\n/).forEach((ln) => {
      ln = ln.trim(); if (!ln) return;
      let m;
      let sep = ln.indexOf('\t') > 0 ? '\t' : (/^[^;]+;\d+;\d+;/.test(ln) ? ';' : (/^[^,]+,\d+,\d+,/.test(ln) ? ',' : ''));
      if (sep) {
        const p = ln.split(sep); const tx = p.slice(3).join(sep).trim().replace(/^"(.*)"$/s, '$1');
        if (p.length >= 4) linhas.push([p[0].trim().replace(/^"|"$/g, ''), Number(p[1]), Number(p[2]), tx]);
      } else if ((m = /^(\d?\s?[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ]*?)\s+(\d+):(\d+)\s+(.+)$/.exec(ln))) {
        linhas.push([m[1].trim(), Number(m[2]), Number(m[3]), m[4].trim()]);
      }
    });
    return linhas;
  }
  function analisaJson(j) {
    const linhas = [];
    if (Array.isArray(j)) {
      j.forEach((x) => {
        if (Array.isArray(x)) { linhas.push(x); return; }
        if (x && x.chapters) { // [{name, chapters:[[v1,v2..],..]}]
          const nome = x.name || x.nome || x.abbrev;
          x.chapters.forEach((cap, ci) => cap.forEach((t, vi) => linhas.push([nome, ci + 1, vi + 1, t])));
          return;
        }
        if (x) linhas.push([x.livro || x.book || x.nome, x.capitulo || x.chapter, x.versiculo || x.verse, x.texto || x.text]);
      });
    } else if (j && typeof j === 'object') {
      Object.keys(j).forEach((l) => Object.keys(j[l]).forEach((c) => Object.keys(j[l][c]).forEach((v) => linhas.push([l, Number(c), Number(v), j[l][c][v]]))));
    }
    return linhas;
  }

  OC.F.importar = (f) => {
    const arq = f.arq.files[0]; if (!arq) return;
    const prog = $('#iProg'), btn = $('#iBtn'); btn.disabled = true;
    prog.innerHTML = '<div class="loading"><div class="spinner"></div>Lendo o arquivo…</div>';
    const rd = new FileReader();
    rd.onerror = () => { prog.textContent = 'Não foi possível ler o arquivo.'; btn.disabled = false; };
    rd.onload = () => {
      let linhas = [];
      try {
        const txt = String(rd.result);
        linhas = /^\s*[\[{]/.test(txt) ? analisaJson(JSON.parse(txt.replace(/^﻿/, ''))) : analisaTexto(txt);
      } catch (e) { prog.innerHTML = '<div class="alert" role="alert">Arquivo inválido. Confira o formato.</div>'; btn.disabled = false; return; }
      if (!linhas.length) { prog.innerHTML = '<div class="alert" role="alert">Nenhum versículo reconhecido no arquivo.</div>'; btn.disabled = false; return; }
      const LOTE = 2000; let enviados = 0, ok = 0, ign = 0; const desc = {};
      const proximo = () => {
        if (enviados >= linhas.length) {
          const ds = Object.keys(desc);
          prog.innerHTML = `<div class="alert ok" role="status">Importação concluída: ${ok} versículos gravados, ${ign} ignorados.${ds.length ? '<br>Livros não reconhecidos: ' + esc(ds.join(', ')) : ''}</div>`;
          btn.disabled = false; S.livros = []; return;
        }
        const lote = linhas.slice(enviados, enviados + LOTE);
        api('importar_biblia', { body: { linhas: lote } }).then((r) => {
          ok += r.importados; ign += r.ignorados; (r.livros_desconhecidos || []).forEach((n) => { desc[n] = 1; });
          enviados += lote.length;
          prog.innerHTML = `<div class="progress" role="progressbar" aria-valuenow="${Math.round(enviados / linhas.length * 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.round(enviados / linhas.length * 100)}%"></span></div><p class="muted">Importando… ${enviados} de ${linhas.length}</p>`;
          proximo();
        }).catch((e) => { prog.innerHTML = `<div class="alert" role="alert">${esc(e.message)}</div>`; btn.disabled = false; });
      };
      proximo();
    };
    rd.readAsText(arq, 'UTF-8');
  };

  /* --------------------------------- Estudos -------------------------------- */
  ADM.estudos = () => {
    $('#admCorpo').innerHTML = `<div class="card"><h2>Estudo detalhado por capítulo</h2>
      <p class="muted">Escreva o contexto, o resumo, a aplicação e perguntas de reflexão. Isso aparece abaixo do texto no leitor.</p>
      <div class="grid-2"><div class="field"><label for="eLivro">Livro</label><select id="eLivro" data-chg="eLivro">${optLivros(19)}</select></div>
      <div class="field"><label for="eCap">Capítulo</label><select id="eCap">${optCaps(19, false)}</select></div></div>
      <button type="button" class="btn" data-act="abrirEstudo">Abrir editor</button></div><div id="eForm"></div>`;
  };
  OC.C.eLivro = (el) => { $('#eCap').innerHTML = optCaps(el.value, false); };
  OC.A.abrirEstudo = () => {
    const l = Number($('#eLivro').value), c = Number($('#eCap').value);
    seguro(api('capitulo', { q: { l: l, c: c } }).then((d) => {
      const e = d.estudo || {};
      $('#eForm').innerHTML = `<div class="card"><h3>${esc(d.livro.nome)} ${c}</h3><form data-form="estudo"><input type="hidden" name="livro" value="${l}"><input type="hidden" name="capitulo" value="${c}">
        <div class="field"><label for="eTit">Título</label><input type="text" id="eTit" name="titulo" value="${esc(e.titulo || '')}" maxlength="160"></div>
        <div class="field"><label for="eCtx">Contexto</label><textarea id="eCtx" name="contexto">${esc(e.contexto || '')}</textarea></div>
        <div class="field"><label for="eRes">Resumo</label><textarea id="eRes" name="resumo">${esc(e.resumo || '')}</textarea></div>
        <div class="field"><label for="eApl">Aplicação para a vida</label><textarea id="eApl" name="aplicacao">${esc(e.aplicacao || '')}</textarea></div>
        <div class="field"><label for="ePer">Perguntas para refletir (uma por linha)</label><textarea id="ePer" name="perguntas">${esc(e.perguntas || '')}</textarea></div>
        <button class="btn" type="submit">Salvar estudo</button></form></div>`;
      $('#eTit').focus();
    }));
  };
  OC.F.estudo = (f) => seguro(api('estudo_salvar', { body: { livro: Number(f.livro.value), capitulo: Number(f.capitulo.value), titulo: f.titulo.value, contexto: f.contexto.value, resumo: f.resumo.value, aplicacao: f.aplicacao.value, perguntas: f.perguntas.value } })
    .then(() => toast('Estudo salvo.')));

  /* --------------------------------- Usuários ------------------------------- */
  ADM.usuarios = () => seguro(api('usuarios_listar').then((d) => {
    S.admUsuarios = d.usuarios;
    $('#admCorpo').innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Usuários</h2>
      <button type="button" class="btn small" data-act="novoUsuario">+ Novo usuário</button></div>
      <ul class="list" style="margin-top:.8rem">${d.usuarios.map((u) => `<li class="item"><div class="info"><strong>${esc(u.nome)}</strong> <span class="pill">${u.perfil === 'admin' ? 'administrador' : 'leitor'}</span><br><small class="muted">usuário: ${esc(u.usuario)}</small></div>
        <div class="acts"><button type="button" class="btn sec small" data-act="editarUsuario" data-id="${u.id}">Editar</button>
        ${Number(u.id) === S.user.id ? '' : `<button type="button" class="btn sec small" data-act="excluirUsuario" data-id="${u.id}">Excluir</button>`}</div></li>`).join('')}</ul></div>`;
  }));
  function formUsuario(u) {
    modal(u ? 'Editar usuário' : 'Novo usuário', `<form data-form="usuario"><input type="hidden" name="id" value="${u ? u.id : 0}">
      <div class="field"><label for="uNome">Nome completo</label><input type="text" id="uNome" name="nome" value="${esc(u ? u.nome : '')}" required maxlength="120"></div>
      <div class="field"><label for="uUsr">Usuário (login)</label><input type="text" id="uUsr" name="usuario" value="${esc(u ? u.usuario : '')}" required autocapitalize="none" maxlength="60"></div>
      <div class="field"><label for="uPerf">Perfil</label><select id="uPerf" name="perfil"><option value="leitor" ${u && u.perfil === 'leitor' ? 'selected' : ''}>Leitor</option><option value="admin" ${u && u.perfil === 'admin' ? 'selected' : ''}>Administrador</option></select></div>
      <div class="field"><label for="uSen">${u ? 'Nova senha (deixe em branco para manter)' : 'Senha (mínimo 6 caracteres)'}</label><input type="password" id="uSen" name="senha" autocomplete="new-password" ${u ? '' : 'required'} minlength="6"></div>
      <button class="btn" type="submit">Salvar</button></form>`);
  }
  OC.A.novoUsuario = () => formUsuario(null);
  OC.A.editarUsuario = (el) => formUsuario(S.admUsuarios.find((u) => String(u.id) === el.dataset.id));
  OC.A.excluirUsuario = (el) => { if (!confirm('Excluir este usuário e todos os seus dados (favoritos, anotações, contatos)?')) return; seguro(api('usuario_excluir', { body: { id: Number(el.dataset.id) } }).then(() => { toast('Usuário excluído.'); ADM.usuarios(); })); };
  OC.F.usuario = (f) => seguro(api('usuario_salvar', { body: { id: Number(f.id.value), nome: f.nome.value, usuario: f.usuario.value, perfil: f.perfil.value, senha: f.senha.value } })
    .then(() => { fechaModal(); toast('Usuário salvo.'); ADM.usuarios(); }));
})();
