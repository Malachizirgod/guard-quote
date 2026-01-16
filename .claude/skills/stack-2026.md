# 2026 Stack Recommendations Skill

Best practices and implementations based on Gemini's 2026 technology review.

## Implemented

### 1. Zod Schema Transformation (AI Ingest)

**Problem:** AI-generated training specs use inconsistent column names (`base_hourly_rate` vs `base_rate`).

**Solution:** `backend/src/schemas/ingest.ts`

```typescript
import { IngestEventTypeSchema, IngestTrainingDataSchema } from './schemas/ingest';

// Auto-transforms AI output to canonical schema
const result = IngestEventTypeSchema.safeParse({
  name: "Music Festival",
  base_hourly_rate: 65.00,  // AI used this name
  risk_weight: 1.80         // AI used this name
});

// result.data is now canonical:
// { code: "music_festival", name: "Music Festival", baseRate: 65.00, riskMultiplier: 1.80 }
```

**Accepted Field Mappings:**
| AI Output | Maps To |
|-----------|---------|
| `base_hourly_rate`, `hourly_rate`, `rate` | `baseRate` |
| `risk_weight`, `risk_factor`, `multiplier` | `riskMultiplier` |
| `base_multiplier`, `location_multiplier` | `rateModifier` |
| `guards`, `guard_count` | `numGuards` |
| `duration`, `hours` | `hoursPerGuard` |

### 2. S2S Authentication (Backend ↔ ML Engine)

**Problem:** No authentication between internal services.

**Solution:** `backend/src/middleware/s2s-auth.ts`

```typescript
import { mlEngineRequest, getMLPrediction } from './middleware/s2s-auth';

// Authenticated request to ML Engine
const prediction = await getMLPrediction({
  event_type: 'concert',
  location_zip: '90001',
  num_guards: 4,
  hours: 8
});

// Header automatically added: X-Internal-Secret: <secret>
```

**Environment Variable:**
```bash
ML_ENGINE_SECRET=guardquote_s2s_secret_2026
```

### 3. Redis Rate Limiting

**Problem:** No protection against API abuse.

**Solution:** `backend/src/middleware/rate-limit.ts`

```typescript
import { rateLimit, RateLimitPresets, tieredRateLimit } from './middleware/rate-limit';

// Apply to routes
app.use('/api/auth/*', rateLimit(RateLimitPresets.auth));     // 10 req/min
app.use('/api/ml/*', rateLimit(RateLimitPresets.ml));         // 30 req/min
app.use('/api/*', rateLimit(RateLimitPresets.standard));      // 100 req/min

// Or use tiered limiter (auto-selects based on path)
app.use('*', tieredRateLimit());
```

**Presets:**
| Preset | Limit | Window | Use Case |
|--------|-------|--------|----------|
| `auth` | 10 | 60s | Login, password reset |
| `ml` | 30 | 60s | Price predictions |
| `standard` | 100 | 60s | General API |
| `admin` | 200 | 60s | Admin endpoints |
| `ingest` | 20 | 60s | Batch imports |

### 4. Docker Compose (Production)

**Problem:** No containerized deployment for Pi cluster.

**Solution:** `docker-compose.yml`

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend ml-engine

# Check health
docker-compose ps
```

**Services:**
| Service | Port | Memory | CPU |
|---------|------|--------|-----|
| backend | 3000 | 512M | 0.5 |
| ml-engine | 8000 | 1G | 1.0 |
| frontend | 5173 | 128M | 0.25 |
| postgres | 5432 | 512M | 0.5 |
| redis | 6379 | 128M | 0.25 |
| traefik | 80/443 | 128M | 0.25 |

**Healthchecks:** All services have healthchecks for automatic restart on failure.

---

## Pending Implementation

### 5. Model Versioning (MLOps)

**Gemini Recommendation:**
```python
# ml_engine/main.py
models = {
    "price_v1": rt.InferenceSession("models/price_2026_01.onnx"),
    "price_v2": rt.InferenceSession("models/price_2026_02.onnx")
}

