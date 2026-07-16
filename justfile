# Deploy gpt-image-2-webui to Cloud Run (reads OPENAI_API_KEY from your local env)
deploy:
    gcloud run deploy gpt-image-2-webui \
        --source . \
        --region us-central1 \
        --platform managed \
        --allow-unauthenticated \
        --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY \
        --memory 1Gi \
        --cpu 1 \
        --min-instances 1 \
        --max-instances 10 \
        --cpu-boost
