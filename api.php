<?php
/*
 * O CAMINHO - API do sistema (PHP + MySQL)
 * Criado e desenvolvido por Cleilton Nascimento - Todos os direitos reservados.
 */
declare(strict_types=1);

require __DIR__ . '/config.php';

date_default_timezone_set('America/Fortaleza');
mb_internal_encoding('UTF-8');

if (!DEBUG) { ini_set('display_errors', '0'); }

session_name('ocaminho');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

/* ----------------------------- utilitários ----------------------------- */

function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            out(['erro' => 'Não foi possível conectar ao banco de dados. Confira o arquivo api/config.php.'
                . (DEBUG ? ' ' . $e->getMessage() : '')], 500);
        }
    }
    return $pdo;
}

function body(): array {
    $raw = file_get_contents('php://input');
    $j = json_decode($raw ?: '', true);
    return is_array($j) ? $j : [];
}

function usuario(): ?array { return $_SESSION['u'] ?? null; }

function exigeLogin(): array {
    $u = usuario();
    if (!$u) out(['erro' => 'Sessão expirada. Entre novamente.'], 401);
    return $u;
}

function exigeAdmin(): array {
    $u = exigeLogin();
    if ($u['perfil'] !== 'admin') out(['erro' => 'Apenas o administrador pode fazer isso.'], 403);
    return $u;
}

