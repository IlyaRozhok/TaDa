-- Fix S3 URLs in database by updating old bucket URLs to use new bucket
-- This script updates all URLs from old bucket to new bucket and regenerates presigned URLs

-- 1. Update PropertyMedia URLs
UPDATE property_media 
SET url = REPLACE(url, 'tada-media-bucket-local.s3.eu-north-1.amazonaws.com', 'tada-prod-media.s3.eu-west-2.amazonaws.com')
WHERE url LIKE '%tada-media-bucket-local.s3.eu-north-1.amazonaws.com%';

-- 2. Update Building logos
UPDATE buildings 
SET logo = REPLACE(logo, 'tada-media-bucket-local.s3.eu-north-1.amazonaws.com', 'tada-prod-media.s3.eu-west-2.amazonaws.com')
WHERE logo LIKE '%tada-media-bucket-local.s3.eu-north-1.amazonaws.com%';

-- 3. Update Building videos
UPDATE buildings 
SET video = REPLACE(video, 'tada-media-bucket-local.s3.eu-north-1.amazonaws.com', 'tada-prod-media.s3.eu-west-2.amazonaws.com')
WHERE video LIKE '%tada-media-bucket-local.s3.eu-north-1.amazonaws.com%';

-- 4. Update Building photos (JSON array)
UPDATE buildings 
SET photos = REPLACE(photos::text, 'tada-media-bucket-local.s3.eu-north-1.amazonaws.com', 'tada-prod-media.s3.eu-west-2.amazonaws.com')::json
WHERE photos::text LIKE '%tada-media-bucket-local.s3.eu-north-1.amazonaws.com%';

-- 5. Update Building documents
UPDATE buildings 
SET documents = REPLACE(documents, 'tada-media-bucket-local.s3.eu-north-1.amazonaws.com', 'tada-prod-media.s3.eu-west-2.amazonaws.com')
WHERE documents LIKE '%tada-media-bucket-local.s3.eu-north-1.amazonaws.com%';

-- Show updated counts
SELECT 'PropertyMedia URLs updated' as table_name, COUNT(*) as count 
FROM property_media 
WHERE url LIKE '%tada-prod-media.s3.eu-west-2.amazonaws.com%'

UNION ALL

SELECT 'Building logos updated' as table_name, COUNT(*) as count 
FROM buildings 
WHERE logo LIKE '%tada-prod-media.s3.eu-west-2.amazonaws.com%'

UNION ALL

SELECT 'Building videos updated' as table_name, COUNT(*) as count 
FROM buildings 
WHERE video LIKE '%tada-prod-media.s3.eu-west-2.amazonaws.com%'

UNION ALL

SELECT 'Building photos updated' as table_name, COUNT(*) as count 
FROM buildings 
WHERE photos::text LIKE '%tada-prod-media.s3.eu-west-2.amazonaws.com%'

UNION ALL

SELECT 'Building documents updated' as table_name, COUNT(*) as count 
FROM buildings 
WHERE documents LIKE '%tada-prod-media.s3.eu-west-2.amazonaws.com%';
