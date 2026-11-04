-- =====================================================================
--  O CAMINHO - Sistema de Estudo da Bíblia Sagrada
--  Criado e desenvolvido por Cleilton Nascimento
--  © Todos os direitos reservados a Cleilton Nascimento
--
--  Como usar: no phpMyAdmin, clique em "Importar" e escolha este arquivo.
--  (O banco "ocaminho" é criado automaticamente.)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `ocaminho` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ocaminho`;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- USUÁRIOS (login do sistema)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(120) NOT NULL,
  `usuario` VARCHAR(60) NOT NULL,
  `senha_hash` VARCHAR(255) NOT NULL,
  `perfil` ENUM('admin','leitor') NOT NULL DEFAULT 'leitor',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuário inicial:  admin  /  senha: caminho123   (TROQUE A SENHA NO PRIMEIRO ACESSO!)
INSERT INTO `usuarios` (`nome`,`usuario`,`senha_hash`,`perfil`) VALUES
('Administrador','admin','$2y$10$QtnMQONq6Vxs946/Nq5K7eDaHZyfq5SNcCF1LzpqrNvn7pc6lEQe6','admin')
ON DUPLICATE KEY UPDATE `usuario`=`usuario`;

-- ---------------------------------------------------------------------
-- LIVROS DA BÍBLIA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `livros` (
  `id` TINYINT UNSIGNED NOT NULL,
  `nome` VARCHAR(40) NOT NULL,
  `abrev` VARCHAR(8) NOT NULL,
  `testamento` ENUM('AT','NT') NOT NULL,
  `capitulos` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `livros` (`id`,`nome`,`abrev`,`testamento`,`capitulos`) VALUES
(1,'Gênesis','Gn','AT',50),(2,'Êxodo','Êx','AT',40),(3,'Levítico','Lv','AT',27),
(4,'Números','Nm','AT',36),(5,'Deuteronômio','Dt','AT',34),(6,'Josué','Js','AT',24),
(7,'Juízes','Jz','AT',21),(8,'Rute','Rt','AT',4),(9,'1 Samuel','1Sm','AT',31),
(10,'2 Samuel','2Sm','AT',24),(11,'1 Reis','1Rs','AT',22),(12,'2 Reis','2Rs','AT',25),
(13,'1 Crônicas','1Cr','AT',29),(14,'2 Crônicas','2Cr','AT',36),(15,'Esdras','Ed','AT',10),
(16,'Neemias','Ne','AT',13),(17,'Ester','Et','AT',10),(18,'Jó','Jó','AT',42),
(19,'Salmos','Sl','AT',150),(20,'Provérbios','Pv','AT',31),(21,'Eclesiastes','Ec','AT',12),
(22,'Cantares','Ct','AT',8),(23,'Isaías','Is','AT',66),(24,'Jeremias','Jr','AT',52),
(25,'Lamentações','Lm','AT',5),(26,'Ezequiel','Ez','AT',48),(27,'Daniel','Dn','AT',12),
(28,'Oseias','Os','AT',14),(29,'Joel','Jl','AT',3),(30,'Amós','Am','AT',9),
(31,'Obadias','Ob','AT',1),(32,'Jonas','Jn','AT',4),(33,'Miqueias','Mq','AT',7),
(34,'Naum','Na','AT',3),(35,'Habacuque','Hc','AT',3),(36,'Sofonias','Sf','AT',3),
(37,'Ageu','Ag','AT',2),(38,'Zacarias','Zc','AT',14),(39,'Malaquias','Ml','AT',4),
(40,'Mateus','Mt','NT',28),(41,'Marcos','Mc','NT',16),(42,'Lucas','Lc','NT',24),
(43,'João','Jo','NT',21),(44,'Atos','At','NT',28),(45,'Romanos','Rm','NT',16),
(46,'1 Coríntios','1Co','NT',16),(47,'2 Coríntios','2Co','NT',13),(48,'Gálatas','Gl','NT',6),
(49,'Efésios','Ef','NT',6),(50,'Filipenses','Fp','NT',4),(51,'Colossenses','Cl','NT',4),
(52,'1 Tessalonicenses','1Ts','NT',5),(53,'2 Tessalonicenses','2Ts','NT',3),(54,'1 Timóteo','1Tm','NT',6),
(55,'2 Timóteo','2Tm','NT',4),(56,'Tito','Tt','NT',3),(57,'Filemom','Fm','NT',1),
(58,'Hebreus','Hb','NT',13),(59,'Tiago','Tg','NT',5),(60,'1 Pedro','1Pe','NT',5),
(61,'2 Pedro','2Pe','NT',3),(62,'1 João','1Jo','NT',5),(63,'2 João','2Jo','NT',1),
(64,'3 João','3Jo','NT',1),(65,'Judas','Jd','NT',1),(66,'Apocalipse','Ap','NT',22)
ON DUPLICATE KEY UPDATE `nome`=VALUES(`nome`);

-- ---------------------------------------------------------------------
-- VERSÍCULOS (texto bíblico)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `versiculos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `livro_id` TINYINT UNSIGNED NOT NULL,
  `capitulo` SMALLINT UNSIGNED NOT NULL,
  `versiculo` SMALLINT UNSIGNED NOT NULL,
  `texto` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ref` (`livro_id`,`capitulo`,`versiculo`),
  FULLTEXT KEY `ft_texto` (`texto`),
  CONSTRAINT `fk_vers_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Textos de exemplo (Almeida Revista e Corrigida). A Bíblia completa é carregada
