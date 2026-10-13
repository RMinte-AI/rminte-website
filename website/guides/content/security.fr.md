# TianShanOS

Ce guide décrit les fonctionnalités et l'interface de TianShanOS 0.6.1. Cela peut rester utile pour les versions ultérieures où ces fonctionnalités restent inchangées. Un numéro de version différent ne rend pas automatiquement le guide obsolète. Si l'interface, les étapes ou les messages de résultat diffèrent, consultez les notes de version de votre version installée avant de continuer.

Utilisez ce guide pour modifier les mots de passe des appareils, configurer l'accès à SSH, vérifier les identités des serveurs et gérer les certificats. Pour une première configuration, commencez par les chapitres 1, 2 et 3. Les procédures de certificat et Config Pack sont destinées aux administrateurs responsables de ces fonctionnalités.

> Utilisez un réseau de gestion fiable. L'interface Web complète utilise actuellement HTTP, et la plupart des opérations d'API manquent de connexion centralisée et d'application des autorisations. Gardez l'appareil sur un réseau de gestion contrôlé. L'installation d'un certificat HTTPS ne fait pas basculer l'interface Web complète vers HTTPS.

## 1. Avant de commencer

### 1.1 Trouvez la tâche dont vous avez besoin Tâche

| Tâche | Où aller |
|---|---|
| Modifier le mot de passe root ou admin de l'appareil Sécurité du compte | ; Chapitre 2 |
| Se connecter à un serveur à l'aide d'une clé SSH | Gestion des clés et hôtes avec clé déployée ; chapitre 3 |
| Copier les clés ou vérifier l'identité d'un serveur Gestion des clés | Gestion des clés et empreintes des hôtes connus ; chapitre 4 |
| Configurer les certificats et l'authentification mutuelle Certificat | HTTPS ; Chapitre 5 Packages de configuration cryptés |
| Exchange | Config Pack; Chapitre 6. L'application de configuration générale est encore inachevée |

### 1.2 Comptes et identité de l'appareil

- **admin** peut ouvrir la sécurité et voir les clés, les hôtes, les certificats et les contrôles Config Pack, mais pas la sécurité du compte.
- **root** peut également définir les mots de passe root et admin ou réinitialiser admin à son mot de passe par défaut. Ces opérations de gestion des mots de passe vérifient l'autorisation root.
- Un appareil **Developer** est identifié par l'unité organisationnelle (UO) dans son certificat d'appareil. Il s'agit d'une identité d'appareil. Seuls ces appareils peuvent actuellement exporter des packs de configuration et des configurations d'hôte SSH ; la connexion en tant que root ne le change pas.

Un bouton visible n'établit pas que son API applique les autorisations d'accès. Outre les opérations telles que la gestion des mots de passe qui vérifient elles-mêmes l'autorisation, l'accès doit actuellement être limité via un réseau de gestion de confiance.

### 1.3 Préparer l'opération

1. Vérifiez que l'adresse IP du navigateur appartient à l'appareil prévu et que votre ordinateur se trouve sur un réseau de gestion de confiance.
2. Confirmez l'adresse, le port et le nom d'utilisateur SSH auprès de l'administrateur du serveur.
3. Le déploiement ou la révocation d'une clé publique via la page nécessite le mot de passe du compte distant et l'authentification par mot de passe. L'administrateur du serveur décide s'il doit laisser l'authentification par mot de passe activée par la suite.
4. Avant de révoquer l'accès, de supprimer des clés ou de remplacer des certificats, assurez-vous qu'une autre connexion de gestion fonctionne : une console serveur, une autre clé d'administrateur ou l'interface HTTP de l'appareil.

## 2. Changer les mots de passe des appareils

Ces commandes modifient les mots de passe de connexion TianShanOS. Ils ne modifient pas le mot de passe SSH sur un serveur distant.

### 2.1 L'invite après la première connexion

Si un compte est toujours marqué comme ayant un mot de passe inchangé, une invite de changement de mot de passe apparaît après la connexion. Définissez un mot de passe long et unique. Choisir de le modifier ultérieurement rejette l'invite sans modifier le mot de passe.

L'invite n'est pas un écran de paramètres de compte que vous pouvez rouvrir à tout moment. Si admin a déjà modifié son mot de passe et nécessite une autre modification, root peut le définir depuis la sécurité.

### 2.2 Définir un mot de passe comme root

1. Connectez-vous en tant que root et ouvrez Sécurité dans la barre de navigation.
2. Recherchez les contrôles de mot de passe root ou admin sous Sécurité du compte. Remplissez le nouveau mot de passe et sa confirmation.
3. Sélectionnez Définir le mot de passe root ou Définir le mot de passe admin. L'interface accepte les caractères 4-64 ; quatre caractères est un minimum technique. Utilisez un mot de passe long et unique.

