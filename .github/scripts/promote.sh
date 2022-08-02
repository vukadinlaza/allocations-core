image=$(kubectl get deploy -n staging allocations.core -o=jsonpath='{.spec.template.spec.containers[0].image}')
kubectl set image deployment/allocations.core allocations.core=$image -n production
kubectl rollout restart -n production deployment/allocations.core
