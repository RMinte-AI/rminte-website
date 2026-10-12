# TianshanOS

Ce guide est basé sur TianshanOS 0.6.2. Il peut toujours être utilisé avec des versions ultérieures où les fonctionnalités et les étapes restent inchangées. Si les contrôles, les messages ou les résultats diffèrent, consultez les instructions correspondant à votre version installée.

Ce guide couvre les fonctions de routine dans la partie I et l'accès au terminal, les commandes à distance et l'automatisation dans la partie II. Les opérations racine peuvent affecter le périphérique et les hôtes distants ; vérifiez les tâches cibles et actives avant de continuer. Consultez le Guide de sécurité séparé pour la gestion de la sécurité.

Utilisez les commandes affichées sur votre appareil. Certains nécessitent un matériel ou une configuration spécifique. Sur un ordinateur, passez la souris sur un bouton icône pour voir son nom.

## Partie I : Fonctions de routine

## 1. Commencer

### Ouvrez l'interface Web

1. Ouvrez l'interface Web de l'appareil (WebUI) à l'aide de l'adresse fournie par votre administrateur.
2. Sélectionnez « Connexion » dans le coin supérieur droit.
3. Saisissez `root` et le mot de passe root fourni avec l'appareil.
4. Sélectionnez « Connexion ». Après une connexion réussie, le nom d'utilisateur actuel apparaît dans le coin supérieur droit.

La connexion avec le mot de passe par défaut ouvre un « rappel de sécurité ». Saisissez le mot de passe actuel, puis saisissez le nouveau mot de passe deux fois et sélectionnez « Modifier maintenant ». Les deux entrées de nouveau mot de passe doivent correspondre. Sélectionnez « Plus tard » pour fermer le rappel.

Lorsque vous avez terminé, sélectionnez « Déconnexion » dans le coin supérieur droit. Vous devrez vous reconnecter pour utiliser l'appareil.

### Changer de langue

Sélectionnez le bouton de langue en haut de la page, puis choisissez chinois ou anglais. Le contenu de la page et les étiquettes de contrôle changent immédiatement.

### Navigation dans les pages

Les utilisateurs root peuvent accéder à ces pages :

- « Système » : affichez l'état de l'appareil, les modules de contrôle, les ventilateurs et les LED, et ouvrez la mise à jour OTA.
- « Réseau » : vérifiez l'état Ethernet et les clients DHCP, configurez WiFi et gérez le transfert NAT.
- « Fichiers » : gérez les fichiers sur la carte SD et SPIFFS.
- « Terminal » : exécutez les commandes de l'appareil et affichez les journaux système.
- « Commandes » : gérez et exécutez les commandes SSH à distance.
- « Automation » : configurez les sources, les règles et les modèles.
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
4. Si l'état est inconnu ou si le démarrage est bloqué, utilisez le contrôle de vérification disponible ou vérifiez la règle, la commande à distance et la connexion hôte comme décrit dans les chapitres 11 et 12.

Si la tâche ne peut pas démarrer, suivez le motif affiché. N’appuyez pas plusieurs fois sur Démarrer :

- Règle désactivée ou lancement manuel non autorisé : vérifiez les réglages dans « Automatisation » (chapitre 12). Une carte visible ne vaut pas autorisation de lancer la tâche.
- Tâche en cours d’exécution, de démarrage, de vérification ou d’arrêt : attendez la mise à jour de son état.
- Service associé en fonctionnement : ne le relancez pas. Pour le redémarrer, arrêtez-le d’abord et confirmez le résultat.
- Arrêt du service non confirmé : vérifiez son état. S’il reste inconnu, vérifiez la connexion à l’hôte dans « Sécurité » (chapitre 11).
- Règle non chargée ou en attente de suppression après redémarrage : vérifiez sa version et le message de redémarrage en attente dans « Automatisation » (chapitre 12).
- L’automatisation n’accepte pas les demandes de démarrage : vérifiez le moteur et la configuration dans « Automatisation ». Suivez le message et vérifiez les tâches en cours avant de redémarrer l’appareil.

<!-- operational-note -->
Confirmez qu'un service s'est arrêté avant de le redémarrer. Une demande de démarrage ou d'arrêt acceptée peut être encore en cours ; attendre l'état final. Après avoir déclenché une action, attendez quelques secondes avant d’en lancer une autre.

Appuyez et maintenez une carte jusqu'à ce que l'indicateur de réorganisation apparaisse, puis faites-la glisser pour modifier l'ordre d'affichage.

Si aucune carte n'est disponible, vérifiez quel message la page affiche :

- « Chargement des actions rapides » : attendez que la configuration termine le chargement. Si le message persiste, sélectionnez « Aller à l'automatisation » et vérifiez les journaux système dans le terminal.
- « Actions rapides indisponibles » : sélectionnez « Aller à l'automatisation » pour vérifier l'état. Ouvrez « Journaux système » sur le terminal pour trouver la cause. Restaurer la configuration avant d'utiliser les cartes ; ne continuez pas à sélectionner Démarrer.
- Aucune action rapide configurée : sélectionnez « Aller à l'automatisation » pour créer une règle ou vérifiez le paramètre « Afficher sur le panneau » d'une règle existante.

Après l’importation d’un paquet de règles, une carte peut encore exécuter l’ancienne tâche jusqu’au redémarrage de l’appareil. Les nouvelles règles ou celles en attente de suppression peuvent ne pas démarrer. Si la tâche vient de changer, vérifiez la version en cours dans la liste des règles avant de la lancer.

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

Importez les paquets de règles depuis « Automatisation », selon le chapitre 12. Un simple envoi de fichiers ne remplace pas l’importation de règles. Pour l’origine et la signature des autres paquets, consultez le Guide de sécurité.