**Vérifiez le résultat :** connectez-vous avec le nouveau mot de passe dans une fenêtre de navigation privée avant de vous déconnecter de la session d'origine. La définition d'un nouveau mot de passe ne met pas automatiquement fin aux sessions existantes.

**Si la connexion échoue :** vérifiez d'abord le compte et l'adresse de l'appareil. Cinq tentatives consécutives infructueuses déclenchent un verrouillage d'environ cinq minutes. Évitez les suppositions répétées.

### 2.3 Réinitialiser le mot de passe admin

Root peut sélectionner Réinitialiser admin par défaut pour restaurer le mot de passe sur `rm01` et effacer le verrouillage de connexion. Connectez-vous en tant que admin dans une nouvelle session et définissez un mot de passe unique immédiatement après.

> Utilisez le mot de passe par défaut uniquement pour récupérer l'accès temporairement. Modifiez-le rapidement et déconnectez-vous de toutes les sessions dont vous n'avez plus besoin.

## 3. Connectez-vous à un serveur avec une clé SSH

Pour la configuration initiale, créez une clé RSA, déployez sa clé publique, examinez le résultat et testez la connexion. Vérifiez l'empreinte du serveur dans le cadre de ce processus. Lorsque vous retirez une clé, révoquez d'abord l'accès à chaque serveur, confirmez que l'ancienne clé ne fonctionne plus, puis supprimez-la seulement de l'appareil.

### 3.1 Créer une clé

1. Dans Gestion des clés, sélectionnez Générer une nouvelle clé.
2. Choisissez un ID de clé inutilisé, tel que `backup01`. Utilisez une courte combinaison de lettres et de chiffres anglais, pas plus de caractères 10, sans virgules. La limite réelle est de 10 UTF-8 octets ; les caractères non-ASCII peuvent utiliser plus d'un octet chacun.
3. Choisissez RSA 2048 ou RSA 4096. RSA 2048 est la valeur par défaut. Les options ECDSA sont affichées, mais le flux de travail SSH actuel ne les prend pas en charge ; choisissez RSA pour SSH.
4. Ajoutez un commentaire ou un alias si utile. Activez Exportable uniquement si vous devez sauvegarder ou migrer la clé privée. Il n'existe aucun contrôle de page permettant de modifier cette option ultérieurement.
5. Définissez Masqué si nécessaire, puis sélectionnez Générer. Cette option affecte l'affichage de la liste ; il ne garde pas secret l’ID de clé réel.

**Vérifiez le résultat :** une fois terminé, la fenêtre se ferme et la liste s'actualise. Recherchez l'ID et le type RSA souhaités, puis ouvrez la clé publique. Vérifiez que le texte complet commence par `ssh-rsa`.

**Pendant l’attente :** ne renvoyez pas la demande. Fermer la fenêtre n’annule pas la génération sur l’appareil.

| Message ou situation | Que faire |
|---|---|
| L'ID est déjà utilisé | Choisissez un autre ID. Le workflow de création de nouvelles clés rejette désormais les identifiants existants plutôt que d'écraser leurs clés. |
| La limite du nombre de clés a été atteinte | Vous pouvez enregistrer jusqu’à huit clés SSH. Avant de retirer une clé inutilisée, suivez la procédure de révocation de son accès. |
| Le stockage ou la mémoire est insuffisant | Résolvez le problème de ressources du périphérique avant de réessayer. Ne traitez pas l’échec comme une création réussie |
| La clé a été générée, mais la liste n'a pas pu être actualisée | Actualisez manuellement et vérifiez la clé ; ne le génère plus La génération |
| La génération n’est pas confirmée | L'appareil fonctionne peut-être encore. Attendez et vérifiez le dossier ; ne soumettez pas à nouveau le même identifiant Le nettoyage de |
| Le nettoyage n’est pas terminé | Vérifiez le stockage de l'appareil, impliquez un administrateur si nécessaire et suspendez la création de clés. |

La recherche d'un enregistrement avec le même ID prouve uniquement qu'un enregistrement existe. Si le résultat n'est pas confirmé, vérifiez qu'il s'agit bien de la clé prévue avant de considérer l'opération comme terminée.

### 3.2 Déployer la clé publique Le déploiement

Le déploiement ajoute la clé publique au fichier `~/.ssh/authorized_keys` du compte distant. Ce compte peut ensuite accepter la clé privée correspondante. Le mot de passe du serveur ne change pas.

1. Sélectionnez Déployer sur la ligne de la clé souhaitée.
2. Saisissez l'adresse du serveur, le nom d'utilisateur, le port SSH et le mot de passe de connexion SSH.
3. Vérifiez l'adresse et le compte, puis sélectionnez Démarrer le déploiement.
4. Lisez le résultat et vérifiez l'enregistrement correspondant sous Hôtes déployés.

