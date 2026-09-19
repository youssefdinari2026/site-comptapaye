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
  var form = document.querySelector('#contact-form, #career-form, #ad-form');
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
    var isAd = form.getAttribute('data-kind') === 'ad';
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
      } else if (isAd) {
        var company = form.elements['company'];
        var adTitle = form.elements['title'];
        var adDesc = form.elements['description'];
        var adLink = form.elements['link'];
        showErr(company, company.value.trim().length < 2 ? 'Merci d’indiquer votre entreprise.' : '');
        showErr(adTitle, adTitle.value.trim().length < 5 ? 'Le titre est trop court (5 caractères minimum).' : '');
        showErr(adDesc, adDesc.value.trim().length < 20 ? 'Décrivez votre annonce en quelques lignes (20 caractères minimum).' : '');
        showErr(adLink, adLink.value.trim() !== '' && !/^(https?:\/\/)?[^\s\/]+\.[^\s\/]{2,}(\/\S*)?$/i.test(adLink.value.trim()) ? 'Ce lien ne semble pas valide.' : '');
        showErr(consent, !consent.checked ? 'Merci de cocher la case pour valider l’envoi.' : '');
        fields.push(company, adTitle, adDesc, adLink);
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

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Accueil : le fond d'écran alterne entre deux photos (fondu + léger zoom) ---- */
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    var bgImgs = heroBg.querySelectorAll('img');
    var bgDots = document.querySelectorAll('.bg-dot');
    var bgPauseBtn = document.querySelector('.bg-pause');
    var bgIndex = 0;
    var bgTimer = null;
    var bgPaused = reduceMotion;    // pas de changement automatique si le visiteur a désactivé les animations

    var showBg = function (n) {
      bgIndex = (n + bgImgs.length) % bgImgs.length;
      bgImgs.forEach(function (im, i) {
        if (i === bgIndex && !im.complete && im.loading === 'lazy') { im.loading = 'eager'; }
        im.classList.toggle('is-active', i === bgIndex);
      });
      bgDots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === bgIndex);
        d.setAttribute('aria-current', i === bgIndex ? 'true' : 'false');
      });
    };
    var stopBg = function () { if (bgTimer) { clearInterval(bgTimer); bgTimer = null; } };
    var startBg = function () {
      stopBg();
      if (!bgPaused && bgImgs.length > 1) { bgTimer = setInterval(function () { showBg(bgIndex + 1); }, 7000); }
    };
    var syncBgPause = function () {
      if (!bgPauseBtn) { return; }
      bgPauseBtn.setAttribute('aria-pressed', bgPaused ? 'true' : 'false');
      bgPauseBtn.setAttribute('aria-label', bgPaused ? 'Reprendre le changement de fond d’écran' : 'Mettre en pause le changement de fond d’écran');
      bgPauseBtn.querySelector('use').setAttribute('href', bgPaused ? '#i-play' : '#i-pause');
    };

    bgDots.forEach(function (d, i) { d.addEventListener('click', function () { showBg(i); startBg(); }); });
    if (bgPauseBtn) { bgPauseBtn.addEventListener('click', function () { bgPaused = !bgPaused; syncBgPause(); startBg(); }); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stopBg(); } else { startBg(); } });
    syncBgPause();
    startBg();
  }

/* ---- Actualités : filtres par thème ---- */
  var newsGrid = document.getElementById('news-grid');
  if (newsGrid) {
    var filterBtns = document.querySelectorAll('.filter-bar .chip-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        newsGrid.querySelectorAll('.news-card').forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-cat') === f;
          card.hidden = !show;
          if (show) { card.classList.add('is-visible'); }
        });
      });
    });
  }

  /* ---- Offres de nos clients : affichage des annonces publiées (assets/data/annonces.json) ---- */
  var adsList = document.getElementById('ads-list');
  if (adsList) {
    var adsEmpty = document.getElementById('ads-empty');
    var adsFilters = document.getElementById('ads-filters');
    var CATS = { offre: 'Offre commerciale', partenaire: 'Recherche de partenaire', emploi: 'Emploi', cession: 'Cession / reprise', evenement: 'Événement', autre: 'Autre' };
    var fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    var el = function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) { n.className = cls; }
      if (text) { n.textContent = text; }   // textContent : aucune injection de HTML possible
      return n;
    };

    var renderAds = function (items, filter) {
      adsList.textContent = '';
      items.filter(function (a) { return filter === 'all' || a.categorie === filter; }).forEach(function (a) {
        var card = el('article', 'ad-card');
        card.appendChild(el('span', 'tag tag--entreprise', CATS[a.categorie] || CATS.autre));
        card.appendChild(el('h3', '', a.titre));
        card.appendChild(el('div', 'ad-company', a.entreprise));
        card.appendChild(el('p', 'ad-desc', a.description));
        var foot = el('div', 'ad-foot');
        if (a.contact) { foot.appendChild(el('span', '', 'Contact : ' + a.contact)); }
        if (a.lien && /^https?:\/\//i.test(a.lien)) {
          var link = el('a', '', 'Voir le site');
          link.href = a.lien; link.target = '_blank'; link.rel = 'noopener noreferrer nofollow ugc';
          foot.appendChild(link);
        }
        if (a.date) {
          var d = new Date(a.date + 'T12:00:00');
          if (!isNaN(d.getTime())) { foot.appendChild(el('span', '', 'Publiée le ' + fmtDate.format(d))); }
        }
        card.appendChild(foot);
        adsList.appendChild(card);
      });
    };

    fetch('assets/data/annonces.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : { annonces: [] }; })
      .catch(function () { return { annonces: [] }; })
      .then(function (data) {
        var today = new Date().toISOString().slice(0, 10);
        var items = (data && Array.isArray(data.annonces) ? data.annonces : [])
          .filter(function (a) { return a && a.titre && a.description && (!a.expire || a.expire >= today); })
          .sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
        if (!items.length) { adsEmpty.hidden = false; return; }
        adsEmpty.hidden = true;

        var cats = [];
        items.forEach(function (a) { if (cats.indexOf(a.categorie) === -1) { cats.push(a.categorie); } });
        if (cats.length > 1) {
          adsFilters.hidden = false;
          var addBtn = function (value, label, pressed) {
            var b = el('button', 'chip-btn', label);
            b.type = 'button';
            b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
            b.addEventListener('click', function () {
              adsFilters.querySelectorAll('.chip-btn').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
              renderAds(items, value);
            });
            adsFilters.appendChild(b);
          };
          addBtn('all', 'Toutes', true);
          cats.forEach(function (c) { addBtn(c, CATS[c] || CATS.autre, false); });
        }
        renderAds(items, 'all');
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
