# FEE Batch 37 — Forms & Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write all 8 Forms & Validation category articles (FEE-1900 through FEE-1907) in both English and Traditional Chinese.

**Architecture:** Each task produces one EN article and one zh-TW translation. Articles follow the standard FEE format. The category covers form state management, validation patterns, and submission workflows. Framework examples use React with React Hook Form and Zod as the reference stack, noting patterns that apply across frameworks.

**Tech Stack:** Markdown, content authoring. Reference `docs/en/Developer Experience and Tooling/1603.md` for format.

---

## File Map

**New directories to create:**
- `docs/en/Forms and Validation/`
- `docs/zh-tw/Forms and Validation/`

**Files to create (EN):** `1900.md` through `1907.md` under `docs/en/Forms and Validation/`
**Files to create (zh-TW):** Mirror under `docs/zh-tw/Forms and Validation/`

---

### Task 1: FEE-1900 Forms Overview

**Files:**
- Create: `docs/en/Forms and Validation/1900.md`
- Create: `docs/zh-tw/Forms and Validation/1900.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:**
  ```
  ---
  id: 1900
  title: Forms & Validation Overview
  state: draft
  overview: true
  category: Forms and Validation
  ---
  ```

  **Opening context (3–4 paragraphs):**
  - Forms are the primary mechanism by which users write data to a system. They are also the primary source of validation errors, submission failures, accessibility issues, and state management complexity in frontend applications. A form that appears simple — three fields and a submit button — requires decisions about controlled vs. uncontrolled state, synchronous vs. asynchronous validation timing, field-level vs. form-level error display, and accessible labeling and error announcement.
  - The central organizing question for a form architecture is: who owns the form state? In React, "controlled" means the component tracks every input's value in state. "Uncontrolled" means the DOM tracks values, and the component reads them only at submission via `ref`. Libraries like React Hook Form adopt an uncontrolled-first approach that improves render performance while providing a declarative API for validation and submission.
  - This category covers the full form lifecycle: state ownership, library selection, schema validation, server-side error integration, multi-step patterns, file uploads, and accessibility. The reference stack is React Hook Form with Zod for schema validation, but the architectural patterns apply to Formik, Angular Reactive Forms, Vue's VeeValidate, and hand-rolled solutions.

  **`## Design Thinking` subsections:**
  - `### Validation timing: on-change, on-blur, on-submit` — Validating on every keystroke (on-change) gives immediate feedback but produces error messages before the user has finished typing, which feels accusatory. Validating on blur (when a field loses focus) is the most common pattern for individual field feedback. Validating on submit is appropriate as a final check and for fields whose validity depends on other fields.
  - `### Schema validation as a shared contract` — A Zod schema defined once can be used for both client-side validation and server-side validation (when the backend is TypeScript). The TypeScript type for the form values is derived from the schema, ensuring that the form's state shape matches the validation rules. This single-source-of-truth pattern is covered in FEE-1903.
  - `### Forms and accessibility: the hidden cost of shortcuts` — Every form input must be associated with a visible label. Error messages must be programmatically associated with the field that has the error. Required fields must be indicated in a way that does not rely on color alone. These requirements are not optional — they are WCAG 2.1 Level AA compliance requirements. Accessible forms are covered in FEE-1907.

  **`## Best Practices`:**

  **MUST associate every form input with a visible label element.** An input without a label is inaccessible to screen reader users and fails WCAG 2.1 Success Criterion 1.3.1. Placeholder text is not a substitute for a label — it disappears when the user types and is not reliably announced by screen readers. The label must be programmatically associated with the input via `htmlFor` (React) or `for` (HTML) matching the input's `id`.

  **MUST display field-level error messages adjacent to the field that has the error and associate them programmatically using `aria-describedby`.** An error message displayed only at the top of the form requires the user to find which field caused the error. An error message displayed adjacent to its field but not associated with `aria-describedby` is invisible to screen readers. Both the visible and the accessible relationship are required.

  **SHOULD use a form library (React Hook Form, Formik) for forms with more than two fields or with validation requirements.** The alternative — managing each field's value, error, touched state, and submission state manually — produces repetitive state management code that scales poorly with the number of fields. Form libraries provide this infrastructure, a declarative validation API, and integration with schema validation libraries.

  **SHOULD define the form's data shape as a TypeScript type derived from the validation schema rather than as a separate interface.** Maintaining a TypeScript interface for form values alongside a validation schema creates two sources of truth. Using Zod's `z.infer<typeof schema>` or the equivalent produces a TypeScript type that is always consistent with the validation rules. When the schema changes, the type updates automatically.

  **`## Related FEEs`:**
  - FEE-1901 — Controlled vs. Uncontrolled Inputs
  - FEE-1903 — Schema Validation
  - FEE-1907 — Accessible Forms
  - FEE-1000 — Accessibility Overview

  **`## References`:**
  - React Hook Form documentation — https://react-hook-form.com/
  - Formik documentation — https://formik.org/
  - WCAG 2.1: 1.3.1 Info and Relationships — https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1900`, `title: 表單與驗證總覽`, `state: draft`, `overview: true`, `category: Forms and Validation`

  Key terms: 受控元件（controlled component）、非受控元件（uncontrolled component）、驗證時機（validation timing）、結構描述驗證（schema validation）、表單無障礙（form accessibility）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1900.md" "docs/zh-tw/Forms and Validation/1900.md"
  git commit -m "feat(fee): add FEE-1900 Forms Overview (EN + zh-TW)"
  ```

