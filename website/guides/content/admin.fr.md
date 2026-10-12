# TianshanOS Guide de l'utilisateur de l'administrateur

Ce guide est basé sur TianshanOS 0.6.2. Il peut toujours être utilisé avec des versions ultérieures où les fonctionnalités et les étapes restent inchangées. Si les contrôles, les messages ou les résultats diffèrent, consultez les instructions correspondant à votre version installée.

Ce guide couvre les vérifications du système, les contrôles des appareils, la mise en réseau, les fichiers et les mises à jour du micrologiciel pour le compte admin. Le Guide des opérations racine couvre l'accès au terminal, les commandes à distance et la configuration de l'automatisation. Consultez le Guide de sécurité séparé pour la gestion de la sécurité.

Utilisez les commandes affichées sur votre appareil. Certains nécessitent un matériel ou une configuration spécifique. Sur un ordinateur, passez la souris sur un bouton icône pour voir son nom.

## 1. Commencer

### Ouvrez l'interface Web

1. Ouvrez l'interface Web de l'appareil (WebUI) à l'aide de l'adresse fournie par votre administrateur.
2. Sélectionnez « Connexion » dans le coin supérieur droit.
3. Conservez `admin` comme nom d'utilisateur et saisissez le mot de passe admin fourni avec l'appareil.
4. Sélectionnez « Connexion ». Après une connexion réussie, le nom d'utilisateur actuel apparaît dans le coin supérieur droit.

La connexion avec le mot de passe par défaut ouvre un « rappel de sécurité ». Saisissez le mot de passe actuel, puis saisissez le nouveau mot de passe deux fois et sélectionnez « Modifier maintenant ». Les deux entrées de nouveau mot de passe doivent correspondre. Sélectionnez « Plus tard » pour fermer le rappel.

Lorsque vous avez terminé, sélectionnez « Déconnexion » dans le coin supérieur droit. Vous devrez vous reconnecter pour utiliser l'appareil.

### Changer de langue

Sélectionnez le bouton de langue en haut de la page, puis choisissez chinois ou anglais. Le contenu de la page et les étiquettes de contrôle changent immédiatement.

### Navigation dans les pages

Les pages principales de admin sont :

- « Système » : affichez l'état de l'appareil, les modules de contrôle, les ventilateurs et les LED, et ouvrez la mise à jour OTA.
- « Réseau » : vérifiez l'état Ethernet et les clients DHCP, configurez WiFi et gérez le transfert NAT.
- « Fichiers » : gérez les fichiers sur la carte SD et SPIFFS.
- « Sécurité » : ouvrez la page de gestion de la sécurité séparée. Consultez le Guide de sécurité pour obtenir des instructions.

## 2. État du système et opérations de routine

Sélectionnez « Système » dans la navigation supérieure.

### Afficher l'état des ressources et des services

« Ressources de la puce de gestion » affiche l’utilisation du CPU, de la DRAM et de la PSRAM de cette puce. Ces valeurs ne concernent ni AGX ni LPMU.

- Sélectionnez « Détails » pour afficher la mémoire totale, utilisée et libre ainsi que d'autres informations sur la mémoire.
- « Services » affiche le nombre de services en cours d'exécution et le total. Sélectionnez-le pour afficher l’état et l’étape de démarrage de chaque service.
- Si un service signale un problème, actualisez son état. Pour le redémarrer, suivez « Redémarrer un service » ci-dessous.

### Afficher les informations sur le système et l'alimentation

« Vue d’ensemble du système » affiche la puce, la version du micrologiciel, celle d’ESP-IDF et la durée de fonctionnement. Pour l’usage courant, vérifiez la version du micrologiciel. ESP-IDF est le cadre logiciel utilisé par l’appareil.

Le côté droit de la carte affiche la tension d'entrée, la tension interne, le courant, la puissance et l'état de protection.

L'interrupteur à côté de l'état de protection active ou désactive la protection basse tension. Lorsqu'il est activé, l'appareil utilise les tensions et les délais enregistrés pour s'arrêter à basse tension et redémarrer une fois l'alimentation rétablie.

