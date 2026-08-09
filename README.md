# maintenance

Next.js maintenance page with a 24-hour countdown. Served on:

- https://maintenance.giolosts.co
- https://qa-pbr.giolosts.co
- https://qa-pbn.giolosts.co
- https://qa-phr.giolosts.co

All four hostnames route to the same pods via the shared public ALB.

## Stack

- **Runtime:** Next.js 15 (App Router, TypeScript)
- **Container:** multi-stage build, Next.js standalone output (~150 MB image)
- **Cluster:** `infratech-prod` EKS
- **Deploy:** Helm chart `webapp` from `infratech-helm-charts` (OCI in ECR)
- **CI:** reusable workflows from `infratech-github-actions` (build + deploy on merge to main)

## Local development

```bash
npm install
npm run dev            # → http://localhost:3000
```

Override the countdown end time (defaults to now + 24h):

```bash
NEXT_PUBLIC_MAINTENANCE_END="2026-08-05T12:00:00Z" npm run dev
```

## Deploy — CI (recommended)

Merge to `main` → `.github/workflows/deploy.yml` runs:

1. `docker-build-push` — builds `linux/amd64` image, pushes to ECR with SHA + `latest` tags
2. `helm-deploy` — pulls chart `oci://.../charts/webapp:0.1.0`, runs `helm upgrade --install --atomic` with `deploy/values.yaml` (+ image tag from build step)

Deploy status: check the Actions tab.

### Prerequisites (one-time infra setup)

Before the workflow can run:

- **GitHub OIDC provider + IAM roles** in AWS account 443496863898 (managed by `infratech-k8s-platform`):
  - `github-actions-ecr-push` — used by the build step
  - `github-actions-eks-deploy` — used by the deploy step
- **`webapp` chart published to ECR** (managed by `infratech-helm-charts`):
  - Tag `charts/webapp-v0.1.0` triggers publish workflow

## Deploy — manually (for testing or emergency)

If CI is down or you want to test a chart change locally:

```bash
# One-time: authenticate helm to ECR
aws ecr get-login-password --profile infratech --region us-west-2 \
  | helm registry login --username AWS --password-stdin \
    443496863898.dkr.ecr.us-west-2.amazonaws.com

# Point kubectl at the cluster
aws eks update-kubeconfig --profile infratech --region us-west-2 --name infratech-prod

# Deploy
IMAGE_TAG=$(git rev-parse --short HEAD)
helm upgrade --install maintenance \
  oci://443496863898.dkr.ecr.us-west-2.amazonaws.com/charts/webapp \
  --version 0.1.0 \
  --namespace maintenance \
  --create-namespace \
  --values deploy/values.yaml \
  --set image.tag=$IMAGE_TAG \
  --atomic --timeout 5m
```

## Deploy — using a LOCAL chart (for chart development)

Useful when iterating on the shared `webapp` chart itself:

```bash
helm upgrade --install maintenance \
  ~/Repos/giolosts/infra/infratech-helm-charts/charts/webapp \
  --namespace maintenance \
  --create-namespace \
  --values deploy/values.yaml \
  --set image.tag=$(git rev-parse --short HEAD) \
  --atomic
```

## Build image manually (if needed outside CI)

```bash
# One-time: create the ECR repo
aws ecr create-repository \
  --profile infratech --region us-west-2 \
  --repository-name giolosts/maintenance \
  --image-scanning-configuration scanOnPush=true

# Login
aws ecr get-login-password --profile infratech --region us-west-2 \
  | docker login --username AWS --password-stdin \
    443496863898.dkr.ecr.us-west-2.amazonaws.com

# Build + push (linux/amd64 for Karpenter)
TAG=$(git rev-parse --short HEAD)
docker buildx build --platform linux/amd64 \
  -t 443496863898.dkr.ecr.us-west-2.amazonaws.com/giolosts/maintenance:$TAG \
  -t 443496863898.dkr.ecr.us-west-2.amazonaws.com/giolosts/maintenance:latest \
  --push .
```

## DNS

DNS is managed **manually in Cloudflare** (see `infratech-k8s-services` ADR-0002). Each host is a CNAME → the shared ALB DNS name. One-time setup per host, doesn't change unless the ALB is destroyed.

Current records (all set to DNS-only, grey cloud):
- `maintenance` CNAME → `k8s-public-6d634e8520-529116321.us-west-2.elb.amazonaws.com`
- `qa-pbr` CNAME → same
- `qa-pbn` CNAME → same
- `qa-phr` CNAME → same

To add a new host: add it to `deploy/values.yaml` `ingress.hosts[]`, push (Helm will add the listener rule), then add the Cloudflare CNAME manually.

## TLS

Wildcard ACM cert `*.giolosts.co` covers all hostnames. Cert ARN is baked into the chart's `values.yaml` as the default — no override needed here.

## Chart values reference

See `deploy/values.yaml` for what this app overrides. See `~/Repos/giolosts/infra/infratech-helm-charts/charts/webapp/values.yaml` for the full documented default set.

## Cleanup

```bash
helm uninstall maintenance -n maintenance
kubectl delete namespace maintenance
# ALB listener rules for these hosts auto-remove
# Cloudflare CNAMEs stay until manually removed
```
