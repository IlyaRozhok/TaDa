const {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();

async function createS3Bucket() {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log("Креды:", {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  try {
    console.log(`🏗️ Создание бакета: ${bucketName}`);

    const createBucketParams = {
      Bucket: bucketName,
    };

    // Для регионов отличных от us-east-1 нужно указать LocationConstraint
    if (process.env.AWS_REGION !== "us-east-1") {
      createBucketParams.CreateBucketConfiguration = {
        LocationConstraint: process.env.AWS_REGION,
      };
    }

    const createCommand = new CreateBucketCommand(createBucketParams);
    await s3Client.send(createCommand);

    console.log("✅ Бакет успешно создан!");

    // Настройка CORS для веб-доступа
    console.log("🔧 Настройка CORS...");
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    const corsCommand = new PutBucketCorsCommand(corsParams);
    await s3Client.send(corsCommand);

    console.log("✅ CORS настроен успешно!");
  } catch (error) {
    if (error.Code === "BucketAlreadyExists") {
      console.log("ℹ️ Бакет уже существует");
    } else if (error.Code === "BucketAlreadyOwnedByYou") {
      console.log("ℹ️ Бакет уже принадлежит вам");
    } else {
      console.log("❌ Ошибка при создании бакета:");
      console.log("Код:", error.Code || error.name);
      console.log("Сообщение:", error.message);
    }
  }
}

createS3Bucket().catch(console.error);
