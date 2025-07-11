const AWS = require("aws-sdk");
require("dotenv").config();

// Настройка AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

console.log("🔍 S3 Configuration:");
console.log("- Region:", process.env.AWS_REGION);
console.log("- Bucket:", BUCKET_NAME);
console.log("- Access Key ID:", process.env.AWS_ACCESS_KEY_ID);
console.log(
  "- Secret Key:",
  process.env.AWS_SECRET_ACCESS_KEY
    ? "***" + process.env.AWS_SECRET_ACCESS_KEY.slice(-4)
    : "Not set"
);

async function testS3() {
  try {
    console.log("\n🔍 Testing S3 Connection...");

    // 1. Проверяем доступность S3
    console.log("\n1. Checking S3 service availability...");
    const regions = await s3.listBuckets().promise();
    console.log("✅ S3 service is accessible");

    // 2. Список всех доступных buckets
    console.log("\n2. Available buckets:");
    if (regions.Buckets && regions.Buckets.length > 0) {
      regions.Buckets.forEach((bucket, index) => {
        console.log(
          `   ${index + 1}. ${bucket.Name} (created: ${bucket.CreationDate})`
        );
      });
    } else {
      console.log("   No buckets found");
    }

    // 3. Проверяем существование нужного bucket
    console.log(`\n3. Checking if bucket '${BUCKET_NAME}' exists...`);
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
      console.log(`✅ Bucket '${BUCKET_NAME}' exists and is accessible`);

      // 4. Проверяем права доступа
      console.log("\n4. Testing bucket permissions...");
      try {
        const objects = await s3
          .listObjectsV2({ Bucket: BUCKET_NAME, MaxKeys: 5 })
          .promise();
        console.log(
          `✅ Can list objects in bucket (found ${
            objects.Contents ? objects.Contents.length : 0
          } objects)`
        );

        if (objects.Contents && objects.Contents.length > 0) {
          console.log("   Recent objects:");
          objects.Contents.slice(0, 3).forEach((obj, index) => {
            console.log(
              `     ${index + 1}. ${obj.Key} (size: ${
                obj.Size
              } bytes, modified: ${obj.LastModified})`
            );
          });
        }
      } catch (listError) {
        console.log("❌ Cannot list objects:", listError.message);
      }

      // 5. Тестируем загрузку файла
      console.log("\n5. Testing file upload...");
      const testKey = `test-upload-${Date.now()}.txt`;
      const testContent = "This is a test file for S3 upload";

      try {
        await s3
          .putObject({
            Bucket: BUCKET_NAME,
            Key: testKey,
            Body: testContent,
            ContentType: "text/plain",
          })
          .promise();
        console.log(`✅ Successfully uploaded test file: ${testKey}`);

        // 6. Проверяем загруженный файл
        console.log("\n6. Verifying uploaded file...");
        const uploadedFile = await s3
          .getObject({
            Bucket: BUCKET_NAME,
            Key: testKey,
          })
          .promise();
        console.log(
          `✅ Successfully retrieved test file (size: ${uploadedFile.Body.length} bytes)`
        );

        // 7. Удаляем тестовый файл
        console.log("\n7. Cleaning up test file...");
        await s3
          .deleteObject({
            Bucket: BUCKET_NAME,
            Key: testKey,
          })
          .promise();
        console.log("✅ Test file deleted successfully");
      } catch (uploadError) {
        console.log("❌ Cannot upload file:", uploadError.message);
        console.log("Error details:", uploadError);
      }
    } catch (bucketError) {
      console.log(
        `❌ Bucket '${BUCKET_NAME}' does not exist or is not accessible`
      );
      console.log("Error details:", bucketError.message);

      // Предлагаем создать bucket
      console.log(`\n🔧 Attempting to create bucket '${BUCKET_NAME}'...`);
      try {
        await s3
          .createBucket({
            Bucket: BUCKET_NAME,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION,
            },
          })
          .promise();
        console.log(`✅ Successfully created bucket '${BUCKET_NAME}'`);
      } catch (createError) {
        console.log("❌ Cannot create bucket:", createError.message);
        console.log("Error details:", createError);
      }
    }
  } catch (error) {
    console.log("❌ S3 Connection failed:", error.message);
    console.log("Error details:", error);
  }
}

// Запускаем тест
testS3()
  .then(() => {
    console.log("\n🏁 S3 test completed");
  })
  .catch((error) => {
    console.log("\n💥 Test failed:", error.message);
  });