### Afficher le réseau et l'heure

« Réseau et heure » affiche Ethernet, WiFi, l'adresse IP, l'heure actuelle, l'état de synchronisation, la source horaire et le fuseau horaire.

- Sélectionnez « Sync Time » pour copier l'heure actuelle du navigateur sur l'appareil.
- Sélectionnez « Fuseau horaire », choisissez un préréglage ou entrez un paramètre de fuseau horaire pris en charge, puis enregistrez.
- Sélectionnez « OTA Update » pour ouvrir la page de mise à jour du micrologiciel.

### Opérations avancées

#### Redémarrer TianshanOS

Un redémarrage interrompt temporairement la WebUI et la gestion des appareils. Terminez les opérations actives, puis sélectionnez « Redémarrer » et confirmez. Attendez que l'appareil soit récupéré, puis rouvrez WebUI.

#### Redémarrer un service

Le redémarrage d'un service interrompt temporairement la fonction qu'il fournit. Ouvrez « État du service », recherchez le service concerné et sélectionnez « Redémarrer » sur cette ligne. Vérifiez à nouveau son état une fois l'opération terminée.

#### Modifier les paramètres d'arrêt

Ces paramètres contrôlent le moment où l'appareil s'éteint après une chute de tension et le moment où il redémarre après le rétablissement de l'alimentation. Utilisez des valeurs qui correspondent aux besoins en énergie de votre appareil.

Sélectionnez « Paramètres d'arrêt » pour modifier :

- « Seuil de basse tension » : démarre le compte à rebours d'arrêt en dessous de cette tension.
- « Seuil de tension de récupération » : démarre la récupération au-dessus de cette tension.
- « Compte à rebours d'arrêt » : définit le délai avant l'arrêt après la détection d'une basse tension.
- « Temps de maintien de la récupération » : définit le temps d'attente utilisé pour confirmer une récupération de puissance stable.
- « Fan Stop Delay » : définit le délai avant l'arrêt des ventilateurs après l'arrêt.

Enregistrez le formulaire pour appliquer les paramètres de protection mis à jour.

#### Changer la cible supérieure USB

Le changement de cible USB peut déconnecter temporairement un périphérique connecté. Confirmez l'objectif et terminez le travail actif avant de continuer.

Les appareils prenant en charge la commutation USB affichent un bouton « USB ». Chaque clic fait basculer le port USB supérieur vers la cible suivante : ESP, AGX, puis LPMU. Vérifiez la cible affichée sur le bouton et le message de la page pour confirmer le résultat.

## 3. Panneau de périphérique

Le « Panneau des périphériques » se trouve sur la page « Système ». Il contient des commandes d'alimentation de module, des actions rapides et des widgets de données.

### AGX et LPMU

Enregistrez le travail sur le module et terminez son processus d'arrêt normal avant de couper l'alimentation. Une mise hors tension forcée peut entraîner la perte de données non enregistrées.

- « AGX Power » affiche l'état de contrôle de l'alimentation. Sélectionnez-le pour allumer ou éteindre l'appareil, puis attendez la confirmation.
- « LPMU Power » affiche « En ligne », « Hors ligne » ou « Inconnu ». Ces états proviennent d'une vérification du réseau. En ligne signifie que le module est accessible ; hors ligne signifie que ce n'est pas le cas. Aucun des deux états ne confirme à lui seul si le module est allumé ou éteint.
- La sélection du bouton LPMU déclenche la même action que l'appui sur son bouton d'alimentation physique. Attendez le contrôle et le résultat affiché. Si le résultat est inconnu, vérifiez le module et le réseau avant d'appuyer à nouveau sur le bouton.

### Utiliser des actions rapides

Un utilisateur root configure les cartes d’actions rapides. Leur affichage et l’autorisation de lancer une tâche sont deux réglages distincts. Une carte visible ne permet pas toujours de lancer sa tâche.

