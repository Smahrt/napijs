import { Seeder } from 'mongo-seeding';
import { Database } from '../../src/config/database';
import path from 'path';

const config = {
  database: Database.uri,
  dropDatabase: true,
};

export const runSeeder = async () => {
  const seeder = new Seeder(config);

  try {
    const collections = seeder.readCollectionsFromPath(
      path.join(__dirname, './data'),
      {
        extensions: ['ts']
      }
    );

    await seeder.import(collections);
    console.log('info', `SPEC: seeded ${collections.length} collections in DB successfully!`);
  } catch (err) {
    console.log('info', `SPEC: an error occurred while seeding -- ${JSON.stringify(err)}`, err);
    process.exit(1);
  }
};
