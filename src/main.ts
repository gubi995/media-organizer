import { parseArgs } from '@std/cli';
import { existsSync, ensureDirSync, move } from '@std/fs';
import ExifReader from 'npm:exifreader@4.25.0';
import path from 'node:path';

const NOT_METADATA = 'no_metadata';

const { input, output, dry } = parseArgs(Deno.args, {
  default: { input: '.', output: './out', dry: false },
});

if (!existsSync(input)) {
  throw new Error(`Input directory does not exist: ${input}`);
}

console.log({ input, output });

const inputDir = Deno.readDirSync(input);
const fileMetadataList = [];

for (const { name: fileName } of inputDir) {
  const file = Deno.readFileSync(path.join(input, fileName));
  const extension = path.extname(fileName);

  if (!['.jpg', '.jpeg', '.png'].includes(extension.toLowerCase())) {
    continue;
  }

  const metadata = ExifReader.load(file.buffer);
  const creationDate = metadata.DateTime?.description;
  const folderToPutFile = creationDate
    ? creationDate.split(':')[0]
    : NOT_METADATA;

  fileMetadataList.push({ fileName, folderToPutFile });
}

ensureDirSync(output);

for (const { fileName, folderToPutFile } of fileMetadataList) {
  ensureDirSync(path.join(output, folderToPutFile));
  const originalFilePath = path.join(input, fileName);
  const newFilePath = path.join(output, folderToPutFile, fileName);
  if (dry) {
    console.log({ originalFilePath, newFilePath });
    continue;
  }
  move(originalFilePath, newFilePath, { overwrite: true });
}