1. Vérifiez le nom de la carte, son état et les commandes disponibles pour identifier la tâche.
2. Sélectionnez une carte disponible, puis attendez la mise à jour de son état. Ne relancez pas la tâche pendant son traitement.
3. Les tâches en arrière-plan peuvent fournir des contrôles de journal, de vérification de l'état ou d'arrêt. Lisez le journal pour voir le résultat de la tâche. Après avoir sélectionné stop, vérifiez que la tâche s'est arrêtée.
4. Si l'état est inconnu ou si le démarrage est bloqué, utilisez le contrôle de vérification disponible ou demandez à un utilisateur root de vérifier la règle, la commande à distance et la connexion hôte.

Si la tâche ne peut pas démarrer, suivez le motif affiché. N’appuyez pas plusieurs fois sur Démarrer :

- Règle désactivée ou lancement manuel non autorisé : demandez à un utilisateur root de vérifier les réglages. Une carte visible ne vaut pas autorisation de lancer la tâche.
- Tâche en cours d’exécution, de démarrage, de vérification ou d’arrêt : attendez la mise à jour de son état.
- Service associé en fonctionnement : ne le relancez pas. Pour le redémarrer, arrêtez-le d’abord et confirmez le résultat.
- Arrêt du service non confirmé : vérifiez son état. S’il reste inconnu, demandez à un utilisateur root de vérifier la connexion à l’hôte.
- Règle non chargée ou en attente de suppression après redémarrage : demandez à un utilisateur root de vérifier sa version et le message de redémarrage en attente.
- L’automatisation n’accepte pas les demandes de démarrage : demandez à un utilisateur root de vérifier le moteur et la configuration. Ne redémarrez pas l’appareil de votre propre initiative.

<!-- operational-note -->
Confirmez qu'un service s'est arrêté avant de le redémarrer. Une demande de démarrage ou d'arrêt acceptée peut être encore en cours ; attendre l'état final. Après avoir déclenché une action, attendez quelques secondes avant d’en lancer une autre.

Appuyez et maintenez une carte jusqu'à ce que l'indicateur de réorganisation apparaisse, puis faites-la glisser pour modifier l'ordre d'affichage.

Si aucune carte n'est disponible, vérifiez quel message la page affiche :

- « Chargement des actions rapides » : attendez que la configuration termine le chargement. Si le message persiste, actualisez la page ou demandez à un utilisateur root d'enquêter.
- « Actions rapides indisponibles » : demandez de l’aide à un utilisateur root. N’appuyez pas plusieurs fois sur Démarrer.
- Aucune action rapide configurée : si vous en avez besoin, demandez à un utilisateur de root de vérifier le paramètre « Afficher sur le panneau » des règles.

<!-- operational-note -->
Après l’importation d’un paquet de règles, une carte peut encore exécuter l’ancienne tâche jusqu’au redémarrage de l’appareil. Les nouvelles règles ou celles en attente de suppression peuvent ne pas démarrer. Si la tâche vient de changer, demandez à un utilisateur root de confirmer la version en cours avant de la lancer.

Ne redémarrez pas un appareil fournissant des services actifs uniquement pour restaurer une carte.

### Gérer les widgets de données

Les widgets de données affichent et actualisent les données de l’appareil dans le « Panneau des appareils ».

1. Sélectionnez « Gestionnaire de widgets ».
2. Choisissez un intervalle d'actualisation ou désactivez l'actualisation automatique.
3. Ajoutez un widget prédéfini ou choisissez un style de composant et une source de données proposés par la page.
4. Modifiez son étiquette, son style d'affichage et son unité selon vos besoins, puis enregistrez.

Les widgets existants peuvent être modifiés, supprimés et réorganisés. Vous pouvez également sélectionner une carte de widget pour la modifier. Appuyez longuement sur un widget, puis faites-le glisser vers une nouvelle position.

## 4. Gestion des fans

<!-- operational-note -->
« Contrôle du ventilateur » se trouve sur la page « Système ». Les cartes de ventilateur montrent les ventilateurs fournis par votre appareil. Vérifiez le numéro du ventilateur avant de modifier une courbe.

### Afficher l'état du ventilateur

La barre d’état affiche « Température effective » et « Sortie actuelle ». Le grand pourcentage indique le réglage de régulation confirmé par l’appareil, pas la vitesse mesurée. RPM indique le nombre de tours par minute mesuré et reste masqué sans mesure valide. Si le grand affichage indique `--`, la sortie actuelle n’est pas confirmée.