> La nouvelle version vérifie l’empreinte de l’hôte avant l’authentification par mot de passe et refuse une empreinte modifiée pour un hôte connu. Toutefois, lors du premier déploiement d’une clé publique, elle enregistre et accepte l’empreinte d’un hôte inconnu sans vous demander de la vérifier. Effectuez ce premier déploiement sur un réseau contrôlé et comparez l’empreinte complète par un canal fiable.

### 3.3 Comprendre le résultat du déploiement

| Ce que vous dit le résultat | Que faire ensuite |
|---|---|
| La clé a été déployée, l'hôte enregistré et la connexion par clé publique vérifiée | Vérifiez les détails de l'hôte, puis testez la tâche réelle que vous devez exécuter |
| La clé a été déployée et l'hôte enregistré, mais la connexion n'est pas confirmée | Sélectionnez Test. En cas d'échec, vérifiez l'autorisation à distance et les paramètres du compte via une autre connexion de gestion. |
| La clé a été déployée, mais l'enregistrement a échoué ou n'est pas confirmé | Vérifiez la liste locale et l'autorisation à distance avant de procéder à un nouveau déploiement |
| Déploiement terminé, mais la liste n'a pas pu être actualisée | Actualiser manuellement. Un échec d'actualisation de la liste ne signifie pas que la clé distante n'a pas été installée |

**Ne déployez pas à plusieurs reprises car le résultat est incomplet.** Chaque déploiement ajoute la clé et peut créer des entrées en double. Utilisez une autre connexion de gestion pour inspecter `authorized_keys` lorsque vous devez confirmer le résultat à distance.

### 3.4 Tester la connexion

1. Sous Hôtes déployés, vérifiez l'adresse, le port, le nom d'utilisateur et l'ID de clé, puis sélectionnez Test.
2. Si une confirmation d'empreinte de l'hôte apparaît, obtenez et comparez une empreinte fiable comme décrit dans la section 4.3 avant de choisir Confiance et connexion.
3. Après la connexion, l'appareil tente la commande d'écho fixe `echo "TianshanOS SSH Test OK"`.

**Ce que signifie le succès :** la page de test vérifie toujours si la requête a réussi, et non l'état de sortie ou la sortie de la commande à distance. Utilisez-le comme vérification de connexion de base. Pour une tâche importante, vérifiez la sortie réelle, l’état de sortie et les autorisations. Ce test ne permet pas non plus d'établir que sudo ou d'autres commandes d'application fonctionneront.

**En cas d'échec :** vérifiez la connectivité, le service SSH, le compte et l'autorisation de clé publique à distance. Arrêtez de réessayer si l'empreinte change ou si l'identité du serveur est incertaine.

### 3.5 Révoquer l'accès avant de supprimer la clé locale

1. Confirmez qu'une autre connexion de gestion du serveur fonctionne et que la clé d'origine reste sur l'appareil.
2. Sélectionnez Révoquer sur la ligne de l'hôte, entrez le mot de passe du serveur et confirmez Révoquer et supprimer. Vous pouvez également partir de la ligne clé et saisir les détails de la cible.
3. Lisez le résultat, puis utilisez une connexion fiable pour vérifier que la clé publique et tous les doublons ont disparu de `authorized_keys`. Confirmez que l'ancienne clé ne fonctionne plus.
4. La révocation laisse une sauvegarde `authorized_keys.bak`. Gérez-la selon la politique de sauvegarde du serveur pour éviter de rétablir une ancienne autorisation.
5. Vérifiez que l'enregistrement de l'hôte local a été supprimé. La page vérifie maintenant cette demande. Si la révocation à distance a réussi mais que la suppression locale a échoué, actualisez et gérez le nettoyage local séparément.
6. Ce n'est qu'après la gestion de chaque serveur cible que vous devez supprimer l'ancienne clé et les copies de clé privée inutiles.

**Si aucune clé publique correspondante n'est trouvée :** confirmez que le compte est correct et que la clé est absente sur le serveur avant de choisir de supprimer uniquement l'enregistrement local.

**Si l'hôte ne peut pas être supprimé :** il se peut qu'un service utilise ou protège l'enregistrement. Vérifiez l'état du service et les références sous Commandes SSH ou les paramètres d'automatisation pertinents. Terminez d'arrêter le service ou de résoudre ses références avant de réessayer. Demandez à un administrateur de vérifier un état incertain.

**Si la révocation signale un échec :** identifiez quelle étape a échoué. La clé distante a peut-être déjà disparu même si le nettoyage local a échoué. Utilisez l'autorisation du serveur et une vérification de connexion réelle pour établir le résultat à distance. Conservez la clé locale jusqu'à ce que le problème soit résolu.

## 4. Gérer les clés, les hôtes et les empreintes

### 4.1 Copier une clé publique ou exporter une clé privée

