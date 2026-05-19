/* =====================================================================
   Artikel-Feedback-Widget  ·  zentral gehostet (Cloudflare Pages)
   ---------------------------------------------------------------------
   Eine Datei fuer ALLE Super-Sites. Aenderungen hier wirken nach dem
   Re-Upload sofort auf jeder Site.

   EINBAU - drei Teile:
   1) Diese Datei auf Cloudflare Pages hochladen (mit _headers + index.html).
   2) PRO SUPER-SITE einmal in die site-weite Code-Injection (Head/Body):
        <script src="https://DEIN-PROJEKT.pages.dev/feedback-widget.js" defer></script>
   3) PRO ARTIKEL (ins Artikel-Template) ein Notion-Code-Block,
      Zeile 1 "super-embed:", darunter:
        <div class="sff-anchor"></div>
      Optional eigener Splitforms-Eingang pro Site:
        <div class="sff-anchor" data-access-key="ANDERER_KEY"></div>

   Kein fetch, kein CORS - die Datei wird als klassisches <script>
   geladen und traegt ihr CSS + HTML selbst.
   ===================================================================== */
(function () {
  'use strict';

  /* ===== KONFIGURATION ===================================================
     Standard-Access-Key (greift, wenn ein Anker kein data-access-key hat).
     Hier ist die EINZIGE Stelle fuer einen siteweiten Schluesselwechsel.   */
  var DEFAULT_ACCESS_KEY = '508305a58cda4945accb3a0128d36ef2';
  var ENDPOINT           = 'https://splitforms.com/api/submit';
  var PLACEHOLDER        = 'DEIN_SPLITFORMS_ACCESS_KEY';
  var MIN_LEN            = 5;
  /* ======================================================================= */

  var CSS = `
    .sff-wrap {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      overflow-wrap: anywhere;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(128,128,128,0.25);
      border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
      font-family: inherit;
      line-height: 1.5;
    }
    .sff-wrap *, .sff-wrap *::before, .sff-wrap *::after {
      box-sizing: border-box;
      min-width: 0;
    }
    .sff-wrap [hidden] { display: none !important; }
    .sff-title { margin: 0 0 0.3rem; font-size: 0.82rem; font-weight: 600; color: inherit; }
    .sff-desc {
      margin: 0 0 0.7rem; font-size: 0.78rem;
      color: rgba(128,128,128,0.95);
      color: color-mix(in srgb, currentColor 58%, transparent);
    }
    .sff-field {
      display: block; width: 100%; max-width: 100%;
      font-family: inherit; font-size: 0.8rem; color: inherit;
      background: rgba(128,128,128,0.08);
      background: color-mix(in srgb, currentColor 6%, transparent);
      border: 1px solid rgba(128,128,128,0.3);
      border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
      border-radius: 7px; padding: 0.55rem 0.65rem;
      resize: vertical; min-height: 78px; outline: none;
      transition: border-color 0.15s ease;
    }
    .sff-field::placeholder {
      color: rgba(128,128,128,0.85);
      color: color-mix(in srgb, currentColor 40%, transparent);
    }
    .sff-field:focus {
      border-color: rgba(128,128,128,0.6);
      border-color: color-mix(in srgb, currentColor 45%, transparent);
    }
    .sff-btn {
      margin-top: 0.5rem; width: 100%; max-width: 100%;
      text-align: center;
      font-family: inherit; font-size: 0.8rem; font-weight: 500; color: inherit;
      background: rgba(128,128,128,0.12);
      background: color-mix(in srgb, currentColor 10%, transparent);
      border: 1px solid rgba(128,128,128,0.3);
      border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
      border-radius: 7px; padding: 0.5rem 0.7rem; cursor: pointer;
      transition: background 0.15s ease, opacity 0.15s ease;
    }
    .sff-btn:hover:not(:disabled) { background: color-mix(in srgb, currentColor 16%, transparent); }
    .sff-btn:disabled { opacity: 0.5; cursor: default; }
    .sff-msg { margin: 0; font-size: 0.78rem; border-radius: 7px; padding: 0.55rem 0.65rem; color: inherit; }
    .sff-msg--ok  { background: color-mix(in srgb, #16a34a 15%, transparent);
                    border: 1px solid color-mix(in srgb, #16a34a 34%, transparent); }
    .sff-msg--err { margin-top: 0.5rem;
                    background: color-mix(in srgb, #dc2626 13%, transparent);
                    border: 1px solid color-mix(in srgb, #dc2626 31%, transparent); }
    .sff-hidden {
      position: absolute !important; width: 1px; height: 1px;
      margin: -1px; padding: 0; border: 0; overflow: hidden;
      clip: rect(0 0 0 0); white-space: nowrap;
    }`;

  /* Widget-Markup - bewusst OHNE id-Attribute (mehrere Instanzen /
     SPA-Navigation wuerden sonst mit doppelten IDs kollidieren). */
  var HTML = `
    <div class="sff-wrap">
      <p class="sff-title">Dein Feedback für diesen Artikel</p>
      <form class="sff-form" novalidate>
        <input type="checkbox" name="botcheck" class="sff-hidden" tabindex="-1" aria-hidden="true">
        <textarea class="sff-field" name="message" aria-label="Dein Feedback"
                  placeholder="Dein Feedback …" rows="4" autocomplete="off"></textarea>
        <button type="submit" class="sff-btn" disabled>Senden</button>
      </form>
      <p class="sff-msg sff-msg--ok"  role="status" aria-live="polite" hidden>Danke! Dein Feedback ist angekommen.</p>
      <p class="sff-msg sff-msg--err" role="alert" hidden>Senden fehlgeschlagen. Bitte versuch es noch einmal.</p>
    </div>`;

  function injectStyles() {
    if (document.getElementById('sff-styles')) return;
    var s = document.createElement('style');
    s.id = 'sff-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* Event-Logik fuer EINE Widget-Instanz */
  function wire(anchor) {
    var form = anchor.querySelector('.sff-form');
    var txt  = anchor.querySelector('.sff-field');
    var bot  = anchor.querySelector('input[name="botcheck"]');
    var btn  = anchor.querySelector('.sff-btn');
    var ok   = anchor.querySelector('.sff-msg--ok');
    var err  = anchor.querySelector('.sff-msg--err');
    if (!form || !txt || !btn || !ok || !err) return;

    /* Key pro Anker: data-access-key gewinnt, sonst der Standard-Key */
    var key = anchor.dataset.accessKey || DEFAULT_ACCESS_KEY;

    txt.addEventListener('input', function () {
      btn.disabled = txt.value.trim().length < MIN_LEN || form.dataset.sffSending === '1';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.sffSending === '1') return;
      if (bot && bot.checked) return;

      var feedback = txt.value.trim();
      if (feedback.length < MIN_LEN) { txt.focus(); return; }

      var body = new URLSearchParams();
      body.set('access_key',    key);
      body.set('message',       feedback);
      body.set('article_url',   window.location.href);
      body.set('article_path',  window.location.pathname);
      body.set('article_title', document.title);
      body.set('submitted_at',  new Date().toISOString());

      form.dataset.sffSending = '1';
      btn.disabled = true;
      btn.textContent = 'Wird gesendet …';
      err.hidden = true;

      var done = function () { form.hidden = true; ok.hidden = false; };
      var fail = function () {
        form.dataset.sffSending = '';
        btn.disabled = false;
        btn.textContent = 'Senden';
        err.hidden = false;
      };

      if (key === PLACEHOLDER) { setTimeout(done, 400); return; }   /* Vorschau-Modus */

      fetch(ENDPOINT, { method: 'POST', body: body })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); done(); })
        .catch(fail);
    });
  }

  function mount(anchor) {
    if (anchor.dataset.sffMounted === '1') return;
    anchor.dataset.sffMounted = '1';   /* Flag VOR innerHTML -> keine Schleife */
    anchor.innerHTML = HTML;
    wire(anchor);
  }

  function scan() {
    var list = document.querySelectorAll('.sff-anchor');
    for (var i = 0; i < list.length; i++) mount(list[i]);
  }

  injectStyles();
  scan();

  /* MutationObserver: faengt den spaet eingefuegten super-embed-Anker
     sowie Supers SPA-Navigation (neuer Anker) ab. Entprellt + idempotent. */
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; scan(); });
  }
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true
  });
})();
