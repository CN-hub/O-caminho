<?php
/*
 * O CAMINHO - Configuração do banco de dados
 * Criado e desenvolvido por Cleilton Nascimento - Todos os direitos reservados.
 *
 * No XAMPP / WAMP o padrão já funciona: usuário "root" e senha vazia.
 * Em hospedagem (cPanel), troque pelos dados que a hospedagem informar.
 */
declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_NAME = 'ocaminho';
const DB_USER = 'root';
const DB_PASS = '';

// Tamanho máximo de upload (em MB) aceito pelo sistema para PDF e MP3.
// Também é preciso ajustar o php.ini (veja o manual).
const UPLOAD_MAX_MB = 100;

// Exibir erros técnicos na tela? Deixe false em produção.
const DEBUG = false;