### Opérations par lots

Après avoir sélectionné des fichiers ou des dossiers, la barre d'outils batch apparaît.

- « Téléchargement par lots » télécharge les fichiers sélectionnés, sans inclure les dossiers.
- « Suppression par lots » supprime les fichiers et dossiers sélectionnés.
- « Effacer la sélection » efface la sélection actuelle.

### Supprimer un fichier ou un dossier La suppression de

La suppression ne peut pas être annulée dans l’interface Web. Supprimer un dossier supprime aussi son contenu. Vérifiez le nom et le chemin avant de choisir « Supprimer » ou « Suppression par lots » et de confirmer.

### Monter et démonter la carte SD Le démontage de

Le démontage de la carte SD rend ses fichiers indisponibles jusqu’au prochain montage. Terminez les envois, les téléchargements et les autres opérations sur les fichiers avant de sélectionner « Démonter SD ».

Si vous retirez ou remplacez la carte contenant la configuration d’automatisation, celle-ci risque de ne pas se charger après le redémarrage. Vérifiez que le démontage ne compromet pas la configuration ni les tâches en cours. Ne démontez pas la carte et ne la retirez pas si la page demande de la laisser insérée.

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

La version 0.6.2 change la manière d’enregistrer la configuration d’automatisation. Avant de revenir à un ancien micrologiciel, vérifiez s’il peut la lire et consultez le fournisseur si nécessaire. Préparez une sauvegarde et une méthode de récupération.

Rollback modifie le micrologiciel, pas le format de configuration. Les règles existantes peuvent ne plus fonctionner après une rétrogradation.

## 9. Entrée de gestion de la sécurité

Sélectionnez « Sécurité » dans la navigation supérieure pour ouvrir la gestion de la sécurité. Utilisez le Guide de sécurité TianshanOS pour les clés SSH, les hôtes distants, les empreintes d'hôte connu, les certificats HTTPS, les packages de configuration et la gestion des comptes. Ces procédures ne sont pas répétées ici.

### Échec ou opérations non confirmées

Un formulaire peut signaler un champ en rouge et afficher une erreur à côté. Corrigez ce champ selon les indications, puis enregistrez. La disparition du signalement ne confirme pas l’enregistrement ; vérifiez aussi le message et la liste.

Identifiez l’opération qui a échoué, puis lisez le motif et l’étape suivante. Si le message ne donne aucun motif, ne le devinez pas.

Si « Détails » est proposé, sélectionnez-le pour consulter les informations supplémentaires. « Masquer » referme les détails. Si un bouton × est affiché, utilisez-le pour fermer le message. Pour poursuivre les vérifications, conservez le message et ses détails, puis ouvrez « Journaux système » dans Terminal.

Si le résultat n’est pas confirmé, actualisez et vérifiez l’état de l’appareil, du fichier ou de la tâche. Un délai expiré ou une déconnexion ne signifie pas que l’opération n’a pas été exécutée. Ne répétez pas aussitôt une opération d’alimentation, de suppression, de lancement de tâche ou de mise à jour. Si le résultat reste inconnu, ouvrez « Journaux système » dans Terminal pour vérifier la cause.

Pour les actions par lots, vérifiez séparément les éléments réussis, échoués et non confirmés. Confirmez les fichiers téléchargés dans la liste de téléchargement du navigateur.

## Partie II : Fonctions racine uniquement

## 10. Journaux du terminal et du système

« Terminal » s'affiche uniquement pour root. Il peut exécuter directement les commandes de la console de l'appareil et afficher les journaux de l'appareil. Une commande peut changer l'état de l'appareil immédiatement. Confirmez sa source, ses paramètres et son impact avant de le saisir.

### Se connecter et utiliser le terminal

1. Sélectionnez « Terminal » dans la navigation supérieure.
2. Attendez « Connecté à l'appareil » et l'invite `tianshan>`.
3. Entrez `help` pour afficher les commandes fournies par le micrologiciel actuel.
4. Entrez une commande et appuyez sur Entrée. Attendez la fin de sa sortie et l'invite de retour.

Les commandes ne sont pas exécutées tant que la page affiche « Non connecté à l’appareil ». Après une coupure, attendez le message de reconnexion avant de renvoyer une commande pour éviter de l’exécuter deux fois.

Le terminal propose ces commandes au clavier :

| Commande | Objectif |
| --- | --- |
| Ctrl+C | Efface l'entrée actuelle et demande une interruption. La commande doit prendre en charge l'interruption pour qu'elle s'arrête. |
| Ctrl+L | Effacer l'écran. |
| ↑ / ↓ | Parcourir l'historique des commandes à partir de la session de page en cours. |
| ← / → | Déplace le curseur dans l'entrée actuelle. |

« Effacer » en haut de la page efface uniquement l'affichage. Il n'annule pas les commandes déjà exécutées. « Déconnecter » met fin à la connexion actuelle du terminal.

### Ouvrir un shell SSH distant

Un shell SSH envoie les entrées clavier ultérieures à un hôte distant. Confirmez l'adresse cible, l'utilisateur et la méthode d'authentification, et effectuez la préparation SSH décrite dans le Guide de sécurité avant de vous connecter.

1. Entrez `ssh --help` pour afficher les options de la commande SSH.
2. Entrez `ssh --host <host> --user <user> --shell`, en remplaçant chaque espace réservé, y compris ses crochets angulaires, par la valeur réelle. Pour spécifier un port, ajoutez `--port <port>` avant --shell.
3. Attendez la confirmation de la connexion à distance avant de saisir des commandes à distance.
4. Appuyez sur Ctrl+\ pour quitter le shell SSH et revenir à l'invite tianshan>.

