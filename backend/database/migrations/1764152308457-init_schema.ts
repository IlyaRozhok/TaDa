import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1764152308457 implements MigrationInterface {
    name = 'InitSchema1764152308457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "primary_postcode" character varying, "secondary_location" character varying, "commute_location" character varying, "commute_time_walk" integer, "commute_time_cycle" integer, "commute_time_tube" integer, "move_in_date" date, "move_out_date" date, "min_price" integer, "max_price" integer, "min_bedrooms" integer, "max_bedrooms" integer, "min_bathrooms" integer, "max_bathrooms" integer, "furnishing" character varying, "let_duration" character varying, "property_type" text array, "building_style" text array, "designer_furniture" boolean, "house_shares" character varying, "date_property_added" character varying, "lifestyle_features" text array, "social_features" text array, "work_features" text array, "convenience_features" text array, "pet_friendly_features" text array, "luxury_features" text array, "hobbies" text array, "ideal_living_environment" json, "pets" character varying, "smoker" character varying, "additional_info" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_34a542d34f1c75c43e78df2e67" UNIQUE ("user_id"), CONSTRAINT "PK_17f8855e4145192bbabd91a51be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying, "age_range" character varying, "phone" character varying, "date_of_birth" date, "nationality" character varying, "occupation" character varying, "industry" character varying, "work_style" character varying, "lifestyle" text, "ideal_living_environment" character varying, "additional_info" text, "shortlisted_properties" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_b8a59063604d0b6d659548da5a" UNIQUE ("userId"), CONSTRAINT "PK_2a7607ec8fe2028dc77670f64c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "operator_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying, "company_name" character varying, "phone" character varying, "date_of_birth" date, "nationality" character varying, "business_address" character varying, "company_registration" character varying, "vat_number" character varying, "license_number" character varying, "years_experience" integer, "operating_areas" text, "property_types" text, "services" text, "business_description" text, "website" character varying, "linkedin" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_7a8bd6902d3eff8546548e6e69" UNIQUE ("userId"), CONSTRAINT "PK_484f29fdc6cb7e6d5e791b759f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."buildings_type_of_unit_enum" AS ENUM('studio', '1-bed', '2-bed', '3-bed', 'Duplex', 'penthouse')`);
        await queryRunner.query(`CREATE TYPE "public"."buildings_tenant_type_enum" AS ENUM('corporateLets', 'sharers', 'student', 'family', 'elder')`);
        await queryRunner.query(`CREATE TABLE "buildings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying, "number_of_units" integer, "type_of_unit" "public"."buildings_type_of_unit_enum", "logo" character varying, "video" character varying, "photos" text DEFAULT '', "documents" character varying, "metro_stations" jsonb NOT NULL, "commute_times" jsonb NOT NULL, "local_essentials" jsonb NOT NULL, "amenities" jsonb NOT NULL DEFAULT '[]', "is_concierge" boolean NOT NULL, "concierge_hours" jsonb, "pet_policy" boolean NOT NULL DEFAULT false, "pets" jsonb, "smoking_area" boolean NOT NULL DEFAULT false, "tenant_type" "public"."buildings_tenant_type_enum" DEFAULT 'family', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "operator_id" uuid, CONSTRAINT "PK_bc65c1acce268c383e41a69003a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "properties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "apartment_number" character varying, "building_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "price" numeric(10,2), "bedrooms" integer, "bathrooms" integer, "photos" text array DEFAULT '{}', "operator_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d83bfa0b9fcd45dee1785af44d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shortlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "propertyId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "unique_user_property" UNIQUE ("userId", "propertyId"), CONSTRAINT "PK_1250a664d7b5e95bbe941503874" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'operator', 'tenant')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying, "role" "public"."users_role_enum", "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "provider" character varying NOT NULL DEFAULT 'local', "google_id" character varying, "avatar_url" character varying, "email_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "full_name" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "property_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "property_id" uuid NOT NULL, "url" character varying NOT NULL, "s3_key" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'image', "mime_type" character varying NOT NULL, "original_filename" character varying NOT NULL, "file_size" bigint NOT NULL, "order_index" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d18a71a690f74cc103387bd67df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "preferences" ADD CONSTRAINT "FK_34a542d34f1c75c43e78df2e67a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD CONSTRAINT "FK_b8a59063604d0b6d659548da5a9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" ADD CONSTRAINT "FK_7a8bd6902d3eff8546548e6e69e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "buildings" ADD CONSTRAINT "FK_0bd1c6abc1930515bbce4eb2441" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_0bfd8f2ef727798734b537ef222" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_596505820276c00d0fa9f827b43" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shortlist" ADD CONSTRAINT "FK_324279f59659fdb6ad0eb6f8942" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shortlist" ADD CONSTRAINT "FK_683115c3f00d8f904dd359a95ab" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "property_media" ADD CONSTRAINT "FK_8f44a07b8e344393e360b2dd808" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "property_media" DROP CONSTRAINT "FK_8f44a07b8e344393e360b2dd808"`);
        await queryRunner.query(`ALTER TABLE "shortlist" DROP CONSTRAINT "FK_683115c3f00d8f904dd359a95ab"`);
        await queryRunner.query(`ALTER TABLE "shortlist" DROP CONSTRAINT "FK_324279f59659fdb6ad0eb6f8942"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_596505820276c00d0fa9f827b43"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_0bfd8f2ef727798734b537ef222"`);
        await queryRunner.query(`ALTER TABLE "buildings" DROP CONSTRAINT "FK_0bd1c6abc1930515bbce4eb2441"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP CONSTRAINT "FK_7a8bd6902d3eff8546548e6e69e"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP CONSTRAINT "FK_b8a59063604d0b6d659548da5a9"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT "FK_34a542d34f1c75c43e78df2e67a"`);
        await queryRunner.query(`DROP TABLE "property_media"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "shortlist"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TABLE "buildings"`);
        await queryRunner.query(`DROP TYPE "public"."buildings_tenant_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."buildings_type_of_unit_enum"`);
        await queryRunner.query(`DROP TABLE "operator_profiles"`);
        await queryRunner.query(`DROP TABLE "tenant_profiles"`);
        await queryRunner.query(`DROP TABLE "preferences"`);
    }

}
