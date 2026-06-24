# EdgeOne Makers Models Experiment

This branch is an isolated compatibility experiment for the frozen portfolio demo.
It does not replace the existing OFOX adapter, Official OpenAI adapter, or the
DeepSeek Task Map route. The page UI and its default providers remain unchanged.

## Branch

`experiment/edgeone-makers-models`, created from `myportfolio/main` at `d166634`.

## Environment variables

Configure these as EdgeOne server-side environment variables for this branch's
preview deployment. Never prefix them with `VITE_` and never place them in the
browser bundle.

```text
MAKERS_MODELS_API_KEY=...
MAKERS_MODELS_BASE_URL=...             # Copy the exact endpoint from Makers Models
MAKERS_MODELS_TEXT_MODEL=@makers/deepseek-v4-flash
MAKERS_MODELS_IMAGE_MODEL=disabled      # EdgeOne does not allow blanks; treated as unset
MAKERS_MODELS_ENABLE_IMAGE_PROBE=0     # Deliberately switch to 1 for billed image tests
MAKERS_MODELS_TIMEOUT_MS=30000
```

The base URL intentionally has no guessed default. The console documentation is
the authority for the gateway URL and its required API version suffix.

## AI Gateway text-only configuration

The EdgeOne **AI Gateway** console is a separate product surface from Makers
Models, but this probe can test it when the endpoint accepts OpenAI-compatible
`/chat/completions` requests with Bearer authentication. For the current
text-only test, configure the gateway's own credential, endpoint, and model ID:

```text
MAKERS_MODELS_API_KEY=<AI Gateway call credential>
MAKERS_MODELS_BASE_URL=<the API Endpoint shown by the ds-model instance>
MAKERS_MODELS_TEXT_MODEL=<the exact model name in the AI Gateway request example>
MAKERS_MODELS_IMAGE_MODEL=disabled
MAKERS_MODELS_ENABLE_IMAGE_PROBE=0
MAKERS_MODELS_TIMEOUT_MS=30000
```

Do not retain the default `@makers/deepseek-v4-flash` unless the AI Gateway
request example explicitly uses that exact model identifier. The instance name
`ds-model` is not necessarily the model value required by the API.

## Endpoints

### Status

`GET /api/ai-workflow/status`

Check `makersModels.configured`, the text model, and whether an image probe is
enabled. It never returns the API key.

### Compatibility probe

`POST /api/ai-workflow/makers-models-probe`

The probe always performs one minimal text request first. It is intentionally
outside the product UI so a failed compatibility test cannot affect users.

```json
{}
```

After confirming the exact image model in the console and intentionally setting
`MAKERS_MODELS_ENABLE_IMAGE_PROBE=1`, test image generation:

```json
{ "testImage": true }
```

To test `images/edits`, send one to four reference image data URLs. The response
only reports response shape and timing; it does not return or store generated
image bytes.

```json
{
  "testEdit": true,
  "referenceImages": ["data:image/png;base64,..."]
}
```

## Acceptance checklist

1. Text probe returns HTTP 200, a response body, and elapsed time.
2. Image generation, if enabled, returns HTTP 200 plus a URL or `b64_json`.
3. Image edit accepts at least two reference images and returns HTTP 200 plus a
   URL or `b64_json`.
4. Check actual generated dimensions, PNG transparency behavior, and whether
   the gateway preserves multiple uploaded files. A successful HTTP response
   alone is not enough to migrate the live sticker workflow.
5. Compare its latency and failure rate with the current Official OpenAI
   adapter using the same image prompt and comparable input images.

## Stop conditions

- Do not change `STICKER_IMAGE_PROVIDER` to `makers`.
- Do not alter the frozen demo UI.
- Do not remove OFOX or Official OpenAI adapters.
- Do not expose the Maker API key or make browser-direct requests.
- If `images/edits` rejects multi-reference uploads, record the result and keep
  the current two-adapter architecture unchanged.
