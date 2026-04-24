---
topic: Autocomplete Attribute Token Reference (incl. webauthn + section-*)
id: 113
slug: autocomplete-token-reference
sources_reviewed: 9
claims: 15
---

# Findings: Autocomplete Attribute Token Reference

**Proposed topic-specific section:** `## Token Reference` (the field-name-token catalog with expected format, anchored to the WHATWG grammar).

## Claims

### Claim 1

- **Text:** WHATWG grammar: `[section-*] [shipping|billing] [home|work|mobile|fax|pager] field-name [webauthn]`. Ordered and strict.
- **Target section:** Context
- **Source URL:** https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- **Pulled quote:** "The `autocomplete` attribute follows this ordered token structure: Optional section prefix: `section-*`; Optional mode: `shipping` or `billing`; Optional contact type: `home`, `work`, `mobile`, `fax`, or `pager`; Field name (required); Optional credential type: `webauthn`."

### Claim 2

- **Text:** `section-*` prefix groups fields in the same logical form section; the portion after `section-` is arbitrary.
- **Target section:** Token Reference
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- **Pulled quote:** "A token whose first eight characters are the string 'section-', case-insensitive, followed by additional characters. All form controls that start with the same token belong to the named group."

### Claim 3

- **Text:** `shipping` / `billing` bind subsequent tokens to a shipping or billing address/contact.
- **Target section:** Token Reference
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- **Pulled quote:** "`shipping`: The field identified by subsequent tokens is part of the shipping address or contact information. `billing`: The field identified by subsequent tokens is part of the billing address or contact information."

### Claim 4

- **Text:** Contact types `home`/`work`/`mobile`/`fax`/`pager` qualify telephone/email fields.
- **Target section:** Token Reference
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- **Pulled quote:** "`home`: The contact type identified by subsequent tokens is for contacting the recipient at their residence. `work`... `mobile`... `fax`... `pager`..."

### Claim 5

- **Text:** Field-name catalog spans identity (`name`, `given-name`, `family-name`, `nickname`, `username`), credentials (`new-password`, `current-password`, `one-time-code`), contact (`tel`, `tel-country-code`, `email`), postal (`street-address`, `address-level1-4`, `country`, `postal-code`), payment (`cc-name`, `cc-number`, `cc-exp`, `cc-csc`, `cc-type`), transaction (`transaction-currency`, `transaction-amount`), demographics (`bday`, `sex`, `language`).
- **Target section:** Token Reference
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- **Pulled quote:** "Normal Fields: name, honorific-prefix, given-name, additional-name, family-name, honorific-suffix, nickname, organization-title, username, new-password, current-password, one-time-code, organization, street-address, address-line1, address-line2, address-line3, address-level4, address-level3, address-level2, address-level1, country, country-name, postal-code, cc-name, cc-given-name, cc-additional-name, cc-family-name, cc-number, cc-exp, cc-exp-month, cc-exp-year, cc-csc, cc-type, transaction-currency, transaction-amount, language, bday, bday-day, bday-month, bday-year, sex, url, photo."

### Claim 6

- **Text:** `new-password` / `current-password` help password managers distinguish signup/change from login flows.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- **Pulled quote:** "`new-password`: A new password. When creating a new account or changing passwords, this should be used for an 'Enter your new password' or 'Confirm new password' field"

### Claim 7

- **Text:** Sign-in forms: pair `autocomplete="username"` on identifier + `autocomplete="current-password"` on password.
- **Target section:** Best Practices
- **Source URL:** https://web.dev/articles/sign-in-form-best-practices
- **Pulled quote:** "For email inputs use `autocomplete=\"username\"`, since `username` is recognized by password managers in modern browsers." "Use `autocomplete=\"current-password\"` and `id=\"current-password\"` for the password input in a sign-in form."

### Claim 8

- **Text:** `webauthn` is the trailing token; with `mediation: 'conditional'` on `navigator.credentials.get()`, the user agent surfaces passkeys inline with the field's autofill menu.
- **Target section:** Passkey Conditional UI (`webauthn` token)
- **Source URL:** https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- **Pulled quote:** "Optionally, a token...for the string 'webauthn', meaning the user agent should show public key credentials available via conditional mediation...webauthn is only valid for input and textarea elements."

