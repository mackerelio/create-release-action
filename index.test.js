import { rmRF, mkdirP } from '@actions/io';
import { writeFile } from 'fs';
import read from 'fs-readdir-recursive';

test('read assets', async () => {
  await rmRF('tmp-readdir/');
  await mkdirP('tmp-readdir/1/2/');
  const files = [
    'tmp-readdir/1.txt',
    'tmp-readdir/1/2.txt',
    'tmp-readdir/1/2/3.txt',
  ];
  for (let filename of files) {
    writeFile(filename, 'Hello', (err) => {
      if (err) throw err;
    });
  }

  const result = read('.', () => true, [], 'tmp-readdir/');
  expect(result).toEqual(expect.arrayContaining(files));
});

