# BeanHelps

## Render keep-alive

The API periodically requests its own `GET /api/health` endpoint. On Render,
`RENDER_EXTERNAL_URL` is used automatically. The default interval is 10 minutes.

To customize it, add either of these environment variables to the API service:

```env
SELF_PING_INTERVAL_MS=600000
SELF_PING_URL=https://your-api.onrender.com/api/health
```

`SELF_PING_URL` is optional on Render. If neither it nor `RENDER_EXTERNAL_URL` is
available, self-pinging stays disabled (for example, during local development).
