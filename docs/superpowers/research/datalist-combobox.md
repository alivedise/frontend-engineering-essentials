---
topic: <datalist> and the Native Combobox Pattern
id: 116
slug: datalist-combobox
sources_reviewed: 12
claims: 17
---

# Findings: `<datalist>` and the Native Combobox Pattern

**Proposed topic-specific section:** `## Input Type Compatibility Matrix`.

## Claims

### Claim 1

- **Text:** `<datalist>` is a set of `<option>` elements representing predefined suggestions for an associated form control; not an input itself.
- **Target section:** Context
- **Source URL:** https://html.spec.whatwg.org/multipage/form-elements.html#the-datalist-element
- **Pulled quote:** "The `datalist` element represents a set of `option` elements that represent predefined options for other controls."

### Claim 2

- **Text:** Associated with an input through the `list` attribute referencing the datalist's `id`.
- **Target section:** Context
- **Source URL:** https://html.spec.whatwg.org/multipage/form-elements.html#the-datalist-element
- **Pulled quote:** "The `datalist` element is hooked up to an `input` element using the `list` attribute on the `input` element."

### Claim 3

- **Text:** Datalist supplies suggestions only; the input still accepts any validation-passing value. Distinct from `<select>`.
- **Target section:** Context
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- **Pulled quote:** "`<datalist>` is not a replacement for `<select>`. A `<datalist>` does not represent an input itself; it is a list of suggested values for an associated control. The control can still accept any value that passes validation, even if it is not in this suggestion list."

### Claim 4

- **Text:** The `list` attribute is valid on 13 input types: `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, `color`.
- **Target section:** Input Type Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input
- **Pulled quote:** "It is valid on `text`, `search`, `url`, `tel`, `email`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, and `color`."

### Claim 5

- **Text:** Unsupported on `hidden`, `password`, `checkbox`, `radio`, `file`, and any button input types.
- **Target section:** Input Type Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input
- **Pulled quote:** "Per the specifications, the `list` attribute is not supported by the `hidden`, `password`, `checkbox`, `radio`, `file`, or any of the button types."

### Claim 6

- **Text:** For text-like types (`text`, `search`, `url`, `tel`, `email`, `number`), matching options surface as a filter-as-you-type dropdown.
- **Target section:** Input Type Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- **Pulled quote:** "Recommended values in types text, search, url, tel, email and number, are displayed in a drop-down menu when user clicks or double-clicks on the control."

### Claim 7

- **Text:** For `range`: options render as selectable tick marks. For `color`: as swatches in the native picker.
- **Target section:** Input Type Compatibility Matrix
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- **Pulled quote:** "When `value` attributes are included on `<option>` elements provided for a datalist associated with a range input type, they will be shown as a series of tick marks that the user can easily select." and "The color type can show predefined colors in a browser-provided interface."

### Claim 8

- **Text:** Submitted value = `<option value>`. Visible label = `label` attribute or inner text. Firefox shows label-instead-of-value; Chrome/Safari show both.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- **Pulled quote:** "Each `<option>` element should have a `value` attribute, which represents a suggestion to be entered into the input. It can also have a `label` attribute, or, missing that, some text content, which may be displayed by the browser instead of `value` (Firefox), or in addition to `value` (Chrome and Safari, as supplemental text)."

### Claim 9

- **Text:** CSS targeting of the datalist dropdown is extremely limited — blocks high-contrast mode adaptation.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- **Pulled quote:** "As targeting the list of options with CSS is very limited to non-existent, rendering can not be styled for high-contrast mode."

### Claim 10

- **Text:** Option text does not scale with page zoom — breaks for low-vision users.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- **Pulled quote:** "The font size of the data list's options does not zoom, always remaining the same size."

### Claim 11

- **Text:** Screen-reader support varies: NVDA/Firefox announces all options as "blank"; VoiceOver/macOS Safari cannot navigate to suggestions at all.
- **Target section:** Best Practices
- **Source URL:** https://a11ysupport.io/tech/html/datalist_element
- **Pulled quote:** "NVDA / Firefox ... all options are announced as 'blank'" and "VoiceOver / macOS Safari ... not possible to navigate to datalist and suggestions are not announced."

### Claim 12

- **Text:** `<input list>` + `<datalist>` implements the WAI-ARIA combobox pattern without author-written ARIA.
- **Target section:** Design Thinking
- **Source URL:** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- **Pulled quote:** "A combobox is an input widget that has an associated popup. The popup enables users to choose a value for the input from a collection."

### Claim 13

- **Text:** Datalist avoids hand-rolled ARIA combobox complexity.
- **Target section:** Design Thinking
- **Source URL:** https://www.webaxe.org/datalist-over-aria-combobox/
- **Pulled quote:** "The beauty of the datalist element is simplicity. Straight forward, semantic, and simple HTML – and no JavaScript needed!"

### Claim 14

- **Text:** Prefer ARIA combobox when product needs zoomable text, styled options, voice-control, Android Firefox support, or submit-value ≠ display-text.
- **Target section:** Best Practices
- **Source URL:** https://adrianroselli.com/2023/06/under-engineered-comboboxen.html
- **Pulled quote:** "Unless… It needs to work as more than a text box in Firefox on Android; Options need to be available in landscape mode in Chrome on Android; Users ever need to zoom the text; Voice control is a requirement for your users; It is imperative you can style the options; and/or The `value` will differ from the node text / innertext in your code."

### Claim 15

- **Text:** Dynamically appending `<option>` is spec-supported but Firefox has bugs: autocomplete controller keeps prior results; a datalist appended after the input has a value only renders on backspace.
- **Target section:** Deep Dive
- **Source URL:** https://bugzilla.mozilla.org/show_bug.cgi?id=1351483
- **Pulled quote:** "dynamically added datalist does not show when appened after the input its assigned to already has a value"

### Claim 16

- **Text:** Firefox truncates options with ellipsis to the input's width; Chrome/Edge do not. CSS cannot fix this.
- **Target section:** Deep Dive
- **Source URL:** https://bugzilla.mozilla.org/show_bug.cgi?id=1106946
- **Pulled quote:** "datalist options should not be truncated to the width of the input"

### Claim 17

- **Text:** Because native datalist is already a combobox, authors should not add `role="combobox"`/`aria-expanded` to the input.
- **Target section:** Best Practices
- **Source URL:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role
- **Pulled quote:** "The element with the combobox role can be either an editable single-line text field (using an `<input>` element, similar to one with a `<datalist>`), or a select-only element (using a button element)."

## Reference URLs

- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist
- https://html.spec.whatwg.org/multipage/form-elements.html#the-datalist-element
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/option
- https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role
- https://a11ysupport.io/tech/html/datalist_element
- https://adrianroselli.com/2023/06/under-engineered-comboboxen.html
- https://www.webaxe.org/datalist-over-aria-combobox/
- https://bugzilla.mozilla.org/show_bug.cgi?id=1351483
- https://bugzilla.mozilla.org/show_bug.cgi?id=1106946
- https://caniuse.com/datalist

## Research notes

- Spec calls input types "states"; MDN's "types" is the cleaner authorial phrasing.
- No authoritative `<option value>` character-count limit; truncation is display-only and Firefox-specific.
- Visual section: Mermaid showing `input[list] → datalist[id]` + user-interaction states works without a quote.