---

### Task 2: FEE-1901 Controlled vs. Uncontrolled Inputs

**Files:**
- Create: `docs/en/Forms and Validation/1901.md`
- Create: `docs/zh-tw/Forms and Validation/1901.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1901`, `title: Controlled vs. Uncontrolled Inputs`, `state: draft`, `category: Forms and Validation`

  **Opening context:** In React, an input element can be controlled (its value is driven by state) or uncontrolled (its value is managed by the DOM). The distinction matters for performance, validation timing, and library choice. A controlled input re-renders the component on every keystroke; an uncontrolled input reads the DOM value only when needed. For most forms, the performance difference is negligible — but for forms with many fields or complex real-time validation, the choice affects whether the form is snappy or sluggish.

  **`## Design Thinking` subsections:**
  - `### Controlled inputs: value in state` — A controlled input has `value={state}` and `onChange={setState}`. React owns the value; the DOM reflects React's state. This enables synchronous validation on every keystroke, conditional rendering based on field values, and programmatic control of the input's value.
  - `### Uncontrolled inputs: value in the DOM` — An uncontrolled input has no `value` prop. Its current value lives in the DOM and is accessed via `ref.current.value`. React Hook Form uses this pattern by default, which explains its performance advantage: no state update occurs on every keystroke, so no re-render occurs.
  - `### defaultValue vs. value` — A controlled input uses `value` (driven by state). An uncontrolled input uses `defaultValue` (sets the initial value, then steps back). Mixing them — setting both `value` and `defaultValue`, or switching between controlled and uncontrolled — produces React warnings and undefined behavior.

  **`## Best Practices`:**

  **MUST NOT switch an input between controlled and uncontrolled during its lifetime.** An input that starts with `value={undefined}` is uncontrolled. Adding a `value` prop later switches it to controlled, which React treats as an error. Initialize state with an empty string (`''`) for controlled string inputs rather than `undefined` to prevent this transition.

  **SHOULD use uncontrolled inputs (via React Hook Form's `register` or `useRef`) for forms where individual keystrokes do not need to trigger side effects.** Controlled inputs re-render the component on every keystroke. For a form with ten fields, each keystroke triggers ten field renders. Uncontrolled inputs defer all state reads to validation and submission time, producing forms that remain performant as field count grows.

  **SHOULD use controlled inputs when field values drive UI changes outside the field itself.** A controlled input is necessary when: (1) a field's value conditionally shows or hides other fields, (2) a field's value is computed from another field, or (3) the form needs real-time validation feedback on every character. These requirements justify the re-render cost.

  **`## Related FEEs`:**
  - FEE-1900 — Forms Overview
  - FEE-1902 — Form Libraries & Schema-Driven Forms

  **`## References`:**
  - React: Controlled Components — https://react.dev/learn/sharing-state-between-components
  - React Hook Form: Performance — https://react-hook-form.com/faqs#Performanceofreacthookform

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1901`, `title: 受控與非受控輸入`, `state: draft`, `category: Forms and Validation`

  Key terms: 受控輸入（controlled input）、非受控輸入（uncontrolled input）、預設值（default value）、參照（ref）、重新渲染（re-render）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1901.md" "docs/zh-tw/Forms and Validation/1901.md"
  git commit -m "feat(fee): add FEE-1901 Controlled vs. Uncontrolled Inputs (EN + zh-TW)"
  ```

---

### Task 3: FEE-1902 Form Libraries & Schema-Driven Forms

**Files:**
- Create: `docs/en/Forms and Validation/1902.md`
- Create: `docs/zh-tw/Forms and Validation/1902.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1902`, `title: Form Libraries & Schema-Driven Forms`, `state: draft`, `category: Forms and Validation`

  **Opening context:** A form library is not a convenience — it is a replacement for a large amount of repetitive state management code. Each field in a hand-rolled form requires state for its value, a touched flag (to defer showing errors until interaction), an error message, and coordination with the submission state. For a ten-field form, that is forty pieces of state plus the cross-field validation and submission logic. Form libraries encode this infrastructure so that application code focuses on the fields themselves and the validation rules.

  **`## Design Thinking` subsections:**
  - `### React Hook Form: register pattern and Controller` — `register('fieldName')` returns props that wire an uncontrolled input to the form state. For custom or third-party components that do not accept `ref`, the `Controller` component wraps the component and provides controlled props. React Hook Form's key advantage is performance: uncontrolled by default, with re-renders limited to the fields that change.
  - `### Schema-driven validation: resolver pattern` — React Hook Form accepts a `resolver` that integrates with Zod, Yup, or other schema libraries via `@hookform/resolvers`. The form's data shape and validation rules are defined in the schema; the resolver translates schema errors into the form library's error format. This keeps validation logic in the schema, not scattered across field-level validators.
  - `### Formik: when it fits` — Formik uses a controlled approach and is more verbose than React Hook Form for large forms, but its explicit render props and `useFormikContext` hook can be easier to reason about for teams new to form libraries. For new projects, React Hook Form is generally the better default; for projects already using Formik, migration is rarely worth the cost.

  **`## Best Practices`:**

  **MUST configure React Hook Form's validation mode to `'onBlur'` for forms where immediate keystroke validation would be disruptive.** The default mode `'onSubmit'` shows errors only after submission. `'onBlur'` shows errors after the user leaves a field. `'onChange'` shows errors on every keystroke. For most forms, `'onBlur'` for initial validation and `'onChange'` after the first error (achieved with `'onTouched'` mode) provides the best experience: no premature errors, but immediate feedback once the user has made an attempt.

  **MUST use a schema resolver rather than field-level validation functions for forms with more than a few fields.** Field-level validators are defined per-field and do not have access to other fields' values, making cross-field validation impossible without custom workarounds. A schema resolver defines all validation in one place, supports cross-field rules naturally (Zod's `refine` and `superRefine`), and produces a TypeScript type as a by-product.

  **SHOULD use React Hook Form's `useFormContext` to share form state with deeply nested field components rather than passing `register` and `errors` as props.** Prop-drilling form utilities through component trees is the form equivalent of prop-drilling state — it creates tight coupling between parent and child component signatures. `FormProvider` and `useFormContext` provide form state to any descendant component via context.

  **`## Related FEEs`:**
  - FEE-1901 — Controlled vs. Uncontrolled Inputs
  - FEE-1903 — Schema Validation
  - FEE-1904 — Async Validation & Server-Side Errors

  **`## References`:**
  - React Hook Form documentation — https://react-hook-form.com/
  - @hookform/resolvers — https://github.com/react-hook-form/resolvers
  - Formik documentation — https://formik.org/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1902`, `title: 表單函式庫與結構描述驅動表單`, `state: draft`, `category: Forms and Validation`

  Key terms: 表單函式庫（form library）、驗證模式（validation mode）、解析器（resolver）、結構描述驅動（schema-driven）、跨欄位驗證（cross-field validation）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1902.md" "docs/zh-tw/Forms and Validation/1902.md"
  git commit -m "feat(fee): add FEE-1902 Form Libraries & Schema-Driven Forms (EN + zh-TW)"
  ```

---

### Task 4: FEE-1903 Schema Validation

**Files:**
- Create: `docs/en/Forms and Validation/1903.md`
- Create: `docs/zh-tw/Forms and Validation/1903.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1903`, `title: Schema Validation`, `state: draft`, `category: Forms and Validation`

  **Opening context:** Schema validation is the practice of defining the expected shape and constraints of data in a declarative specification — the schema — and using that specification to validate data against it. For forms, the schema defines field types, required/optional status, length and format constraints, and cross-field rules. For API boundaries, the schema validates that incoming data matches the expected shape. A schema library like Zod produces both the validator and the TypeScript type from one definition, eliminating the drift between "what the form accepts" and "what the type says the form accepts."

  **`## Design Thinking` subsections:**
  - `### Zod: parse, don't validate` — Zod's `parse` and `safeParse` methods do not just check that data is valid — they transform it into the typed form. A Zod string schema with `.trim().min(1)` both validates that the trimmed value is non-empty and returns the trimmed string. This parse-transform combination means the application receives already-cleaned data, not raw input.
  - `### Cross-field validation with refine` — Single-field constraints are handled by chaining methods on the field's schema. Cross-field constraints — "confirm password must match password," "end date must be after start date" — require Zod's `refine` or `superRefine` at the object level. `refine` receives the full object and returns a boolean; `superRefine` provides access to the Zod context for multi-error reporting.
  - `### Schema composition` — Zod schemas are composable: `z.object({ base fields }).extend({ additional fields })`, `z.union([schemaA, schemaB])`, `schemaA.merge(schemaB)`. A base user schema can be extended into a create-user schema (with `password`) and an update-user schema (all fields optional with `.partial()`). Composition prevents field definitions from being repeated across related schemas.

  **`## Best Practices`:**

  **MUST derive TypeScript form value types from the Zod schema using `z.infer<typeof schema>` rather than defining a separate TypeScript interface.** A separately maintained interface must be updated whenever the schema changes and creates a maintenance obligation with no enforcement. The derived type is always consistent with the schema by definition. Pass the derived type as the generic argument to React Hook Form: `useForm<z.infer<typeof schema>>()`.

  **MUST use `safeParse` for validation in application code and `parse` only in contexts where a thrown error is the desired behavior.** `parse` throws a `ZodError` on invalid data; `safeParse` returns a discriminated union. In form submission handlers and API boundary validators, `safeParse` integrates with TypeScript's narrowing and allows structured error handling. `parse` is appropriate in test setup and module initialization where failure should halt execution.

  **SHOULD apply `refine` cross-field validators at the object level, not at individual field levels, to ensure that the error is attached to the correct field or to a field-pair path.** A cross-field `refine` at the root object level can be configured with `{ path: ['confirmPassword'] }` to attach the error to the `confirmPassword` field's error list, where form libraries will display it adjacent to that field.

  **SHOULD use Zod's transform methods (`.trim()`, `.toLowerCase()`, `.coerce`) to normalize input data as part of the schema rather than normalizing it manually before validation.** Schema-level normalization is applied consistently whenever the schema validates data — in the form, in API handlers, in test utilities. Manual normalization requires the same code to be written at every validation call site.

  **`## Related FEEs`:**
  - FEE-1902 — Form Libraries & Schema-Driven Forms
  - FEE-1904 — Async Validation & Server-Side Errors
  - FEE-1708 — Runtime Validation & Schema Libraries (API boundary context)

  **`## References`:**
  - Zod documentation — https://zod.dev/
  - Valibot documentation — https://valibot.dev/
  - @hookform/resolvers Zod integration — https://github.com/react-hook-form/resolvers#zod

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1903`, `title: 結構描述驗證`, `state: draft`, `category: Forms and Validation`

  Key terms: 結構描述驗證（schema validation）、解析轉換（parse-transform）、跨欄位驗證（cross-field validation）、結構描述組合（schema composition）、型別推論（type inference）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1903.md" "docs/zh-tw/Forms and Validation/1903.md"
  git commit -m "feat(fee): add FEE-1903 Schema Validation (EN + zh-TW)"
  ```