**Clé publique :** sélectionnez la clé publique et copiez la valeur complète sur une seule ligne pour l'administrateur du serveur. Il s'agit d'un matériel public ; l'envoyer à la mauvaise personne n'expose pas la clé privée. L'accès est accordé lorsqu'un administrateur l'ajoute à la liste d'autorisation d'un compte.

**Clé privée :** l'exportation est disponible uniquement si Exportable a été activé lors de la création. Sélectionnez Clé privée sur un ordinateur de confiance et un réseau de gestion isolé. Stockez-le dans un magasin secret approuvé, effacez le presse-papiers temporaire et téléchargez des copies. Ne le collez jamais dans le chat, les tickets ou les journaux.

**Si Copier ne fait rien :** les navigateurs peuvent restreindre l'accès au presse-papiers sur une page HTTP. Sélectionnez et copiez le texte manuellement, puis vérifiez ses limites et son exhaustivité. N'affaiblissez pas les paramètres de sécurité du navigateur pour permettre la copie.

### 4.2 Révoquer, supprimer et supprimer

| Action | Effet |
|---|---|
| Révoquer une clé publique | Tentatives de suppression de l'autorisation du serveur ; nécessite le mot de passe distant |
| Supprimer un hôte | Supprime un enregistrement de connexion locale sans révoquer l'accès au serveur |
| Supprimer une clé | Supprime les éléments de clé locale sans contacter le serveur ni révoquer l'accès |
| Supprimer une empreinte d'hôte | Supprime un enregistrement d'identité de serveur enregistré, pas son enregistrement de connexion ou son autorisation à distance Les hôtes déployés |

« Hôtes avec clé déployée » est une liste locale ; elle ne reflète pas en direct les autorisations du serveur. Une liste vide ne confirme pas la suppression de l’accès. La présence d’un hôte ne garantit pas non plus qu’il soit joignable.

### 4.3 Vérifier l'empreinte du serveur SSH

Une empreinte identifie le serveur auquel vous vous connectez. Cette page stocke un résumé SHA-256 sous forme de caractères hexadécimaux 64. Les outils OpenSSH affichent généralement `SHA256:base64`. Demandez à l'administrateur le même format avant de comparer ; les chaînes ne peuvent pas être comparées directement.

**Après le déploiement initial :** sélectionnez Afficher sous Empreintes digitales d'hôte connues et comparez la valeur complète avec celle obtenue à partir d'une console de serveur, d'un inventaire d'actifs ou d'un autre canal approuvé. Le tableau ne montre que les premiers caractères 32, ce qui n'est pas suffisant pour une vérification complète.

**Lorsque le test demande une confirmation :** la boîte de dialogue affiche l'empreinte complète actuelle. Vérifiez-le indépendamment avant de sélectionner Faire confiance et se connecter. S'il a changé, vérifiez également l'identité du serveur, l'adresse IP, le port et l'enregistrement de maintenance. N'approuvez pas simplement parce que la boîte de dialogue est apparue.

**Si l'empreinte diffère ou si sa source n'est pas claire :** annulez la connexion et enquêtez. Si vous avez déjà utilisé un mot de passe sur une connexion non fiable, considérez-le comme potentiellement exposé. Modifiez-le via une connexion approuvée, examinez les journaux de connexion et supprimez les autorisations indésirables. N'envoyez pas de mot de passe via la connexion suspecte pour révoquer l'accès.

**Après une reconstruction autorisée ou un changement de clé d'hôte :** vérifiez d'abord la nouvelle empreinte complète et l'enregistrement de maintenance. Une fois vérifié, acceptez-le dans la boîte de dialogue Confirmation du test. Vous pouvez également supprimer l’ancienne entrée, tester à nouveau et confirmer l’empreinte vérifiée. Le chemin de test nécessite désormais une confirmation explicite ; ne supposez pas que la reconnexion fera automatiquement confiance à la nouvelle clé.

**Protégez la carte SD :** les empreintes de l'hôte connu sont synchronisées avec le texte en clair JSON sur la carte. Au démarrage, les configurations d'empreintes SD disponibles remplacent les enregistrements locaux correspondants. Ces fichiers ne sont pas signés ; n'autorisez pas les modifications non fiables.

### 4.4 Importer et exporter les configurations d'hôte SSH

Ce flux de travail `.tscfg` dédié stocke l'adresse, le port, le nom d'utilisateur, le type d'authentification et l'ID de clé. Il ne contient ni mot de passe SSH ni clé privée et n'accorde pas d'accès à distance. Il est distinct de l'application générale inachevée du chapitre 6.

**Pour exporter :** sur un appareil Developer, sélectionnez Exporter sur la ligne hôte. Pour un autre appareil, fournissez et vérifiez son certificat, générez le package et sélectionnez Télécharger. Vérifiez que le fichier a été enregistré. Un appareil ordinaire peut afficher le contrôle, mais sa demande d'exportation est rejetée.