Ne saisissez pas d'informations d'identification en texte clair lorsque le terminal est partagé, enregistré ou consulté par une autre personne.

### Afficher les journaux système

Sélectionnez « Journaux système » en haut du terminal pour ouvrir la fenêtre du journal.

- « Niveau » définit le niveau minimum affiché. Utilisez ERROR, WARN+, INFO+ ou DEBUG+ pour affiner la sortie.
- « TAG » filtre par source de journal.
- « Recherche » filtre les journaux actuels par mot-clé.
- « Défilement automatique » suit les nouvelles entrées du journal lorsqu'il est activé.
- Le bouton Actualiser recharge les journaux historiques.
- Le bouton Effacer efface uniquement les journaux actuellement affichés dans la fenêtre.

Si le filtrage ne produit aucune sortie, effacez d'abord TAG et Search, puis modifiez le niveau. La fermeture de la fenêtre du journal n'arrête pas les services de l'appareil.

## 11. Gérer et exécuter des commandes à distance

« Commandes » enregistre des commandes SSH réutilisables et les exécute sur l’hôte distant choisi. Les hôtes et leurs données d’authentification se gèrent dans « Sécurité ». Consultez le guide de sécurité pour ces étapes.

### Vérifier l’empreinte de l’hôte avant la connexion

L’empreinte aide à identifier l’hôte auquel vous vous connectez. Ces étapes concernent les tests d’hôtes SSH dans la page Web « Sécurité », pas la confirmation de SSH Shell dans Terminal. Si le message indique une empreinte non enregistrée ou modifiée, ne répétez pas la commande. Ouvrez « Sécurité », trouvez l’hôte SSH et sélectionnez « Tester ».

Lors de la première connexion, la boîte de dialogue affiche l’adresse et l’empreinte de l’hôte. Comparez-les avec l’administrateur par un canal fiable. Sélectionnez « Faire confiance et se connecter » uniquement après avoir confirmé leur correspondance.

Si l’empreinte a changé, la boîte de dialogue affiche l’ancienne et l’actuelle, avec « Annuler » sélectionné par défaut. Une réinstallation peut modifier l’empreinte, mais le changement peut aussi signaler un autre hôte ou une usurpation.

Vérifiez l’adresse et confirmez la cause du changement par un canal fiable. Si vous ne pouvez pas la confirmer, sélectionnez « Annuler ». Ne supprimez pas l’ancienne empreinte pour contourner la vérification. Sélectionnez « Mettre à jour la clé de l’hôte » seulement après avoir confirmé la fiabilité de la nouvelle empreinte.

### Sélectionnez un hôte et affichez les commandes

1. Sélectionnez « Commandes » dans la navigation supérieure.
2. Choisissez un hôte actuellement affiché sous « Sélectionner un hôte ».
3. Consultez ses éléments enregistrés sous « Liste de commandes ».

Des hôtes de référence « Orphan Commands » qui n'existent plus et ne peuvent pas être exécutés. Supprimez une commande orpheline ou utilisez l'option de liaison d'hôte lors de l'importation pour l'associer à un hôte valide.

### Créer ou modifier une commande

<!-- operational-note -->
Une commande enregistrée s'exécute sur un hôte distant. Vérifiez la commande et les autorisations requises sur cet hôte avant de l'enregistrer. Faites particulièrement attention aux commandes qui suppriment des données, arrêtent ou redémarrent un hôte ou écrasent des fichiers.

1. Sélectionnez un hôte, puis sélectionnez « Nouvelle commande ». Utilisez le bouton Modifier sur une commande existante pour la modifier.
2. Entrez un « ID de commande » unique. Il peut contenir des lettres, des chiffres, des traits de soulignement et des traits d'union, et ne peut ni commencer ni se terminer par un trait de soulignement ou un trait d'union.
3. Saisissez « Nom de la commande » et « Commande ». Placez chaque commande sur une ligne distincte lorsque vous utilisez plusieurs lignes.
4. Ajoutez une description et choisissez une icône ou une image sur la carte SD si nécessaire.
5. Vérifiez le mode d'exécution et les options de correspondance de sortie, puis sélectionnez « Enregistrer ».

Le nom vous aide à reconnaître une commande ; L'automatisation utilise son identifiant pour le trouver. Vous ne pouvez pas modifier l'ID d'une commande existante. Pour utiliser un nouvel ID, créez une commande et mettez à jour les modèles et les sources qui l'utilisent.

### Exécuter une commande et consulter le résultat

1. Sélectionnez le contrôle d'exécution sur une carte de commande.
2. Regardez la sortie et l'état sous « Résultat de l'exécution ».
3. Lorsque « Annuler » s'affiche, utilisez-le pour demander l'interruption de la session en cours. Vérifiez l'état et la sortie pour confirmer s'ils se sont arrêtés. Les opérations à distance terminées ne sont pas annulées.
4. Sélectionnez « Effacer » pour supprimer l'affichage du résultat actuel.

« Effacer » n’annule pas ce qui a déjà été exécuté sur l’hôte distant. Le classement en réussite ou en échec, le contenu extrait et l’état final dépendent des critères configurés pour la commande.

### Configurer la correspondance des résultats

La correspondance des résultats convertit la sortie distante en un état plus facile à utiliser.

