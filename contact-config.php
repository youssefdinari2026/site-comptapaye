<?php
/**
 * Réglages du formulaire de contact.
 * Ce fichier n'est pas accessible depuis le navigateur (voir .htaccess).
 */

// Boîte qui REÇOIT les messages des formulaires : volontairement sur le domaine hébergé chez Hostinger (comptapaye.com).
// Le courrier de comptapaie.com est chez OVH : un envoi depuis Hostinger vers OVH peut être filtré ou refusé.
// Pour lire ces messages à une seule adresse, créez dans hPanel > E-mails > Redirections une redirection vers votre boîte habituelle.
$CONTACT_TO = 'contact@comptapaye.com';

// Adresse d'expédition des notifications : volontairement sur le domaine qui HÉBERGE le site (comptapaye.com),
// et non comptapaie.com, pour que les e-mails passent les contrôles SPF/DKIM de l'hébergeur (moins de spam).
// Créez cette boîte dans hPanel > E-mails, ou remplacez-la par une adresse existante de ce domaine.
$CONTACT_FROM = 'ComptaPaie <no-reply@comptapaye.com>';

// Adresse qui reçoit les candidatures (stage, alternance, emploi) avec CV en pièce jointe.
$CAREERS_TO = 'contact@comptapaye.com';

// Adresse qui reçoit les annonces déposées par les clients (à valider avant publication).
$ANNONCE_TO = 'contact@comptapaye.com';

// Nombre maximum de messages par visiteur et par heure.
$CONTACT_MAX_PER_HOUR = 5;

// Taille maximale de chaque pièce jointe d'une candidature (en octets) : 5 Mo.
$CAREERS_MAX_FILE_BYTES = 5 * 1024 * 1024;
