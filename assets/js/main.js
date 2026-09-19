/* ComptaPaye — scripts (vanilla, sans dépendance, sans cookie) */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---- Menu mobile ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMenu(false); }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setMenu(false); }
    });
  }

  /* ---- En-tête : disparaît quand on descend, réapparaît quand on remonte ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    var HIDE_AFTER = 160; // ne masque qu'après ce défilement (px)

    var update = function () {
      var y = window.scrollY;
      var menuOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';
      header.classList.toggle('is-scrolled', y > 8);
      if (menuOpen || y <= HIDE_AFTER || y < lastY - 6) {
        header.classList.remove('is-hidden');   // en haut de page, en remontant, ou menu ouvert
      } else if (y > lastY + 6) {
        header.classList.add('is-hidden');      // en descendant
      }
      lastY = y;
      ticking = false;
    };

    update();
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    // Accessibilité clavier : l'en-tête réapparaît dès qu'un de ses liens reçoit le focus.
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  /* ---- Apparition au défilement ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Année du pied de page ---- */
  var yr = document.getElementById('year');
  if (yr) { yr.textContent = new Date().getFullYear(); }

  /* ---- Formulaires : contact et candidature (avec CV) ---- */
  var form = document.querySelector('#contact-form, #career-form');
  if (form) {
    var alertOk = document.getElementById('form-ok');
    var alertErr = document.getElementById('form-err');
    var submitBtn = form.querySelector('button[type="submit"]');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var showErr = function (field, msg) {
      var box = document.getElementById(field.id + '-error');
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (box) { box.textContent = msg || ''; }
    };

    var isCareer = form.getAttribute('data-kind') === 'career';
    var MAX_FILE = 5 * 1024 * 1024; // 5 Mo
    var FILE_EXT = /\.(pdf|docx?)$/i;

    // Retourne un message d'erreur, ou '' si le fichier est correct.
    var fileError = function (input, required) {
      var f = input.files && input.files[0];
      if (!f) { return required ? 'Merci de joindre votre CV.' : ''; }
      if (!FILE_EXT.test(f.name)) { return 'Format non accepté : utilisez un fichier PDF, DOC ou DOCX.'; }
      if (f.size > MAX_FILE) { return 'Fichier trop volumineux (5 Mo maximum).'; }
      return '';
    };

    var validate = function () {
      var ok = true;
      var name = form.elements['name'];
      var email = form.elements['email'];
      var consent = form.elements['consent'];
      var fields = [name, email, consent];

      showErr(name, name.value.trim().length < 2 ? 'Merci d’indiquer votre nom.' : '');
      showErr(email, !emailRe.test(email.value.trim()) ? 'Merci d’indiquer une adresse e-mail valide.' : '');

      if (isCareer) {
        var cv = form.elements['cv'];
        var letter = form.elements['letter'];
        showErr(cv, fileError(cv, true));
        showErr(letter, fileError(letter, false));
        showErr(consent, !consent.checked ? 'Merci d’accepter le traitement de votre candidature.' : '');
        fields.push(cv, letter);
      } else {
        var message = form.elements['message'];
        showErr(message, message.value.trim().length < 10 ? 'Votre message est un peu court (10 caractères minimum).' : '');
        showErr(consent, !consent.checked ? 'Merci d’accepter le traitement de votre demande.' : '');
        fields.push(message);
      }

      fields.forEach(function (f) {
        if (f.getAttribute('aria-invalid') === 'true') { ok = false; }
      });
      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) { first.focus(); }
      }
      return ok;
    };

    if (/[?&]sent=1/.test(location.search) && alertOk) { alertOk.hidden = false; }
    if (/[?&]error=1/.test(location.search) && alertErr) {
      alertErr.textContent = 'L’envoi a échoué. Merci de vérifier le formulaire ou de nous écrire directement par e-mail.';
      alertErr.hidden = false;
    }

    // Préremplissage depuis les liens ?sujet=… et ?formule=…
    try {
      var params = new URLSearchParams(location.search);
      var subj = params.get('sujet');
      var formule = params.get('formule');
      var select = form.elements['subject'];
      if (subj && select && select.querySelector('option[value="' + subj.replace(/[^a-z-]/g, '') + '"]')) {
        select.value = subj.replace(/[^a-z-]/g, '');
      }
      var names = { 'essentiel': 'Essentiel', 'serenite': 'Sérénité', 'sur-mesure': 'Sur-mesure' };
      if (formule && names[formule] && !form.elements['message'].value) {
        form.elements['message'].value = 'Bonjour, je souhaite un devis pour la formule « ' + names[formule] + ' ».\n\n';
      }
    } catch (err) { /* navigateur ancien : on ignore */ }

    form.addEventListener('submit', function (e) {
      alertOk.hidden = true;
      alertErr.hidden = true;
      if (!validate()) { e.preventDefault(); return; }
      if (!window.fetch) { return; } // repli : envoi classique

      e.preventDefault();
      submitBtn.disabled = true;
      var label = submitBtn.innerHTML;
      submitBtn.textContent = 'Envoi en cours…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'fetch' }
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (data) {
          if (data && data.ok) {
            form.reset();
            alertOk.hidden = false;
            alertOk.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            alertErr.textContent = (data && data.error) || 'L’envoi a échoué. Merci de réessayer ou de nous écrire directement par e-mail.';
            alertErr.hidden = false;
          }
        })
        .catch(function () {
          alertErr.textContent = 'Impossible de joindre le serveur. Merci de réessayer ou de nous écrire directement par e-mail.';
          alertErr.hidden = false;
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = label;
        });
    });
  }

  /* ---- Simulateur brut / net (estimation indicative) ---- */
  var sim = document.getElementById('sim-form');
  if (sim) {
    // Taux moyens approximatifs, hors allègements de charges et cas particuliers.
    var RATES = {
      noncadre: { salarial: 0.22, patronal: 0.42 },
      cadre:    { salarial: 0.25, patronal: 0.45 }
    };
    var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    var out = {
      net: document.getElementById('r-net'),
      brut: document.getElementById('r-brut'),
      sal: document.getElementById('r-sal'),
      cout: document.getElementById('r-cout'),
      annuelNet: document.getElementById('r-annuel-net'),
      annuelCout: document.getElementById('r-annuel-cout'),
      label: document.getElementById('r-label')
    };

    var compute = function () {
      var mode = sim.elements['mode'].value;       // "brut" ou "net"
      var statut = sim.elements['statut'].value;   // "noncadre" ou "cadre"
      var amount = parseFloat(String(sim.elements['montant'].value).replace(',', '.'));
      var r = RATES[statut];

      if (!isFinite(amount) || amount <= 0) {
        Object.keys(out).forEach(function (k) { if (k !== 'label') { out[k].textContent = '—'; } });
        return;
      }
      var brut = mode === 'brut' ? amount : amount / (1 - r.salarial);
      var net = brut * (1 - r.salarial);
      var cout = brut * (1 + r.patronal);

      out.label.textContent = mode === 'brut' ? 'Salaire net avant impôt estimé' : 'Salaire brut estimé';
      out.net.textContent = eur.format(mode === 'brut' ? net : brut);
      out.brut.textContent = eur.format(mode === 'brut' ? brut : net);
      out.sal.textContent = eur.format(brut - net);
      out.cout.textContent = eur.format(cout);
      out.annuelNet.textContent = eur.format(net * 12);
      out.annuelCout.textContent = eur.format(cout * 12);
    };

    // Libellés de la ligne « saisie » selon le mode
    var syncLabels = function () {
      var mode = sim.elements['mode'].value;
      document.getElementById('montant-label').textContent =
        mode === 'brut' ? 'Salaire brut mensuel (€)' : 'Salaire net mensuel avant impôt (€)';
      document.getElementById('r-row1-label').textContent = mode === 'brut' ? 'Salaire brut' : 'Salaire net avant impôt';
    };

    sim.addEventListener('input', function () { syncLabels(); compute(); });
    sim.addEventListener('submit', function (e) { e.preventDefault(); compute(); });
    syncLabels();
    compute();
  }
})();