**Pour importer :**

1. Confirmez que le package a été conçu pour cet appareil, que la carte SD est inscriptible et que la source a été vérifiée via un canal de confiance.
2. Assurez-vous que cet appareil dispose de la clé référencée correcte. Un identifiant correspondant à lui seul ne suffit pas ; le matériel de clé doit correspondre à l'autorisation du serveur.
3. Sélectionnez Importer l'hôte, choisissez le fichier et examinez l'aperçu. Activez le remplacement uniquement lorsque vous avez l'intention de remplacer une configuration portant le même nom.
4. Confirmez et redémarrez lorsque vous y êtes invité. L'importation enregistre d'abord le package sur la carte SD ; le chargement et le décryptage sont tentés au redémarrage.
5. Autorisez le chargement au démarrage, actualisez la liste des hôtes, vérifiez l'adresse, le compte, le port et la clé, puis testez.

Une prévisualisation réussie ne confirme ni la confiance du signataire ni que ce paquet est destiné à cet appareil. L’empreinte du destinataire est vérifiée au chargement. Au démarrage, les configurations d’hôtes sont fusionnées et les autres enregistrements locaux sont conservés. Importer un paquet ne supprime pas toute la liste précédente.

Supprimez un enregistrement incorrect et vérifiez que sa configuration SD correspondante a été effacée. Un package restant peut se charger à nouveau après le redémarrage. Résolvez les références de service si l’enregistrement est en cours d’utilisation. Lisez également la section 5.6 avant de remplacer le certificat de l'appareil.

## 5. Configurer les certificats HTTPS et mTLS

Le service actuel sur le port 443 fournit des points de terminaison de test d'intégrité, d'identité et d'autorisation, et non l'interface Web complète. Le démarrage par défaut nécessite une clé de périphérique, un certificat de périphérique, une chaîne d'autorité de certification client et une horloge de périphérique valide.

### 5.1 Savoir quel certificat fait quoi

- Le **certificat d'appareil et la clé privée** permettent à l'appareil de prouver son identité aux clients.
- Un **certificat client et une clé privée**, détenus par un ordinateur ou un service, permettent au client de prouver son identité à l'appareil.
- L'**autorité de certification de vérification client sur l'appareil** valide les certificats clients. Cela n’oblige pas automatiquement un ordinateur ou un navigateur à faire confiance au certificat de l’appareil.

Cette authentification bidirectionnelle est appelée TLS mutuel, ou mTLS. Les clients doivent toujours faire confiance à l'autorité de certification émettrice du certificat de périphérique et vérifier son nom d'accès, ses utilisations autorisées et sa validité.

### 5.2 Lire l'état et régler l'heure de l'appareil

Enregistré, Pendant la période de validité et HTTPS : En cours d'exécution décrivent séparément le stockage, la validité temporelle et le fonctionnement du service. L'un n'établit pas les autres.

| Statut ou situation | Que faire |
|---|---|
| Le certificat de périphérique, la clé privée ou l'autorité de certification de vérification du client sont manquants | Installez les informations d'identification manquantes à l'aide des sections suivantes |
| En attente de l'heure de l'appareil | Vérifiez que l'horloge de votre ordinateur est correcte, puis sélectionnez Définir l'heure de l'appareil à partir de cet ordinateur (source du navigateur) |
| Pas encore valide ou expiré | Vérifiez l'horloge de l'appareil et les dates du certificat ; organiser le renouvellement s'il a expiré |
| Pendant la période de validité, mais HTTPS n'est pas en cours d'exécution | Lire l'erreur d'informations d'identification manquantes, de clé incompatible ou de démarrage affichée ; résolvez-le et actualisez |
| Le service en cours d'exécution utilise toujours les informations d'identification précédentes | Enregistrez d'autres travaux et redémarrez l'appareil. Confirmez que les nouvelles informations d'identification répondent aux exigences de démarrage et sont en cours d'utilisation |
| Le stockage ou l'état n'est pas confirmé | Actualiser et vérifier. Redémarrez si vous y êtes invité ; éviter les installations ou suppressions répétées |

Après avoir réglé l'heure, vérifiez l'heure affichée de l'appareil et l'état de synchronisation. Lorsque le service n'est pas en cours d'exécution, le système tente de démarrer une fois que les exigences d'identification et de temps sont remplies. S'il reste arrêté, recherchez la raison affichée plutôt que de considérer l'installation comme une preuve qu'elle est prête.

### 5.3 Générer une clé d'appareil et une demande de certificat