- « Correspondance attendue » : marque le résultat comme réussi lorsque la sortie contient le texte configuré.
- « Fail Match » : marque l'échec du résultat lorsque la sortie contient le texte configuré.
- « Extraire l'expression régulière » : utilise un groupe de capture `(.*)` pour enregistrer la sortie sélectionnée.
- « Stop on match » : termine une commande continue après une correspondance réussie.
- « Timeout (s) » : définit le temps d'attente pour une correspondance, en secondes. Cela s'applique uniquement lorsqu'un modèle de réussite ou d'échec est défini ou que « Arrêt en cas de correspondance » est activé.
- « Nom de la variable » : enregistre l'état et la sortie extraite pour une utilisation sur la page Automatisation.

Choisissez un texte de réussite et d'échec stable et spécifique. Un texte large peut produire des correspondances incorrectes. Exécutez la commande une fois et examinez les « Résultats de correspondance » avant d'utiliser ses variables dans une règle.

### Utiliser l'exécution en arrière-plan et le mode service

nohup signifie qu'une commande continue de s'exécuter en arrière-plan de l'hôte distant après la fermeture de la connexion SSH. La fermeture de WebUI n'arrête pas une tâche en arrière-plan.

Après avoir activé « Exécuter en arrière-plan (nohup) », vous pouvez utiliser :

- « Afficher le journal » : lit le journal actuel des tâches en arrière-plan.
- « Tail Log » : actualisez continuellement le journal.
- « Stop Tail » : Arrête de rafraîchir la page sans arrêter la tâche distante.
- « Vérifier le processus » : vérifiez si la tâche en arrière-plan est toujours en cours d'exécution.
- « Arrêter le processus » : demander l'arrêt de la tâche en arrière-plan, puis vérifier son état.

Si « Voir le journal » ou « Vérifier le processus » échoue, lisez le motif et vérifiez la connexion à l’hôte. Un échec de lecture ne signifie ni que le journal est vide ni que le processus est terminé. Vérifiez à nouveau après avoir rétabli la connexion. Ne relancez pas une tâche parce que la vérification de son état a échoué.

« Mode service » surveille une tâche en arrière-plan jusqu’à sa disponibilité. Renseignez « Critère de disponibilité » et « Nom de variable ». Ajustez si nécessaire le critère d’échec et les délais :
- « Ready match » : marque le service prêt lorsque le texte configuré apparaît. Utilisez `|` pour séparer plusieurs modèles.
- « Fail Match » : marque l'échec du service lorsque le texte configuré apparaît.
- « Délai d'expiration (s) prêt » : définit l'attente la plus longue pour l'état prêt, en secondes.
- « Intervalle de vérification (ms) » : définit la fréquence à laquelle le journal est vérifié, en millisecondes ; 1000 ms est 1 deuxième.
- « Nom de la variable » : stocke les états tels que la vérification, la préparation et le délai d'attente.

<!-- operational-note -->
« Arrêter le suivi » arrête seulement l’actualisation du journal sur la page. « Arrêter le processus » demande l’arrêt de la tâche en arrière-plan ; vérifiez son état ensuite. Une tâche en mode service peut être en cours de démarrage, de vérification ou d’arrêt, ou avoir un état non confirmé. Une demande acceptée n’est pas un résultat final. Vérifiez tout état inconnu et confirmez l’arrêt avant de relancer la tâche.

### Importer et exporter des commandes

- Utilisez le bouton d'exportation d'une commande pour l'exporter et, une fois sélectionné, inclure sa configuration d'hôte dépendante.
- Sélectionnez « Importer une commande », choisissez un package de configuration `.tscfg`, prévisualisez son contenu et choisissez si vous souhaitez écraser une configuration existante ou la lier à un hôte actuellement affiché sur la page.

L’importation peut remplacer une configuration ayant le même ID et inclure des données d’hôte distant. Suivez le guide de sécurité pour vérifier l’origine et la signature. Si un redémarrage est requis, terminez les tâches du terminal et de l’automatisation avant de redémarrer.

### Vérifiez quelles règles utilisent une commande avant de la supprimer

La suppression d'une commande n'annule pas les opérations terminées sur l'hôte distant et ne peut pas être annulée à partir de la page Commandes. Vérifiez d’abord si les sources, les modèles ou les règles en ont encore besoin.

- Service en cours d'exécution ou état inconnu : sélectionnez l'icône d'actualisation de la commande pour vérifier son état. Arrêtez-le si nécessaire et confirmez le résultat. Attendez la fin de tout démarrage, arrêt ou vérification. Le bouton Supprimer n'arrête pas la tâche distante.
- Service arrêté mais suppression bloquée : Vérifiez quelles règles importées utilisent toujours la commande. Mettez d'abord à jour ces règles. L'arrêt d'un service ou du moteur d'automatisation laisse la commande dans ces règles. La modification de l'hôte de la commande ou le remplacement de la configuration de l'hôte peuvent également être bloqués.
- Règle en lecture seule ou en attente de redémarrage : Suivre le chapitre 12. Ne supprimez pas les fichiers SD pour contourner la protection. Vérifiez les règles et les connexions révisées avant de supprimer la configuration inutile.

## 12. Gestion de l'automatisation

« Automation » connecte les données et les opérations dans des flux de travail reproductibles. Créez des sources de données et des modèles d'action, puis utilisez des règles pour décider quand les exécuter.

```text
Automatic: Data source → Variable → Rule evaluation → Actions
Manual: System-page Quick Action → Actions
```

Les sources lisent les données, les variables contiennent des valeurs, les règles évaluent les conditions et les modèles définissent les tâches. Afficher une règle sur le panneau et autoriser l'exécution manuelle sont des paramètres distincts. Des règles automatiques peuvent également apparaître sur le panneau.

### Afficher et contrôler le moteur d'automatisation

Le haut de la page affiche l'état du moteur, le nombre de règles, de variables et de sources, le nombre de déclencheurs et le temps d'exécution.

