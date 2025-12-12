# Kubernetes Deployment

Kubernetes configurations for deploying Jivan Healthcare API to production.

## Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Helm (optional, for easier management)
- cert-manager (for SSL certificates)
- NGINX Ingress Controller

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

**Option A: From file**
```bash
kubectl create secret generic jivan-secrets \
  --from-env-file=../.env \
  --namespace=jivan
```

**Option B: Manually**
```bash
kubectl apply -f secrets.yaml
# Edit the secrets file with your actual values first!
```

### 3. Create ConfigMap

```bash
kubectl apply -f configmap.yaml
```

### 4. Deploy Database (PostgreSQL)

```bash
kubectl apply -f postgres-deployment.yaml
```

Wait for PostgreSQL to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=postgres --namespace=jivan --timeout=300s
```

### 5. Run Migrations

```bash
kubectl run migrations --rm -it --restart=Never \
  --image=jivan/backend:latest \
  --namespace=jivan \
  --env="DATABASE_URL=postgresql://jivan_user:password@postgres-service:5432/jivan_db" \
  --command -- npm run migrate
```

### 6. Deploy Redis

```bash
kubectl apply -f redis-deployment.yaml
```

### 7. Deploy Backend API & Workers

```bash
kubectl apply -f backend-deployment.yaml
```

### 8. Setup Ingress (Optional)

```bash
kubectl apply -f ingress.yaml
```

## Verify Deployment

Check all pods are running:
```bash
kubectl get pods --namespace=jivan
```

Check services:
```bash
kubectl get services --namespace=jivan
```

Check logs:
```bash
# API logs
kubectl logs -f deployment/backend-api --namespace=jivan

# Worker logs
kubectl logs -f deployment/backend-worker --namespace=jivan
```

## Scaling

### Manual Scaling
```bash
kubectl scale deployment/backend-api --replicas=5 --namespace=jivan
kubectl scale deployment/backend-worker --replicas=3 --namespace=jivan
```

### Auto-scaling
HPA is configured in backend-deployment.yaml and will automatically scale based on CPU/memory usage.

## Updating

### Rolling Update
```bash
kubectl set image deployment/backend-api backend-api=jivan/backend:v2.0.0 --namespace=jivan
```

### Rollback
```bash
kubectl rollout undo deployment/backend-api --namespace=jivan
```

## Monitoring

Get pod status:
```bash
kubectl get pods --namespace=jivan -w
```

Describe pod:
```bash
kubectl describe pod <pod-name> --namespace=jivan
```

Execute commands in pod:
```bash
kubectl exec -it <pod-name> --namespace=jivan -- /bin/sh
```

## Troubleshooting

### Database Connection Issues
```bash
kubectl exec -it postgres-0 --namespace=jivan -- psql -U jivan_user -d jivan_db
```

### Redis Connection Issues
```bash
kubectl exec -it <redis-pod> --namespace=jivan -- redis-cli
```

### View Logs
```bash
kubectl logs <pod-name> --namespace=jivan --tail=100 -f
```

### Pod Not Starting
```bash
kubectl describe pod <pod-name> --namespace=jivan
kubectl logs <pod-name> --namespace=jivan --previous
```

## Cleanup

Delete all resources:
```bash
kubectl delete namespace jivan
```

## Production Considerations

1. **Secrets Management**: Use external secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
2. **Database**: Use managed database service (AWS RDS, Google Cloud SQL)
3. **Redis**: Use managed Redis (AWS ElastiCache, Google Memorystore)
4. **Monitoring**: Setup Prometheus + Grafana
5. **Logging**: Setup ELK Stack or cloud logging
6. **Backup**: Configure automated database backups
7. **SSL**: Use cert-manager for automatic SSL certificate management
8. **Network Policies**: Implement network policies for security
9. **Resource Limits**: Tune resource requests/limits based on actual usage
10. **High Availability**: Deploy across multiple availability zones

