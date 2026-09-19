<?php
/**
 * Réglages du formulaire de contact.
 * Ce fichier n'est pas accessible depuis le navigateur (voir .htaccess).
 */

// Adresse qui reçoit les demandes. Créez cette boîte dans hPanel > E-mails.
$CONTACT_TO = 'contact@comptapaie.com';

// Adresse d'expédition des notifications : volontairement sur le domaine qui HÉBERGE le site (comptapaye.com),
// et non comptapaie.com, pour que les e-mails passent les contrôles SPF/DKIM de l'hébergeur (moins de spam).
// Créez cette boîte dans hPanel > E-mails, ou remplacez-la par une adresse existante de ce domaine.
$CONTACT_FROM = 'ComptaPaie <no-reply@comptapaye.com>';

// Adresse qui reçoit les candidatures (stage, alternance, emploi) avec CV en pièce jointe.
$CAREERS_TO = 'contact@comptapaie.com';

// Adresse qui reçoit les annonces déposées par les clients (à valider avant publication).
$ANNONCE_TO = 'contact@comptapaie.com';

// Nombre maximum de messages par visiteur et par heure.
$CONTACT_MAX_PER_HOUR = 5;

// Taille maximale de chaque pièce jointe d'une candidature (en octets) : 5 Mo.
$CAREERS_MAX_FILE_BYTES = 5 * 1024 * 1024;