| Commande | Effet |
| --- | --- |
| « Démarrer » | Démarre un moteur arrêté et commence le traitement des règles activées. |
| « Pause » | Suspend toute évaluation automatique ultérieure. Les actions existantes peuvent se poursuivre. Pour reprendre la page, arrêtez le moteur, puis démarrez-le. |
| « Arrêter » | Tente d'arrêter les vérifications de règles, la lecture des données et la planification d'actions ultérieures, tout en conservant la configuration. Attendez la confirmation ; un timeout ne signifie pas que le moteur s'est arrêté. |
| « Recharger » | Lit à nouveau la configuration enregistrée ; un moteur qui tournait reprend après le chargement. Enregistrez d'abord les modifications. Bloqué pendant que les règles attendent le redémarrage ; il ne peut pas remplacer un redémarrage de l'appareil. |

Vérifiez si le refroidissement, les alertes ou d'autres tâches en cours dépendent de l'automatisation. L'arrêt du moteur n'arrête pas un processus en arrière-plan distant. Arrêtez les tâches à distance à partir des commandes ou de la carte de service appropriée et confirmez le résultat.

### Créez un flux de travail d'automatisation minimal

1. Créez une source et utilisez son test pour vérifier la connexion et les champs sélectionnés.
2. Activez-le, puis utilisez l'icône « Afficher les variables » de la ligne pour vérifier les valeurs et mettre à jour les heures.
3. Créez un modèle, vérifiez ses paramètres et sélectionnez « Test ». Les tests exécutent l’action immédiatement ; confirmez que l'appareil et l'hôte peuvent l'accepter.
4. Créez une règle avec « Activer immédiatement » désactivé. Définissez les conditions, le temps de recharge, l'ordre d'action, les délais et la répétition.
5. Réglez « Afficher sur le panneau » et « Autoriser le déclenchement manuel » selon vos besoins.
6. Enregistrez, puis activez la règle. Vérifiez les variables, le nombre de déclencheurs et les résultats réels.

### Gérer les sources de données

Sélectionnez « Ajouter » sous « Sources de données » et choisissez un type : Type

| Type | Objectif |
| --- | --- |
| «API REST» | Lit périodiquement les données d'une adresse HTTP. |
| « WebSocket » | Reçoit les données transmises via une connexion persistante. |
| « Socket.IO » | Reçoit les événements d'un service Socket.IO. |
| « Variable de commande » | Lit les résultats d'une commande à distance configurée. |

1. Entrez un ID unique, une étiquette d'affichage et les informations de connexion requises.
2. Utilisez le test pour vérifier la connexion. Obtenez les adresses, les détails d'authentification et les informations de champ auprès du fournisseur de données.
3. Pour les trois premiers types, sélectionnez les champs de la réponse du test. Laisser un nom d’événement Socket.IO vide permet au test de tenter la découverte d’événements.
4. Pour une variable de commande, sélectionnez l'hôte et une commande avec un nom de variable configuré, puis définissez l'intervalle d'interrogation.
5. Enregistrez et activez la source. Utilisez son contrôle « Afficher les variables » pour vérifier le résultat.

Chaque ligne de source propose un interrupteur d’activation et des commandes pour voir les variables, exporter ou supprimer. Avant de désactiver ou de supprimer une source, vérifiez les règles qui l’utilisent pour ne pas interrompre leurs tâches.

Importer et exporter des packages de configuration. Prévisualisez les ID, les types et les remplacements avant l’importation, et suivez le Guide de sécurité pour connaître les exigences en matière de source et de confiance.

### Afficher les variables

Sélectionnez l'icône « Afficher les variables » en forme d'œil sur une ligne source. La fenêtre affiche les noms, les types, les valeurs et les heures de mise à jour. Les variables de la commande à distance peuvent également être visualisées à partir du contrôle des variables de la commande.

- Confirmez les noms et la source, et vérifiez que les valeurs et les types correspondent aux comparaisons de la règle.
- Vérifiez si les heures de mise à jour correspondent à la fréquence de données attendue.
- Si aucune donnée n'est disponible, vérifiez que la source est activée, puis testez la connexion et les champs. Pour les variables de commande, vérifiez également le résultat de l’exécution de la commande.

### Créer et tester des modèles d'action

Sélectionnez « Ajouter » sous « Modèles d'action » et choisissez un type de tâche :

| Type | Objectif |
| --- | --- |
| « Commande CLI » | Exécute une commande de console de périphérique locale. |
| « Commande SSH » | Exécute une commande à distance enregistrée sur la page Commandes. |
| « Contrôle LED » | Contrôle les couleurs, les effets ou le contenu des LED. |
| « Journal » | Écrit un message au niveau sélectionné. |
| « Définir la variable » | Attribue une valeur à une variable d'automatisation. |
| « Webhook » | L'option reste visible, mais l'exécution de l'action n'est pas implémentée. Il ne peut actuellement pas envoyer de demande. |

Entrez un ID unique, un nom et les paramètres spécifiques au type. Définissez un délai ou une « exécution asynchrone » si nécessaire. Une action asynchrone se poursuit en arrière-plan ; vérifiez son résultat final via les journaux, les variables ou le périphérique cible.

- CLI : saisissez la commande. Vous pouvez ajouter une variable de résultat et un délai d’expiration.
- SSH : choisissez un hôte et une commande configurés, puis vérifiez l'aperçu.
- LED : choisissez l’appareil et une opération prise en charge pour la couleur, l’effet, la luminosité, le texte, l’image, le code QR ou le filtre.
- Journal : choisissez le niveau et le message. Le message peut faire référence à des variables.
- Définir la variable : saisissez le nom et la valeur de la variable.
- Webhook : actuellement indisponible. Choisissez plutôt une action prise en charge. Les packages de règles contenant des actions Webhook ne peuvent pas non plus être importés.