1. Sélectionnez Générer une paire de clés. Cela crée une clé privée ECDSA P-256 distincte, sans rapport avec les clés SSH. Il ne peut pas être exporté via cette interface.
2. Si une clé existe déjà, lisez d'abord la section 5.6. Continuer l'écrase.
3. Sélectionnez Générer CSR. Saisissez l'ID de l'appareil (CN), l'organisation et le service, ou laissez tous les champs vides. Le département correspond à l'unité organisationnelle (UO) du certificat.
4. Sélectionnez Générer une demande de signature de certificat et envoyez le texte CSR complet à votre administrateur d'autorité de certification.

**Utilisez un identifiant d'appareil court et stable.** Les lettres et chiffres anglais sont plus faciles à conserver dans la limite UTF-8 d'octets 63. Les caractères non-ASCII peuvent utiliser plusieurs octets. Raccourcissez les champs si l'interface signale une erreur de longueur.

**Vérifiez les noms avant l'émission :** le chemin du champ personnalisé ne génère pas de SAN. Avec tous les champs vides, CN est fixé à `TIANSHAN-DEVICE-001` ; l'adresse IP actuelle est ajoutée en tant que SAN IP uniquement si elle est disponible. Aucun SAN DNS n’est ajouté. Demandez à l'administrateur de l'autorité de certification d'utiliser un processus d'émission contrôlé pour inclure les noms IP ou DNS réels et les objectifs d'authentification requis dans le certificat final. Ce formulaire ne peut pas modifier les SAN.

Un CSR ne contient aucune clé privée et n'installe pas de certificat. Demandez à l'administrateur de l'autorité de certification d'inspecter sa clé publique, son sujet et son SAN avant son émission.

### 5.4 Installer le certificat de l'appareil

1. Obtenez un certificat PEM qui correspond à la clé privée actuelle de l'appareil.
2. Sélectionnez Installer le certificat, collez le texte complet, y compris ses limites, puis sélectionnez Installer.
3. Vérifiez le résultat enregistré, la validité du certificat et l'état actuel du HTTPS. Vérifiez le sujet, l'émetteur et les dates.

L’installation vérifie le format et la paire de clés. L’état indique aussi la validité dans le temps et les conditions de démarrage. Les clients doivent vérifier la chaîne de confiance, le nom utilisé pour la connexion et les usages autorisés.

Si la clé ne correspond pas, recherchez le certificat émis pour la CSR actuelle. Ne régénérez pas une clé privée pour effacer l’erreur. Si le résultat n'est pas confirmé, actualisez et vérifiez ce qui a été enregistré avant de décider de réessayer.

### 5.5 Installer la chaîne d'autorité de certification client et tester

1. Sélectionnez Installer l'autorité de certification, collez un ou plusieurs certificats d'autorité de certification PEM utilisés pour approuver vos clients, puis sélectionnez Installer.
2. Vérifiez l'état. Un service arrêté tentera de démarrer lorsque les informations d'identification et l'heure seront prêtes. Si un service en cours d'exécution signale des informations d'identification modifiées, redémarrez comme indiqué pour les appliquer.
3. Accédez aux points de terminaison de test appropriés à l'aide d'un certificat client approuvé avec l'objectif et le rôle corrects.
4. Répétez l'opération avec un certificat non fiable ou sans certificat, puis confirmez le rejet.

**Vérifiez le résultat :** HTTPS est en cours d'exécution et utilise le certificat prévu. Si le certificat actif SHA-256 s'affiche, comparez son empreinte. Les clients de confiance doivent accéder uniquement aux points de terminaison autorisés par leurs rôles ; les clients non fiables ne doivent pas se connecter. Vérifiez ces résultats sur l’appareil réel.

### 5.6 Renouveler les certificats ou supprimer toutes les informations d'identification

**Expiration du certificat** : réutilisez une clé non compromise pour demander un nouveau certificat, installez-le, suivez les instructions d'état pour l'appliquer et testez à nouveau. Les packs de configuration sont liés à l’empreinte du certificat du destinataire. Même avec la même clé, un ancien package peut être rejeté après réinitialisation ou redémarrage car le certificat a changé. Organisez à l’avance des colis de remplacement.

**Remplacement de clé privée :** l'ancienne CSR et le certificat ne correspondent plus à la nouvelle clé. Cela ne révoque pas l'ancien certificat auprès de l'autorité de certification. Gérez séparément une clé exposée avec l’administrateur de l’autorité de certification. Les packages qui dépendent d'une clé perdue peuvent être irrécupérables.

**Supprimer toutes les informations d'identification :** Supprimer les informations d'identification supprime ensemble la clé de périphérique, le certificat de périphérique et la chaîne d'autorité de certification client. Vérifiez que l'accès à la gestion HTTP fonctionne et organisez d'abord les packages de remplacement. Une sauvegarde de certificat public ne peut pas restaurer une clé privée.