Lorsque vous déplacez le curseur manuel, la valeur à côté indique le réglage que vous allez demander. Le grand pourcentage indique toujours la sortie actuelle. Relâchez le curseur, puis vérifiez le message et la valeur actualisée. Si la demande et la sortie actuelle diffèrent, ne considérez pas le réglage comme appliqué.

Le mode intelligent affiche son état : « Mode intelligent », « Suivi de la courbe », protection ou température non valide. Il affiche aussi la température de référence de sécurité, la température prévue dans 45 secondes et la vitesse de variation de la température.

Si la température devient invalide, vérifier que sa source est toujours à jour. L'appareil passe en contrôle de protection contre la perte de température. Sélectionnez « TTI » pour une explication du contrôle thermique intelligent.

Utilisez le bouton d'actualisation dans l'en-tête de section pour récupérer l'état actuel. Si le réglage échoue ou si la sortie n'est pas confirmée, vérifiez l'appareil avant de décider de réessayer.

### Sélectionnez un mode de fonctionnement

| Mode | Objectif |
| --- | --- |
| « Désactivé » | Arrête le ventilateur. |
| « Manuel » | Utilise un pourcentage de contrôle fixe défini avec le curseur 0-100%. |
| « Courbe » | Suit la courbe configurée entre la température et le pourcentage de contrôle. |
| « Intelligent » | Utilise la courbe de base, les tendances de température et les ajustements passés pour contrôler le refroidissement. Utilise un contrôle de protection en cas de besoin. |

L'arrêt d'un ventilateur ou le réglage d'une valeur manuelle basse réduit le refroidissement. Vérifiez d’abord la charge et la température et continuez à les surveiller. Le curseur est disponible uniquement en mode manuel lorsque la sortie actuelle est confirmée.

### Configurer une courbe de ventilateur

Sélectionnez « Courbe » dans l'en-tête de la section Contrôle du ventilateur pour ouvrir « Gestion des courbes de ventilateur ». Le bouton « Courbe » à l’intérieur d’une carte change uniquement le mode de fonctionnement.

1. Sous « Ventilateur », choisissez le nombre à ajuster et vérifiez-le par rapport à la page Système.
2. Sous « Liaison des variables de température », ajoutez des variables de température et attribuez des poids.
3. Sélectionnez « Relier ». La source de température est partagée par les ventilateurs en modes Courbe et Intelligent, donc sa modification affecte les ventilateurs utilisant cette source.
4. Ajoutez ou modifiez des « nœuds de courbe ». Chaque courbe nécessite au moins des nœuds 2 et prend en charge jusqu'à 10.
5. Définissez la « Vitesse minimale » et la « Vitesse maximale » comme pourcentages de contrôle. Le minimum ne doit pas dépasser le maximum.
6. Réglez « Hystérésis de température » et « Intervalle minimum ». L’hystérésis accepte 0-20°C et limite les réglages fréquents dus à de petites variations de température. L’intervalle accepte 500-30000 ms. 1000 ms correspondent à 1 seconde.
7. Sélectionnez « Enregistrer la courbe ». Après une sauvegarde réussie, le ventilateur sélectionné passe en mode Courbe. Pour utiliser le contrôle thermique intelligent, revenez à la carte et sélectionnez « Smart ».

Si l'enregistrement échoue, lisez le message et vérifiez l'état actuel avant de réessayer. Après avoir dissocié les variables de température, vérifiez également la température effective et l’état du ventilateur.

### Importer et exporter une courbe

- Sélectionnez « Importer Config » et choisissez un fichier de courbe JSON. JSON est le format de fichier utilisé pour stocker les données de courbe. Passez en revue les nœuds, les limites et le numéro de ventilateur, puis sélectionnez « Enregistrer la courbe » pour les appliquer.
- Sélectionnez « Exporter la configuration » pour télécharger la courbe actuelle. La page tente également d'enregistrer une copie sous `/sdcard/config` sur la carte SD. Vérifiez séparément le téléchargement du navigateur et le résultat de la carte SD rapporté.

