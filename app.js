/* =====================================================================
   O CAMINHO - Aplicação principal
   Criado e desenvolvido por Cleilton Nascimento - Todos os direitos reservados.
   ===================================================================== */
(function () {
  'use strict';

  const OC = window.OC = {
    S: { csrf: '', user: null, livros: [], lidos: {}, disp: {}, view: 'inicio', bk: 0, ch: 0, cap: null, sel: [], tab: 'AT', envio: null, minutoData: '', foco: null },
    views: {}, A: {}, F: {}, C: {}
  };
  const S = OC.S;
  const raiz = document.documentElement;
  const $ = (s, r) => (r || document).querySelector(s);

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OC.esc = esc;
  OC.$ = $;

  const brData = (iso) => { const p = String(iso).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso; };
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const somaDia = (iso, n) => { const p = iso.split('-').map(Number); const d = new Date(p[0], p[1] - 1, p[2] + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  OC.brData = brData; OC.hoje = hoje;

  const fmtTel = (t) => {
    const d = String(t).replace(/\D/g, '');
    if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return `(${d.slice(2, 4)}) ${d.slice(4, d.length - 4)}-${d.slice(-4)}`;
    return '+' + d;
  };
  OC.fmtTel = fmtTel;

  /* ------------------------------ comunicação ------------------------------ */
  function api(acao, o) {
    o = o || {};
    let url = 'api/api.php?a=' + encodeURIComponent(acao);
    if (o.q) Object.keys(o.q).forEach((k) => { url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(o.q[k]); });
    const init = { credentials: 'same-origin', headers: { 'X-CSRF': S.csrf } };
    if (o.form) { init.method = 'POST'; init.body = o.form; }
    else if (o.body !== undefined) { init.method = 'POST'; init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(o.body); }
    return fetch(url, init).then((r) => r.json().catch(() => ({ erro: 'Resposta inválida do servidor.' })).then((j) => {
      if (r.status === 401) { location.replace('index.html'); throw new Error(j.erro || 'Sessão expirada.'); }
      if (!r.ok) throw new Error(j.erro || 'Erro inesperado.');
      return j;
    }));
  }
  OC.api = api;

  function msgErro(e) {
    const m = e && e.message ? e.message : String(e);
    return m === 'Failed to fetch' ? 'Sem conexão com o servidor.' : m;
  }
  function seguro(p) { return p.catch((e) => { toast(msgErro(e)); }); }
  OC.seguro = seguro;

  /* ------------------------------ interface base --------------------------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    $('#aviso').textContent = msg;
    setTimeout(() => { t.remove(); }, 3800);
  }
  OC.toast = toast;

  function carregando() { return '<div class="loading"><div class="spinner"></div>Carregando...</div>'; }

  function modal(titulo, corpo, depois) {
    fechaModal(true);
    S.foco = document.activeElement;
    $('#modal-raiz').innerHTML = `<div class="modal-bg" data-act="fundo"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitulo">
      <div class="modal-head"><h3 id="mTitulo">${esc(titulo)}</h3><button type="button" class="btn sec small icon" data-act="fechar" aria-label="Fechar">✕</button></div>
      <div id="mCorpo">${corpo}</div></div></div>`;
    const alvo = $('#mCorpo input, #mCorpo textarea, #mCorpo select, #mCorpo button') || $('.modal .btn');
    if (alvo) alvo.focus();
    if (depois) depois();
  }
  function fechaModal(semFoco) {
    $('#modal-raiz').innerHTML = '';
    if (!semFoco && S.foco && S.foco.focus) { try { S.foco.focus(); } catch (e) {} }
  }
  OC.modal = modal; OC.fechaModal = fechaModal;

  document.addEventListener('keydown', (ev) => {
    const m = $('.modal');
    if (!m) return;
    if (ev.key === 'Escape') { fechaModal(); return; }
    if (ev.key === 'Tab') {
      const f = m.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); z.focus(); }
      else if (!ev.shiftKey && document.activeElement === z) { ev.preventDefault(); a.focus(); }
    }
  });

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'fundo' && ev.target !== el) return;
    const f = OC.A[el.dataset.act];
    if (f) { ev.preventDefault(); f(el, ev); }
  });
  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('form[data-form]');
    if (!f) return;
    ev.preventDefault();
    const fn = OC.F[f.dataset.form];
    if (fn) fn(f);
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-chg]');
    if (el && OC.C[el.dataset.chg]) OC.C[el.dataset.chg](el, ev);
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-inp]');
    if (el && OC.C[el.dataset.inp]) OC.C[el.dataset.inp](el, ev);
  });

  OC.A.fechar = () => fechaModal();
  OC.A.fundo = () => fechaModal();

  /* ---------------------------------- tema --------------------------------- */
  const botaoTema = $('#themeToggle');
  function marcaTema() { botaoTema.setAttribute('aria-checked', raiz.getAttribute('data-theme') === 'dark' ? 'true' : 'false'); }
  botaoTema.addEventListener('click', () => {
    const novo = raiz.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    raiz.setAttribute('data-theme', novo);
    try { localStorage.setItem('oc_tema', novo); } catch (e) {}
    marcaTema();
  });
  marcaTema();
  $('#ano').textContent = new Date().getFullYear();

  /* -------------------------------- navegação ------------------------------ */
  const ICON = {
    inicio: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    biblia: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M12 7v6M9.5 9.5h5"/>',
    minuto: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    meu: '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
    whats: '<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/>',
    admin: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    conta: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  const ICONE = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  function montaNav() {
    const itens = [['inicio', 'Início'], ['biblia', 'Bíblia'], ['minuto', 'Minuto'], ['buscar', 'Buscar'], ['meu', 'Meu estudo'], ['whats', 'WhatsApp']];
    if (S.user.perfil === 'admin') itens.push(['admin', 'Admin']);
    itens.push(['conta', 'Conta']);
    $('#nav').innerHTML = itens.map((i) => `<button type="button" data-act="ir" data-v="${i[0]}">${ICONE(i[0])}<span>${i[1]}</span></button>`).join('');
  }

  function irPara(v, manterEstado) {
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (!manterEstado && v === 'biblia') { /* mantém o livro/capítulo atual */ }
    S.view = v;
    document.querySelectorAll('#nav button').forEach((b) => {
      if (b.dataset.v === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const fn = OC.views[v] || OC.views.inicio;
    fn();
    const m = $('#conteudo');
    m.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
  OC.irPara = irPara;
  OC.A.ir = (el) => irPara(el.dataset.v);

  OC.A.sair = () => { api('logout', { body: {} }).finally(() => location.replace('index.html')); };

  /* -------------------------- textos para WhatsApp ------------------------- */
  function refVersos(arr) {
    arr = arr.slice().sort((a, b) => a - b);
    const partes = [];
    let i = 0;
    while (i < arr.length) {
      let j = i;
      while (j + 1 < arr.length && arr[j + 1] === arr[j] + 1) j++;
      partes.push(j > i ? arr[i] + '-' + arr[j] : String(arr[i]));
      i = j + 1;
    }
    return partes.join(',');
  }

  function textoMinuto(m, data) {
    let t = `🕊️ *Minuto de Sabedoria* — ${brData(data)}\n\n“${m.texto}”\n— *${m.referencia}*`;
    if (m.reflexao) t += `\n\n💭 ${m.reflexao}`;
    return t + '\n\n_O Caminho_';
  }
  function textoVersos(livro, cap, versos) {
    const ref = `${livro.nome} ${cap.capitulo}` + (versos.length === cap.versiculos.length ? '' : ':' + refVersos(versos.map((v) => v.versiculo)));
    const corpo = versos.length === 1 ? `“${versos[0].texto}”` : versos.map((v) => `${v.versiculo} ${v.texto}`).join('\n');
    return `📖 *${ref}*\n\n${corpo}\n\n_O Caminho_`;
  }
  OC.textoVersos = textoVersos;

  function dividir(t, max) {
    if (t.length <= max) return [t];
    const blocos = []; let atual = '';
    t.split('\n').forEach((l) => {
      if (atual && (atual + '\n' + l).length > max) { blocos.push(atual); atual = l; }
      else atual = atual ? atual + '\n' + l : l;
    });
    if (atual) blocos.push(atual);
    const res = [];
    blocos.forEach((b) => { while (b.length > max) { res.push(b.slice(0, max)); b = b.slice(max); } res.push(b); });
    return res.length > 1 ? res.map((p, i) => `${p}\n\n(${i + 1}/${res.length})`) : res;
  }

  /* ------------------------------ envio WhatsApp --------------------------- */
  function modalEnviar(titulo, texto) {
    return seguro(api('contatos_listar').then((d) => {
      S.envio = { titulo, texto, contatos: d.contatos, listas: d.listas, parte: 0, listaSel: d.listas.length ? d.listas[0].id : 0, enviados: {} };
      modal('Enviar pelo WhatsApp', `
        <div class="field"><label for="envTexto">Mensagem (você pode editar)</label>
          <textarea id="envTexto" data-inp="envTexto" rows="7"></textarea></div>
        <div id="envAcoes"></div>`, () => { $('#envTexto').value = texto; desenhaEnvio(); });
    }));
  }
  OC.enviar = modalEnviar;

  function urlWa(tel, parte) { return 'https://wa.me/' + (tel || '') + '?text=' + encodeURIComponent(parte); }

  function desenhaEnvio() {
    const E = S.envio; if (!E) return;
    const partes = dividir(E.texto, 1800);
    if (E.parte >= partes.length) E.parte = 0;
    E.partes = partes;
    const lista = E.listas.find((l) => Number(l.id) === Number(E.listaSel));
    const membros = lista ? E.contatos.filter((c) => lista.contato_ids.indexOf(Number(c.id)) >= 0) : [];
    $('#envAcoes').innerHTML = `
      ${partes.length > 1 ? `<div class="field"><label for="envParte">O texto é longo e foi dividido em ${partes.length} partes</label>
        <select id="envParte" data-chg="envParte">${partes.map((p, i) => `<option value="${i}" ${i === E.parte ? 'selected' : ''}>Parte ${i + 1} de ${partes.length}</option>`).join('')}</select>
        <small class="muted">Envie uma parte de cada vez, na ordem.</small></div>` : ''}
      <div class="card" style="margin-bottom:.8rem">
        <h3>1. Escolher no próprio WhatsApp</h3>
        <p class="muted">Abre o WhatsApp com a mensagem pronta. Lá você escolhe um contato, um grupo ou uma <strong>lista de transmissão</strong>.</p>
        <button type="button" class="btn wa" data-act="waLivre">Abrir WhatsApp</button>
      </div>
      <div class="card" style="margin-bottom:.8rem">
        <h3>2. Enviar para um contato salvo</h3>
        ${E.contatos.length ? `<div class="row"><div class="grow"><label class="sr-only" for="envContato">Contato</label>
          <select id="envContato">${E.contatos.map((c) => `<option value="${esc(c.telefone)}" data-id="${c.id}">${esc(c.nome)} — ${esc(fmtTel(c.telefone))}</option>`).join('')}</select></div>
          <button type="button" class="btn wa" data-act="waContato">Enviar</button></div>`
        : '<p class="muted">Nenhum contato salvo. Cadastre na aba <strong>WhatsApp</strong>.</p>'}
      </div>
      <div class="card" style="margin-bottom:.8rem">
        <h3>3. Enviar para uma lista de transmissão do sistema</h3>
        ${E.listas.length ? `<label for="envLista">Lista</label>
          <select id="envLista" data-chg="envLista">${E.listas.map((l) => `<option value="${l.id}" ${Number(l.id) === Number(E.listaSel) ? 'selected' : ''}>${esc(l.nome)} (${l.contato_ids.length})</option>`).join('')}</select>
          <p class="muted" style="margin-top:.6rem">Toque em “Enviar” em cada pessoa. O WhatsApp abre com a mensagem pronta para aquele contato.</p>
          <ul class="list">${membros.length ? membros.map((c) => `<li class="item"><div class="info"><strong>${esc(c.nome)}</strong><br><small class="muted">${esc(fmtTel(c.telefone))}</small></div>
            <button type="button" class="btn wa small" data-act="waMembro" data-tel="${esc(c.telefone)}" data-id="${c.id}">${E.enviados[c.id] ? '✓ Enviado — reenviar' : 'Enviar'}</button></li>`).join('') : '<li class="muted">Esta lista está vazia.</li>'}</ul>`
        : '<p class="muted">Nenhuma lista criada. Crie na aba <strong>WhatsApp</strong>.</p>'}
      </div>
      <div class="row">
        <button type="button" class="btn sec" data-act="copiarEnvio">Copiar mensagem</button>
        ${navigator.share ? '<button type="button" class="btn sec" data-act="compartilharEnvio">Compartilhar…</button>' : ''}
      </div>`;
  }
  OC.C.envTexto = (el) => { S.envio.texto = el.value; desenhaEnvio(); };
  OC.C.envParte = (el) => { S.envio.parte = Number(el.value); };
  OC.C.envLista = (el) => { S.envio.listaSel = Number(el.value); desenhaEnvio(); };

  function abreWa(tel, destino) {
    const E = S.envio;
    window.open(urlWa(tel, E.partes[E.parte]), '_blank', 'noopener');
    api('log_envio', { body: { tipo: tel ? 'contato' : 'whatsapp', destino: destino || 'Escolhido no WhatsApp', resumo: (E.titulo || '').slice(0, 180) } }).catch(() => {});
  }
  OC.A.waLivre = () => abreWa('', 'Escolhido no WhatsApp');
  OC.A.waContato = () => { const s = $('#envContato'); const o = s.options[s.selectedIndex]; abreWa(s.value, o.textContent.split(' — ')[0]); };
  OC.A.waMembro = (el) => {
    const E = S.envio; E.enviados[el.dataset.id] = true;
    const c = E.contatos.find((x) => String(x.id) === el.dataset.id);
    abreWa(el.dataset.tel, c ? c.nome : '');
    el.textContent = '✓ Enviado — reenviar';
  };
  OC.A.copiarEnvio = () => {
    const t = S.envio.partes[S.envio.parte];
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Mensagem copiada.')).catch(() => {
      const ta = $('#envTexto'); ta.select(); document.execCommand('copy'); toast('Mensagem copiada.');
    });
  };
  OC.A.compartilharEnvio = () => { navigator.share({ text: S.envio.partes[S.envio.parte] }).catch(() => {}); };

  /* ---------------------------------- início ------------------------------- */
  function cartaoMinuto(m, data, extra) {
    return `<section class="hero" aria-labelledby="tMinuto">
      <h2 id="tMinuto" style="font-size:1rem;letter-spacing:.06em;text-transform:uppercase">Minuto de Sabedoria · ${esc(brData(data))}</h2>
      <p class="ref">${esc(m.referencia)}</p>
      <blockquote>“${esc(m.texto)}”</blockquote>
      ${m.reflexao ? `<p class="reflexao">💭 ${esc(m.reflexao)}</p>` : ''}
      <div class="row no-print" style="margin-top:.6rem">
        <button type="button" class="btn wa" data-act="enviarMinuto">Enviar pelo WhatsApp</button>
        <button type="button" class="btn" data-act="copiarMinuto">Copiar</button>
        ${extra || ''}
      </div></section>`;
  }

  OC.views.inicio = () => {
    const m = $('#conteudo'); m.innerHTML = carregando();
    seguro(Promise.all([api('minuto'), api('progresso')]).then((r) => {
      S.minuto = r[0].minuto; S.minutoData = r[0].data;
      const p = r[1];
      const pct = Math.min(100, Math.round((p.capitulos_lidos / p.capitulos_total) * 1000) / 10);
      m.innerHTML = `<h1>Paz do Senhor, ${esc(S.user.nome.split(' ')[0])}!</h1>
        ${cartaoMinuto(S.minuto, S.minutoData)}
        <section class="card" aria-labelledby="tProg">
          <h2 id="tProg">Sua jornada de leitura</h2>
          <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de leitura da Bíblia"><span style="width:${pct}%"></span></div>
          <p class="muted" style="margin-top:.5rem">${p.capitulos_lidos} de ${p.capitulos_total} capítulos lidos (${pct}%)</p>
          <div class="row">
            ${p.ultima ? `<button type="button" class="btn" data-act="abrirCap" data-l="${p.ultima.livro_id}" data-c="${p.ultima.capitulo}">Continuar: ${esc(p.ultima.livro)} ${p.ultima.capitulo}</button>` : ''}
            <button type="button" class="btn sec" data-act="ir" data-v="biblia">${p.ultima ? 'Escolher outro livro' : 'Começar a ler'}</button>
          </div>
        </section>`;
    }));
  };

  OC.A.enviarMinuto = () => modalEnviar('Minuto de Sabedoria', textoMinuto(S.minuto, S.minutoData));
  OC.A.copiarMinuto = () => {
    const t = textoMinuto(S.minuto, S.minutoData);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Mensagem copiada.')).catch(() => toast('Não foi possível copiar neste navegador.'));
  };

  /* ---------------------------------- Bíblia ------------------------------- */
  function carregaLivros() {
    if (S.livros.length) return Promise.resolve();
    return api('livros').then((d) => { S.livros = d.livros; S.lidos = d.lidos; S.disp = d.disponiveis; });
  }

  OC.carregaLivros = () => carregaLivros();

  OC.views.biblia = () => {
    const m = $('#conteudo'); m.innerHTML = carregando();
    seguro(carregaLivros().then(() => {
      if (S.bk && S.ch) return abrirCapitulo(S.bk, S.ch);
      if (S.bk) return listaCapitulos();
      return listaLivros();
    }));
  };

  function listaLivros() {
    S.bk = 0; S.ch = 0;
    const m = $('#conteudo');
    m.innerHTML = `<h1>Bíblia Sagrada</h1>
      <div class="tabs" role="group" aria-label="Testamento">
        <button type="button" class="btn small ${S.tab === 'AT' ? '' : 'sec'}" data-act="testamento" data-t="AT" aria-pressed="${S.tab === 'AT'}">Antigo Testamento</button>
        <button type="button" class="btn small ${S.tab === 'NT' ? '' : 'sec'}" data-act="testamento" data-t="NT" aria-pressed="${S.tab === 'NT'}">Novo Testamento</button>
      </div>
      <div class="field"><label for="filtroLivro">Filtrar livro</label><input type="search" id="filtroLivro" data-inp="filtroLivro" placeholder="Ex.: Salmos"></div>
      <div class="books" id="listaLivros"></div>`;
    desenhaLivros('');
  }
  function desenhaLivros(f) {
    f = f.toLowerCase();
    const el = $('#listaLivros'); if (!el) return;
    const itens = S.livros.filter((l) => (f ? l.nome.toLowerCase().indexOf(f) >= 0 : l.testamento === S.tab));
    el.innerHTML = itens.length ? itens.map((l) => {
      const lidos = S.lidos[l.id] || 0, tem = S.disp[l.id] || 0;
      return `<button type="button" class="book" data-act="livro" data-id="${l.id}"><strong>${esc(l.nome)}</strong><small>${l.capitulos} cap. · ${lidos} lidos${tem ? '' : ' · sem texto'}</small></button>`;
    }).join('') : '<p class="muted">Nenhum livro encontrado.</p>';
  }
  OC.C.filtroLivro = (el) => desenhaLivros(el.value);
  OC.A.testamento = (el) => { S.tab = el.dataset.t; listaLivros(); };
  OC.A.livro = (el) => { S.bk = Number(el.dataset.id); S.ch = 0; seguro(listaCapitulos()); };

  function listaCapitulos() {
    const livro = S.livros.find((l) => l.id === S.bk);
    const m = $('#conteudo'); m.innerHTML = carregando();
    return api('livro_info', { q: { l: S.bk } }).then((info) => {
      let b = '';
      for (let c = 1; c <= livro.capitulos; c++) {
        const cls = (info.lidos.indexOf(c) >= 0 ? 'lido ' : '') + (info.com_texto.indexOf(c) >= 0 ? '' : 'sem');
        b += `<button type="button" class="chap ${cls}" data-act="abrirCap" data-l="${livro.id}" data-c="${c}" aria-label="Capítulo ${c}${info.lidos.indexOf(c) >= 0 ? ', lido' : ''}">${c}</button>`;
      }
      m.innerHTML = `<div class="reader-head"><h1>${esc(livro.nome)}</h1><button type="button" class="btn sec small" data-act="voltarLivros">← Todos os livros</button></div>
        <p class="muted">Escolha um capítulo. Capítulos com ✓ já foram lidos; os mais claros ainda não têm texto importado.</p>
        <div class="chapters">${b}</div>`;
    });
  }
  OC.A.voltarLivros = () => { S.bk = 0; S.ch = 0; listaLivros(); window.scrollTo({ top: 0 }); };

  OC.A.abrirCap = (el) => {
    S.sel = el.dataset.v ? [Number(el.dataset.v)] : [];
    S.view = 'biblia';
    document.querySelectorAll('#nav button').forEach((b) => { if (b.dataset.v === 'biblia') b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const m = $('#conteudo'); m.innerHTML = carregando();
    seguro(carregaLivros().then(() => abrirCapitulo(Number(el.dataset.l), Number(el.dataset.c))));
  };
  OC.abrirCapitulo = (l, c, v) => OC.A.abrirCap({ dataset: { l: l, c: c, v: v || '' } });

  function vizinho(l, c, dir) {
    const livro = S.livros.find((x) => x.id === l);
    if (dir > 0) {
      if (c < livro.capitulos) return [l, c + 1];
      const n = S.livros.find((x) => x.id === l + 1); return n ? [n.id, 1] : null;
    }
    if (c > 1) return [l, c - 1];
    const p = S.livros.find((x) => x.id === l - 1); return p ? [p.id, p.capitulos] : null;
  }

  function abrirCapitulo(l, c) {
    S.bk = l; S.ch = c;
    if (window.speechSynthesis) speechSynthesis.cancel();
    return api('capitulo', { q: { l: l, c: c } }).then((d) => {
      S.cap = d;
      desenhaLeitor();
      window.scrollTo({ top: 0 });
    });
  }

  function desenhaLeitor() {
    const d = S.cap, m = $('#conteudo');
    const ant = vizinho(d.livro.id, d.capitulo, -1), prox = vizinho(d.livro.id, d.capitulo, 1);
    const favs = d.favoritos;
    const midias = d.midias;
    const e = d.estudo;
    m.innerHTML = `
      <div class="print-head"><h2>${esc(d.livro.nome)} ${d.capitulo}</h2><p>O Caminho · Cleilton Nascimento</p></div>
      <div class="reader-head no-print">
        <button type="button" class="btn sec small" data-act="voltarCaps">← ${esc(d.livro.nome)}</button>
        <div class="row">
          <button type="button" class="btn sec small" ${ant ? `data-act="abrirCap" data-l="${ant[0]}" data-c="${ant[1]}"` : 'disabled'} aria-label="Capítulo anterior">‹ Anterior</button>
          <button type="button" class="btn sec small" ${prox ? `data-act="abrirCap" data-l="${prox[0]}" data-c="${prox[1]}"` : 'disabled'} aria-label="Próximo capítulo">Próximo ›</button>
        </div>
      </div>
      <h1>${esc(d.livro.nome)} ${d.capitulo}${e && e.titulo ? ` <small class="muted" style="font-size:.6em">— ${esc(e.titulo)}</small>` : ''}</h1>

      <div class="toolbar no-print" role="toolbar" aria-label="Ferramentas de leitura">
        <button type="button" class="btn sec small" data-act="fonte" data-d="-1" aria-label="Diminuir letra">A−</button>
        <button type="button" class="btn sec small" data-act="fonte" data-d="1" aria-label="Aumentar letra">A+</button>
        <button type="button" class="btn small ${d.lido ? '' : 'sec'}" data-act="lido" aria-pressed="${d.lido}">${d.lido ? '✓ Lido' : 'Marcar como lido'}</button>
        <button type="button" class="btn wa small" data-act="enviarCap">WhatsApp: capítulo</button>
        <button type="button" class="btn sec small" data-act="imprimir">PDF / Imprimir</button>
      </div>

      <section class="card no-print" aria-labelledby="tOuvir">
        <h2 id="tOuvir" style="font-size:1.1rem">Ouvir e ler em PDF</h2>
        <div class="player">
          ${midias.audio ? `<div><strong>🎧 Áudio MP3 do capítulo</strong><audio controls preload="none" src="${esc(midias.audio)}" id="audioCap">Seu navegador não suporta áudio.</audio>
            <label for="vel" class="muted" style="margin-top:.4rem">Velocidade</label>
            <select id="vel" data-chg="vel" style="max-width:160px"><option value="0.8">0,8×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select></div>` : ''}
          ${midias.audio_livro ? `<div><strong>🎧 Áudio MP3 do livro inteiro</strong><audio controls preload="none" src="${esc(midias.audio_livro)}"></audio></div>` : ''}
          ${!midias.audio && !midias.audio_livro ? '<p class="muted">Ainda não há MP3 para este capítulo. Você pode ouvir com a voz do aparelho:</p>' : ''}
          <div class="row">
            <button type="button" class="btn sec small" data-act="ttsPlay">🔊 Ouvir com voz do aparelho</button>
            <button type="button" class="btn sec small" data-act="ttsPausa">⏸ Pausar</button>
            <button type="button" class="btn sec small" data-act="ttsParar">⏹ Parar</button>
          </div>
          <div class="row">
            ${midias.pdf ? `<a class="btn sec small" href="${esc(midias.pdf)}" target="_blank" rel="noopener">📄 PDF do capítulo</a>` : ''}
            ${midias.pdf_livro ? `<a class="btn sec small" href="${esc(midias.pdf_livro)}" target="_blank" rel="noopener">📚 PDF do livro</a>` : ''}
          </div>
        </div>
      </section>

      <section class="card" aria-label="Texto bíblico">
        <div class="reading" id="leitura">
          ${d.versiculos.length ? d.versiculos.map((v) => `<span class="verse ${favs.indexOf(v.versiculo) >= 0 ? 'fav' : ''} ${S.sel.indexOf(v.versiculo) >= 0 ? 'sel' : ''}" role="button" tabindex="0" data-act="verso" data-v="${v.versiculo}" aria-pressed="${S.sel.indexOf(v.versiculo) >= 0}"><span class="vn">${v.versiculo}</span>${esc(v.texto)}</span>`).join('')
          : '<p class="muted">O texto deste capítulo ainda não foi importado. Peça ao administrador para usar <strong>Administração → Importar Bíblia</strong>.</p>'}
        </div>
        <div class="verse-actions no-print ${S.sel.length ? '' : 'hidden'}" id="acoesVerso" role="group" aria-label="Ações para os versículos selecionados"></div>
      </section>

      ${e && (e.contexto || e.resumo || e.aplicacao || e.perguntas) ? `<section class="card study" aria-labelledby="tEstudo"><h2 id="tEstudo">Estudo do capítulo</h2>
        ${e.contexto ? `<details open><summary>Contexto</summary><p>${esc(e.contexto)}</p></details>` : ''}
        ${e.resumo ? `<details open><summary>Resumo</summary><p>${esc(e.resumo)}</p></details>` : ''}
        ${e.aplicacao ? `<details><summary>Aplicação para a vida</summary><p>${esc(e.aplicacao)}</p></details>` : ''}
        ${e.perguntas ? `<details><summary>Perguntas para refletir</summary><p style="white-space:pre-line">${esc(e.perguntas)}</p></details>` : ''}
      </section>` : ''}

      <section class="card no-print" aria-labelledby="tNotas">
        <div class="row" style="justify-content:space-between"><h2 id="tNotas" style="margin:0">Minhas anotações</h2>
          <button type="button" class="btn sec small" data-act="novaNota" data-v="0">+ Anotação do capítulo</button></div>
        <div id="listaNotas" style="margin-top:.8rem"></div>
      </section>`;
    desenhaNotas(); desenhaAcoesVerso();
    const a = $('#audioCap'); if (a) a.addEventListener('ended', () => { if (!S.cap.lido) OC.A.lido(); });
  }

  OC.A.voltarCaps = () => { S.ch = 0; seguro(listaCapitulos()); window.scrollTo({ top: 0 }); };
  OC.A.imprimir = () => window.print();
  OC.C.vel = (el) => { const a = $('#audioCap'); if (a) a.playbackRate = Number(el.value); };

  OC.A.fonte = (el) => {
    let v = parseFloat(getComputedStyle(raiz).getPropertyValue('--reader-size')) || 1.18;
    v = Math.max(0.95, Math.min(2.2, v + Number(el.dataset.d) * 0.12));
    raiz.style.setProperty('--reader-size', v.toFixed(2) + 'rem');
    try { localStorage.setItem('oc_fonte', v.toFixed(2)); } catch (e) {}
  };

  OC.A.lido = () => {
    seguro(api('lido_toggle', { body: { livro: S.bk, capitulo: S.ch } }).then((r) => {
      S.cap.lido = r.lido;
      S.lidos[S.bk] = Math.max(0, (S.lidos[S.bk] || 0) + (r.lido ? 1 : -1));
      desenhaLeitor(); toast(r.lido ? 'Capítulo marcado como lido.' : 'Marcação removida.');
    }));
  };

  /* seleção de versículos */
  function alternaVerso(v) {
    const i = S.sel.indexOf(v);
    if (i >= 0) S.sel.splice(i, 1); else S.sel.push(v);
    const el = document.querySelector(`.verse[data-v="${v}"]`);
    if (el) { el.classList.toggle('sel', i < 0); el.setAttribute('aria-pressed', String(i < 0)); }
    desenhaAcoesVerso();
  }
  OC.A.verso = (el) => alternaVerso(Number(el.dataset.v));
  document.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('verse')) { ev.preventDefault(); alternaVerso(Number(ev.target.dataset.v)); }
  });

  function desenhaAcoesVerso() {
    const b = $('#acoesVerso'); if (!b) return;
    if (!S.sel.length) { b.classList.add('hidden'); b.innerHTML = ''; return; }
    b.classList.remove('hidden');
    b.innerHTML = `<strong style="align-self:center">${S.sel.length} selecionado(s)</strong>
      <button type="button" class="btn wa small" data-act="enviarSel">WhatsApp</button>
      <button type="button" class="btn sec small" data-act="favSel">★ Favoritar</button>
      <button type="button" class="btn sec small" data-act="notaSel">✎ Anotar</button>
      <button type="button" class="btn sec small" data-act="copiarSel">Copiar</button>
      <button type="button" class="btn sec small" data-act="limparSel">Limpar</button>`;
  }
  const versosSel = () => S.cap.versiculos.filter((v) => S.sel.indexOf(v.versiculo) >= 0);
  OC.A.enviarSel = () => { const vs = versosSel(); modalEnviar('Versículos', textoVersos(S.cap.livro, S.cap, vs)); };
  OC.A.enviarCap = () => {
    if (!S.cap.versiculos.length) { toast('Este capítulo ainda não tem texto.'); return; }
    modalEnviar('Capítulo completo', textoVersos(S.cap.livro, S.cap, S.cap.versiculos));
  };
  OC.A.copiarSel = () => {
    const t = textoVersos(S.cap.livro, S.cap, versosSel());
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copiado.')).catch(() => toast('Não foi possível copiar.'));
  };
  OC.A.limparSel = () => {
    S.sel = [];
    document.querySelectorAll('.verse.sel').forEach((e) => { e.classList.remove('sel'); e.setAttribute('aria-pressed', 'false'); });
    desenhaAcoesVerso();
  };
  OC.A.favSel = () => {
    const alvo = S.sel.slice();
    seguro(alvo.reduce((p, v) => p.then(() => api('favorito_toggle', { body: { livro: S.bk, capitulo: S.ch, versiculo: v } }).then((r) => {
      const i = S.cap.favoritos.indexOf(v);
      if (r.favorito && i < 0) S.cap.favoritos.push(v);
      if (!r.favorito && i >= 0) S.cap.favoritos.splice(i, 1);
    })), Promise.resolve()).then(() => { S.sel = []; desenhaLeitor(); toast('Favoritos atualizados.'); }));
  };

  /* anotações */
  function desenhaNotas() {
    const el = $('#listaNotas'); if (!el) return;
    const n = S.cap.anotacoes;
    el.innerHTML = n.length ? n.map((a) => `<div class="note"><strong>${a.versiculo > 0 ? 'Versículo ' + a.versiculo : 'Capítulo'}</strong>
      <p style="white-space:pre-line;margin:.2rem 0 .4rem">${esc(a.texto)}</p>
      <div class="row"><button type="button" class="btn sec small" data-act="editarNota" data-id="${a.id}">Editar</button>
      <button type="button" class="btn sec small" data-act="excluirNota" data-id="${a.id}">Excluir</button></div></div>`).join('')
      : '<p class="muted">Nenhuma anotação neste capítulo.</p>';
  }
  function formNota(titulo, id, texto, v) {
    modal(titulo, `<form data-form="nota"><input type="hidden" name="id" value="${id}"><input type="hidden" name="versiculo" value="${v}">
      <div class="field"><label for="notaTexto">Sua anotação</label><textarea id="notaTexto" name="texto" required>${esc(texto)}</textarea></div>
      <button class="btn" type="submit">Salvar</button></form>`);
  }
  OC.A.novaNota = (el) => formNota('Nova anotação', 0, '', Number(el.dataset.v));
  OC.A.notaSel = () => formNota('Anotar versículo ' + S.sel.slice().sort((a, b) => a - b)[0], 0, '', S.sel.slice().sort((a, b) => a - b)[0]);
  OC.A.editarNota = (el) => { const a = S.cap.anotacoes.find((x) => String(x.id) === el.dataset.id); if (a) formNota('Editar anotação', a.id, a.texto, a.versiculo); };
  OC.A.excluirNota = (el) => {
    if (!confirm('Excluir esta anotação?')) return;
    seguro(api('anotacao_excluir', { body: { id: Number(el.dataset.id) } }).then(() => { S.cap.anotacoes = S.cap.anotacoes.filter((x) => String(x.id) !== el.dataset.id); desenhaNotas(); toast('Anotação excluída.'); }));
  };
  OC.F.nota = (f) => {
    const dados = { id: Number(f.id.value), versiculo: Number(f.versiculo.value), texto: f.texto.value, livro: S.bk, capitulo: S.ch };
    seguro(api('anotacao_salvar', { body: dados }).then(() => api('capitulo', { q: { l: S.bk, c: S.ch } })).then((d) => {
      S.cap.anotacoes = d.anotacoes; fechaModal(); desenhaNotas(); toast('Anotação salva.');
    }));
  };

  /* leitura em voz do aparelho */
  OC.A.ttsPlay = () => {
    if (!('speechSynthesis' in window)) { toast('Seu navegador não tem leitura em voz.'); return; }
    speechSynthesis.cancel();
    const v = S.cap.versiculos; if (!v.length) { toast('Sem texto para ler.'); return; }
    let i = 0;
    const falar = () => {
      if (i >= v.length) return;
      const u = new SpeechSynthesisUtterance(`${v[i].versiculo}. ${v[i].texto}`);
      u.lang = 'pt-BR'; u.onend = () => { i++; falar(); };
      speechSynthesis.speak(u);
    };
    falar();
  };
  OC.A.ttsPausa = () => { if (!window.speechSynthesis) return; if (speechSynthesis.paused) speechSynthesis.resume(); else speechSynthesis.pause(); };
  OC.A.ttsParar = () => { if (window.speechSynthesis) speechSynthesis.cancel(); };

  /* ------------------------------ Minuto de Sabedoria ---------------------- */
  OC.views.minuto = () => { S.minutoData = hoje(); desenhaMinuto(); };
  function desenhaMinuto() {
    const m = $('#conteudo'); m.innerHTML = carregando();
    seguro(api('minuto', { q: { data: S.minutoData } }).then((r) => {
      S.minuto = r.minuto; S.minutoData = r.data;
      m.innerHTML = `<div class="print-head"><h2>Minuto de Sabedoria</h2><p>O Caminho · Cleilton Nascimento</p></div>
        <h1 class="no-print">Minuto de Sabedoria</h1>
        <p class="muted no-print">Uma passagem por dia para refletir e compartilhar.</p>
        ${cartaoMinuto(r.minuto, r.data, '<button type="button" class="btn" data-act="imprimir">Imprimir / PDF</button>')}
        <div class="card no-print"><div class="row">
          <button type="button" class="btn sec small" data-act="diaMinuto" data-d="-1">‹ Dia anterior</button>
          <label class="sr-only" for="dataMin">Escolher data</label>
          <input type="date" id="dataMin" data-chg="dataMin" value="${esc(r.data)}" style="max-width:190px">
          <button type="button" class="btn sec small" data-act="diaMinuto" data-d="1">Dia seguinte ›</button>
          <button type="button" class="btn sec small" data-act="diaMinuto" data-d="0">Hoje</button>
        </div></div>`;
    }));
  }
  OC.A.diaMinuto = (el) => { const d = Number(el.dataset.d); S.minutoData = d === 0 ? hoje() : somaDia(S.minutoData, d); desenhaMinuto(); };
  OC.C.dataMin = (el) => { if (el.value) { S.minutoData = el.value; desenhaMinuto(); } };

  /* ----------------------------------- busca ------------------------------- */
  OC.views.buscar = () => {
    $('#conteudo').innerHTML = `<h1>Buscar na Bíblia</h1>
      <form data-form="buscar" class="card" role="search"><div class="row"><div class="grow"><label class="sr-only" for="q">Palavra ou expressão</label>
        <input type="search" id="q" name="q" placeholder="Ex.: esperança, amor, paz…" required minlength="3"></div>
        <button class="btn" type="submit">Buscar</button></div></form>
      <div id="resultados" aria-live="polite"></div>`;
    $('#q').focus();
  };
  const destaca = (t, q) => {
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return t.split(re).map((p, i) => (i % 2 ? `<mark>${esc(p)}</mark>` : esc(p))).join('');
  };
  OC.F.buscar = (f) => {
    const q = f.q.value.trim(); const r = $('#resultados'); r.innerHTML = carregando();
    api('busca', { q: { q: q } }).then((d) => {
      r.innerHTML = d.resultados.length ? `<p class="muted">${d.resultados.length} resultado(s)${d.resultados.length === 100 ? ' (mostrando os 100 primeiros)' : ''}.</p><ul class="list">` + d.resultados.map((x) => `
        <li class="item"><div class="info"><strong>${esc(x.livro)} ${x.capitulo}:${x.versiculo}</strong><br>${destaca(x.texto, q)}</div>
        <div class="acts"><button type="button" class="btn sec small" data-act="abrirCap" data-l="${x.livro_id}" data-c="${x.capitulo}" data-v="${x.versiculo}">Abrir</button></div></li>`).join('') + '</ul>'
        : '<p class="muted">Nada encontrado. Lembre-se: só é possível buscar nos capítulos que já foram importados.</p>';
    }).catch((e) => { r.innerHTML = `<div class="alert" role="alert">${esc(msgErro(e))}</div>`; });
  };

  /* -------------------------------- meu estudo ----------------------------- */
  S.meuTab = 'fav';
  OC.views.meu = () => {
    const m = $('#conteudo');
    m.innerHTML = `<h1>Meu estudo</h1>
      <div class="tabs" role="group" aria-label="Seções">
        ${[['fav', '★ Favoritos'], ['not', '✎ Anotações'], ['prog', 'Progresso']].map((t) => `<button type="button" class="btn small ${S.meuTab === t[0] ? '' : 'sec'}" data-act="meuTab" data-t="${t[0]}" aria-pressed="${S.meuTab === t[0]}">${t[1]}</button>`).join('')}
      </div><div id="meuCorpo">${carregando()}</div>`;
    const c = $('#meuCorpo');
    if (S.meuTab === 'fav') {
      seguro(api('favoritos_listar').then((d) => {
        S.favLista = d.favoritos;
        c.innerHTML = d.favoritos.length ? '<ul class="list">' + d.favoritos.map((f, i) => `<li class="item"><div class="info"><strong>${esc(f.livro)} ${f.capitulo}:${f.versiculo}</strong><br>${esc(f.texto || '(texto não importado)')}</div>
          <div class="acts"><button type="button" class="btn sec small" data-act="abrirCap" data-l="${f.livro_id}" data-c="${f.capitulo}" data-v="${f.versiculo}">Abrir</button>
          <button type="button" class="btn wa small" data-act="enviarFav" data-i="${i}">WhatsApp</button>
          <button type="button" class="btn sec small" data-act="tirarFav" data-i="${i}">Remover</button></div></li>`).join('') + '</ul>'
          : '<p class="muted">Você ainda não favoritou versículos. Toque em um versículo na leitura e escolha “★ Favoritar”.</p>';
      }));
    } else if (S.meuTab === 'not') {
      seguro(api('anotacoes_listar').then((d) => {
        c.innerHTML = d.anotacoes.length ? '<ul class="list">' + d.anotacoes.map((a) => `<li class="item"><div class="info"><strong>${esc(a.livro)} ${a.capitulo}${a.versiculo > 0 ? ':' + a.versiculo : ''}</strong>
          <p style="white-space:pre-line;margin:.2rem 0 0">${esc(a.texto)}</p></div>
          <div class="acts"><button type="button" class="btn sec small" data-act="abrirCap" data-l="${a.livro_id}" data-c="${a.capitulo}" ${a.versiculo > 0 ? `data-v="${a.versiculo}"` : ''}>Abrir</button></div></li>`).join('') + '</ul>'
          : '<p class="muted">Nenhuma anotação ainda.</p>';
      }));
    } else {
      seguro(api('livros').then((d) => {
        S.livros = d.livros; S.lidos = d.lidos; S.disp = d.disponiveis;
        const itens = d.livros.filter((l) => (d.lidos[l.id] || 0) > 0).map((l) => {
          const n = d.lidos[l.id], p = Math.round((n / l.capitulos) * 100);
          return `<div style="margin-bottom:.8rem"><strong>${esc(l.nome)}</strong> <span class="muted">${n}/${l.capitulos}</span>
            <div class="progress" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(l.nome)}"><span style="width:${p}%"></span></div></div>`;
        }).join('');
        c.innerHTML = itens ? `<div class="card">${itens}</div>` : '<p class="muted">Quando você marcar capítulos como lidos, o progresso aparece aqui.</p>';
      }));
    }
  };
  OC.A.meuTab = (el) => { S.meuTab = el.dataset.t; OC.views.meu(); };
  OC.A.enviarFav = (el) => {
    const f = S.favLista[Number(el.dataset.i)];
    modalEnviar('Versículo favorito', `📖 *${f.livro} ${f.capitulo}:${f.versiculo}*\n\n“${f.texto}”\n\n_O Caminho_`);
  };
  OC.A.tirarFav = (el) => {
    const f = S.favLista[Number(el.dataset.i)];
    seguro(api('favorito_toggle', { body: { livro: f.livro_id, capitulo: f.capitulo, versiculo: f.versiculo } }).then(() => { toast('Favorito removido.'); OC.views.meu(); }));
  };

  /* ---------------------------------- WhatsApp ----------------------------- */
  OC.views.whats = () => {
    const m = $('#conteudo'); m.innerHTML = carregando();
    seguro(Promise.all([api('contatos_listar'), api('log_listar')]).then((r) => {
      const d = r[0]; S.contatos = d.contatos; S.listas = d.listas;
      m.innerHTML = `<h1>WhatsApp</h1>
        <p class="muted">Cadastre seus contatos e monte listas de transmissão para enviar capítulos, versículos e o Minuto de Sabedoria.</p>
        <section class="card" aria-labelledby="tMsg"><h2 id="tMsg">Mensagem rápida</h2>
          <div class="row"><button type="button" class="btn wa" data-act="enviarMinuto2">Enviar o Minuto de Sabedoria de hoje</button>
          <button type="button" class="btn sec" data-act="msgLivre">Escrever uma mensagem</button></div></section>
        <section class="card" aria-labelledby="tCont"><div class="row" style="justify-content:space-between"><h2 id="tCont" style="margin:0">Contatos</h2>
          <button type="button" class="btn small" data-act="novoContato">+ Novo contato</button></div>
          <ul class="list" style="margin-top:.8rem">${d.contatos.length ? d.contatos.map((c) => `<li class="item"><div class="info"><strong>${esc(c.nome)}</strong><br><small class="muted">${esc(fmtTel(c.telefone))}</small></div>
            <div class="acts"><button type="button" class="btn sec small" data-act="editarContato" data-id="${c.id}">Editar</button>
            <button type="button" class="btn sec small" data-act="excluirContato" data-id="${c.id}">Excluir</button></div></li>`).join('') : '<li class="muted">Nenhum contato ainda.</li>'}</ul></section>
        <section class="card" aria-labelledby="tList"><div class="row" style="justify-content:space-between"><h2 id="tList" style="margin:0">Listas de transmissão</h2>
          <button type="button" class="btn small" data-act="novaLista">+ Nova lista</button></div>
          <ul class="list" style="margin-top:.8rem">${d.listas.length ? d.listas.map((l) => `<li class="item"><div class="info"><strong>${esc(l.nome)}</strong> <span class="pill">${l.contato_ids.length} contato(s)</span></div>
            <div class="acts"><button type="button" class="btn wa small" data-act="msgLista" data-id="${l.id}">Enviar mensagem</button>
            <button type="button" class="btn sec small" data-act="editarLista" data-id="${l.id}">Editar</button>
            <button type="button" class="btn sec small" data-act="excluirLista" data-id="${l.id}">Excluir</button></div></li>`).join('') : '<li class="muted">Nenhuma lista criada.</li>'}</ul></section>
        <section class="card" aria-labelledby="tHist"><h2 id="tHist">Últimos envios</h2>
          ${r[1].envios.length ? '<ul class="list">' + r[1].envios.slice(0, 10).map((e) => `<li class="item"><div class="info"><strong>${esc(e.resumo || e.tipo)}</strong><br><small class="muted">${esc(e.destino)} · ${esc(e.criado_em)}</small></div></li>`).join('') + '</ul>' : '<p class="muted">Nenhum envio registrado.</p>'}</section>`;
    }));
  };
  OC.A.enviarMinuto2 = () => {
    seguro(api('minuto').then((r) => { S.minuto = r.minuto; S.minutoData = r.data; modalEnviar('Minuto de Sabedoria', textoMinuto(r.minuto, r.data)); }));
  };
  OC.A.msgLivre = () => modalEnviar('Mensagem', '🙏 Paz do Senhor!\n\n');
  OC.A.msgLista = (el) => {
    modalEnviar('Mensagem para lista', '🙏 Paz do Senhor!\n\n').then(() => {
      if (S.envio) { S.envio.listaSel = Number(el.dataset.id); desenhaEnvio(); }
    });
  };

  function formContato(c) {
    modal(c ? 'Editar contato' : 'Novo contato', `<form data-form="contato"><input type="hidden" name="id" value="${c ? c.id : 0}">
      <div class="field"><label for="cNome">Nome</label><input type="text" id="cNome" name="nome" value="${esc(c ? c.nome : '')}" required maxlength="120"></div>
      <div class="field"><label for="cTel">Telefone com DDD</label><input type="tel" id="cTel" name="telefone" value="${esc(c ? c.telefone : '')}" placeholder="(85) 99999-9999" inputmode="tel" required></div>
      <button class="btn" type="submit">Salvar</button></form>`);
  }
  OC.A.novoContato = () => formContato(null);
  OC.A.editarContato = (el) => formContato(S.contatos.find((c) => String(c.id) === el.dataset.id));
  OC.A.excluirContato = (el) => { if (!confirm('Excluir este contato?')) return; seguro(api('contato_excluir', { body: { id: Number(el.dataset.id) } }).then(() => { toast('Contato excluído.'); OC.views.whats(); })); };
  OC.F.contato = (f) => seguro(api('contato_salvar', { body: { id: Number(f.id.value), nome: f.nome.value, telefone: f.telefone.value } }).then(() => { fechaModal(); toast('Contato salvo.'); OC.views.whats(); }));

  function formLista(l) {
    modal(l ? 'Editar lista' : 'Nova lista de transmissão', `<form data-form="lista"><input type="hidden" name="id" value="${l ? l.id : 0}">
      <div class="field"><label for="lNome">Nome da lista</label><input type="text" id="lNome" name="nome" value="${esc(l ? l.nome : '')}" required maxlength="120"></div>
      <fieldset style="border:0;padding:0;margin:0 0 1rem"><legend style="font-weight:600;margin-bottom:.3rem">Quem recebe</legend>
        ${S.contatos.length ? `<div class="checks">${S.contatos.map((c) => `<label><input type="checkbox" name="ids" value="${c.id}" ${l && l.contato_ids.indexOf(Number(c.id)) >= 0 ? 'checked' : ''}> ${esc(c.nome)}</label>`).join('')}</div>` : '<p class="muted">Cadastre contatos primeiro.</p>'}
      </fieldset><button class="btn" type="submit">Salvar</button></form>`);
  }
  OC.A.novaLista = () => formLista(null);
  OC.A.editarLista = (el) => formLista(S.listas.find((l) => String(l.id) === el.dataset.id));
  OC.A.excluirLista = (el) => { if (!confirm('Excluir esta lista? Os contatos continuam salvos.')) return; seguro(api('lista_excluir', { body: { id: Number(el.dataset.id) } }).then(() => { toast('Lista excluída.'); OC.views.whats(); })); };
  OC.F.lista = (f) => {
    const ids = Array.from(f.querySelectorAll('input[name="ids"]:checked')).map((i) => Number(i.value));
    seguro(api('lista_salvar', { body: { id: Number(f.id.value), nome: f.nome.value, contato_ids: ids } }).then(() => { fechaModal(); toast('Lista salva.'); OC.views.whats(); }));
  };

  /* ------------------------------------ conta ------------------------------ */
  OC.views.conta = () => {
    const alto = raiz.getAttribute('data-contrast') === 'alto';
    $('#conteudo').innerHTML = `<h1>Minha conta</h1>
      <section class="card" aria-labelledby="tAcess"><h2 id="tAcess">Acessibilidade</h2>
        <div class="row"><span>Tamanho da letra da leitura:</span>
          <button type="button" class="btn sec small" data-act="fonte" data-d="-1" aria-label="Diminuir letra">A−</button>
          <button type="button" class="btn sec small" data-act="fonte" data-d="1" aria-label="Aumentar letra">A+</button></div>
        <div class="row" style="margin-top:.8rem"><label style="display:flex;gap:.6rem;align-items:center;margin:0;font-weight:600"><input type="checkbox" id="altoContraste" data-chg="contraste" ${alto ? 'checked' : ''}> Modo de alto contraste</label></div>
        <p class="muted" style="margin-top:.8rem">Dica: o tema claro/escuro fica no botão de sol e lua no topo. O sistema funciona com teclado (Tab, Enter e Espaço) e com leitores de tela.</p>
      </section>
      <section class="card" aria-labelledby="tSenha"><h2 id="tSenha">Trocar senha</h2>
        <form data-form="senha"><div class="grid-2">
          <div class="field"><label for="sAtual">Senha atual</label><input type="password" id="sAtual" name="atual" autocomplete="current-password" required></div>
          <div class="field"><label for="sNova">Nova senha (mínimo 6 caracteres)</label><input type="password" id="sNova" name="nova" autocomplete="new-password" required minlength="6"></div></div>
          <button class="btn" type="submit">Salvar nova senha</button></form></section>
      <section class="card"><p class="muted" style="margin:0"><strong>O Caminho</strong> — sistema criado e desenvolvido por <strong>Cleilton Nascimento</strong>. Todos os direitos reservados.</p></section>`;
  };
  OC.C.contraste = (el) => {
    if (el.checked) { raiz.setAttribute('data-contrast', 'alto'); try { localStorage.setItem('oc_contraste', 'alto'); } catch (e) {} }
    else { raiz.removeAttribute('data-contrast'); try { localStorage.removeItem('oc_contraste'); } catch (e) {} }
  };
  OC.F.senha = (f) => seguro(api('senha_alterar', { body: { atual: f.atual.value, nova: f.nova.value } }).then(() => { f.reset(); toast('Senha alterada com sucesso.'); }));

  /* ------------------------------------ início ----------------------------- */
  OC.iniciar = () => {
    api('me').then((d) => {
      S.user = d.usuario; S.csrf = d.csrf;
      $('#quem').textContent = S.user.nome;
      montaNav();
      irPara('inicio');
    }).catch(() => { location.replace('index.html'); });
  };
  document.addEventListener('DOMContentLoaded', OC.iniciar);
})();