Après la suppression, recherchez Aucun certificat de périphérique et les informations d'identification manquantes. Un service HTTPS en cours d'exécution peut toujours conserver les informations d'identification précédentes ; la suppression des données stockées ne constitue pas une révocation immédiate. Redémarrez comme indiqué et confirmez que les anciennes informations d'identification ne sont plus utilisées. Restaurez le service avec une nouvelle clé, un certificat de périphérique émis, une chaîne d'autorité de certification client et des tests de connexion.

## 6. Comprendre les limites du Config Pack

Un Config Pack est un package `.tscfg` crypté et signé. Les packages peuvent actuellement être créés et inspectés, mais l'application de configuration générale n'est pas terminée. Ne comptez pas sur lui pour la configuration du parc de production, la reprise après sinistre ou les vérifications d'acceptation des modifications des paramètres.

### 6.1 Ce que font les commandes

| Action | Résultat actuel Certificat de périphérique d'exportation |
|---|---|
| Exporter le certificat de l’appareil | Fournit le certificat public afin qu'un expéditeur puisse créer un package pour cet appareil ; n'exporte pas sa clé privée |
| Vérifier uniquement | Vérifie la structure et la signature chiffrée par rapport au certificat inclus ; n'établit pas la confiance du signataire ni l'identité du destinataire |
| Importer après avoir sélectionné ou collé un package Les paramètres frontend et backend | Les paramètres de la page et ceux de l’appareil ne correspondent pas encore. Cette procédure ne peut pas aboutir. |
| Importer depuis la liste des packages | Valide un fichier de périphérique existant sans le copier, le déchiffrer ou l'appliquer |
| Appliquer | Déchiffre et répertorie les noms de modules sans écrire leurs paramètres ; peut encore signaler un succès |
| Exporter Config Pack sur un appareil Developer | Crée un package téléchargeable et tente de l'enregistrer sur la carte SD |

### 6.2 Vérifier la source et le destinataire La vérification

La vérification utilise le certificat du signataire inclus dans le paquet, sans établir la confiance de sa chaîne de certificats. La signature couvre le texte chiffré ; ne considérez pas tous les champs affichés comme authentifiés. Une étiquette « Official » ne prouve pas que l’origine est fiable.

Utilisez un système d'actifs ou un canal de confiance indépendant pour confirmer l'empreinte du signataire, le certificat du périphérique cible et l'objectif du package. Le nom cible de l’aperçu ne remplace pas une vérification des empreintes du certificat. Recevoir un certificat et une empreinte dans le même message ne constitue pas une vérification indépendante.

### 6.3 Partager le certificat de l'appareil et inspecter un colis

**Pour fournir le certificat de cet appareil :** sélectionnez Exporter le certificat de l'appareil et copiez le PEM complet et l'empreinte affichée. Envoyez le certificat public à l'expéditeur et confirmez son empreinte via un autre canal de confiance.

**Pour inspecter un colis reçu :** ouvrez Importer Config Pack, sélectionnez ou collez le fichier `.tscfg`, puis sélectionnez Vérifier uniquement. Vérifiez les détails du signataire et confirmez la source. La vérification n'applique pas les paramètres et ne prouve pas que cet appareil est le destinataire. Arrêtez-vous si la source, la cible ou le but n'est pas clair.

Même une fois la vérification réussie, les contrôles généraux d'importation et d'application actuels ne peuvent pas être utilisés pour configurer le périphérique. Utilisez les contrôles pris en charge sur les pages de fonctionnalités pertinentes et vérifiez les paramètres résultants.

### 6.4 Export depuis un appareil Developer

1. Préparez des fichiers de configuration JSON valides sur la carte SD et obtenez un certificat cible vérifié.
2. Sélectionnez Exporter Config Pack, choisissez les fichiers, entrez un nom et une description, puis collez le certificat de l'appareil destinataire.
3. Générez le package, sélectionnez Télécharger et vérifiez que le navigateur a enregistré le fichier `.tscfg`.
4. Vérifiez séparément le téléchargement et le fichier sous `/sdcard/output_config/`. Le package peut rester disponible au téléchargement même si l'écriture du SD échoue.

L’exportation ne modifie pas les réglages d’origine. Régénérez le paquet s’il a été créé pour un autre destinataire ou si son certificat a changé. Une exportation réussie ne confirme pas le fonctionnement de l’application générale sur l’appareil destinataire.

## 7. Dépannage et réponse aux incidents

### 7.1 Problèmes courants Symptôme