« Test » exécute l'action. Vérifiez l'effet des opérations d'alimentation, de redémarrage, de commande à distance ou de demande externe avant de procéder au test.

Après l'édition, enregistrez et vérifiez les paramètres. Si l’enregistrement échoue, conservez le brouillon et corrigez le problème signalé. Les importations peuvent remplacer les modèles ; vérifiez quelles règles utilisent un modèle avant de le supprimer. Si un service lié n’est pas confirmé arrêté, vérifiez-le. Arrêtez-le si nécessaire et confirmez le résultat.

### Suivre les messages de suppression du modèle d'action

Si « Impossible de supprimer le modèle d'action » apparaît, lisez d'abord la raison. Le modèle n'a pas été supprimé : Les règles

1. Des règles utilisent encore le modèle : sélectionnez « Voir les règles ». Retirez le modèle de ces règles ou supprimez les règles inutiles dont la suppression est autorisée. Supprimez ensuite le modèle. Désactiver une règle ou arrêter le moteur ne retire pas le modèle de la règle.
2. Le service n’est pas arrêté : sélectionnez « Voir les commandes ». Vérifiez son état, arrêtez-le et confirmez le résultat avant de revenir supprimer le modèle.
3. Mise à jour ou chargement de la configuration : attendez la fin. Récupération nécessaire ou vérification de l'utilisation indisponible : ouvrez les « Journaux système » sur le terminal, recherchez la cause et restaurez la configuration. Ne continuez pas à sélectionner Supprimer.

Vous ne pouvez pas modifier directement une règle en lecture seule importée. Demandez au fournisseur de configuration de réviser son package et de supprimer le modèle inutile.

Si l'enregistrement d'une règle signale qu'un modèle n'existe plus, l'enregistrement n'a pas réussi. Sélectionnez un modèle existant, examinez-le et enregistrez-le à nouveau.

### Créer une règle

1. Sélectionnez « Ajouter » sous « Règles » et entrez un identifiant, un nom et une icône uniques.
2. Choisissez « Logique » : ET requiert toutes les conditions ; OU nécessite n’importe quelle condition.
3. Définit le temps de recharge pour les déclencheurs automatiques. Les valeurs sont en ms ; 1000 ms est 1 deuxième.
4. Ajoutez des conditions et choisissez une variable, une comparaison et une valeur. Les comparaisons incluent égal, différent, supérieur à, supérieur ou égal, inférieur à, inférieur ou égal, valeur modifiée et contient. Faites correspondre le type de valeur à la variable.
5. Ajoutez des modèles et définissez les délais d'action, la répétition et les conditions au niveau de l'action.
6. Définissez « Afficher sur le panneau » et « Autoriser le déclenchement manuel ». Le premier contrôle la visibilité de la carte sur le système ; le second contrôle l’exécution manuelle.
7. Vérifiez, enregistrez, puis activez la règle. Laissez « Activer immédiatement » désactivé lors de la configuration pour la première fois.

Si l’enregistrement, l’activation ou la désactivation signale « La copie de sauvegarde n’est pas synchronisée », l’opération a réussi, mais la sauvegarde ne s’est pas synchronisée. Ce n’est ni un échec d’enregistrement ni une demande de redémarrage. Ne retirez pas et ne remplacez pas la carte SD. Actualisez la liste, puis vérifiez le contenu et l’état de la règle ; ne la créez pas à nouveau. Si l’avertissement persiste, ouvrez « Journaux système » dans Terminal pour vérifier le stockage.

<!-- operational-note -->
Faites correspondre la valeur au type sélectionné. Pour un nombre, saisissez une valeur spécifique, pas l'infini ou NaN (un nombre non valide). Saisissez du texte, un booléen (vrai ou faux) ou null pour les autres types. N'entrez pas un objet ou un tableau JSON entier. Si la page signale une erreur, vérifiez la variable, la comparaison et la valeur avant de réenregistrer.

### Configurer les conditions de répétition et d'action

| Mode | Signification |
| --- | --- |
| « Une fois » | S'exécute une fois par déclencheur. |
| « Répéter en étant vrai » | Se répète tant que la condition de l'action est respectée, jusqu'à 100 fois par exécution. |
| « Nombre fixe » | Se répète pour le nombre et l'intervalle configurés, en vérifiant la condition d'action avant chaque exécution. |

Les conditions d'action sont distinctes des conditions de déclenchement de règle. Sans condition d'action, « Répéter tant que vrai » continue jusqu'à la limite par exécution. La règle peut déclencher une autre exécution ultérieurement.

La désactivation d'une règle empêche de nouveaux déclencheurs ; une course déjà commencée peut continuer. Pour arrêter de programmer des actions ultérieures, sélectionnez la commande « Stop » du moteur et attendez la confirmation. Vérifiez séparément les actions déjà envoyées et les processus distants. Les opérations terminées ne sont pas annulées.

### Créer une action rapide

« Déclenchement manuel uniquement », « Afficher sur le panneau » et « Autoriser le déclenchement manuel » contrôlent si une règle s'exécute uniquement manuellement, si sa carte est visible et si les utilisateurs peuvent l'exécuter.

1. Saisissez l'ID, le nom et l'icône, puis activez « Déclenchement manuel uniquement ». Une telle règle ne nécessite aucune condition de déclenchement automatique.
2. Ajoutez des modèles et examinez les retards, les répétitions et les conditions d'action.
3. Activez « Afficher sur le panneau » et « Autoriser le déclenchement manuel », puis enregistrez et activez la règle.
4. Revenez au panneau des périphériques système. Vérifiez le nom et l'état de la carte, exécutez-la une fois et examinez le résultat.

