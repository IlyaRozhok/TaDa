# AWS S3 Configuration for Property Media

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=eu-central-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

## AWS Setup Steps

### 1. Create S3 Bucket

1. Go to AWS Console → S3
2. Create a new bucket with a unique name
3. Enable public read access for uploaded files
4. Configure CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 2. Create IAM User

1. Go to AWS Console → IAM → Users
2. Create a new user with programmatic access
3. Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 3. Security Best Practices

- Use IAM roles in production
- Enable bucket encryption
- Set up lifecycle policies for cost optimization
- Monitor access logs

## API Endpoints

### Upload Media

```
POST /properties/:propertyId/media/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: (binary file)
- orderIndex: (number, optional)
- isFeatured: (boolean, optional)
```

### Get Property Media

```
GET /properties/:propertyId/media
```

### Delete Media

```
DELETE /properties/:propertyId/media/:mediaId
Authorization: Bearer <token>
```

### Update Media Order

```
PUT /properties/:propertyId/media/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaOrders": [
    { "id": "media-id", "order_index": 0 },
    { "id": "media-id", "order_index": 1 }
  ]
}
```

### Set Featured Media

```
PUT /properties/:propertyId/media/:mediaId/featured
Authorization: Bearer <token>
```

## File Constraints

- **Max file size**: 10MB
- **Max files per property**: 10
- **Allowed types**:
  - Images: JPEG, PNG, GIF, WebP, BMP, TIFF
  - Videos: MP4, MPEG, QuickTime, AVI, WMV
- **Access control**: Only property owners can upload/delete media

## Database Schema

The `property_media` table includes:

- `id` - UUID primary key
- `property_id` - Foreign key to properties table
- `url` - Public S3 URL
- `s3_key` - S3 object key for deletion
- `type` - 'image' or 'video'
- `mime_type` - Original MIME type
- `original_filename` - Original filename
- `file_size` - File size in bytes
- `order_index` - Display order
- `is_featured` - Featured image flag
- `created_at` - Upload timestamp
- `updated_at` - Last update timestamp
