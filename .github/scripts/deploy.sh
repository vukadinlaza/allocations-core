for s in $(echo `cat deployconfig.json` | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ); do
  export $s
done
sha=$(git rev-parse main)
ECR_REGISTRY=046746691294.dkr.ecr.us-east-1.amazonaws.com
#find or create repository in ECR and set as ECR_REPOSITORY https://us-east-1.console.aws.amazon.com/ecr/repositories?region=us-east-1:
ECR_REPOSITORY=allocations.core
export IMAGE=$ECR_REGISTRY/$ECR_REPOSITORY:$sha

if [ $type = "next" ]
then
  export next_patch_url=https://static.allocations.dev/ymls/next/full.yml
else
  export next_patch_url=https://static.allocations.dev/ymls/next/empty.yml
fi

mkdir -p temp/base
cd temp/base
curl https://static.allocations.dev/ymls/base/kustomization.yml > kustomization.yml
curl https://static.allocations.dev/ymls/base/deployment.yml > deployment.yml

cd .. && mkdir -p overlays/$STAGE
cd overlays/$STAGE
curl https://static.allocations.dev/ymls/overlays/$STAGE/kustomization.yml > kustomization.yml
cp ../../../deployment/custom/patch.yml .
envsubst < kustomization.yml > kustomization.yaml
rm kustomization.yml
kubectl kustomize . > new-deployment.yml
envsubst < new-deployment.yml | kubectl apply -f -

rm -rf temp
