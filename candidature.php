<?php
/**
 * ComptaPaie — traitement du formulaire de candidature (stage / alternance / emploi).
 *
 * - Accepte uniquement les requêtes POST multipart (CV en pièce jointe).
 * - Contrôles : origine, champ piège (honeypot), limitation de fréquence par IP,
 *   nettoyage des en-têtes, extension ET contenu réel des fichiers (PDF, DOC, DOCX), taille maximale.
 * - Les fichiers ne sont JAMAIS enregistrés sur le serveur : ils sont lus depuis le
 *   dossier temporaire de PHP puis joints à l'e-mail envoyé au cabinet.
 * - Répond en JSON (appel fetch) ou par redirection (envoi classique).
 * - Les réglages (destinataire, taille max) sont dans contact-config.php.
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
        header('Location: candidature.html' . ($ok ? '?sent=1' : '?error=1'), true, 303);
    }
    exit;
}

function clean(string $value, int $max): string
{
    $value = trim(str_replace(["\r", "\n", "\0"], ' ', $value));
    return mb_substr($value, 0, $max);
}

/**
 * Lit et valide un fichier téléversé.
 * Retourne ['ext' => ..., 'mime' => ..., 'data' => ...], ou null (absent ou invalide).
 * En cas d'erreur, $error contient le message à afficher.
 */
