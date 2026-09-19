<?php
/**
 * ComptaPaie — dépôt d'une annonce par un client (page « Offres de nos clients »).
 *
 * Rien n'est publié automatiquement : l'annonce est envoyée par e-mail au cabinet, qui la relit
 * puis la publie en ajoutant le bloc JSON fourni dans le mail au fichier assets/data/annonces.json.
 *
 * - POST uniquement. Protections : origine, honeypot, limitation par IP, nettoyage des en-têtes.
 * - Répond en JSON (appel fetch) ou par redirection (envoi classique).
 */

declare(strict_types=1);

require __DIR__ . '/contact-config.php';

date_default_timezone_set('Europe/Paris');

$wantsJson = (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'fetch');

function respond(bool $ok, string $error, bool $json): void
{
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: offres-clients.html' . ($ok ? '?sent=1' : '?error=1') . '#deposer', true, 303);
    }
    exit;
}

function clean(string $value, int $max): string
{
    $value = trim(str_replace(["\r", "\n", "\0"], ' ', $value));
    return mb_substr($value, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit('Méthode non autorisée.');
}

// 1. Origine : le formulaire doit provenir de ce site.
$host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    respond(false, 'Requête refusée.', $wantsJson);
}

// 2. Honeypot.
if (!empty($_POST['website'])) {
    respond(true, '', $wantsJson);
}

// 3. Limitation de fréquence (par IP, fenêtre glissante d'une heure).
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateFile = sys_get_temp_dir() . '/comptapaye_ad_rate_' . hash('sha256', $ip . '|' . __DIR__);
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter(array_map('intval', (array) file($rateFile, FILE_IGNORE_NEW_LINES)), static function (int $t) use ($now): bool {
        return $t > $now - 3600;
    });
}
if (count($hits) >= $CONTACT_MAX_PER_HOUR) {
    respond(false, 'Trop d’envois récents. Merci de réessayer plus tard ou de nous écrire par e-mail.', $wantsJson);
}

// 4. Validation.
$name = clean((string) ($_POST['name'] ?? ''), 120);
$company = clean((string) ($_POST['company'] ?? ''), 120);
$email = clean((string) ($_POST['email'] ?? ''), 160);
$phone = clean((string) ($_POST['phone'] ?? ''), 30);
$categoryKey = clean((string) ($_POST['category'] ?? 'autre'), 20);
$isClient = (clean((string) ($_POST['client'] ?? 'non'), 3) === 'oui') ? 'oui' : 'non';
$title = clean((string) ($_POST['title'] ?? ''), 100);
$description = mb_substr(trim(str_replace("\0", '', (string) ($_POST['description'] ?? ''))), 0, 800);
$publicContact = clean((string) ($_POST['public_contact'] ?? ''), 150);
$link = clean((string) ($_POST['link'] ?? ''), 200);
$consent = !empty($_POST['consent']);

$categories = ['offre', 'partenaire', 'emploi', 'cession', 'evenement', 'autre'];
if (!in_array($categoryKey, $categories, true)) {
    $categoryKey = 'autre';
}

if ($link !== '') {
    if (!preg_match('#^https?://#i', $link)) {
        $link = 'https://' . $link;
    }
    $scheme = strtolower((string) parse_url($link, PHP_URL_SCHEME));
    if (filter_var($link, FILTER_VALIDATE_URL) === false || !in_array($scheme, ['http', 'https'], true)) {
        respond(false, 'Le lien du site web semble incorrect.', $wantsJson);
    }
}

if (
    mb_strlen($name) < 2 || mb_strlen($company) < 2
    || mb_strlen($title) < 5 || mb_strlen($description) < 20
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || !$consent
) {
    respond(false, 'Merci de vérifier les champs du formulaire.', $wantsJson);
}

// 5. E-mail au cabinet, avec le bloc JSON prêt à être ajouté à assets/data/annonces.json.
$snippet = json_encode([
    'id' => date('Y-m-d') . '-' . substr(bin2hex(random_bytes(3)), 0, 6),
    'date' => date('Y-m-d'),
    'categorie' => $categoryKey,
    'titre' => $title,
    'entreprise' => $company,
    'description' => $description,
    'contact' => $publicContact !== '' ? $publicContact : 'Via le cabinet ComptaPaie',
    'lien' => $link,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

$body = "Nouvelle annonce déposée sur le site (à valider avant publication).\n\n"
    . "Déposant : $name\n"
    . "Entreprise : $company\n"
    . "E-mail : $email\n"
    . 'Téléphone : ' . ($phone !== '' ? $phone : '—') . "\n"
    . "Client du cabinet : $isClient\n"
    . "Type : $categoryKey\n\n"
    . "Titre : $title\n\n"
    . "Description :\n$description\n\n"
    . 'Contact à afficher : ' . ($publicContact !== '' ? $publicContact : '(aucun : « Via le cabinet »)') . "\n"
    . 'Site web : ' . ($link !== '' ? $link : '—') . "\n\n"
    . "----- Pour publier -----\n"
    . "Ajoutez ce bloc dans la liste \"annonces\" du fichier assets/data/annonces.json (après vérification) :\n\n"
    . $snippet . "\n";
$body = (string) preg_replace('/\r\n|\r|\n/', "\r\n", $body);

$headers = [
    'From' => $CONTACT_FROM,
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'ComptaPaie-annonce',
];

$subject = '[ComptaPaie] Nouvelle annonce à valider — ' . $company;
$sent = mail(
    $ANNONCE_TO,
    mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n"),
    $body,
    $headers
);

if (!$sent) {
    respond(false, 'L’envoi a échoué. Merci de nous écrire directement à ' . $ANNONCE_TO . '.', $wantsJson);
}

$hits[] = $now;
@file_put_contents($rateFile, implode("\n", $hits), LOCK_EX);

respond(true, '', $wantsJson);