### Utiliser une température de test

Une température de test remplace temporairement la source normale et affecte le contrôle Curve ou Smart. Surveillez le ventilateur et l’appareil tout au long du test.

1. Entrez 0-100°C sous « Test Temp ».
2. Sélectionnez « Test » et observez la sortie actuelle, l'état et la réponse du ventilateur.
3. À la fin du test, sélectionnez « Effacer le test ». Vérifiez que la température effective provient à nouveau de sa source habituelle.

## 5. Gestion des LED

« LED Control » se trouve sur la page « Système » et affiche les LED fournies par l'appareil. Les fonctionnalités disponibles varient selon les LED.

### Commandes courantes

- Utilisez le bouton ampoule situé en bas d'une carte pour allumer ou éteindre la LED.
- Déplacez le curseur « Luminosité » ou choisissez une couleur ou un préréglage.
- Utilisez le bouton d'animation pour ouvrir les « Paramètres LED ». Sélectionnez une animation sous « Animation programmatique », puis utilisez son contrôle de lecture ou d'arrêt.
- Sélectionnez l'icône de sauvegarde en bas à droite de la carte pour enregistrer la configuration actuelle des LED.
- Sélectionnez « All Off » pour éteindre toutes les LED et vérifier le résultat rapporté. Si certains échouent, vérifiez ces appareils.

### Les cartes matricielles

Les cartes de la matrice proposent des icônes pour les fonctions disponibles. Ouvrez une fonction, puis changez de groupe dans « Paramètres LED » :

- « Animation programmatique » : sélectionnez et exécutez une animation.
- « Image/QR Code » : choisissez une image de la carte SD ou saisissez le contenu d'un code QR.
- « Affichage du texte » : définissez le texte, la police, l'alignement, le défilement, le premier plan et l'arrière-plan.
- « Filtre de post-traitement » : Choisissez un filtre et des paramètres, puis appliquez-le ou arrêtez-le.
- « Correction des couleurs » : ajustez l'affichage et utilisez les commandes de réinitialisation, d'importation ou d'exportation disponibles.

Vérifiez la lumière réelle ou l'affichage matriciel après avoir appliqué une modification. Utilisez uniquement les fonctionnalités affichées. Si un paramètre échoue, suivez le message pour vérifier l’état du fichier, de l’entrée ou du périphérique.

## 6. Gestion du réseau

<!-- operational-note -->
Sélectionnez « Réseau » dans la navigation supérieure pour ouvrir « Paramètres réseau ». La modification des paramètres du mode réseau, du point d'accès ou de NAT peut interrompre la connexion WebUI actuelle. Avant d'enregistrer, assurez-vous que vous pouvez vous reconnecter via la nouvelle adresse réseau.

### Afficher l'état du réseau

Le haut de la page affiche l'état d'Ethernet, du client WiFi et du point d'accès WiFi. Ouvrez le panneau associé pour afficher l'adresse IP, le masque de sous-réseau, la passerelle, DNS, l'adresse MAC, SSID, le signal et le nombre d'appareils connectés lorsqu'ils sont disponibles.

Le panneau Ethernet affiche les informations actuelles sur la liaison et l'adresse. Il ne fournit pas de contrôles d'édition d'adresse.

### Sélectionnez un mode WiFi

| Mode | Objectif |
| --- | --- |
| « Désactivé » | Désactive WiFi. |
| «Gare (STA)» | Connecte l'appareil à un réseau WiFi existant. |
| « Point d'accès (AP) » | Permet à l'appareil de fournir un point d'accès WiFi. |
| « STA+AP » | Se connecte à un réseau WiFi existant tout en gardant le point d'accès de l'appareil disponible. |

Après avoir choisi un mode, attendez que la page actualise l'état. La connexion sans fil actuelle peut être interrompue pendant le changement.

### Se connecter à WiFi