function exigeCsrf(): void {
    $t = $_SERVER['HTTP_X_CSRF'] ?? '';
    if (!isset($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) {
        out(['erro' => 'Requisição inválida. Atualize a página e tente de novo.'], 403);
    }
}

function txt($v, int $max = 5000): string {
    $v = trim((string)$v);
    return mb_substr($v, 0, $max);
}

function telefone(string $t): ?string {
    $d = preg_replace('/\D+/', '', $t) ?? '';
    if ($d === '') return null;
    if (strlen($d) === 10 || strlen($d) === 11) $d = '55' . $d;   // DDD + número (Brasil)
    if (strlen($d) < 12 || strlen($d) > 15) return null;
    return $d;
}

function normaliza(string $s): string {
    $s = mb_strtolower(trim($s));
    $s = strtr($s, [
        'á'=>'a','à'=>'a','â'=>'a','ã'=>'a','ä'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
        'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i','ó'=>'o','ò'=>'o','ô'=>'o','õ'=>'o','ö'=>'o',
        'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u','ç'=>'c','º'=>'','ª'=>'',
    ]);
    return preg_replace('/[^a-z0-9]+/', '', $s) ?? '';
}

function hojeIso(): string { return date('Y-m-d'); }

/* ------------------------------- roteador ------------------------------ */

$a = $_GET['a'] ?? '';
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    if ($metodo !== 'GET' && $a !== 'login') { exigeCsrf(); }

    switch ($a) {

    /* ---------------------------- autenticação --------------------------- */
    case 'login': {
        if ($metodo !== 'POST') out(['erro' => 'Método inválido'], 405);
        $_SESSION['tent'] = $_SESSION['tent'] ?? [];
        $_SESSION['tent'] = array_values(array_filter($_SESSION['tent'], fn($t) => $t > time() - 300));
        if (count($_SESSION['tent']) >= 6) {
            out(['erro' => 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'], 429);
        }
        $b = body();
        $usr = txt($b['usuario'] ?? '', 60);
        $senha = (string)($b['senha'] ?? '');
        $st = db()->prepare('SELECT id,nome,usuario,senha_hash,perfil FROM usuarios WHERE usuario = ? LIMIT 1');
        $st->execute([$usr]);
        $row = $st->fetch();
        if (!$row || !password_verify($senha, $row['senha_hash'])) {
            $_SESSION['tent'][] = time();
            usleep(400000);
            out(['erro' => 'Usuário ou senha incorretos.'], 401);
        }
        session_regenerate_id(true);
        $_SESSION['tent'] = [];
        $_SESSION['u'] = ['id' => (int)$row['id'], 'nome' => $row['nome'], 'usuario' => $row['usuario'], 'perfil' => $row['perfil']];
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        out(['usuario' => $_SESSION['u'], 'csrf' => $_SESSION['csrf']]);
    }

    case 'logout': {
        $_SESSION = [];
        session_destroy();
        out(['ok' => true]);
    }

    case 'me': {
        $u = exigeLogin();
        if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
        out(['usuario' => $u, 'csrf' => $_SESSION['csrf']]);
    }

    case 'senha_alterar': {
        $u = exigeLogin();
        $b = body();
        $atual = (string)($b['atual'] ?? '');
        $nova = (string)($b['nova'] ?? '');
        if (mb_strlen($nova) < 6) out(['erro' => 'A nova senha precisa ter pelo menos 6 caracteres.'], 422);
        $st = db()->prepare('SELECT senha_hash FROM usuarios WHERE id = ?');
        $st->execute([$u['id']]);
        $h = $st->fetchColumn();
        if (!$h || !password_verify($atual, (string)$h)) out(['erro' => 'A senha atual está incorreta.'], 422);
        db()->prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?')
            ->execute([password_hash($nova, PASSWORD_DEFAULT), $u['id']]);
        out(['ok' => true]);
    }

    /* ------------------------------- bíblia ------------------------------ */
    case 'livros': {
        $u = exigeLogin();
        $livros = db()->query('SELECT id,nome,abrev,testamento,capitulos FROM livros ORDER BY id')->fetchAll();
        $st = db()->prepare('SELECT livro_id, COUNT(*) AS n FROM leituras WHERE usuario_id = ? GROUP BY livro_id');
        $st->execute([$u['id']]);
        $lidos = [];
        foreach ($st->fetchAll() as $r) $lidos[(int)$r['livro_id']] = (int)$r['n'];
        $tem = [];
        foreach (db()->query('SELECT livro_id, COUNT(DISTINCT capitulo) AS n FROM versiculos GROUP BY livro_id')->fetchAll() as $r) {
            $tem[(int)$r['livro_id']] = (int)$r['n'];
        }
        out(['livros' => $livros, 'lidos' => $lidos, 'disponiveis' => $tem]);
    }

    case 'capitulo': {
        $u = exigeLogin();
        $l = (int)($_GET['l'] ?? 0);
        $c = (int)($_GET['c'] ?? 0);
        $st = db()->prepare('SELECT id,nome,abrev,testamento,capitulos FROM livros WHERE id = ?');
        $st->execute([$l]);
        $livro = $st->fetch();
        if (!$livro || $c < 1 || $c > (int)$livro['capitulos']) out(['erro' => 'Capítulo não encontrado.'], 404);

        $st = db()->prepare('SELECT versiculo, texto FROM versiculos WHERE livro_id = ? AND capitulo = ? ORDER BY versiculo');
        $st->execute([$l, $c]);
        $vers = $st->fetchAll();

        $st = db()->prepare('SELECT titulo,contexto,resumo,aplicacao,perguntas FROM estudos WHERE livro_id = ? AND capitulo = ?');
        $st->execute([$l, $c]);
        $estudo = $st->fetch() ?: null;

        $st = db()->prepare('SELECT tipo,capitulo,arquivo FROM midias WHERE livro_id = ? AND capitulo IN (0, ?)');
        $st->execute([$l, $c]);
        $midias = ['audio' => null, 'pdf' => null, 'audio_livro' => null, 'pdf_livro' => null];
        foreach ($st->fetchAll() as $m) {
            $pasta = $m['tipo'] === 'audio' ? 'audio' : 'pdf';
            $url = 'uploads/' . $pasta . '/' . $m['arquivo'];
            if ((int)$m['capitulo'] === 0) $midias[$m['tipo'] . '_livro'] = $url; else $midias[$m['tipo']] = $url;
        }

        $st = db()->prepare('SELECT versiculo FROM favoritos WHERE usuario_id = ? AND livro_id = ? AND capitulo = ?');
        $st->execute([$u['id'], $l, $c]);
        $favs = array_map('intval', array_column($st->fetchAll(), 'versiculo'));

        $st = db()->prepare('SELECT id,versiculo,texto FROM anotacoes WHERE usuario_id = ? AND livro_id = ? AND capitulo = ? ORDER BY versiculo,id');
        $st->execute([$u['id'], $l, $c]);
        $anots = $st->fetchAll();

        $st = db()->prepare('SELECT 1 FROM leituras WHERE usuario_id = ? AND livro_id = ? AND capitulo = ?');
        $st->execute([$u['id'], $l, $c]);
        $lido = (bool)$st->fetchColumn();

        out(['livro' => $livro, 'capitulo' => $c, 'versiculos' => $vers, 'estudo' => $estudo,
             'midias' => $midias, 'favoritos' => $favs, 'anotacoes' => $anots, 'lido' => $lido]);
    }

    case 'busca': {
        exigeLogin();
        $q = txt($_GET['q'] ?? '', 80);
        if (mb_strlen($q) < 3) out(['erro' => 'Digite pelo menos 3 letras para buscar.'], 422);
        $like = '%' . addcslashes($q, '%_\\') . '%';
        $st = db()->prepare('SELECT v.livro_id, l.nome AS livro, v.capitulo, v.versiculo, v.texto
                             FROM versiculos v JOIN livros l ON l.id = v.livro_id
                             WHERE v.texto LIKE ? ORDER BY v.livro_id, v.capitulo, v.versiculo LIMIT 100');
        $st->execute([$like]);
        out(['resultados' => $st->fetchAll()]);
    }

    case 'lido_toggle': {
        $u = exigeLogin();
        $b = body();
        $l = (int)($b['livro'] ?? 0); $c = (int)($b['capitulo'] ?? 0);
        $st = db()->prepare('SELECT 1 FROM leituras WHERE usuario_id=? AND livro_id=? AND capitulo=?');
        $st->execute([$u['id'], $l, $c]);
        if ($st->fetchColumn()) {
            db()->prepare('DELETE FROM leituras WHERE usuario_id=? AND livro_id=? AND capitulo=?')->execute([$u['id'], $l, $c]);
            out(['lido' => false]);
        }
        db()->prepare('INSERT IGNORE INTO leituras (usuario_id,livro_id,capitulo) VALUES (?,?,?)')->execute([$u['id'], $l, $c]);
        out(['lido' => true]);
    }

    case 'favorito_toggle': {
        $u = exigeLogin();
        $b = body();
        $l = (int)($b['livro'] ?? 0); $c = (int)($b['capitulo'] ?? 0); $v = (int)($b['versiculo'] ?? 0);
        $st = db()->prepare('SELECT id FROM favoritos WHERE usuario_id=? AND livro_id=? AND capitulo=? AND versiculo=?');
        $st->execute([$u['id'], $l, $c, $v]);
        $id = $st->fetchColumn();
        if ($id) {
            db()->prepare('DELETE FROM favoritos WHERE id = ?')->execute([$id]);
            out(['favorito' => false]);
        }
        db()->prepare('INSERT INTO favoritos (usuario_id,livro_id,capitulo,versiculo) VALUES (?,?,?,?)')->execute([$u['id'], $l, $c, $v]);
        out(['favorito' => true]);
    }

    case 'favoritos_listar': {
        $u = exigeLogin();
        $st = db()->prepare('SELECT f.livro_id, l.nome AS livro, f.capitulo, f.versiculo, v.texto
                             FROM favoritos f JOIN livros l ON l.id = f.livro_id
                             LEFT JOIN versiculos v ON v.livro_id=f.livro_id AND v.capitulo=f.capitulo AND v.versiculo=f.versiculo
                             WHERE f.usuario_id = ? ORDER BY f.criado_em DESC LIMIT 300');
        $st->execute([$u['id']]);
        out(['favoritos' => $st->fetchAll()]);
    }

    case 'anotacao_salvar': {
        $u = exigeLogin();
        $b = body();
        $id = (int)($b['id'] ?? 0);
        $texto = txt($b['texto'] ?? '', 4000);
        if ($texto === '') out(['erro' => 'Escreva a anotação.'], 422);
        if ($id > 0) {
            db()->prepare('UPDATE anotacoes SET texto=? WHERE id=? AND usuario_id=?')->execute([$texto, $id, $u['id']]);
            out(['id' => $id]);
        }
        db()->prepare('INSERT INTO anotacoes (usuario_id,livro_id,capitulo,versiculo,texto) VALUES (?,?,?,?,?)')
            ->execute([$u['id'], (int)($b['livro'] ?? 0), (int)($b['capitulo'] ?? 0), (int)($b['versiculo'] ?? 0), $texto]);
        out(['id' => (int)db()->lastInsertId()]);
    }

    case 'anotacao_excluir': {
        $u = exigeLogin();
        db()->prepare('DELETE FROM anotacoes WHERE id=? AND usuario_id=?')->execute([(int)(body()['id'] ?? 0), $u['id']]);
        out(['ok' => true]);
    }

    case 'anotacoes_listar': {
        $u = exigeLogin();
        $st = db()->prepare('SELECT a.id, a.livro_id, l.nome AS livro, a.capitulo, a.versiculo, a.texto, a.atualizado_em
                             FROM anotacoes a JOIN livros l ON l.id = a.livro_id
                             WHERE a.usuario_id = ? ORDER BY a.atualizado_em DESC LIMIT 300');
        $st->execute([$u['id']]);
        out(['anotacoes' => $st->fetchAll()]);
    }

    case 'livro_info': {
        $u = exigeLogin();
        $l = (int)($_GET['l'] ?? 0);
        $st = db()->prepare('SELECT capitulo FROM leituras WHERE usuario_id = ? AND livro_id = ?');
        $st->execute([$u['id'], $l]);
        $lidos = array_map('intval', array_column($st->fetchAll(), 'capitulo'));
        $st = db()->prepare('SELECT DISTINCT capitulo FROM versiculos WHERE livro_id = ?');
        $st->execute([$l]);
        $com = array_map('intval', array_column($st->fetchAll(), 'capitulo'));
        out(['lidos' => $lidos, 'com_texto' => $com]);
    }

    case 'progresso': {
        $u = exigeLogin();
        $st = db()->prepare('SELECT l.nome AS livro, p.livro_id, p.capitulo FROM leituras p JOIN livros l ON l.id=p.livro_id
                             WHERE p.usuario_id = ? ORDER BY p.lido_em DESC LIMIT 1');
        $st->execute([$u['id']]);
        $ultima = $st->fetch() ?: null;
        $st = db()->prepare('SELECT COUNT(*) FROM leituras WHERE usuario_id = ?');
        $st->execute([$u['id']]);
        $total = (int)$st->fetchColumn();
        out(['ultima' => $ultima, 'capitulos_lidos' => $total, 'capitulos_total' => 1189]);
    }

    /* -------------------------- minuto de sabedoria ---------------------- */
    case 'minuto': {
        exigeLogin();
        $d = $_GET['data'] ?? hojeIso();
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) $d = hojeIso();
        $st = db()->prepare('SELECT referencia,texto,reflexao FROM minuto_sabedoria WHERE data_exibicao = ? ORDER BY id DESC LIMIT 1');
        $st->execute([$d]);
        $m = $st->fetch();
        if (!$m) {
            $rows = db()->query('SELECT referencia,texto,reflexao FROM minuto_sabedoria WHERE data_exibicao IS NULL ORDER BY ordem,id')->fetchAll();
            if ($rows) {
                $dias = (int)floor(strtotime($d . ' 12:00:00 UTC') / 86400);
                $m = $rows[$dias % count($rows)];
            }
        }
        if (!$m) out(['erro' => 'Nenhuma passagem cadastrada.'], 404);
        out(['data' => $d, 'minuto' => $m]);
    }

    case 'minuto_lista': {
        exigeAdmin();
        out(['itens' => db()->query('SELECT id,data_exibicao,referencia,texto,reflexao,ordem FROM minuto_sabedoria ORDER BY (data_exibicao IS NULL), data_exibicao DESC, ordem, id')->fetchAll()]);
    }

    case 'minuto_salvar': {
        exigeAdmin();
        $b = body();
        $id = (int)($b['id'] ?? 0);
        $data = txt($b['data_exibicao'] ?? '', 10);
        $data = preg_match('/^\d{4}-\d{2}-\d{2}$/', $data) ? $data : null;
        $ref = txt($b['referencia'] ?? '', 80);
        $texto = txt($b['texto'] ?? '', 3000);
        $refl = txt($b['reflexao'] ?? '', 1500);
        if ($ref === '' || $texto === '') out(['erro' => 'Informe a referência e o texto.'], 422);
        if ($id > 0) {
            db()->prepare('UPDATE minuto_sabedoria SET data_exibicao=?, referencia=?, texto=?, reflexao=? WHERE id=?')
                ->execute([$data, $ref, $texto, $refl, $id]);
        } else {
            $max = (int)db()->query('SELECT COALESCE(MAX(ordem),0) FROM minuto_sabedoria')->fetchColumn();
            db()->prepare('INSERT INTO minuto_sabedoria (data_exibicao,referencia,texto,reflexao,ordem) VALUES (?,?,?,?,?)')
                ->execute([$data, $ref, $texto, $refl, $max + 1]);
        }
        out(['ok' => true]);
    }

    case 'minuto_excluir': {
        exigeAdmin();
        db()->prepare('DELETE FROM minuto_sabedoria WHERE id = ?')->execute([(int)(body()['id'] ?? 0)]);
        out(['ok' => true]);
    }

    /* ------------------------ contatos e transmissão --------------------- */
    case 'contatos_listar': {
        $u = exigeLogin();
        $st = db()->prepare('SELECT id,nome,telefone FROM contatos WHERE usuario_id = ? ORDER BY nome');
        $st->execute([$u['id']]);
        $contatos = $st->fetchAll();
        $st = db()->prepare('SELECT id,nome FROM listas WHERE usuario_id = ? ORDER BY nome');
        $st->execute([$u['id']]);
        $listas = $st->fetchAll();
        $st = db()->prepare('SELECT lc.lista_id, lc.contato_id FROM lista_contatos lc JOIN listas l ON l.id = lc.lista_id WHERE l.usuario_id = ?');
        $st->execute([$u['id']]);
        $mapa = [];
        foreach ($st->fetchAll() as $r) $mapa[(int)$r['lista_id']][] = (int)$r['contato_id'];
        foreach ($listas as &$l) $l['contato_ids'] = $mapa[(int)$l['id']] ?? [];
        out(['contatos' => $contatos, 'listas' => $listas]);
    }

    case 'contato_salvar': {
        $u = exigeLogin();
        $b = body();
        $id = (int)($b['id'] ?? 0);
        $nome = txt($b['nome'] ?? '', 120);
        $tel = telefone((string)($b['telefone'] ?? ''));
        if ($nome === '') out(['erro' => 'Informe o nome.'], 422);
        if (!$tel) out(['erro' => 'Telefone inválido. Use DDD + número, ex.: (85) 99999-9999.'], 422);
        if ($id > 0) {
            db()->prepare('UPDATE contatos SET nome=?, telefone=? WHERE id=? AND usuario_id=?')->execute([$nome, $tel, $id, $u['id']]);
        } else {
            db()->prepare('INSERT INTO contatos (usuario_id,nome,telefone) VALUES (?,?,?)')->execute([$u['id'], $nome, $tel]);
        }
        out(['ok' => true]);
    }

    case 'contato_excluir': {
        $u = exigeLogin();
        db()->prepare('DELETE FROM contatos WHERE id=? AND usuario_id=?')->execute([(int)(body()['id'] ?? 0), $u['id']]);
        out(['ok' => true]);
    }

    case 'lista_salvar': {
        $u = exigeLogin();
        $b = body();
        $id = (int)($b['id'] ?? 0);
        $nome = txt($b['nome'] ?? '', 120);
        $ids = array_values(array_unique(array_map('intval', (array)($b['contato_ids'] ?? []))));
        if ($nome === '') out(['erro' => 'Dê um nome para a lista.'], 422);
        $pdo = db();
        $pdo->beginTransaction();
        if ($id > 0) {
            $pdo->prepare('UPDATE listas SET nome=? WHERE id=? AND usuario_id=?')->execute([$nome, $id, $u['id']]);
            $chk = $pdo->prepare('SELECT 1 FROM listas WHERE id=? AND usuario_id=?');
            $chk->execute([$id, $u['id']]);
            if (!$chk->fetchColumn()) { $pdo->rollBack(); out(['erro' => 'Lista não encontrada.'], 404); }
            $pdo->prepare('DELETE FROM lista_contatos WHERE lista_id = ?')->execute([$id]);
        } else {
            $pdo->prepare('INSERT INTO listas (usuario_id,nome) VALUES (?,?)')->execute([$u['id'], $nome]);
            $id = (int)$pdo->lastInsertId();
        }
        if ($ids) {
            $in = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdo->prepare("SELECT id FROM contatos WHERE usuario_id = ? AND id IN ($in)");
            $st->execute(array_merge([$u['id']], $ids));
            $ok = array_column($st->fetchAll(), 'id');
            $ins = $pdo->prepare('INSERT IGNORE INTO lista_contatos (lista_id,contato_id) VALUES (?,?)');
            foreach ($ok as $cid) $ins->execute([$id, (int)$cid]);
        }
        $pdo->commit();
        out(['ok' => true, 'id' => $id]);
    }

    case 'lista_excluir': {
        $u = exigeLogin();
        db()->prepare('DELETE FROM listas WHERE id=? AND usuario_id=?')->execute([(int)(body()['id'] ?? 0), $u['id']]);
        out(['ok' => true]);
    }

    case 'log_envio': {
        $u = exigeLogin();
        $b = body();
        db()->prepare('INSERT INTO envios_log (usuario_id,tipo,destino,resumo) VALUES (?,?,?,?)')
            ->execute([$u['id'], txt($b['tipo'] ?? '', 30), txt($b['destino'] ?? '', 160), txt($b['resumo'] ?? '', 190)]);
        out(['ok' => true]);
    }

    case 'log_listar': {
        $u = exigeLogin();
        $st = db()->prepare('SELECT tipo,destino,resumo,criado_em FROM envios_log WHERE usuario_id = ? ORDER BY id DESC LIMIT 50');
        $st->execute([$u['id']]);
        out(['envios' => $st->fetchAll()]);
    }

    /* --------------------------- administração --------------------------- */
    case 'upload_midia': {
        exigeAdmin();
        $l = (int)($_POST['livro'] ?? 0);
        $c = (int)($_POST['capitulo'] ?? 0);               // 0 = livro inteiro
        $tipo = ($_POST['tipo'] ?? '') === 'audio' ? 'audio' : 'pdf';
        $st = db()->prepare('SELECT capitulos FROM livros WHERE id = ?');
        $st->execute([$l]);
        $cap = $st->fetchColumn();
        if ($cap === false || $c < 0 || $c > (int)$cap) out(['erro' => 'Livro ou capítulo inválido.'], 422);

        $f = $_FILES['arquivo'] ?? null;
        if (!$f || $f['error'] !== UPLOAD_ERR_OK) {
            $msg = ($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE
                ? 'Arquivo maior que o limite do servidor. Aumente upload_max_filesize no php.ini (veja o manual).'
                : 'Falha ao enviar o arquivo.';
            out(['erro' => $msg], 422);
        }
        if ($f['size'] > UPLOAD_MAX_MB * 1024 * 1024) out(['erro' => 'Arquivo maior que ' . UPLOAD_MAX_MB . ' MB.'], 422);

        $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        if ($tipo === 'audio') {
            if ($ext !== 'mp3' || !in_array($mime, ['audio/mpeg', 'audio/mp3', 'application/octet-stream'], true)) {
                out(['erro' => 'Envie um arquivo MP3 válido.'], 422);
            }
        } else {
            if ($ext !== 'pdf' || $mime !== 'application/pdf') out(['erro' => 'Envie um arquivo PDF válido.'], 422);
        }

        $pasta = __DIR__ . '/../uploads/' . $tipo;
        if (!is_dir($pasta) && !mkdir($pasta, 0755, true)) out(['erro' => 'Não foi possível criar a pasta uploads.'], 500);
        $nome = sprintf('%s_%d_%d_%s.%s', $tipo, $l, $c, bin2hex(random_bytes(4)), $ext);
        if (!move_uploaded_file($f['tmp_name'], $pasta . '/' . $nome)) out(['erro' => 'Não foi possível salvar o arquivo (permissão da pasta uploads).'], 500);

        $st = db()->prepare('SELECT arquivo FROM midias WHERE livro_id=? AND capitulo=? AND tipo=?');
        $st->execute([$l, $c, $tipo]);
        $antigo = $st->fetchColumn();
        db()->prepare('INSERT INTO midias (livro_id,capitulo,tipo,arquivo,nome_original) VALUES (?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE arquivo=VALUES(arquivo), nome_original=VALUES(nome_original)')
            ->execute([$l, $c, $tipo, $nome, mb_substr(basename($f['name']), 0, 190)]);
        if ($antigo && is_file($pasta . '/' . $antigo)) @unlink($pasta . '/' . $antigo);
        out(['ok' => true]);
    }

    case 'midias_listar': {
        exigeAdmin();
        out(['midias' => db()->query('SELECT m.id,m.tipo,m.capitulo,m.nome_original,l.nome AS livro FROM midias m JOIN livros l ON l.id=m.livro_id ORDER BY m.id DESC LIMIT 200')->fetchAll()]);
    }

    case 'midia_excluir': {
        exigeAdmin();
        $id = (int)(body()['id'] ?? 0);
        $st = db()->prepare('SELECT tipo,arquivo FROM midias WHERE id = ?');
        $st->execute([$id]);
        if ($m = $st->fetch()) {
            $p = __DIR__ . '/../uploads/' . ($m['tipo'] === 'audio' ? 'audio' : 'pdf') . '/' . $m['arquivo'];
            if (is_file($p)) @unlink($p);
            db()->prepare('DELETE FROM midias WHERE id = ?')->execute([$id]);
        }
        out(['ok' => true]);
    }

    case 'estudo_salvar': {
        exigeAdmin();
        $b = body();
        $l = (int)($b['livro'] ?? 0); $c = (int)($b['capitulo'] ?? 0);
        if ($l < 1 || $c < 1) out(['erro' => 'Escolha o livro e o capítulo.'], 422);
        db()->prepare('INSERT INTO estudos (livro_id,capitulo,titulo,contexto,resumo,aplicacao,perguntas) VALUES (?,?,?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), contexto=VALUES(contexto), resumo=VALUES(resumo), aplicacao=VALUES(aplicacao), perguntas=VALUES(perguntas)')
            ->execute([$l, $c, txt($b['titulo'] ?? '', 160), txt($b['contexto'] ?? '', 4000), txt($b['resumo'] ?? '', 4000),
                       txt($b['aplicacao'] ?? '', 4000), txt($b['perguntas'] ?? '', 4000)]);
        out(['ok' => true]);
    }

    case 'importar_biblia': {
        exigeAdmin();
        $linhas = body()['linhas'] ?? [];
        if (!is_array($linhas) || !$linhas) out(['erro' => 'Nenhuma linha recebida.'], 422);
        if (count($linhas) > 6000) out(['erro' => 'Lote grande demais.'], 422);

        $mapa = [];
        foreach (db()->query('SELECT id,nome,abrev FROM livros')->fetchAll() as $r) {
            $mapa[normaliza($r['nome'])] = (int)$r['id'];
            $mapa[normaliza($r['abrev'])] = (int)$r['id'];
            $mapa[(string)$r['id']] = (int)$r['id'];
        }
        $mapa[normaliza('Cantares de Salomão')] = 22; $mapa[normaliza('Cântico dos Cânticos')] = 22;
        $mapa[normaliza('Atos dos Apóstolos')] = 44; $mapa[normaliza('Salmo')] = 19;

        $pdo = db();
        $pdo->beginTransaction();
        $ins = $pdo->prepare('INSERT INTO versiculos (livro_id,capitulo,versiculo,texto) VALUES (?,?,?,?)
                              ON DUPLICATE KEY UPDATE texto = VALUES(texto)');
        $ok = 0; $ignoradas = 0; $desconhecidos = [];
        foreach ($linhas as $ln) {
            if (!is_array($ln) || count($ln) < 4) { $ignoradas++; continue; }
            $chave = normaliza((string)$ln[0]);
            $lid = $mapa[$chave] ?? null;
            $cap = (int)$ln[1]; $ver = (int)$ln[2]; $texto = trim((string)$ln[3]);
            if (!$lid) { $desconhecidos[(string)$ln[0]] = true; $ignoradas++; continue; }
            if ($cap < 1 || $ver < 1 || $texto === '') { $ignoradas++; continue; }
            $ins->execute([$lid, $cap, $ver, $texto]);
            $ok++;
        }
        $pdo->commit();
        out(['importados' => $ok, 'ignorados' => $ignoradas, 'livros_desconhecidos' => array_slice(array_keys($desconhecidos), 0, 10)]);
    }

    case 'usuarios_listar': {
        exigeAdmin();
        out(['usuarios' => db()->query('SELECT id,nome,usuario,perfil,criado_em FROM usuarios ORDER BY nome')->fetchAll()]);
    }

    case 'usuario_salvar': {
        exigeAdmin();
        $b = body();
        $id = (int)($b['id'] ?? 0);
        $nome = txt($b['nome'] ?? '', 120);
        $usr = txt($b['usuario'] ?? '', 60);
        $perfil = ($b['perfil'] ?? '') === 'admin' ? 'admin' : 'leitor';
        $senha = (string)($b['senha'] ?? '');
        if ($nome === '' || !preg_match('/^[A-Za-z0-9._@-]{3,60}$/', $usr)) {
            out(['erro' => 'Informe o nome e um usuário (3 a 60 letras/números, sem espaços).'], 422);
        }
        if ($id === 0 && mb_strlen($senha) < 6) out(['erro' => 'A senha precisa ter pelo menos 6 caracteres.'], 422);
        if ($senha !== '' && mb_strlen($senha) < 6) out(['erro' => 'A senha precisa ter pelo menos 6 caracteres.'], 422);
        try {
            if ($id > 0) {
                if ($senha !== '') {
                    db()->prepare('UPDATE usuarios SET nome=?, usuario=?, perfil=?, senha_hash=? WHERE id=?')
                        ->execute([$nome, $usr, $perfil, password_hash($senha, PASSWORD_DEFAULT), $id]);
                } else {
                    db()->prepare('UPDATE usuarios SET nome=?, usuario=?, perfil=? WHERE id=?')->execute([$nome, $usr, $perfil, $id]);
                }
            } else {
                db()->prepare('INSERT INTO usuarios (nome,usuario,senha_hash,perfil) VALUES (?,?,?,?)')
                    ->execute([$nome, $usr, password_hash($senha, PASSWORD_DEFAULT), $perfil]);
            }
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') out(['erro' => 'Esse nome de usuário já existe.'], 422);
            throw $e;
        }
        out(['ok' => true]);
    }

    case 'usuario_excluir': {
        $u = exigeAdmin();
        $id = (int)(body()['id'] ?? 0);
        if ($id === $u['id']) out(['erro' => 'Você não pode excluir o seu próprio usuário.'], 422);
        db()->prepare('DELETE FROM usuarios WHERE id = ?')->execute([$id]);
        out(['ok' => true]);
    }

    default:
        out(['erro' => 'Ação não encontrada.'], 404);
    }
} catch (Throwable $e) {
    out(['erro' => 'Ocorreu um erro no servidor.' . (DEBUG ? ' ' . $e->getMessage() : '')], 500);
}