### Claim 9

- **Text:** To enable Conditional UI: `autocomplete="username webauthn"` + `navigator.credentials.get({ mediation: 'conditional', ... })`. The call remains pending until the user picks a passkey.
- **Target section:** Example
- **Source URL:** https://web.dev/articles/passkey-form-autofill
- **Pulled quote:** "add the `autocomplete` attribute to your form's username `input` field. Include both `username` and `webauthn` as space-separated values." "The `navigator.credentials.get()` call with `mediation: 'conditional'` remains pending and does not show any UI on its own."

### Claim 10

- **Text:** `autocomplete="one-time-code"` on iOS/macOS Safari 12+ extracts OTP from incoming SMS and offers it via keyboard suggestion; Android Chrome handles this via WebOTP API instead.
- **Target section:** Token Reference
- **Source URL:** https://web.dev/articles/sms-otp-form
- **Pulled quote:** "With `autocomplete=\"one-time-code\"` whenever a user receives an SMS message while a form is open, the operating system will parse the OTP in the SMS heuristically and the keyboard will suggest the OTP for the user to enter."

### Claim 11

- **Text:** `autocomplete="off"` tells the browser not to remember values, but browsers deliberately ignore it on username/password to keep password managers working.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion
- **Pulled quote:** "If a site sets `autocomplete=\"off\"` on a `<form>` element and the form includes username and password input fields, the browser will still offer to remember this login."

### Claim 12

- **Text:** To suppress autofill on an admin-sets-other-user-password field, `autocomplete="new-password"` is respected more consistently than `off`.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion
- **Pulled quote:** "If you are defining a user management page where a user can specify a new password for another person, and therefore, you want to prevent autofilling of password fields, you can use `autocomplete=\"new-password\"`."

### Claim 13

- **Text:** A grouped example: `<input autocomplete="section-user1 billing postal-code">` declares a billing postal code inside the `user1` section.
- **Target section:** Example
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- **Pulled quote:** "`<input autocomplete=\"section-user1 billing postal-code\" />`."

### Claim 14

- **Text:** Safari layers heuristics over field `name`/`placeholder`/`label` in that order — mismatched names can cause unwanted autofill even when tokens are correct.
- **Target section:** Deep Dive
- **Source URL:** https://cloudfour.com/thinks/autofill-what-web-devs-should-know-but-dont/
- **Pulled quote:** "Safari uses heuristics to detect what autofill values to use and it's very aggressive in doing so. Rather than simply relying on standardized attributes, Safari evaluates the input's attributes in this order: name, placeholder, and label."

### Claim 15

- **Text:** `webauthn` Conditional UI landed in Firefox 122 (Jan 2024); supported in Chrome, Edge, Safari. The token has no effect on `<textarea>` and is ignored when combined with `one-time-code`.
- **Target section:** Passkey Conditional UI (`webauthn` token)
- **Source URL:** https://www.corbado.com/blog/webauthn-autocomplete
- **Pulled quote:** "Firefox added explicit recognition of the webauthn autocomplete token in version 122; Chrome, Edge and Safari also support Conditional UI as of 2025."

## Reference URLs

- https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion
- https://web.dev/articles/sign-in-form-best-practices
- https://web.dev/articles/passkey-form-autofill
- https://web.dev/articles/sms-otp-form
- https://cloudfour.com/thinks/autofill-what-web-devs-should-know-but-dont/
- https://www.corbado.com/blog/webauthn-autocomplete

## Research notes

- Grammar ordering is strict; footgun = writing tokens in the wrong order silently loses autofill.
- `webauthn` is input-only (no textarea).
- `autocomplete="off"` is ignored on login fields by design.
- iOS: `one-time-code`; Android: WebOTP API (separate).
- Safari heuristics over `name`/`placeholder`/`label` — defensively keep names semantic.
- Token Reference is the load-bearing section.