1. Réglez le mode WiFi sur « Station (STA) » ou « STA+AP ».
2. Sous « Station », sélectionnez « Scan ».
3. Choisissez un réseau dans la liste. La liste affiche SSID, la force du signal, le canal et le type d'authentification.
4. Saisissez le mot de passe et confirmez. Laissez le mot de passe vide pour un réseau ouvert.
5. Attendez que l'état passe à « Connecté », puis confirmez la nouvelle adresse IP.

Sélectionnez « Déconnecter » pour mettre fin à la connexion client WiFi actuelle.

### Configurer le point d'accès WiFi

1. Réglez le mode WiFi sur « Access Point (AP) » ou « STA+AP ».
2. Sous « Hotspot », sélectionnez « Config ».
3. Entrez le SSID. Un mot de passe vide crée un point d'accès ouvert ; un point d'accès protégé nécessite au moins des caractères 8.
4. Sélectionnez un canal et activez « Masquer SSID » si nécessaire.
5. Sélectionnez « Appliquer » et attendez que l'état du point d'accès soit mis à jour.

Sélectionnez « Appareils » pour afficher les clients actuellement connectés au point d'accès.

### Définir le nom d'hôte

Entrez un nouveau nom dans la section « Nom d'hôte » sous « Services réseau », puis sélectionnez « Définir ». La page affiche le nom d'hôte actuel après sa mise à jour.

### Afficher les clients DHCP

DHCP attribue automatiquement des adresses réseau aux appareils connectés. Sélectionnez « Clients », choisissez « WiFi AP » ou « Ethernet » et affichez les baux en cours. Utilisez le bouton Actualiser pour recharger la liste.

### Opérations réseau avancées

#### Configurer la passerelle NAT

NAT transmet le trafic réseau entre les interfaces réseau de l'appareil. Activez ou désactivez NAT, puis sélectionnez « Enregistrer » pour conserver le paramètre. Vérifiez ensuite l'état du WiFi et d'Ethernet.

#### Accédez au réseau en amont via LPMU

<!-- operational-note -->
Cette opération utilise l'hôte LPMU configuré pour configurer l'accès au réseau. Avant de commencer, vérifiez que LPMU est accessible et que les câbles réseau sont connectés. Obtenez le mot de passe sudo pour le compte SSH sur cet hôte. Ce mot de passe autorise les modifications du système et peut différer du mot de passe WebUI.

1. Sous « Accès au réseau en amont », sélectionnez « Accès via LPMU ».
2. Entrez le mot de passe sudo LPMU et sélectionnez le bouton d'accès. Le mot de passe est utilisé uniquement pour cette exécution et n'est pas enregistré ; saisissez-le à nouveau pour une exécution ultérieure.
3. Attendez la fin de l'opération. Ne le redémarrez pas pendant le traitement.
4. L'accès est confirmé uniquement lorsque le résultat indique à la fois une connexion Internet et une configuration réseau terminée.
5. En cas d'échec ou si le résultat n'est pas confirmé, lisez d'abord la raison. Développez « Journal d'exécution » pour plus de détails. Vérifiez le mot de passe pour une erreur de mot de passe, ou le câblage et le réseau en amont si aucune connexion Internet n'est trouvée.

Un échec de demande d'état ne signifie pas que le script s'est arrêté. Utilisez le contrôle « Actualiser l'état » disponible pour vérifier l'exécution en cours avant de décider de réessayer.

## 7. Gestion des fichiers

Sélectionnez « Fichiers » dans la navigation supérieure pour ouvrir le « Gestionnaire de fichiers ».

La carte SD est un stockage amovible et SPIFFS est un stockage de fichiers interne à l'appareil. Sélectionnez « Carte SD » ou « SPIFFS » pour changer d'emplacement. Le chemin en haut montre votre dossier actuel. Sélectionnez un nom de dossier dans le chemin pour y revenir.

### Parcourir et gérer les fichiers

- Sélectionnez un nom de dossier pour l'ouvrir.
- Sélectionnez le bouton de téléchargement à côté d'un fichier pour l'enregistrer à l'emplacement de téléchargement du navigateur.
- Sélectionnez le bouton Renommer, saisissez un nouveau nom et confirmez.
- Sélectionnez « Nouveau dossier », saisissez un nom de dossier et créez-le.
- Sélectionnez le bouton d'actualisation pour recharger le répertoire actuel et l'état de stockage.