---

### Task 5: FEE-1904 Async Validation & Server-Side Errors

**Files:**
- Create: `docs/en/Forms and Validation/1904.md`
- Create: `docs/zh-tw/Forms and Validation/1904.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1904`, `title: Async Validation & Server-Side Errors`, `state: draft`, `category: Forms and Validation`

  **Opening context:** Client-side validation catches format errors before a request is sent. Server-side validation catches business rule errors that cannot be checked on the client: username already taken, email already registered, insufficient inventory. When a form submission fails server-side validation, the server returns field-level errors that must be mapped back to the form's fields and displayed adjacent to the fields they describe. This round-trip between client form and server validator is where most form implementations break down.

  **`## Design Thinking` subsections:**
  - `### Async field validation: debounce and loading state` — Async validation on a single field — checking whether a username is available — requires a debounced request to avoid a new API call on every keystroke, a loading indicator while the request is in flight, and error handling when the request fails. React Hook Form supports async validators in the `validate` option; the loading state requires additional local state.
  - `### Server error integration: setError` — React Hook Form's `setError('fieldName', { message: 'error text' })` sets a field-level error programmatically. After a failed submission, parse the server's error response (typically a map of field names to error messages) and call `setError` for each field that has an error. This displays server errors adjacent to the correct fields using the same error display components as client-side errors.
  - `### Error response format standardization` — Server error responses vary: some return `{ errors: { field: message } }`, some return `{ field_errors: [{ field, message }] }`, some return problem+json. Standardizing the error response format across the backend — and writing a single adapter function on the frontend — prevents per-endpoint error parsing logic.

  **`## Best Practices`:**

  **MUST map server-side validation errors to field-level errors in the form using `setError` rather than displaying them only in a page-level alert.** A page-level error message — "The form contains errors" — requires the user to scan all fields to find the problem. Field-level errors displayed adjacent to the offending field communicate both what is wrong and where. `setError('fieldName', { type: 'server', message: 'Username is taken' })` integrates server errors with the form's existing error display infrastructure.

  **MUST debounce async field validators to prevent a network request on every keystroke.** An async username availability check on every keystroke makes a request with every character the user types. A 300–500ms debounce limits requests to when the user has paused typing. React Hook Form's `validate` option supports async functions; debouncing requires wrapping the validation function with a debounce utility.

  **SHOULD clear server-side field errors when the user modifies the field they apply to.** Server errors set via `setError` persist until explicitly cleared or the form is reset. A user who corrects a server-side error and resubmits should see the new server response — not a stale error from the previous submission. Use React Hook Form's `clearErrors('fieldName')` in the field's `onChange` handler for fields that received server errors.

  **`## Related FEEs`:**
  - FEE-1902 — Form Libraries & Schema-Driven Forms
  - FEE-1903 — Schema Validation
  - FEE-1807 — Error Handling & Loading States

  **`## References`:**
  - React Hook Form: setError — https://react-hook-form.com/docs/useform/seterror
  - React Hook Form: Async Validation — https://react-hook-form.com/docs/useform/register#validate

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1904`, `title: 非同步驗證與伺服器端錯誤`, `state: draft`, `category: Forms and Validation`

  Key terms: 非同步驗證（async validation）、伺服器端錯誤（server-side errors）、防抖（debounce）、設定錯誤（setError）、錯誤回應格式（error response format）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1904.md" "docs/zh-tw/Forms and Validation/1904.md"
  git commit -m "feat(fee): add FEE-1904 Async Validation & Server-Side Errors (EN + zh-TW)"
  ```