@app.post("/predict/{model_version}")
async def predict(model_version: str, features: list[float]):
    session = models.get(model_version, models["price_v1"])
    # ...
```

**Metadata Sidecar Pattern:**
```json
// models/price_v1.0.2/metadata.json
{
  "version": "1.0.2",
  "trained_at": "2026-01-15T03:00:00Z",
  "r2_score": 0.82,
  "mae": 8.2,
  "git_commit": "2439e95",
  "training_records": 1100
}
```

### 6. ONNX Inference (Performance)

**Current:** scikit-learn pickle files (~50ms inference)
**Recommended:** ONNX runtime (5-10x faster)

```python
# Convert to ONNX
from skl2onnx import convert_sklearn
onnx_model = convert_sklearn(model, initial_types=[...])

# Fast inference
import onnxruntime as rt
session = rt.InferenceSession("model.onnx")
prediction = session.run(None, {"features": [features]})
```

### 7. RS256 JWT (Security)

**Current:** HS256 (shared secret)
**Recommended:** RS256 (asymmetric keys)

```typescript
// Backend signs with private key
const accessToken = sign(payload, privateKey, { algorithm: 'RS256' });

// ML Engine verifies with public key (can't forge tokens)
const decoded = verify(token, publicKey, { algorithms: ['RS256'] });
```

### 8. Model Drift Monitoring

**Prometheus Metric:**
```typescript
// backend/src/services/monitoring.ts
import { Gauge } from 'prom-client';

const priceErrorGauge = new Gauge({
  name: 'guardquote_price_prediction_error_rate',
  help: 'Difference between predicted and accepted price'
});

export const logPriceDrift = (predicted: number, actual: number) => {
  const error = ((actual - predicted) / actual) * 100;
  priceErrorGauge.set(error);
};
```

**Grafana Alert:** If error distribution shifts > 10%, trigger retrain.

### 9. SOPS Secrets Management

**Encrypt secrets:**
```bash
# Install SOPS + Age
brew install sops age

# Generate key
age-keygen -o key.txt

# Encrypt .env
sops --encrypt --age $(cat key.txt | grep public | cut -d: -f2) .env > .env.enc

# Decrypt at runtime
sops --decrypt .env.enc > .env
```

---

## Architecture Decisions

### Database: Keep PostgreSQL on Pi1

**Gemini Warning:** SD cards fail under high PG writes.

**Action Items:**
1. Move PostgreSQL data to NVMe SSD via USB 3.0
2. Mount in docker-compose: `/mnt/ssd/postgres:/var/lib/postgresql/data`
3. Enable WAL archiving for backup verification

### Communication: Consider gRPC

**Current:** REST (JSON serialization overhead)
**Recommended:** gRPC for Backend ↔ ML Engine

**Benefits:**
- Binary protocol (faster)
- Type-safe contracts (protobuf)
- Streaming support

**Effort:** Medium (requires protobuf definitions)

### Orchestration: K3s for Production

**Current:** Docker Compose
**Recommended:** K3s for multi-node Pi cluster

```bash
# Install K3s on Pi0 (server)
curl -sfL https://get.k3s.io | sh -

# Join Pi1 as agent
curl -sfL https://get.k3s.io | K3S_URL=https://pi0:6443 K3S_TOKEN=<token> sh -
```

---

## Quick Reference

### Environment Variables

```bash
# .env
DB_PASSWORD=WPU8bj3nbwFyZFEtHZQz
REDIS_PASSWORD=guardquote_redis_2024
ML_ENGINE_SECRET=guardquote_s2s_secret_2026
JWT_SECRET=your_jwt_secret_here
```

### Testing the Stack

```bash
# Test Zod ingest
bun test backend/src/schemas/ingest.test.ts

# Test rate limiting
for i in {1..15}; do curl -s localhost:3000/api/auth/login; done

# Test S2S auth
curl -H "X-Internal-Secret: guardquote_s2s_secret_2026" localhost:8000/api/v1/quote

# Test healthchecks
docker-compose ps  # All should show "healthy"
```

---

*Based on Gemini 2026 Stack Review*
*Last updated: January 15, 2026*