### Envoyer des fichiers

Les fichiers peuvent être envoyés uniquement sur la carte SD, pas dans SPIFFS. Vérifiez d’abord que la carte SD est montée.

1. Sélectionnez « Carte SD » et ouvrez le dossier où vous souhaitez envoyer les fichiers.
2. Sélectionnez « Envoyer des fichiers ».
3. Sélectionnez un ou plusieurs fichiers, ou faites-les glisser dans la zone d’envoi.
4. Vérifiez la liste des fichiers à envoyer et retirez ceux dont vous n’avez pas besoin.
5. Sélectionnez « Envoyer » et attendez la confirmation pour chaque fichier.

L’envoi d’un paquet `.tscfg` ouvre les étapes de vérification et d’application. Cette page de fichiers n’applique pas encore les réglages du paquet. Un envoi ou une vérification réussi ne signifie pas que les réglages sont actifs.

Confiez les paquets de règles à un utilisateur root, qui les importera depuis « Automatisation ». Un simple envoi de fichiers ne remplace pas l’importation de règles. Pour l’origine et la signature des autres paquets, consultez le Guide de sécurité.

### Opérations par lots

Après avoir sélectionné des fichiers ou des dossiers, la barre d'outils batch apparaît.

- « Téléchargement par lots » télécharge les fichiers sélectionnés, sans inclure les dossiers.
- « Suppression par lots » supprime les fichiers et dossiers sélectionnés.
- « Effacer la sélection » efface la sélection actuelle.

### Supprimer un fichier ou un dossier La suppression de

La suppression ne peut pas être annulée dans l’interface Web. Supprimer un dossier supprime aussi son contenu. Vérifiez le nom et le chemin avant de choisir « Supprimer » ou « Suppression par lots » et de confirmer.

### Monter et démonter la carte SD Le démontage de

Le démontage de la carte SD rend ses fichiers indisponibles jusqu’au prochain montage. Terminez les envois, les téléchargements et les autres opérations sur les fichiers avant de sélectionner « Démonter SD ».

Si vous retirez ou remplacez la carte contenant la configuration d’automatisation, celle-ci risque de ne pas se charger après le redémarrage. Demandez à un utilisateur root si vous pouvez la démonter. Ne la démontez pas et ne la retirez pas si la page demande de la laisser insérée.

Lorsque la carte SD n'est pas montée, la page affiche « Mount SD ». Sélectionnez-le, attendez que l'état passe à « Monté », puis ouvrez à nouveau le répertoire de la carte SD.

## 8. Mises à jour OTA

Sur la page « Système », sélectionnez « Mise à jour OTA » dans la section « Réseau et heure » pour ouvrir « Mise à niveau du micrologiciel ».

<!-- operational-note -->
L'appareil redémarre lors d'une mise à jour, déconnectant temporairement l'interface Web. Enregistrez le travail actif et maintenez la alimentation de l’appareil stable avant de commencer. N'éteignez pas l'appareil tant que la progression de la mise à jour est incomplète.

### Rechercher des mises à jour à partir d'un serveur OTA

1. Consultez la « version actuelle ».
2. Saisissez l'adresse du serveur OTA fournie par un administrateur ou un éditeur.
3. Sélectionnez « Enregistrer », puis sélectionnez « Vérifier la mise à jour ».
4. La page indique « Mise à jour disponible », « Déjà à jour », une ancienne version du serveur ou une erreur.
5. Confirmez la version cible, puis sélectionnez « Mettre à niveau maintenant » ou le contrôle de mise à niveau affiché sur la page.
6. Attendez la fin du téléchargement, de l'installation et du redémarrage. Pour annuler, utilisez le bouton « Abandonner » lorsqu'il est disponible. Toutes les étapes ne prennent pas en charge l'annulation.
7. Reconnectez-vous à WebUI une fois l'appareil remis en ligne et vérifiez la « version actuelle ».

