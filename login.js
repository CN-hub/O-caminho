/* O CAMINHO - Login | Criado e desenvolvido por Cleilton Nascimento - Todos os direitos reservados. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var botaoTema = document.getElementById('themeToggle');

  function aplicaTema(t) {
    raiz.setAttribute('data-theme', t);
    botaoTema.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
    try { localStorage.setItem('oc_tema', t); } catch (e) {}
  }
  botaoTema.setAttribute('aria-checked', raiz.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
  botaoTema.addEventListener('click', function () {
    aplicaTema(raiz.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('ano').textContent = new Date().getFullYear();

  var senha = document.getElementById('senha');
  var ver = document.getElementById('verSenha');
  ver.addEventListener('click', function () {
    var mostrar = senha.type === 'password';
    senha.type = mostrar ? 'text' : 'password';
    ver.setAttribute('aria-pressed', mostrar ? 'true' : 'false');
    ver.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  });

  var erro = document.getElementById('erro');
  function mostraErro(msg) {
    erro.textContent = msg;
    erro.classList.remove('hidden');
  }

  // se já estiver logado, vai direto para o sistema
  fetch('api/api.php?a=me', { credentials: 'same-origin' })
    .then(function (r) { if (r.ok) location.replace('app.html'); })
    .catch(function () {});

  document.getElementById('form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    erro.classList.add('hidden');
    var usuario = document.getElementById('usuario').value.trim();
    var pass = senha.value;
    if (!usuario || !pass) { mostraErro('Informe o usuário e a senha.'); return; }

    var botao = document.getElementById('entrar');
    botao.disabled = true;
    botao.textContent = 'Entrando...';

    fetch('api/api.php?a=login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usuario, senha: pass })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.j.erro || 'Não foi possível entrar.');
        location.replace('app.html');
      })
      .catch(function (e) {
        mostraErro(e.message === 'Failed to fetch' ? 'Sem conexão com o servidor. Verifique se o Apache e o MySQL estão ligados.' : e.message);
        botao.disabled = false;
        botao.textContent = 'Entrar';
        senha.focus();
      });
  });
})();
