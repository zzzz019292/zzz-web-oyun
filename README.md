# LAST BOND — Cloudflare'a Kurulum

## İçerik
- `public/index.html`: oyun istemcisi (aynı adresten otomatik WSS bağlantısı)
- `worker.js`: oyun sunucusu ve WebSocket Durable Object
- `wrangler.jsonc`: Static Assets + SQLite Durable Object ayarları
- `package.json`: Wrangler komutları

## Kurulum (Windows)
1. [Node.js](https://nodejs.org/) LTS yükle.
2. Bu ZIP'i `last-bond-cloudflare` klasörüne aç.
3. Klasörün içinde Dosya Gezgini adres satırına `cmd` yazıp Enter'a bas.
4. Aşağıdaki komutları sırayla çalıştır:

```bat
npm install
npx wrangler login
npx wrangler deploy
```

Son komut sana `https://last-bond.<hesap>.workers.dev` biçiminde bir URL verir. O adresi hem kendin hem arkadaşın tarayıcıda aç.

**Not:** Dashboard'da oluşturduğun Worker'ın adı `last-bond` değilse, `wrangler.jsonc` dosyasındaki `name` alanını mevcut Worker adıyla değiştir.

## Oynamak
- Oyun sayfasının `Sunucu URL` alanı açılan internet adresinden otomatik doldurulur.
- Biriniz `ODA OLUŞTUR` der ve kodu paylaşır, diğeriniz `KATIL` der.
- Karakter seçin ve `HAZIR` olun.

## Yerel deneme
`npm run dev` ile http://localhost:8787 açılır. İki ayrı sekmede aynı URL üzerinden deneyebilirsin.

## Bilinen sınırlar
Bu oyun hâlen erken prototiptir. 12 silah, çeşitli sinerjiler, aktif yetenekler, boss desenleri gibi özelliklerin bir bölümü henüz kodlanmamıştır. Gerçek Cloudflare dağıtımı ve iki farklı ağda bağlantı burada test edilmemiştir.
