# Levmich admin API

Node.js Yandex Cloud Function for publishing generated cases from `/admin`.

Required environment variables are listed in `.env.example`.

The GitHub token must have write access to the repository contents. A fine-grained token scoped only to `LevykinM/levmich-studio-site` with `Contents: Read and write` is enough.

Routes:

- `POST /login` -> `{ token }`
- `GET /cases` -> generated cases manifest
- `POST /cases` -> creates/updates a generated case
- `DELETE /cases/:slug` -> removes a generated case

Yandex Cloud Function direct URLs do not support extra path segments after the function id. Use the same routes through the `route` query parameter:

- `POST https://functions.yandexcloud.net/<id>?route=/login`
- `GET https://functions.yandexcloud.net/<id>?route=/cases`
- `POST https://functions.yandexcloud.net/<id>?route=/cases`
- `DELETE https://functions.yandexcloud.net/<id>?route=/cases/<slug>`

After deployment, put the public function URL into `admin/config.js`:

```js
window.LEVMICH_ADMIN_API_URL = 'https://functions.yandexcloud.net/<function-id>';
```