function read_upload(string $field, string $label, bool $required, int $maxBytes, string &$error): ?array
{
    $f = $_FILES[$field] ?? null;

    if (!is_array($f) || !isset($f['error']) || is_array($f['error']) || $f['error'] === UPLOAD_ERR_NO_FILE) {
        if ($required) {
            $error = 'Merci de joindre ' . $label . '.';
        }
        return null;
    }
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
        $error = 'Le fichier (' . $label . ') est trop volumineux : 5 Mo maximum.';
        return null;
    }
    if ($f['error'] !== UPLOAD_ERR_OK) {
        $error = 'Le fichier (' . $label . ') n’a pas pu être reçu. Merci de réessayer.';
        return null;
    }
    if (!is_uploaded_file((string) $f['tmp_name'])) {
        $error = 'Fichier invalide (' . $label . ').';
        return null;
    }
    if ((int) $f['size'] <= 0 || (int) $f['size'] > $maxBytes) {
        $error = 'Le fichier (' . $label . ') est vide ou dépasse 5 Mo.';
        return null;
    }

    $ext = strtolower(pathinfo((string) $f['name'], PATHINFO_EXTENSION));
    $data = file_get_contents((string) $f['tmp_name']);
    if ($data === false || $data === '') {
        $error = 'Le fichier (' . $label . ') est illisible.';
        return null;
    }

    // Contrôle du contenu réel (l'extension seule ne suffit pas).
    $mime = '';
    if ($ext === 'pdf' && strpos(substr($data, 0, 1024), '%PDF-') !== false) {
        $mime = 'application/pdf';
    } elseif ($ext === 'docx' && strncmp($data, "PK\x03\x04", 4) === 0) {
        $mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } elseif ($ext === 'doc' && strncmp($data, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1", 8) === 0) {
        $mime = 'application/msword';
    }
    if ($mime === '') {
        $error = 'Format non accepté (' . $label . ') : utilisez un fichier PDF, DOC ou DOCX.';
        return null;
    }

    return ['ext' => $ext, 'mime' => $mime, 'data' => $data];
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
$rateFile = sys_get_temp_dir() . '/comptapaye_career_rate_' . hash('sha256', $ip . '|' . __DIR__);
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

// 4. Validation des champs.
$name = clean((string) ($_POST['name'] ?? ''), 120);
$email = clean((string) ($_POST['email'] ?? ''), 160);
$phone = clean((string) ($_POST['phone'] ?? ''), 30);
$availability = clean((string) ($_POST['availability'] ?? ''), 120);
$kindKey = clean((string) ($_POST['kind'] ?? 'spontanee'), 20);
$domainKey = clean((string) ($_POST['domain'] ?? 'autre'), 20);
$message = mb_substr(trim(str_replace("\0", '', (string) ($_POST['message'] ?? ''))), 0, 3000);
$consent = !empty($_POST['consent']);

$kinds = [
    'stage' => 'Stage',
    'alternance' => 'Alternance',
    'emploi' => 'Emploi (CDI / CDD)',
    'spontanee' => 'Candidature spontanée',
];
$domains = [
    'comptabilite' => 'Comptabilité',
    'paie' => 'Paie et social',
    'fiscal' => 'Fiscal et juridique',
    'conseil' => 'Conseil et gestion',
    'autre' => 'Autre / à discuter',
];
$kindLabel = $kinds[$kindKey] ?? $kinds['spontanee'];
$domainLabel = $domains[$domainKey] ?? $domains['autre'];

if (mb_strlen($name) < 2 || !$consent || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Merci de vérifier les champs du formulaire.', $wantsJson);
}

$error = '';
$cv = read_upload('cv', 'votre CV', true, (int) $CAREERS_MAX_FILE_BYTES, $error);
if ($cv === null) {
    respond(false, $error !== '' ? $error : 'Merci de joindre votre CV.', $wantsJson);
}
$letter = read_upload('letter', 'votre lettre de motivation', false, (int) $CAREERS_MAX_FILE_BYTES, $error);
if ($letter === null && $error !== '') {
    respond(false, $error, $wantsJson);
}

// 5. Construction de l'e-mail (texte + pièces jointes).
$slug = $name;
if (function_exists('iconv')) {
    $tr = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
    if ($tr !== false && $tr !== '') {
        $slug = $tr;
    }
}
$slug = trim((string) preg_replace('/[^A-Za-z0-9]+/', '_', $slug), '_');
$slug = $slug !== '' ? substr($slug, 0, 40) : 'candidat';

$body = "Nouvelle candidature reçue depuis le site.\n\n"
    . "Type : $kindLabel\n"
    . "Domaine souhaité : $domainLabel\n"
    . "Nom : $name\n"
    . "E-mail : $email\n"
    . 'Téléphone : ' . ($phone !== '' ? $phone : '—') . "\n"
    . 'Disponibilité : ' . ($availability !== '' ? $availability : '—') . "\n\n"
    . "Message :\n" . ($message !== '' ? $message : '—') . "\n\n"
    . 'Pièces jointes : CV' . ($letter !== null ? ' + lettre de motivation' : '') . "\n";
$body = (string) preg_replace('/\r\n|\r|\n/', "\r\n", $body);

$boundary = '=_cp_' . bin2hex(random_bytes(12));
$eol = "\r\n";

$payload = '--' . $boundary . $eol
    . 'Content-Type: text/plain; charset=UTF-8' . $eol
    . 'Content-Transfer-Encoding: 8bit' . $eol . $eol
    . $body . $eol;

$attachments = [['CV_' . $slug, $cv]];
if ($letter !== null) {
    $attachments[] = ['Lettre_motivation_' . $slug, $letter];
}
foreach ($attachments as $att) {
    $fileName = $att[0] . '.' . $att[1]['ext'];
    $payload .= '--' . $boundary . $eol
        . 'Content-Type: ' . $att[1]['mime'] . '; name="' . $fileName . '"' . $eol
        . 'Content-Transfer-Encoding: base64' . $eol
        . 'Content-Disposition: attachment; filename="' . $fileName . '"' . $eol . $eol
        . chunk_split(base64_encode($att[1]['data']), 76, $eol) . $eol;
}
$payload .= '--' . $boundary . '--' . $eol;

$headers = [
    'From' => $CONTACT_FROM,
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'multipart/mixed; boundary="' . $boundary . '"',
    'X-Mailer' => 'ComptaPaie-candidature',
];

$subject = '[ComptaPaie] Candidature — ' . $kindLabel . ' — ' . $name;
$sent = mail(
    $CAREERS_TO,
    mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n"),
    $payload,
    $headers
);

if (!$sent) {
    respond(false, 'L’envoi a échoué. Merci de nous écrire directement à ' . $CAREERS_TO . '.', $wantsJson);
}

$hits[] = $now;
@file_put_contents($rateFile, implode("\n", $hits), LOCK_EX);

respond(true, '', $wantsJson);
