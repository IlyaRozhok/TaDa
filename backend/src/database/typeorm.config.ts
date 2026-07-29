import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export const typeOrmConfig = (env: NodeJS.ProcessEnv): TypeOrmModuleOptions => {
  const isDev = env.NODE_ENV === "development";

  return {
    type: "postgres",
    host: env.DB_HOST,
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    autoLoadEntities: true,
    synchronize: isDev ? env.TYPEORM_SYNCHRONIZE === "true" : false,
    logging: env.TYPEORM_LOGGING === "true",
    // Миграции применяются только явным шагом деплоя (npm run mig:run:prod),
    // а не на бутстрапе приложения: так падение миграции видно в CI и не уводит
    // контейнер в краш-луп, а при нескольких репликах они не гонятся наперегонки.
    migrationsRun: false,
    // Резолвим от __dirname, а не от cwd: файл компилируется в dist/database/,
    // поэтому путь указывает на dist/database/migrations — туда же, куда смотрит
    // dist/database/data-source.js, используемый CLI в mig:run:prod.
    migrations: [join(__dirname, "migrations/*.js")],
    ssl: env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
};