Les règles automatiques peuvent aussi apparaître sur le panneau. Afficher une carte ne rend pas sa règle exclusivement manuelle. Une règle désactivée peut rester visible, mais sa tâche ne peut pas démarrer. Donnez des noms clairs aux actions destinées à admin et prévoyez des commandes de journal ou d’arrêt adaptées.

### Importer un package de configuration de règles

Importez des packages de règles sur Automation, et non via la fonction « Vérification uniquement » de sécurité ou le téléchargement de fichiers. Ce contrôle vérifie si le signataire est fiable, si le package appartient à cet appareil et si la configuration requise est présente. Son résultat de vérification ne s’applique pas aux autres types de packages.

Avant d'importer, préparez :

- Vérifiez que la carte SD est montée et accessible en écriture. Les paquets y sont enregistrés. Laissez-la insérée après l’importation et ne la retirez pas ou ne la remplacez pas tant qu’un redémarrage est en attente.
- L'appareil dispose d'un certificat valide, de sa clé privée correspondante et d'une chaîne d'autorité de certification ; son heure est vérifiée. Une chaîne d'autorité de certification vérifie l'origine des certificats. Consultez le Guide de sécurité pour connaître les étapes d'installation.
- Vérifiez que l’administrateur du déploiement a choisi un signataire de confiance. La connexion root ou l’installation de certificats HTTPS ne remplace pas ce réglage. S’il manque, demandez à cet administrateur de le configurer.
- Les modèles, commandes et hôtes de la règle sont prêts. Import ne les installe pas pour vous. Ajoutez d'abord toute configuration manquante. Si la règle est activée, vérifiez également l'état d'activation de la configuration qu'elle utilise.

Un redémarrage interrompt les services WebUI et de gestion des appareils. Vérifiez si la règle est activée et s'exécutera automatiquement. Confirmez qu'il peut s'exécuter après le redémarrage avant de l'importer. S'il doit rester inactif, demandez au fournisseur une version désactivée. Le redémarrage de TianshanOS n'arrête pas les processus en arrière-plan sur les hôtes distants.

1. Sélectionnez l'icône d'importation sous « Règles » pour ouvrir « Importer la configuration des règles », puis choisissez le fichier `.tscfg`. La vérification démarre et la page affiche un aperçu.
2. Attendez « Confiance de signature, périphérique cible et contenu des règles vérifiés ». Vérifiez le nom, l'ID de la règle et le « Résumé de la règle ». Développez « Afficher le contenu des règles » pour examiner les conditions, les actions, les cibles et l'état d'activation ; ne vous fiez pas au nom du fichier.
3. Si le même ID existe, lisez « Impact de l'écrasement ». Sélectionnez « Écraser la configuration existante » uniquement si vous souhaitez remplacer la version enregistrée. Si le fichier, les informations d'identification ou la configuration changent après l'aperçu, sélectionnez à nouveau le fichier et revérifiez-le.
4. Sélectionnez « Confirmer l'importation » et attendez. "Enregistré ; prend effet après le redémarrage. La version en cours d'exécution n'a pas changé. " confirme le stockage, pas que la nouvelle règle est en cours d'exécution. Si la page indique que la configuration est déjà enregistrée et active, cette importation répétée ne nécessite pas un autre redémarrage.
5. Si un redémarrage est nécessaire, enregistrez les autres travaux et examinez les tâches d'automatisation et à distance, puis redémarrez TianshanOS à partir du système. Gardez la même carte SD installée et attendez le retour de WebUI.
6. Revenez à Automation et confirmez que l'étiquette de redémarrage en attente de la règle a disparu. Vérifiez son état d'activation, les variables requises et les journaux. Si la règle permet une vérification manuelle sécurisée, exécutez-la une fois et vérifiez le résultat du périphérique ou de l'hôte distant. Pour les règles qui ne peuvent pas être exécutées manuellement, surveillez les journaux et les résultats après un déclenchement normal. Ne vous fiez pas uniquement au message de sauvegarde.

Les paquets de règles importés sont en lecture seule. Vous ne pouvez pas les modifier, les activer, les désactiver ou les supprimer depuis la page. Demandez au fournisseur un paquet révisé pour cet appareil, puis importez-le en suivant ces étapes. Pour désactiver une règle, obtenez une version désactivée et redémarrez selon les indications. L’ancienne version peut continuer à fonctionner jusqu’au redémarrage.

La commande « Stop » du moteur arrête la programmation d'actions ultérieures. Il ne modifie pas les règles et n'annule pas les opérations terminées. Arrêtez les tâches en arrière-plan distantes séparément et confirmez le résultat.

Après la modification ou l'importation, vérifiez le moteur, les règles et les résultats des tâches. Rechargez ou redémarrez comme indiqué, puis confirmez que les tâches fonctionnent. Le tableau ci-dessous explique les restrictions en lecture seule et en attente de redémarrage.

### Distinguer la version enregistrée de la version en cours d’exécution