Lorsque « Mise à niveau également www » est activé, le micrologiciel et l'interface Web sont mis à jour en séquence. Pour 0.6.2, utilisez le micrologiciel principal et les ressources WebUI correspondants fournis par l'éditeur, tous deux issus de la même version. Si l'ancienne interface persiste après la mise à niveau, actualisez de force le navigateur et vérifiez à nouveau la version et la page.

### Mise à jour manuelle

Développez « Mise à niveau manuelle » et choisissez l'une de ces méthodes :

- « Mise à niveau à partir de l'URL » : saisissez l'URL du micrologiciel, définissez « Mise à niveau également www » conformément aux instructions de publication, puis sélectionnez « Mise à niveau ». Ici, www fait référence aux ressources de l’interface Web de l’appareil.
- « Mise à niveau depuis la carte SD » : saisissez un chemin de micrologiciel tel que `/sdcard/firmware.bin`. Si « Mettre également à niveau www » est activé, assurez-vous que `www.bin` de la même version se trouve dans ce répertoire.

Pour une mise à niveau à partir d'une URL, « Ignorer la vérification du certificat » ignore la vérification du certificat du serveur HTTPS. Cela supprime la vérification du certificat utilisée pour confirmer l’identité du serveur de téléchargement. Laissez-le décoché pour les mises à jour de routine. Si vous voyez une erreur de certificat, demandez à votre administrateur de vérifier l'adresse du serveur et le certificat.

### Gestion des partitions et retour à une version précédente

« Gestion des partitions » affiche la partition en cours d'exécution et les autres partitions disponibles.

- « Mark Valid » confirme la version en cours d'exécution et désactive la protection automatique contre la restauration pour cette version. Utilisez-le après avoir confirmé que la version actuelle fonctionne correctement.
- « Revenir à cette version » sélectionne une autre version amorçable et passe par un redémarrage. La restauration interrompt les services actuels. Confirmez d'abord la version cible et la compatibilité des données.

Une fois l'opération et le redémarrage terminés, rouvrez l'interface utilisateur Web et vérifiez la version actuelle et l'état de l'appareil.

La version 0.6.2 change la manière d’enregistrer la configuration d’automatisation. Avant de revenir à un ancien micrologiciel, demandez à un utilisateur root ou au fournisseur si cette version peut la lire. Préparez aussi une sauvegarde et une méthode de récupération.

Rollback modifie le micrologiciel, pas le format de configuration. Les règles existantes peuvent ne plus fonctionner après une rétrogradation.

## 9. Entrée de gestion de la sécurité

Sélectionnez « Sécurité » dans la navigation supérieure pour ouvrir la gestion de la sécurité. Utilisez le Guide de sécurité TianshanOS pour les clés SSH, les hôtes distants, les empreintes d'hôte connu, les certificats HTTPS, les packages de configuration et la gestion des comptes. Ces procédures ne sont pas répétées ici.

### Échec ou opérations non confirmées

Un formulaire peut signaler un champ en rouge et afficher une erreur à côté. Corrigez ce champ selon les indications, puis enregistrez. La disparition du signalement ne confirme pas l’enregistrement ; vérifiez aussi le message et la liste.

Identifiez l’opération qui a échoué, puis lisez le motif et l’étape suivante. Si le message ne donne aucun motif, ne le devinez pas.

Si « Détails » est proposé, sélectionnez-le pour consulter les informations supplémentaires. « Masquer » referme les détails. Si un bouton × est affiché, utilisez-le pour fermer le message. Pour demander de l’aide, conservez le message et ses détails afin qu’un utilisateur root puisse les vérifier.

Si le résultat n’est pas confirmé, actualisez et vérifiez l’état de l’appareil, du fichier ou de la tâche. Un délai expiré ou une déconnexion ne signifie pas que l’opération n’a pas été exécutée. Ne répétez pas aussitôt une opération d’alimentation, de suppression, de lancement de tâche ou de mise à jour. Demandez à un utilisateur root de vérifier si le résultat reste inconnu.

Pour les actions par lots, vérifiez séparément les éléments réussis, échoués et non confirmés. Confirmez les fichiers téléchargés dans la liste de téléchargement du navigateur.
