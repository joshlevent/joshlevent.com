# Contact forms: replacing Squarespace form blocks

Squarespace form blocks currently write submissions to a Google Sheet. Neither GitHub
Pages nor Cloudflare Workers runs Squarespace's form backend, so this needs its own
mechanism regardless of host. See `docs/HOSTING-GITHUB-PAGES-VS-CLOUDFLARE.md` §3 for the
DNS context: since the domain is leaving Squarespace either way, the "extra DNS work" cost
of Cloudflare nameserver delegation I flagged there is no longer a real differentiator,
you're touching DNS regardless of which host you pick.

## The core mechanism (same on both hosts)

A Google Apps Script deployed as a **Web App** is the direct equivalent of what
Squarespace was doing: it appends a row to a Sheet on every POST. It's free, needs no
third-party vendor, and the client-side call is identical whether the page is served by
GitHub Pages or Cloudflare.

Apps Script (`Code.gs`, bound to the target spreadsheet):

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.company) {
    return respond({ result: 'ignored' });
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Submissions');
  sheet.appendRow([new Date(), data.formId, data.name, data.email, data.message]);
  return respond({ result: 'success' });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy as: Web App, execute as yourself, access "Anyone". Copy the resulting `/exec` URL.

Frontend (any static page, Astro included):

```html
<form id="contact-form">
  <input name="name" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <input name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" />
  <button type="submit">Send</button>
</form>
```

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';

document.getElementById('contact-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  data.formId = 'contact';
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'text/plain' },
  });
  form.reset();
});
```

`Content-Type: text/plain` is deliberate, not a mistake: it avoids a CORS preflight that
Apps Script web apps don't handle cleanly. `e.postData.contents` still gets the raw JSON
string regardless of the declared content type, so `JSON.parse` works fine server-side.

The hidden `company` field is a honeypot: real users never fill it in, bots that
auto-fill every field do, and the script silently drops anything that arrives with it
set.

## GitHub Pages

Ship exactly the above. The page calls Google's endpoint directly; GitHub Pages never
sees the request, so there is nothing to configure on the hosting side. Spam defence is
limited to what you can do client-side (honeypot, plus optionally a hidden timestamp
field checked against `Date.now()` server-side in the Apps Script to reject
sub-second "instant" submissions). No CAPTCHA is realistically available without a
server hop.

## Cloudflare Workers

Cloudflare gives you the one thing GitHub Pages structurally can't: a server-side hop
between the browser and Google, which is where CAPTCHA verification and secret-holding
belong.

Add a small Worker route (`/api/contact`) that the form posts to instead of calling
Apps Script directly:

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    const body = await request.json();
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: body.turnstileToken }),
    }).then((r) => r.json());

    if (!verify.success) {
      return new Response(JSON.stringify({ result: 'failed-captcha' }), { status: 403 });
    }

    await fetch(env.APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'text/plain' },
    });

    return new Response(JSON.stringify({ result: 'success' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

`TURNSTILE_SECRET` and `APPS_SCRIPT_URL` live as Worker secrets, never in client code.
Turnstile itself is Cloudflare's free CAPTCHA widget, add its site key to the form and
the resulting token to `body.turnstileToken` before posting.

This costs you a second deployable (the Worker, alongside the static assets project) and
a couple of secrets to manage, in exchange for real bot filtering and the Apps Script URL
never appearing in page source.

## Recommendation

For a personal site with a handful of low-volume contact forms, the honeypot-only,
direct-to-Apps-Script version is enough, and it's the only version GitHub Pages can run
without a third party. Reach for the Cloudflare Worker/Turnstile version only if the
honeypot proves insufficient in practice (you start seeing spam rows in the Sheet),
rather than building it pre-emptively.

If you'd rather not maintain Apps Script code at all, **Web3Forms** offers Google Sheets
syncing on its free plan and works the same way (form posts to their endpoint) on either
host. Worth knowing that **Formspree's** Sheets integration is gated behind its $90/month
Business plan, so it's not a free-tier option despite being the most commonly recommended
service.