-- pela tela "Administração > Importar Bíblia" (veja o manual).
INSERT INTO `versiculos` (`livro_id`,`capitulo`,`versiculo`,`texto`) VALUES
(1,1,1,'No princípio criou Deus os céus e a terra.'),
(1,1,2,'E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.'),
(1,1,3,'E disse Deus: Haja luz; e houve luz.'),
(1,1,4,'E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.'),
(1,1,5,'E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã, o dia primeiro.'),
(19,1,1,'Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores.'),
(19,1,2,'Antes tem o seu prazer na lei do SENHOR, e na sua lei medita de dia e de noite.'),
(19,1,3,'Pois será como a árvore plantada junto a ribeiros de águas, que dá o seu fruto na estação própria, e cuja folha não cai, e tudo quanto fizer prosperará.'),
(19,1,4,'Não são assim os ímpios, mas são como a moinha que o vento espalha.'),
(19,1,5,'Pelo que os ímpios não prevalecerão no juízo, nem os pecadores na congregação dos justos.'),
(19,1,6,'Pois o SENHOR conhece o caminho dos justos, mas o caminho dos ímpios perecerá.'),
(19,23,1,'O SENHOR é o meu pastor, nada me faltará.'),
(19,23,2,'Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.'),
(19,23,3,'Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.'),
(19,23,4,'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.'),
(19,23,5,'Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.'),
(19,23,6,'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do SENHOR por longos dias.'),
(43,1,1,'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.'),
(43,1,2,'Ele estava no princípio com Deus.'),
(43,1,3,'Todas as coisas foram feitas por ele, e sem ele nada do que foi feito se fez.'),
(43,1,4,'Nele estava a vida, e a vida era a luz dos homens.'),
(43,1,5,'E a luz resplandece nas trevas, e as trevas não a compreenderam.')
ON DUPLICATE KEY UPDATE `texto`=VALUES(`texto`);

