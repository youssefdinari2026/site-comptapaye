<?php
/**
 * Réglages du formulaire de contact.
 * Ce fichier n'est pas accessible depuis le navigateur (voir .htaccess).
 */

// Adresse qui reçoit les demandes. Créez cette boîte dans hPanel > E-mails.
$CONTACT_TO = 'contact@comptapaye.com';

// Adresse d'expédition : doit appartenir au domaine du site (meilleure délivrabilité, SPF/DKIM).
$CONTACT_FROM = 'ComptaPaye <no-reply@comptapaye.com>';

// Nombre maximum de messages par visiteur et par heure.
$CONTACT_MAX_PER_HOUR = 5;