| La sécurité du compte | Que faire |
|---|---|
| La section de sécurité des comptes n’apparaît pas | Il est affiché uniquement pour root |
| Un identifiant de clé est pris ou trop long | Choisissez un identifiant court et inutilisé ; voir la section 3.1 La génération de clé |
| La génération de la clé n’est pas confirmée | Attendez et inspectez l'enregistrement ; ne soumettez pas à nouveau le même identifiant Le déploiement de |
| Le déploiement est terminé, mais un enregistrement manque ou le test échoue | Vérifiez l'autorisation à distance, l'enregistrement local et connectez-vous séparément ; voir la section 3.3 |
| Une confirmation ou une modification d'empreinte apparaît | Vérifiez via un canal de confiance avant de décider de lui faire confiance ; voir la section 4.3 |
| Un enregistrement local demeure après la révocation | Vérifiez le résultat à distance, puis gérez l'échec de la suppression locale et les références de service |
| Access fonctionne toujours après la suppression d'un hôte | Remove affecte uniquement l’enregistrement local ; révoquer la clé publique distante séparément |
| Un certificat est enregistré, mais HTTPS est arrêté | Vérifiez l'heure de l'appareil, puis les informations d'identification affichées ou le problème de démarrage |
| Le service en cours d'exécution utilise toujours l'ancien certificat | Redémarrez comme indiqué, puis vérifiez le certificat actif |
| Un client rejette le certificat | Vérifiez la confiance du client, le nom d'accès, les utilisations autorisées et la validité |
| L'application réussit, mais les paramètres ne changent pas | L’application générale n’enregistre pas encore les réglages des modules. Configurez-les depuis les pages des fonctions concernées. |

### 7.2 Exposition suspectée de clé ou de mot de passe

1. Restreindre l'accès à l'appareil et au matériel concerné ; conserver les dossiers nécessaires à l’enquête.
2. Pour une clé privée SSH exposée, révoquez sa clé publique sur chaque serveur concerné via des connexions approuvées. Vérifiez les sauvegardes et confirmez que l'ancienne clé ne fonctionne plus.
3. Créez et déployez une nouvelle clé RSA sous un nouvel ID. Vérifiez-le, puis supprimez l'ancienne clé et les copies exportées.
4. Pour un mot de passe SSH exposé, modifiez-le via une connexion de gestion approuvée et examinez les enregistrements de connexion.
5. Pour une clé HTTPS exposée, remplacez les informations d'identification comme décrit dans la section 5.6 et travaillez avec l'administrateur de l'autorité de certification sur la révocation et les anciens packages.

La liste d'hôtes locaux peut ne pas couvrir tous les serveurs ayant accordé l'accès ; vérifiez également les enregistrements du serveur et des actifs. Avant de partager des journaux, examinez-les pour rechercher les mots de passe, les clés ou tout autre contenu sensible saisi par les utilisateurs.

### 7.3 Limites de fonctionnement actuelles Compte

Tenez compte de la gestion en HTTP, de l’autorisation centralisée incomplète, de la confiance automatique au premier déploiement et des limites de Config Pack. « Masqué » ne contrôle pas l’accès.

La configuration de build révisée n'active pas le chiffrement NVS, le chiffrement Flash ou le démarrage sécurisé. Ne présumez pas que ceux-ci protègent les clés stockées ou l’intégrité du démarrage. La configuration du micrologiciel flashé et les paramètres de sécurité du matériel nécessitent des vérifications distinctes. Demandez au propriétaire de la sécurité d'organiser l'isolement ou un correctif si l'environnement prévu ne peut pas tolérer ces limites.

## 8. Notes de version et glossaire

### 8.1 Portée de cette édition

Ce guide repose sur le code et les interfaces chinoise et anglaise de TianShanOS 0.6.1, vérifiés le 9 octobre 2026. Il reste utile pour les fonctions inchangées des versions suivantes. Si les commandes, les étapes ou les messages diffèrent, consultez les notes de votre version avant de continuer.

L'examen portait sur le code source et une interface simulée locale. La simulation n'a pas été traitée comme un test d'acceptation sur le matériel. Vérifiez l'accès SSH, les négociations TLS, les redémarrages et l'autorisation à distance dans votre propre environnement, comme décrit ici.

### 8.2 Termes utilisés dans ce guide

- **Clé publique / clé privée :** partagez la clé publique avec l'administrateur qui accorde l'accès ; garder la clé privée secrète. L'authentification utilise la paire correspondante.
- **Fingerprint :** un résumé utilisé pour comparer les identités de serveur ou de certificat. Convertissez différents formats d’affichage avant de comparer.
- **CSR / CA :** une demande de signature de certificat, et une autorité de certification ou son certificat.
- **CN / O / OU :** nom commun, organisation et unité organisationnelle dans un sujet de certificat. Le département sous la forme correspond à l'UO.
- **SAN / EKU :** les noms d'accès ou les adresses IP couverts par un certificat et ses objectifs d'authentification autorisés.
- **PEM :** un format de texte avec des marqueurs BEGIN/END pour les certificats, les CSR et les clés.
- **mTLS / PKI :** authentification mutuelle par certificat et système de gestion des certificats et de la confiance.
- **NVS :** une zone de stockage Flash pour les paramètres et les clés de l'appareil ; son nom n'implique pas de cryptage.