---

### Task 6: FEE-1905 Multi-Step Forms & Wizard Patterns

**Files:**
- Create: `docs/en/Forms and Validation/1905.md`
- Create: `docs/zh-tw/Forms and Validation/1905.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1905`, `title: Multi-Step Forms & Wizard Patterns`, `state: draft`, `category: Forms and Validation`

  **Opening context:** A multi-step form breaks a long form into a sequence of steps, showing one step at a time and validating each step before advancing to the next. The UX benefit is reduced cognitive load: a form with twenty fields is more approachable when presented as five steps of four fields. The technical challenge is state management: form data accumulates across steps, each step may have its own validation schema, the user must be able to navigate back without losing previously entered data, and the final submission must include all steps' data.

  **`## Design Thinking` subsections:**
  - `### State ownership across steps` — The simplest approach stores all form data in a parent component's state, passing each step's relevant fields as props. A step updates the parent's state on "next" before advancing. This works for linear wizards with few steps. For complex non-linear flows with shared state across many steps, a context or form library with multi-step support is more maintainable.
  - `### Step validation before advancing` — Each step should validate its fields before allowing the user to advance. With React Hook Form, `trigger(['field1', 'field2'])` runs validation for specific fields and returns a promise resolving to a boolean. If validation fails, the step stays on screen with error messages; if it passes, the parent advances to the next step.
  - `### URL-based step state` — Storing the current step in the URL (`?step=2`) allows deep linking to a specific step, preserves the browser's back button behavior, and enables the user to refresh without losing their position. This requires the form data to also be persisted (in sessionStorage or server-side session) since form state is lost on refresh.

  **`## Best Practices`:**

  **MUST validate each step's fields before advancing to the next step.** A wizard that allows the user to reach the final submission step with invalid earlier-step data produces a confusing experience: the submission fails with errors from a step the user has already passed. Validate step fields on "next" and prevent advancement until they pass.

  **MUST preserve form data when the user navigates back to a previous step.** A wizard that resets fields when the user navigates back forces re-entry of already-provided data. Store the accumulated form data in the parent component's state or in a form library instance that persists across step renders. Steps should initialize with the stored data.

  **SHOULD show the user their position in the wizard using a step indicator.** A step indicator communicates: how many steps remain, which step is current, and which steps have been completed. For a three-step form this is a minor convenience; for an eight-step form it is essential. Completed steps should be visually distinct from the current step and the upcoming steps.

  **`## Related FEEs`:**
  - FEE-1900 — Forms Overview
  - FEE-1902 — Form Libraries & Schema-Driven Forms
  - FEE-1903 — Schema Validation

  **`## References`:**
  - React Hook Form: trigger — https://react-hook-form.com/docs/useform/trigger
  - UX patterns for multi-step forms (Smashing Magazine) — https://www.smashingmagazine.com/2010/01/designing-ui-of-long-complex-forms/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1905`, `title: 多步驟表單與精靈模式`, `state: draft`, `category: Forms and Validation`

  Key terms: 多步驟表單（multi-step form）、精靈模式（wizard pattern）、步驟指示器（step indicator）、步驟驗證（step validation）、URL 狀態（URL state）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1905.md" "docs/zh-tw/Forms and Validation/1905.md"
  git commit -m "feat(fee): add FEE-1905 Multi-Step Forms & Wizard Patterns (EN + zh-TW)"
  ```

---

### Task 7: FEE-1906 File Uploads & Binary Data

**Files:**
- Create: `docs/en/Forms and Validation/1906.md`
- Create: `docs/zh-tw/Forms and Validation/1906.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1906`, `title: File Uploads & Binary Data`, `state: draft`, `category: Forms and Validation`

  **Opening context:** File uploads differ from text form fields in several ways: the data is binary, not text; the size can be large enough to require progress feedback; the validation is different (file type, file size); and the submission mechanism changes from JSON to `multipart/form-data`. These differences require specific handling that React Hook Form's standard `register` pattern does not fully address out of the box.

  **`## Design Thinking` subsections:**
  - `### File input state and React Hook Form` — React Hook Form's `register` works with file inputs, but the `FileList` returned by `input[type=file]` is not a plain value. Accessing `watch('file')` gives a `FileList` object. Validation is done via the `validate` option with a function that checks `fileList[0]?.type` and `fileList[0]?.size`.
  - `### Upload progress and XHR vs fetch` — The Fetch API does not support upload progress events. Tracking upload progress requires `XMLHttpRequest` with the `progress` event, or a library that wraps XHR (axios). For implementations that need progress feedback, `XMLHttpRequest` is the correct tool despite its age.
  - `### Drag-and-drop file upload` — The File API and drag events (dragover, drop) allow users to drop files onto a target area. The `DataTransfer.files` property on the drop event provides the dropped files as a `FileList`. The drag target must cancel `dragover`'s default behavior to allow the `drop` event to fire.

  **`## Best Practices`:**

  **MUST validate file type using the file's MIME type, not its extension.** A file extension is user-controlled and can be changed without changing the file's content. The MIME type read from `file.type` is set by the browser based on the file's content. Validate `file.type === 'image/jpeg'` or check against an allowlist of MIME types.

  **MUST validate file size before initiating the upload request.** A 100MB file uploaded to an endpoint with a 10MB limit produces a server error after the full upload completes. Checking `file.size` against the allowed maximum on the client prevents wasted upload bandwidth and provides immediate feedback.

  **SHOULD show upload progress for files larger than a few hundred kilobytes.** A file upload with no progress indicator appears frozen to the user. Even an indeterminate progress bar is better than no feedback. For large files, use `XMLHttpRequest` with the `upload.progress` event to calculate and display a percentage.

  **`## Related FEEs`:**
  - FEE-1900 — Forms Overview
  - FEE-411 — File API, Clipboard & Drag-and-Drop

  **`## References`:**
  - MDN: Using files from web applications — https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
  - React Hook Form: File Upload example — https://react-hook-form.com/docs/useform/register

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1906`, `title: 檔案上傳與二進位資料`, `state: draft`, `category: Forms and Validation`

  Key terms: 檔案上傳（file upload）、MIME 型別（MIME type）、上傳進度（upload progress）、拖放（drag-and-drop）、表單資料（FormData）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1906.md" "docs/zh-tw/Forms and Validation/1906.md"
  git commit -m "feat(fee): add FEE-1906 File Uploads & Binary Data (EN + zh-TW)"
  ```

