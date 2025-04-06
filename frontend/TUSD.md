# Setting up TUSD for S3 Uploads

This project uses [TUSD](https://github.com/tus/tusd) (TUS Daemon) to handle resumable file uploads directly to Amazon S3. This document explains how to set up and configure TUSD for your environment.

## What is TUS?

TUS (Tus Upload Server) is an open protocol for resumable file uploads. It allows you to resume interrupted uploads instead of starting over from the beginning, which is especially helpful for large audio/video files.

## Setting up TUSD

### 1. Install TUSD

#### Using Docker (recommended)

```bash
docker pull tusproject/tusd:latest

docker run -p 1080:1080 \
  -e AWS_ACCESS_KEY_ID=your_aws_access_key \
  -e AWS_SECRET_ACCESS_KEY=your_aws_secret_key \
  -e AWS_REGION=us-east-1 \
  tusproject/tusd:latest \
  -s3-bucket=meet-notes-audio \
  -host=0.0.0.0 \
  -port=1080 \
  -behind-proxy
```

#### Manual Installation

```bash
# For macOS
brew install tusd

# From source
git clone https://github.com/tus/tusd.git
cd tusd
go build -o tusd cmd/tusd/main.go
```

### 2. Configure TUSD for S3

To run TUSD with S3 storage:

```bash
tusd \
  -s3-bucket=meet-notes-audio \
  -s3-endpoint=https://s3.amazonaws.com \
  -s3-object-prefix=uploads/ \
  -port=1080 \
  -behind-proxy
```

### 3. Configure AWS IAM Policy

Ensure your AWS IAM user has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListMultipartUploadParts",
        "s3:AbortMultipartUpload",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::meet-notes-audio/*",
        "arn:aws:s3:::meet-notes-audio"
      ]
    }
  ]
}
```

### 4. CORS Configuration for Your S3 Bucket

Add a CORS policy to your S3 bucket:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "PUT",
      "POST",
      "DELETE",
      "GET"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "Location",
      "Tus-Resumable",
      "Upload-Length",
      "Upload-Offset"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## Environment Configuration

Update your `.env.local` file with:

```
NEXT_PUBLIC_TUSD_ENDPOINT=http://localhost:1080/files/
NEXT_PUBLIC_S3_BUCKET=meet-notes-audio
NEXT_PUBLIC_TRANSCRIPTION_API_URL=http://your-transcription-api/api
```

## Testing Your Setup

1. Start TUSD server
2. Start your Next.js application
3. Upload a file and check if it's properly stored in your S3 bucket
4. Interrupt an upload and resume it

## Troubleshooting

- **CORS errors**: Ensure your S3 bucket CORS settings allow requests from your application
- **Authentication errors**: Verify AWS credentials are correctly set
- **Network errors**: Check if TUSD server is running and accessible 