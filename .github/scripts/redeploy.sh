kubectl rollout restart deployment/allocations.core -n $STAGE
kubectl rollout status deployment/allocations.core -n $STAGE