---

### Task 8: FEE-1907 Accessible Forms

**Files:**
- Create: `docs/en/Forms and Validation/1907.md`
- Create: `docs/zh-tw/Forms and Validation/1907.md`

- [ ] **Step 1: Write EN article**

  **Frontmatter:** `id: 1907`, `title: Accessible Forms`, `state: draft`, `category: Forms and Validation`

  **Opening context:** Form accessibility failures are among the most common WCAG violations on the web. The failures are consistent: inputs without labels, error messages not associated with their fields, required fields indicated only by color, and submit buttons with no descriptive text. These are not difficult to fix — each has a specific HTML or ARIA solution — but they require intentional implementation rather than relying on visual design alone to communicate form structure.

  **`## Design Thinking` subsections:**
  - `### Label association: htmlFor and aria-labelledby` — The most common form accessibility failure is an input whose label is not programmatically associated with it. A label visually positioned above an input is not sufficient — screen readers announce the input's accessible name, which comes from `htmlFor` association, `aria-label`, or `aria-labelledby`. Of these, `htmlFor` with a matching `id` is the most robust.
  - `### Error announcement: aria-describedby and aria-invalid` — When an input has a validation error, the error message must be associated with the input via `aria-describedby`. The input's `aria-invalid` attribute must be set to `true`. Screen readers announce the accessible name, then the role, then content from `aria-describedby` — placing the error message in `aria-describedby` ensures it is read when the user focuses the field.
  - `### Required fields: not color alone` — WCAG 1.4.1 prohibits using color as the only visual means of conveying information. A required field indicated only by a red asterisk fails this criterion for color-blind users. Use `required` attribute (which screen readers announce as "required") plus a visible text indicator, and explain the indicator's meaning in the form's instructions.

  **`## Best Practices`:**

  **MUST associate every input with a visible label using `htmlFor` (React) matching the input's `id`.** A placeholder is not a label — it disappears when the user types and is not reliably announced by screen readers. A label visually positioned above an input but not associated via `htmlFor` is visible to sighted users and invisible to assistive technology. Association is required, not optional.

  **MUST set `aria-describedby` to the error message element's `id` and `aria-invalid="true"` on an input when it has a validation error.** Without `aria-describedby`, screen reader users hear the field label and type without hearing the error. Without `aria-invalid="true"`, some screen readers do not announce the invalid state. Both attributes are required together.

  **MUST use the `autocomplete` attribute on inputs that correspond to personal information.** WCAG 1.3.5 requires that inputs collecting name, email, address, phone, credit card, and similar personal information have the correct `autocomplete` value. This enables autofill for all users and is required for assistive technology that supports personalization. Common values: `autocomplete="name"`, `"email"`, `"tel"`, `"current-password"`, `"new-password"`.

  **SHOULD use `fieldset` and `legend` to group related inputs.** A group of radio buttons or checkboxes that represents a single question should be wrapped in a `fieldset` with a `legend` that states the question. Screen readers announce the legend when the user enters the fieldset, providing context for the individual options.

  **`## Related FEEs`:**
  - FEE-1900 — Forms Overview
  - FEE-1000 — Accessibility Overview
  - FEE-1003 — ARIA Roles, States & Properties

  **`## References`:**
  - WCAG 2.1: 1.3.1 Info and Relationships — https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html
  - WCAG 2.1: 3.3 Input Assistance — https://www.w3.org/WAI/WCAG21/Understanding/input-assistance.html
  - MDN: aria-describedby — https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby
  - WebAIM: Creating Accessible Forms — https://webaim.org/techniques/forms/

- [ ] **Step 2: Verify EN format**
- [ ] **Step 3: Write zh-TW article**

  **Frontmatter:** `id: 1907`, `title: 無障礙表單`, `state: draft`, `category: Forms and Validation`

  Key terms: 標籤關聯（label association）、錯誤宣告（error announcement）、aria-describedby、aria-invalid、自動填入（autocomplete）、欄位群組（fieldset）。

- [ ] **Step 4: Verify zh-TW format**
- [ ] **Step 5: Commit**
  ```bash
  git add "docs/en/Forms and Validation/1907.md" "docs/zh-tw/Forms and Validation/1907.md"
  git commit -m "feat(fee): add FEE-1907 Accessible Forms (EN + zh-TW)"
  ```
