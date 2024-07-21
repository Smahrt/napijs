import fs from 'fs';

export const registerMocks = async () => {
  console.log('SPEC: Registering mocks...');
  const mockFiles = fs.readdirSync(__dirname)
    .filter(file => file.includes('mock.'))
    .map(file => file.split('.ts')[0]);

  const mocks = await Promise.all(mockFiles.map(file_2 => import(`./${file_2}`)));
  console.log(`SPEC: Registered ${mocks.length} mocks successfully!`);
  return mocks;
};
