<?php
/**
 * ComptaPaie — traitement du formulaire de contact.
 *
 * - Accepte uniquement les requêtes POST.
 * - Protections : champ piège (honeypot), vérification de l'origine,
 *   limitation de fréquence par IP, nettoyage des en-têtes (anti-injection).
 * - Répond en JSON (appel fetch) ou par redirection (envoi classique).
 * - Le destinataire se règle dans contact-config.php.
 */

declare(strict_types=1);

require __DIR__ . '/contact-config.php';

$wantsJson = (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'fetch');

function respond(bool $ok, string $error, bool $json): void
{
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: contact.html' . ($ok ? '?sent=1' : '?error=1'), true, 303);
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
$host = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) {
    respond(false, 'Requête refusée.', $wantsJson);
}

// 2. Honeypot : un robot remplit ce champ, pas un humain. On feint le succès.
if (!empty($_POST['website'])) {
    respond(true, '', $wantsJson);
}

// 3. Limitation de fréquence (par IP, fenêtre glissante d'une heure).
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateFile = sys_get_temp_dir() . '/comptapaye_rate_' . hash('sha256', $ip . '|' . __DIR__);
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter(array_map('intval', (array) file($rateFile, FILE_IGNORE_NEW_LINES)), static function (int $t) use ($now): bool {
        return $t > $now - 3600;
    });
}
if (count($hits) >= $CONTACT_MAX_PER_HOUR) {
    respond(false, 'Trop de messages envoyés. Merci de réessayer plus tard ou de nous écrire par e-mail.', $wantsJson);
}

// 4. Validation.
$name = clean((string) ($_POST['name'] ?? ''), 120);
$email = clean((string) ($_POST['email'] ?? ''), 160);
$phone = clean((string) ($_POST['phone'] ?? ''), 30);
$company = clean((string) ($_POST['company'] ?? ''), 120);
$subjectKey = clean((string) ($_POST['subject'] ?? 'devis'), 30);
$message = trim(str_replace("\0", '', (string) ($_POST['message'] ?? '')));
$message = mb_substr($message, 0, 5000);
$consent = !empty($_POST['consent']);

$subjects = [
    'devis' => 'Demande de devis',
    'comptabilite' => 'Comptabilité',
    'paie' => 'Paie et social',
    'juridique' => 'Formalités et juridique',
    'conseil' => 'Conseil et gestion',
    'autre' => 'Autre question',
];
$subjectLabel = $subjects[$subjectKey] ?? $subjects['devis'];

if (mb_strlen($name) < 2 || mb_strlen($message) < 10 || !$consent || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Merci de vérifier les champs du formulaire.', $wantsJson);
}

// 5. Envoi.
$mailSubject = '[ComptaPaie] ' . $subjectLabel . ' — ' . $name;
$body = "Nouvelle demande reçue depuis le site.\n\n"
    . "Nom : $name\n"
    . "E-mail : $email\n"
    . 'Téléphone : ' . ($phone !== '' ? $phone : '—') . "\n"
    . 'Entreprise : ' . ($company !== '' ? $company : '—') . "\n"
    . "Sujet : $subjectLabel\n\n"
    . "Message :\n$message\n";

$headers = [
    'From' => $CONTACT_FROM,
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'ComptaPaie-contact',
];

$sent = mail(
    $CONTACT_TO,
    mb_encode_mimeheader($mailSubject, 'UTF-8', 'B', "\r\n"),
    $body,
    $headers
);

if (!$sent) {
    respond(false, 'L’envoi a échoué. Merci de nous écrire directement à ' . $CONTACT_TO . '.', $wantsJson);
}

$hits[] = $now;
@file_put_contents($rateFile, implode("\n", $hits), LOCK_EX);

respond(true, '', $wantsJson);
