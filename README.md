# JavBus API

一个自我托管的 [JavBus](https://www.javbus.com) API 服务

## 用途

- 可以用来搭建自己的视频信息网站
- 可以作为移动端 App 的 API 服务
- 可以作为爬虫的数据服务

## 使用

**注意：本程序仅仅是 JavBus 的一个在线转换服务，每个请求会实时请求 JavBus 对应的网页，解析之后返回对应的 json 数据**

因此需要您保证部署的机器有访问 JavBus 的能力，否则不会返回结果

### Docker 部署（推荐）

```shell
$ docker pull javbus-api
$ docker run --name javbus-api -d --restart unless-stopped -p 8080:3000 javbus-api
```

启动一个 Docker 容器，并将其名称设置为 `javbus-api`，端口设置为 `8080`，并且自动重启

在浏览器中访问 [http://localhost:8080/api/v1/movies?page=1&magnet=exist](http://localhost:8080/api/v1/movies?page=1&magnet=exist) 即可获取结果

### node.js 部署

```shell
$ git clone https://github.com/ovnrain/javbus-api.git
$ cd javbus-api
$ npm install
$ npm run build
$ echo "PORT=8080" > .env # 可选，默认端口为 `3000`
$ npm start
```

以上两种方式都可以配合 nginx 代理一起使用，以实现 https 访问等，例如

```nginx
location /api {
  proxy_pass http://localhost:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
  add_header cache-control "no-cache";
}
```

## API 文档

### /api/v1/movies

获取影片列表

#### 参数

- `page`: 页码，**必须**
- `magnet`: 根据影片是否包含磁力链接筛选，**必须**，可选值为 `all` 或 `exist`。`exist` 表示只返回有磁力链接的影片，`all` 表示返回全部影片
- `starId`: 根据演员 ID 筛选，可选，**不可以**与 `tagId` 同时使用
- `tagId`: 根据标签 ID 筛选，可选，**不可以**与 `starId` 同时使用

#### 请求举例

    /api/v1/movies?page=1&magnet=exist

返回有磁力链接的第一页影片

    /api/v1/movies?page=1&starId=2xi&magnet=all

返回 starId 为 `2xi` 的影片的第一页，包含有磁力链接和无磁力链接的影片

    /api/v1/movies?page=2&tagId=2t&magnet=exist

返回 tagId 为 `2t` 的影片的第二页，只返回有磁力链接的影片

#### 返回举例

```json
{
  "movies": [
    // 影片列表
    {
      "date": "2022-07-21",
      "id": "DLDSS-097",
      "img": "https://www.javbus.com/pics/thumb/915m.jpg",
      "title": "谷間を魅せつけ視線で誘惑。僕の思春期、毎日セックスをしてくれた姉が今…",
      "tags": ["高清", "昨日新種"]
    }
    // ...
  ],
  // 分页信息
  "pagination": {
    "currentPage": 1,
    "hasNextPage": true,
    "nextPage": 2,
    "pages": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  // 演员信息，注意：只有在请求参数包含 starId 时才会返回
  "star": {
    "avatar": "https://www.javbus.com/pics/actress/2xi_a.jpg",
    "id": "2xi",
    "name": "葵つかさ",
    "birthday": "1990-08-14",
    "age": "31",
    "height": "163cm",
    "bust": "88cm",
    "waistline": "58cm",
    "hipline": "86cm",
    "birthplace": "大阪府",
    "hobby": "ジョギング、ジャズ鑑賞、アルトサックス、ピアノ、一輪車"
  },
  // 标签信息，注意：只有在请求参数包含 tagId 时才会返回
  "tag": {
    "tagId": "2t",
    "tagName": "花癡"
  }
}
```

### /api/v1/movies/{id}

获取影片详情

#### 请求举例

    /api/v1/movies/SSIS-406

返回番号为 `SSIS-406` 的影片详情

#### 返回举例

```json
{
  "id": "SSIS-406",
  "title": "SSIS-406 才色兼備な女上司が思う存分に羽目を外し僕を連れ回す【週末限定】裏顔デート 葵つかさ",
  "img": "https://www.javbus.com/pics/cover/8xnc_b.jpg",
  // 封面大图尺寸
  "imageSize": {
    "width": 800,
    "height": 538
  },
  "date": "2022-05-20",
  // 影片时长
  "videoLength": 120,
  "director": {
    "directorId": "hh",
    "directorName": "五右衛門"
  },
  "producer": {
    "producerId": "7q",
    "producerName": "エスワン ナンバーワンスタイル"
  },
  "publisher": {
    "publisherId": "9x",
    "publisherName": "S1 NO.1 STYLE"
  },
  "series": null,
  "tags": [
    {
      "tagId": "e",
      "tagName": "巨乳"
    }
    // ...
  ],
  // 演员信息，一部影片可能包含多个演员
  "stars": [
    {
      "starId": "2xi",
      "starName": "葵つかさ"
    }
  ],
  // 磁力链接列表
  "magnets": [
    {
      "link": "magnet:?xt=urn:btih:A6D7C90FAB7E4223C61425A2E4CDF9E503CEDAA2&dn=SSIS-406-C",
      // 是否高清
      "isHD": true,
      "title": "SSIS-406-C",
      "size": "5.46GB",
      "shareDate": "2022-05-20",
      // 是否包含字幕
      "hasSubtitle": true
    }
    // ...
  ],
  // 影片截图
  "samples": [
    {
      "alt": "SSIS-406 才色兼備な女上司が思う存分に羽目を外し僕を連れ回す【週末限定】裏顔デート 葵つかさ - 樣品圖像 - 1",
      "id": "8xnc_1",
      "src": "https://pics.dmm.co.jp/digital/video/ssis00406/ssis00406jp-1.jpg",
      "thumbnail": "https://www.javbus.com/pics/sample/8xnc_1.jpg"
    }
    // ...
  ],
  "gid": "50217198406",
  "uc": "0"
}
```
