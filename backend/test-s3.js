const {
  S3Client,
  PutObjectCommand,
  ListBucketsCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();

async function testS3Connection() {
  console.log("🔍 Проверка настроек S3...");

  // Проверим переменные окружения
  console.log(
    "AWS_ACCESS_KEY_ID:",
    process.env.AWS_ACCESS_KEY_ID ? "✅ Установлен" : "❌ Отсутствует"
  );
  console.log(
    "AWS_SECRET_ACCESS_KEY:",
    process.env.AWS_SECRET_ACCESS_KEY ? "✅ Установлен" : "❌ Отсутствует"
  );
  console.log("AWS_REGION:", process.env.AWS_REGION || "❌ Отсутствует");
  console.log(
    "AWS_S3_BUCKET_NAME:",
    process.env.AWS_S3_BUCKET_NAME || "❌ Отсутствует"
  );

  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION ||
    !process.env.AWS_S3_BUCKET_NAME
  ) {
    console.log("❌ Не все переменные окружения установлены");
    return;
  }

  // Создаем S3 клиент
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log("\n🔗 Проверка подключения к AWS S3...");

    // Тест 1: Список бакетов
    const listBucketsCommand = new ListBucketsCommand({});
    const buckets = await s3Client.send(listBucketsCommand);
    console.log("✅ Подключение к AWS успешно");
    console.log(
      "📦 Доступные бакеты:",
      buckets.Buckets?.map((b) => b.Name).join(", ") || "Нет бакетов"
    );

    // Проверим, существует ли наш бакет
    const bucketExists = buckets.Buckets?.some(
      (b) => b.Name === process.env.AWS_S3_BUCKET_NAME
    );
    console.log(
      `📦 Бакет "${process.env.AWS_S3_BUCKET_NAME}":`,
      bucketExists ? "✅ Существует" : "❌ Не найден"
    );

    // Тест 2: Попытка загрузки тестового файла
    if (bucketExists) {
      console.log("\n📤 Тест загрузки файла...");
      const testKey = `test-${Date.now()}.txt`;
      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: testKey,
        Body: Buffer.from("Test upload from backend"),
        ContentType: "text/plain",
      });

      await s3Client.send(putCommand);
      console.log("✅ Тестовый файл успешно загружен:", testKey);
    }
  } catch (error) {
    console.log("❌ Ошибка при подключении к S3:");
    console.log("Код ошибки:", error.Code || error.name);
    console.log("Сообщение:", error.message);
    console.log("Статус:", error.$response?.statusCode);

    if (error.Code === "InvalidAccessKeyId") {
      console.log("🔧 Проверьте AWS_ACCESS_KEY_ID");
    } else if (error.Code === "SignatureDoesNotMatch") {
      console.log("🔧 Проверьте AWS_SECRET_ACCESS_KEY");
    } else if (error.Code === "NoSuchBucket") {
      console.log("🔧 Бакет не существует или нет доступа");
    }
  }
}

testS3Connection().catch(console.error);