| Message ou état de la page | Que faire |
| --- | --- |
| « Enregistré ; redémarrage requis » | La nouvelle configuration est enregistrée mais pas encore utilisée. Les modifications ordinaires, les commutateurs d'activation et la suppression ne sont pas disponibles. Organisez un redémarrage de l'appareil. |
| Une ancienne version est déjà en cours d'exécution | Jusqu'au redémarrage, l'ancienne règle peut toujours s'exécuter. Le bouton manuel indique « Exécuter l'ancienne version actuelle » ; vérifiez son effet avant de l'exécuter. L'exportation renvoie la version en cours d'exécution, pas le nouveau package en attente. |
| Nouvelle règle pas encore chargée | L'exécution manuelle n'est pas disponible. Redémarrez, puis vérifiez son état d'activation et ses autorisations manuelles. |
| « Suppression enregistrée ; la suppression nécessite un redémarrage » | La règle quitte la liste en cours d'exécution après le redémarrage. Aucune nouvelle exécution manuelle ou automatique ne peut démarrer. Vérifiez séparément les actions déjà envoyées et les tâches distantes. Confirmez la suppression après le redémarrage. |
| Règle en lecture seule | Les contrôles d'édition, d'activation, de désactivation et de suppression ordinaires restent indisponibles après la disparition de l'étiquette de redémarrage en attente. Obtenez et importez un package révisé comme décrit ci-dessus. |

Toutes les sauvegardes ne nécessitent pas un redémarrage. La création, la modification ou l'activation d'une règle modifiable met à jour la règle actuelle lorsque l'opération réussit. Le désactiver aussi. Vérifiez le résultat de l'opération et l'état de la règle.

« Recharger » n'est pas disponible pendant que les règles attendent le redémarrage. L'arrêt et le démarrage du moteur ne changent pas ces versions ; redémarrez l'appareil.

### Si l’importation ne se termine pas

#### Échec de la vérification

| Message ou problème | Étape suivante |
| --- | --- |
| Racine de confiance de signature non définie, signataire non fiable ou non autorisé | Demandez à l'administrateur de déploiement ou au fournisseur de configuration de vérifier la source de signature et les autorisations du certificat. Ne remplacez pas l'option « Vérifier uniquement » de Sécurité et ne désactivez pas la vérification. |
| Le paquet est destiné à un autre appareil | Demandez au fournisseur de l'exporter à l'aide du certificat de cet appareil ; ne changez pas le nom à l’intérieur du package. Organisez des packages de remplacement correspondants avant de modifier également le certificat de cet appareil. |
| L’heure de l’appareil n’est pas vérifiée | Vérifiez et synchronisez l'heure sous « Réseau et heure » sur le système, puis vérifiez à nouveau le fichier. |
| Chargement de la configuration | Attendez la fin, puis vérifiez à nouveau le package. |
| La configuration n’a pas pu être chargée | Vérifiez les journaux système, résolvez la cause et restaurez la configuration avant de vérifier à nouveau. |
| Configuration requise manquante | Ajoutez le modèle, la commande ou l'hôte nommé par la page, puis vérifiez à nouveau. |
| Configuration requise désactivée | Vérifiez s'il doit être activé. Une fois que l'exécution est sûre, activez-la et vérifiez à nouveau. |
| Un service lié est en cours d'exécution ou son état n'est pas confirmé | Vérifiez le service sur les commandes. Arrêtez-le si nécessaire et confirmez le résultat. Attendez la fin de tout démarrage, arrêt ou vérification en cours, puis sélectionnez à nouveau le fichier et revérifiez-le. |
| Action non prise en charge | Demandez au fournisseur de réviser le package. L'importation de packages de règles rejette actuellement les actions Webhook ; leur présence dans le sélecteur de modèle ne signifie pas que le package peut être importé. |
| Le fichier, les identifiants ou la configuration ont changé depuis la prévisualisation | Sélectionnez à nouveau le fichier, revérifiez-le et examinez l'impact de l'écrasement avant de confirmer. |

#### Enregistrer incomplet Carte

| Message ou problème | Étape suivante |
| --- | --- |
| SD indisponible | Vérifiez que la carte est insérée, montée et inscriptible, puis vérifiez à nouveau. |
| Source de configuration en lecture seule | Restaurer une source inscriptible. Ne supprimez pas de fichiers pour contourner la protection. |
| Enregistrer peu fiable | Vérifiez le stockage, résolvez le problème et vérifiez à nouveau. |
| Le résultat de l’enregistrement n’est pas confirmé | Actualisez la liste des règles et vérifiez la règle et l'état en attente de redémarrage. Si cela reste incertain, inspectez les journaux système. Conservez le fichier original et ne répétez pas l'importation. |

Une variable de condition sans échantillon ne signifie pas nécessairement qu'il manque une configuration ; vérifiez quand il sera mis à jour. Si les anciens objets de stockage doivent être nettoyés, laissez la carte SD installée et vérifiez après le redémarrage.

### Gérer les règles et la configuration

- L'exécution manuelle nécessite une règle activée qui autorise les déclencheurs manuels, sans qu'aucune exécution de la même règle ne soit déjà en cours. Il contourne les conditions de déclenchement automatique et le temps de recharge, mais applique toujours les conditions d'action, les délais et la répétition.
- La désactivation n’annule pas les actions terminées. La suppression ne peut pas être annulée à partir de la page.
- Avant de modifier des sources, des modèles ou des commandes, vérifiez quelles règles les utilisent. Vérifiez ou arrêtez tout service lié en cours d'exécution, inconnu ou en cours de traitement d'une opération. Si une règle utilise toujours la configuration, révisez-la également ; l'arrêt du service ne supprime pas cette utilisation.
- Utilisez le flux dédié de ce chapitre pour les packages de règles. Suivez le Guide de sécurité pour les autres packages ; le résultat de la vérification de l’ensemble de règles ne s’applique pas à eux.
- Si l'enregistrement échoue, lisez le message et conservez le brouillon. Si l'enregistrement a réussi mais que l'actualisation a échoué, actualisez et vérifiez la liste avant de créer un autre élément.