-- ---------------------------------------------------------------------
-- ESTUDOS (contexto, resumo e aplicação de cada capítulo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `estudos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `livro_id` TINYINT UNSIGNED NOT NULL,
  `capitulo` SMALLINT UNSIGNED NOT NULL,
  `titulo` VARCHAR(160) NOT NULL DEFAULT '',
  `contexto` TEXT NULL,
  `resumo` TEXT NULL,
  `aplicacao` TEXT NULL,
  `perguntas` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_estudo` (`livro_id`,`capitulo`),
  CONSTRAINT `fk_est_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `estudos` (`livro_id`,`capitulo`,`titulo`,`contexto`,`resumo`,`aplicacao`,`perguntas`) VALUES
(19,23,'O Senhor é o meu Pastor',
 'Salmo atribuído a Davi, que foi pastor de ovelhas antes de ser rei. Ele usa a imagem do pastor para falar do cuidado de Deus.',
 'O salmista descreve Deus como pastor que provê, guia, protege e acolhe. A segunda parte do salmo muda a imagem para a de um anfitrião que prepara a mesa.',
 'Em tempos de escassez ou medo, lembrar que Deus cuida de cada passo. Confiar não significa ausência de vales, mas presença de Deus neles.',
 '1) Que necessidades suas você tem tentado resolver sozinho? 2) Em que "vale" você precisa lembrar que Deus está com você? 3) Como você pode cuidar de alguém como o pastor cuida das ovelhas?'),
(19,1,'Os dois caminhos',
 'O Salmo 1 abre o livro de Salmos e apresenta a escolha entre dois modos de viver.',
 'O justo medita na lei do Senhor e é comparado a uma árvore plantada junto a ribeiros; o ímpio é como a moinha levada pelo vento.',
 'Escolher diariamente o que nos alimenta: com o que você tem enchido sua mente e seu coração?',
 '1) Quais "conselhos" você tem ouvido mais? 2) Que hábito de meditação na Palavra você pode começar esta semana?')
ON DUPLICATE KEY UPDATE `titulo`=VALUES(`titulo`);

-- ---------------------------------------------------------------------
-- MÍDIAS (PDF e áudio MP3 por capítulo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `midias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `livro_id` TINYINT UNSIGNED NOT NULL,
  `capitulo` SMALLINT UNSIGNED NOT NULL,
  `tipo` ENUM('pdf','audio') NOT NULL,
  `arquivo` VARCHAR(190) NOT NULL,
  `nome_original` VARCHAR(190) NOT NULL DEFAULT '',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_midia` (`livro_id`,`capitulo`,`tipo`),
  CONSTRAINT `fk_mid_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- MINUTO DE SABEDORIA (uma passagem por dia)
--   data_exibicao NULL  -> entra no rodízio automático diário
--   data_exibicao fixa  -> aparece somente naquele dia
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `minuto_sabedoria` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `data_exibicao` DATE NULL,
  `referencia` VARCHAR(80) NOT NULL,
  `texto` TEXT NOT NULL,
  `reflexao` TEXT NULL,
  `ordem` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_data` (`data_exibicao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `minuto_sabedoria` (`referencia`,`texto`,`reflexao`,`ordem`) VALUES
('Provérbios 3:5-6','Confia no SENHOR de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.','Hoje, entregue a Deus aquela decisão que você tenta controlar sozinho.',1),
('Filipenses 4:13','Posso todas as coisas em Cristo que me fortalece.','A força que você precisa hoje não vem de você; ela é recebida.',2),
('Salmos 46:1','Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.','Quando o dia apertar, corra para Deus antes de correr para qualquer outra coisa.',3),
('Isaías 41:10','Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.','O medo perde força quando lembramos quem caminha ao nosso lado.',4),
('Mateus 11:28','Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.','Descansar em Deus não é fraqueza, é sabedoria. Que peso você pode entregar hoje?',5),
('Josué 1:9','Não to mandei eu? Esforça-te, e tem bom ânimo; não pasmes, nem te espantes, porque o SENHOR teu Deus é contigo, por onde quer que andares.','Coragem é seguir em frente sabendo que você não está só.',6),
('Romanos 8:28','E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.','Mesmo o que você não entende hoje pode estar sendo usado para o seu bem.',7),
('Salmos 119:105','Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.','A Palavra ilumina o próximo passo; você não precisa ver a estrada inteira.',8),
('Jeremias 29:11','Porque eu bem sei os pensamentos que penso de vós, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais.','Deus tem planos de paz para a sua vida. Confie no tempo dele.',9),
('João 14:6','Disse-lhe Jesus: Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim.','Jesus não apenas mostra o caminho: ele é o caminho. Caminhe com ele hoje.',10),
('Salmos 121:1-2','Elevo os meus olhos para os montes, de onde vem o meu socorro. O meu socorro vem do SENHOR, que fez os céus e a terra.','Levante os olhos: o seu socorro não está nas circunstâncias, está em Deus.',11),
('Mateus 6:33','Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.','Prioridades em ordem trazem paz. O que você tem colocado em primeiro lugar?',12),
('Provérbios 16:3','Confia ao SENHOR as tuas obras, e teus pensamentos serão estabelecidos.','Comece o trabalho de hoje com uma oração; o resultado fica nas mãos de Deus.',13),
('1 Pedro 5:7','Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.','Ansiedade é um peso que podemos lançar. Faça isso em oração agora.',14),
('Gálatas 5:22-23','Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança; contra estas coisas não há lei.','Qual desses frutos você precisa cultivar com mais atenção hoje?',15),
('Salmos 37:5','Entrega o teu caminho ao SENHOR; confia nele, e ele o fará.','Entregar é soltar o controle. Confiar é esperar com paz.',16),
('Efésios 2:8','Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.','Você não precisa merecer o amor de Deus: ele já foi dado.',17),
('Tiago 1:5','E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente, e o não lança em rosto, e ser-lhe-á dada.','Sem saber o que fazer? Peça sabedoria; Deus não se cansa de dar.',18),
('Provérbios 4:23','Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as saídas da vida.','O que você deixa entrar no coração hoje define o que sai dele amanhã.',19),
('Salmos 34:8','Provai, e vede que o SENHOR é bom; bem-aventurado o homem que nele confia.','Experimente a bondade de Deus hoje, em pequenos detalhes do seu dia.',20),
('2 Timóteo 1:7','Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.','O medo não vem de Deus. Responda a ele com amor e equilíbrio.',21),
('Lamentações 3:22-23','As misericórdias do SENHOR são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; novas são cada manhã; grande é a tua fidelidade.','Cada manhã é um recomeço sustentado pela fidelidade de Deus.',22),
('Mateus 5:16','Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai, que está nos céus.','Pequenos gestos de bondade hoje podem levar alguém a enxergar Deus.',23),
('Romanos 12:2','E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.','Transformação começa na mente. Que pensamento precisa ser renovado hoje?',24),
('Hebreus 11:1','Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.','Fé é caminhar com firmeza mesmo antes de ver o resultado.',25),
('Salmos 27:1','O SENHOR é a minha luz e a minha salvação; a quem temerei? O SENHOR é a força da minha vida; de quem me recearei?','Com Deus como luz e força, o medo perde o direito de decidir por você.',26),
('Colossenses 3:23','E tudo quanto fizerdes, fazei-o de coração, como ao Senhor, e não aos homens.','Faça até as tarefas simples de hoje como quem serve a Deus.',27),
('João 8:12','Falou-lhes, pois, Jesus outra vez, dizendo: Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida.','Seguir Jesus é caminhar com luz, mesmo em dias escuros.',28),
('Provérbios 15:1','A resposta branda desvia o furor, mas a palavra dura suscita a ira.','Antes de responder hoje, respire. Uma palavra suave pode desfazer uma briga.',29),
('1 Coríntios 13:13','Agora, pois, permanecem a fé, a esperança e o amor, estes três, mas o maior destes é o amor.','No fim, o que fica é o amor. Que ele guie suas ações hoje.',30),
('Salmos 90:12','Ensina-nos a contar os nossos dias, de tal maneira que alcancemos corações sábios.','O tempo é um presente. Como você quer usar o seu dia de hoje?',31);

-- ---------------------------------------------------------------------
-- CONTATOS E LISTAS DE TRANSMISSÃO (WhatsApp)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contatos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `nome` VARCHAR(120) NOT NULL,
  `telefone` VARCHAR(20) NOT NULL,
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cont_user` (`usuario_id`),
  CONSTRAINT `fk_cont_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `listas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `nome` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lista_user` (`usuario_id`),
  CONSTRAINT `fk_lista_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lista_contatos` (
  `lista_id` INT UNSIGNED NOT NULL,
  `contato_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`lista_id`,`contato_id`),
  CONSTRAINT `fk_lc_lista` FOREIGN KEY (`lista_id`) REFERENCES `listas`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lc_contato` FOREIGN KEY (`contato_id`) REFERENCES `contatos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `envios_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `tipo` VARCHAR(30) NOT NULL,
  `destino` VARCHAR(160) NOT NULL DEFAULT '',
  `resumo` VARCHAR(190) NOT NULL DEFAULT '',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_user` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- ESTUDO PESSOAL: favoritos, anotações e progresso de leitura
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favoritos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `livro_id` TINYINT UNSIGNED NOT NULL,
  `capitulo` SMALLINT UNSIGNED NOT NULL,
  `versiculo` SMALLINT UNSIGNED NOT NULL,
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fav` (`usuario_id`,`livro_id`,`capitulo`,`versiculo`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `anotacoes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `livro_id` TINYINT UNSIGNED NOT NULL,
  `capitulo` SMALLINT UNSIGNED NOT NULL,
  `versiculo` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `texto` TEXT NOT NULL,
  `atualizado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_anot` (`usuario_id`,`livro_id`,`capitulo`),
  CONSTRAINT `fk_anot_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `leituras` (
  `usuario_id` INT UNSIGNED NOT NULL,
  `livro_id` TINYINT UNSIGNED NOT NULL,
  `capitulo` SMALLINT UNSIGNED NOT NULL,
  `lido_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`,`livro_id`,`capitulo`),
  CONSTRAINT `fk_leit_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
