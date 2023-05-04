import { ConsoleLogger, Injectable } from '@nestjs/common';

import axios from 'axios';

import * as cheerio from 'cheerio';

import * as fs from 'fs';

import * as path from 'path';

@Injectable()
export class SpiderService {
  async findAll() {
    const baseUrl = 'https://j.20dh.top';
    const imgs: string[] = [];
    const nextText = '下一页';
    let index = 0;
    const getCosPlay = async () => {
      const url = `https://www.xgmn08.com/Xiuren/Xiuren25906${
        index ? '_' + index : ''
      }.html`;
      console.log(
        '🚀 ~ file: spider.service.ts:22 ~ SpiderService ~ getCosPlay ~ url:',
        url,
      );
      const body = await axios.get(url).then(async (res) => res.data);

      const $ = cheerio.load(body);
      const page = $('.pagination').eq(0).find('a');

      const pageList = page
        .map(function () {
          return $(this).text();
        })
        .toArray();
      if (pageList.includes(nextText)) {
        $('.article-content p img').each(function (index, element) {
          const src = `${baseUrl}${$(element).attr('src')}`;
          imgs.push(src.replace('/upload', '/Upload'));
        });
        index++;
        await getCosPlay();
      }
    };
    await getCosPlay();
    console.log(
      '🚀 ~ file: spider.service.ts:16 ~ SpiderService ~ findAll ~ imgs:',
      imgs,
    );
    this.writeFile(imgs);
  }
  writeFile(urls: string[]) {
    urls.forEach(async (url) => {
      const buffer = await axios
        .get(url, { responseType: 'arraybuffer' })
        .then((res) => res.data);
      const ws = fs.createWriteStream(
        path.join(__dirname, '../cos' + new Date().getTime() + '.jpg'),
      );
      ws.write(buffer);
    });
  }
}
