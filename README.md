# LAST BOND — Son Bağ

İki kişilik, sunucu otoriter Canvas 2D co-op roguelike. Tek Cloudflare Worker; SQLite-backed `RoomDirectory` + `GameRoom`; gerçek WebSocket ve Hibernation API. İstemci HTML, CSS ve JavaScript dahil tek `index.html` dosyasıdır. Backend `worker.js`, `engine.js`, `protocol.js` dosyalarındadır. Harici görsel, ses, framework, veritabanı veya ücretli sunucu gerekmez.

## Doğrulama durumu

- 35 otomatik kural / protokol / SQLite yaşam döngüsü testi geçti.
- Yerel Wrangler 4.150.0 / workerd üzerinde HTTP ve gerçek WebSocket **101** ile 14 ağ kontrolü geçti. İki istemci aynı server tick’te aynı oyuncu/düşman durumunu aldı; güvenli reconnect ve oda sınırı doğrulandı.
- `wrangler deploy --dry-run` başarılı: binding’ler, SQLite migration ve Static Assets build’i kabul edildi. Dry-run, canlı deploy değildir.
- Canlı adres: [LAST BOND](https://last-bond.ahmet728kq.workers.dev/). GitHub `main` Cloudflare Workers Builds'e bağlıdır; arayüz ASSETS binding'i ile yayınlanır. İlk yayın ve iki oyunculu lobi tarayıcıda doğrulandı.
- v1.1 istemcisi bellek içi DOM/audio testleriyle; gerçek Canvas raster çıktısı ile sınıflar, canavarlar, çayır ve boss uyarıları kontrol edildi. Bu test gerçek tarayıcı veya hoparlörden dinleme yerine geçmez. İki farklı gerçek internet bağlantısından tam maç henüz doğrulanmadı.
- `benchmark-result.json`: 900 saniye simüle edilmiş yerel Node yük testi; son 150 saniyede sentetik 450 projectile sınır stresi; 150 düşman, iki build, ölçülmüş tick süreleri ve sınırlı entity/pool sayıları. Bu test gerçek zamanlı 15 dakikalık internet maçı veya Cloudflare profili değildir.

## v1.1 — Çayır kuşatması

- Pixel sprite karakterler; goblin, koşucu, tükürücü, patlayan mantar, zırhlı, büyücü, avcı, boynuzlu Diken Muhafızı ve büyük Boşluk Efendisi. Çimen, çiçek, taş, patika ve sınır ormanı; ahşap/orman renklerinde arayüz.
- Başlangıçta güvenli mesafede on düşman. Takviye aralığı 1,25 sn yerine 0,60 sn'den başlar, zamanla 0,22 sn'ye iner. Her 24 sn beş ek düşman; sert entity sınırları korunur.
- Tükürücü 25 sn, Patlak 45 sn, Avcı 95 sn, Büyücü 135 sn, Zırhlı 180 sn'den itibaren havuza girer. İlk miniboss 70 sn, sonraki minibosslar 95 sn arayla; final boss 12. dakikada.
- Her yaşayan karakterin üstünde can barı; 0,32 sn kırmızı hasar sprite'ı ve hasar sayısı. Kendi hasarında kısa 8-bit darbe sesi; arkadaşın hasarı bunu tetiklemez. Ses ayarı korunur, kullanıcı etkileşimi AudioContext'i açar.
- Miniboss: önceden işaretlenmiş ezme alanı, beş tohumlu salvo, sürü çağrısı. Final boss: kök kırılması, bir saniye çizgili hücum uyarısı, gecikmeli diken çemberi, alan saldırısıyla çağrı. %50 HP altında ikinci evre: ek kök alanları, daha çok diken/çağrı ve daha kısa döngü.

## İlk kurulum: ücretsiz hesap ve deploy

1. [Cloudflare](https://dash.cloudflare.com/sign-up) üzerinde ücretsiz hesap açın. Dashboard → Workers & Pages → Plans / kullanım ekranından **Workers Free** planını doğrulayın. Workers Paid, KV-backed DO veya başka ücretli hizmet seçmeyin. Özel alan adı ve kredi kartı gerektiren bir bileşen kullanılmaz.
2. [Node.js](https://nodejs.org/) 22.15+ veya 24 LTS kurun. Terminalde `node --version` ve `npm --version` çalıştırın. ZIP’i açın; `package.json` bulunan `last-bond` klasörüne girin.
3. Bağımlılıkları kurun:

   ```sh
   npm install
   npx wrangler login
   ```

   Tarayıcıda kendi Cloudflare hesabınıza izin verin. Birden fazla hesabınız varsa hedef hesabı Wrangler üzerinden seçin / config’e `account_id` ekleyin. Browser istemcisinde hiçbir Cloudflare API token’ı tutulmaz. **Zorunlu gizli anahtar yok.** Oyuncu reconnect token’ları sunucu üretir; Cloudflare API anahtarı değildir.

4. Build ve yerel çalışma:

   ```sh
   npm run build:assets
   npm run dev
   ```

   `build:assets` kökteki tek HTML’yi `dist/index.html` olarak kopyalar; backend’i `dist` içine koymaz. `dev` build’den sonra yerel SQLite Durable Objects / WebSocket sunucusunu başlatır. Terminalde yazan `http://localhost:8787` adresini kullanın. Bu komut internetten erişilebilir sunucu oluşturmaz.

5. Kontrol ve yayın:

   ```sh
   npm test
   npm run test:network
   npm run check:deploy
   npm run deploy
   ```

   `deploy` build + gerçek `wrangler deploy` çalıştırır. İlk deploy’da `migrations: [{tag:"v1",new_sqlite_classes:["RoomDirectory","GameRoom"]}]` SQLite DO namespace’lerini oluşturur. Ayrı D1, KV, R2 veya manuel veritabanı kurulmaz. Sonraki deploy’larda aynı v1 migration’ını bırakın; yeniden adlandırma/silme gerekmedikçe değiştirmeyin.

6. Deploy çıktısında `https://last-bond.<sizin-subdomaininiz>.workers.dev` URL’si görünür. `last-bond` adında zaten başka bir projeniz varsa önce `wrangler.jsonc` içindeki `name` değerini benzersiz bir ada değiştirin. Mevcut projeyi istemeden üzerine yazmayın.

Scripts Windows, macOS ve Linux için Node/npm tabanlıdır. `test:network` yerel Wrangler’ı kendisi açar, geçici SQLite state ile test eder ve kapatır. Ayrı terminalde dev sunucusu açmanız gerekmez. İsteğe bağlı mevcut / canlı endpoint testi: `TEST_ORIGIN` ortam değişkenini ayarlayın; bu test gerçek odalar oluşturur ve günlük limite sayılır. Normal otomatik test yereldir.

## İki oyuncu nasıl oynar?

1. İkiniz de **aynı dağıtılmış HTTPS URL’sini** Chrome / Edge’de açın. Biri mobil hotspot, diğeri ev internetinde olabilir.
2. Oyuncu 1: `ODA OLUŞTUR` → altı karakterli kodu kopyala.
3. Oyuncu 2: `ODAYA KATIL` → ad ve kod → `KATIL`.
4. İki oyuncu sınıfını seçer ve `HAZIRIM` der. Aynı sınıf serbesttir. Sunucu 3 saniye geri sayar ve maçı başlatır.
5. WASD / yön tuşları hareket; Shift dash; E sınıf yeteneği; F ruh kurtarma; Esc ayarlar. Saldırılar otomatik. Esc online maçı durdurmaz.
6. Ortak XP ile seviye atlanınca sunucu herkesi durdurur. Her kişi kendi üç kartından birini seçer; 12 saniye sonunda seçmeyene ilk geçerli kart atanır.
7. İkiniz düşerseniz maç biter. Boss 12. dakikada çıkar; öldürülünce zafer. Sonuçta iki kişi `YENİDEN OYNA` seçince yeni lobi açılır, eski build sıfırlanır.

Yerel test için aynı makinede iki ayrı tarayıcı profili / pencere açın. Oturum `sessionStorage` içinde sekmeye özeldir. Sekmeyi çoğaltmak aynı kimliği kopyalayabilir; ikinci oyuncu için temiz sekme veya farklı profil kullanın. Aynı kimliğin ikinci bağlantısı eskisini kapatır. Sayfayı yenilemek kimliği korur; ana menüde `Mevcut odaya yeniden bağlan` seçin. Bağlantı kopunca 30 saniye içinde token ile aynı slota dönülür. Token’ı paylaşmayın.

### `file://` seçeneği

Normal kullanımda ayar gerekmez; HTTP `location.origin`, WebSocket onun ws/wss eşdeğeridir. Yerel HTML için yalnızca şu iki açık ayar gerekir:

- `index.html` içindeki `const SERVER_ORIGIN=''` değerini örneğin `https://last-bond.sizin-subdomaininiz.workers.dev` yapın.
- `wrangler.jsonc` içinde `ALLOW_FILE_ORIGIN` değerini `"true"` yapıp tekrar deploy edin. Bu, `Origin: null` isteklerini ve yalnızca bu origin için CORS’u açar. Yerel dosyalar kullanmayacaksanız `false` bırakın.

Sonra HTML’yi iki bilgisayarda açabilirsiniz. Backend yine Cloudflare’dadır; dosyayı açmak sunucu başlatmaz. HTTPS için `wss://` gerekir. `file://` altında pano kopyalama başarısız olursa kod ekranda gösterilir.

## URL’ler ve protokol

| Yol                       | İşlev                                                       |
| ------------------------- | ----------------------------------------------------------- |
| `/`                       | Workers Static Assets tek HTML oyun istemcisi               |
| `GET /api/health`         | Hafif sağlık / sürüm bilgisi; oda listesi veya sır içermez  |
| `POST /api/rooms`         | Directory üzerinde oda rezervasyonu ve gizli kurucu kimliği |
| `GET /ws/<KOD>` + Upgrade | GameRoom üzerinde gerçek WebSocket 101                      |

API/WS yolları `assets.run_worker_first: ["/api/*","/ws/*"]` ile Worker’dan geçer; HTML’ye fallback yapılmaz. Oda dolu durumu handshake öncesi genel socket sınırında 409 veya kimlik doğrulama sonrasında açıklamalı error + 1008 kapanış olur. Tarayıcı WebSocket API’si HTTP hata gövdesini göstermediği için handshake başarısızlığında genel bir hata gösterilir.

Oturum WS’nin ilk `join` mesajında doğrulanır. Kurucu ve katılımcı token’ları 192 bit kriptografik rastgeledir; SQL checkpoint’te sadece SHA-256 hash bulunur. Açık lobi / snapshot / loglarda token yoktur. Attachment yalnızca slot kimliği, sequence ve kısa rate-limit bilgisini içerir. Input yalnızca normalize yön, F durumu, dash/E komutu ve monoton sequence taşır. HP/XP/hasar gibi bilinmeyen alanlar reddedilir; 1 KiB UTF-8 mesaj sınırı, bilinen schema ve socket başına 18 komut/sn limiti vardır. En fazla 4 pending/aktif socket bulunur; pending auth 10 saniyede biter. Oda API’si gövde okumaz.

İstemci input’u değişiklikte ve hareket sürerken yaklaşık 10 Hz ritimde gönderir; her render frame’inde göndermez. Dash/E hemen gönderilebilir. Input 0,5 simülasyon saniyesi güncellenmezse yön sıfırlanır. Kendi karakterinde tahmin + sunucu düzeltmesi, uzak entity’lerde 100 ms interpolation bulunur. İstemci tahmini yalnızca görseldir.

## Oyun içeriği

4 sınıf, istenen 12 silah ve Simyacı başlangıcı için ek Zehir Şişesi (toplam 13), 12 pasif (seviye 1–5), 6 elite sandığı evrimi, 8 Bağ Kartı ve 8 sinerji uygulanır. Silah slotu 4, pasif slotu 5’tir. Silahlar zincir, orbit alanı, takip, delici mermi, geri dönen bumerang, koni, ışın, gecikmiş alan veya çeken mayın olarak farklı davranır.

Son Nöbet: yaşayan oyuncuya +%50 hareket ve saldırı hızı, eksik HP’nin tam %50’si iyileşme ve +%20 direnç. Buff birikmez. Ruh normalde hasar/XP/target alamaz; Hayalet Yardımı Bağ Kartı özel istisnadır. Ölüm sayısıyla respawn 22 → 26 → 30 → 34 → 35 sn artar. Dönüş %50 HP, 2 saniye bağışıklık ve Anka Bağı verir. F kurtarma 120 mesafede 3 kesintisiz saniye ister; hasar sıfırlar, ölüm başına bir defa 8 sn azaltır.

Yakınlık, elektrik + başka oyuncunun ıslatması, donma + başka oyuncunun ağır vuruşu, kanama + diğer oyuncunun öldürmesi, ateş + diğer oyuncunun rüzgarı, paylaşılan kalkan, Ortak Hedef ve Anka Bağı sunucuda uygulanır. Kan Kardeşliği en fazla 3/sn, ateş yayılması aynı hedefte 3 sn bekler. Hız/direnç/iyileşmede üst sınırlar vardır. Ortak Bağ Kartı elitin ölümüyle ayrı seçim açar; oylar eşitse o kart, farklıysa iki oydan biri sunucu RNG’siyle seçilir; en fazla 3 kart.

Evrim: silah5 + gereken pasif2 + elite ölümü. Örnek davranış farkları: elektrik periyodik nova, buz her vuruşta donma, orak öldürme alanında iyileştirme, meteor çoklu darbe + kalıcı alan, kalkan yenilenen/paylaşılan kalkan, arılar ek takip sürüsü. Evrim için ikinci bir sahte satın alma butonu yoktur; sandık ödülü sunucuda uygulanır ve bildirilir.

8 düşman tipi + iki fazlı boss; boss telegraph alan, gecikmiş dash, ağır küre ve minyon çağırır. Arena 2800×2800; dekorlar yürümeyi engellemez, yalnızca arena sınırı gerçektir.

## Free plan: doğrulanmış kotalar ve tahmin

Resmi belgeler 2026-10-13 tarihinde kontrol edildi. Prompt’taki Free değerleriyle çelişki görülmedi:

| Boyut                           |      Workers Free |
| ------------------------------- | ----------------: |
| Worker isteği                   |     100.000 / gün |
| Standart Worker CPU             |     10 ms / istek |
| Durable Object compute isteği   |     100.000 / gün |
| DO aktif süre                   | 13.000 GB-s / gün |
| SQLite satır okuma              |    5 milyon / gün |
| SQLite satır yazma              |     100.000 / gün |
| SQLite depolama (hesap toplamı) |              5 GB |

SQLite DO Free’da kullanılabilir. KV-backed DO kullanılmaz. Gelen **uygulama WebSocket mesajları** DO compute request hesabında 20:1 oranındadır; normal Worker HTTP isteklerini 20’ye bölmeyin. Çıkış WS mesajı ayrıca incoming request değildir ama CPU/aktif süre yaratır. Metrics mesaj sayısı gerçek sayıyı gösterebilir; billing ile karıştırmayın. Günlük kotalar 00:00 UTC’de sıfırlanır. Free kotası aşılırsa ilgili işlemler hata verir; otomatik ücretsiz aşım yoktur. Hesabın diğer uygulamaları da aynı kaynakları tüketebilir.

Kaba 15 dakika / 2 oyuncu / sürekli hareket / 10 Hz input örneği: `2 × 10 × 900 = 18.000` gelen input → yaklaşık `900` DO compute request eşdeğeri; giriş, HTTP, ping, seçim, directory proxy ve alarm hariç. 12 Hz üst örnek: 21.600 mesaj → 1.080 eşdeğer. 128 MB için Cloudflare GB yaklaşımıyla `0,128 × 900 = 115,2 GB-s` aktif oda süresi tahmini. Üç eşzamanlı oda 345,6 GB-s / 15 dakika olur. 40 yeni oda/gün tek maç oynasa 4.608 GB-s; **yeniden oynamalar ve uzun oturumlar bu tahmini artırır**. Bunlar kota garantisi değildir; Dashboard’dan gerçek hesabı takip edin.

**Aktif 20 Hz timer hibernation’ı engeller.** Savaşta DO aktif süresi devam eder. Lobi / boş oda / yükseltme / sonuç ekranında simulation interval yoktur. Hibernation’a uygunluk boşta active duration maliyetini azaltır; platformun gerçekten ne zaman hibernate edeceği uygulamanın garantisi değildir. Lobide uygulama ping’i sürekli gönderilmez.

Dashboard → Workers & Pages → `last-bond` → Metrics / kullanım; Durable Objects → `RoomDirectory` / `GameRoom` namespace → Metrics üzerinden requests, duration, storage kullanımını kontrol edin. Dashboard etiketleri değişebilir; account plan usage ekranı da kontrol edilmeli.

## Koruma ayarları

`wrangler.jsonc` → `vars`:

| Ayar                      | Varsayılan | Etki                                                    |
| ------------------------- | ---------: | ------------------------------------------------------- |
| `MAX_ACTIVE_ROOMS`        |          3 | Aynı anda kayıtlı oda sayısı; lobby/sonuç da slot tutar |
| `MAX_NEW_ROOMS_PER_DAY`   |         40 | UTC günü başına yeni oda; replay yeni oda değildir      |
| `MAX_PLAYERS_PER_ROOM`    |          2 | Kod 2’nin üzerini her durumda reddeder                  |
| `LOBBY_TTL_MINUTES`       |          5 | Hazır olunmayan oda ömrü                                |
| `RECONNECT_GRACE_SECONDS` |         30 | Kopuk karakterin en fazla korumalı otomatik kaçışı      |
| `MAX_ENEMIES`             |        150 | Başlangıç düşman sınırı; 150 üzeri kabul edilmez        |
| `SNAPSHOT_HZ`             |         10 | Başlangıç snapshot hedefi; 5–15 aralığı                 |
| `ALLOW_FILE_ORIGIN`       |      false | Yerel HTML için null Origin izni                        |

Maçın başlangıcından itibaren 30 dakikalık sert oda TTL vardır; oyunu/süreyi sürekli replay ederek sınırsız oda ömrü elde edilmez (yeni lobi 5 dk TTL alır). Sonuç ekranı 2 dk sonra temizlenir. Lobide bir oyuncu açıkça ayrılırsa oda temizlenip diğer socket de kapanır; aktif maçta açık ayrılma maçı sonlandırır. Ağ kopmasında son socket gidince tick durur; reconnect için tek düşük frekanslı alarm kalır. Grace bitince maç biter; sessiz sınırsız bot veya fake multiplayer yoktur. Oda sona erince socket’ler kapanır, checkpoint silinir ve Directory kaydı bırakılır. Directory expired kayıtları kendi alarmında veya yeni isteklerde temizler; geçmiş günlük admission satırları silinir.

Bu korumalar gerçek Cloudflare kota sayaçlarını ölçmez. Gerekiyorsa oda/gün sınırını düşürün, snapshot Hz’yi 5–8 ve düşman sayısını 80–100 yapın. Ücretli plana yükseltmek kodun şartı değildir. Free kotası yetmezse yeni odaları azaltın; istemciye hata gösterin.

## Simülasyon, checkpoint ve bellek

Cloudflare üretimde `performance.now()` / `Date.now()` yalnızca I/O sonrasında ilerleyebilir. Bu nedenle CPU farkı 0 görünebilir; üretim CPU ölçümü için Dashboard profili gerekir. Tick zamanlayıcısı donuk saat sırasında sabit adım kredisi tutar, I/O zamanı ilerleyince bu krediyi çıkararak çift sayımı önler. Adaptif yük koruması gerçek CPU iddiası yerine timer sapmasını da kullanır. Ağ panelindeki ms değeri scheduler sapmasıdır. [Resmi timing belgesi](https://developers.cloudflare.com/workers/runtime-apis/performance/)

- Tek interval, 50 ms sabit adım. `performance.now()` delta; en çok 4 catch-up adımı; uzun süreç/tab donmasında delta borcu atılır ve `runtimeLostMs` raporlanır. Maç süresi **simüle aktif zaman**dır; yükseltmede / bütün oyuncular kopukken durur. `Date.now()` başlangıç, pause, seçim/TTL/grace deadline’larını yönetir. Uzun scheduler donması maçı ileri atlatmaz; gerçek duvar saatiyle 12 dakika birebir garanti edilmez.
- Canonical world RAM’de; yaklaşık 20 saniyede bir ve kritik geçişlerde tek sürümlü SQLite checkpoint satırı. Tick başına SQL yazısı yoktur. Kayıt, bounded world ve iki oturumu içerir; tipik büyüklük JSON entity sayısına bağlıdır.
- DO yeniden kurulursa checkpoint + WebSocket attachment slot/sequence ile restore edilir. Son checkpoint sonrasındaki **yaklaşık 0–20 saniye** ilerleme kaybolabilir. Kopan socket bilgisi son kayıtla sınırlı olduğundan beklenmeyen restart’ta grace yeniden yorumlanabilir. Kesintisiz kurtarma garantisi yoktur. Sürüm1 uyuşmazsa kaynak hata verir; bilinmeyen kaydı sessizce client-authoritative yapmaz.
- Monoton tick/revision ve sequence; tüm entity’lerde ID; 0,5 birim konum quantization. 10 Hz delta + yaklaşık 5 saniyede full snapshot; revision kaçırılırsa sync ister. Events ID ile tekrar oynatılmaz.
- Spatial grid, broad-phase segment collision, projectile / FX pooling ve culling. Düşman150, projectile450, loot240, hazard60, olay100 ve pool100 gibi sert sınırlar. Yerel simülasyon süresi EMA 12ms veya scheduler sapması EMA 20ms üstündeyse (en fazla iki saniyede bir) cap 60’a kadar 10’ar düşer, yayın 5Hz’e kadar azaltılır ve kullanıcıya bildirilir. Cap üstündeki eski düşmanlar anında silinmez; yeni spawn azaltılır.
- Snapshot büyük JSON’unda hareket eden düşmanların çoğu değişir; delta her koşulda çok küçük değildir. Yerel benchmark dosyası full ve delta byte ortalamalarını verir. Ağ daha yavaşsa yayın sınırını düşürün.
- İstemcide görsel frame süresi 25ms üstünde veya Düşük Kalite seçilirse partikül/glow/dekor azalır; gerçek hasar değişmez. Web Audio sadece kullanıcı etkileşiminden sonra açılır. Ses, partikül ve sarsıntı kapatılabilir.

## Hata ayıklama

- Chrome/Edge DevTools → Network → WS: `/ws/<KOD>` **101** olmalı. Gelen `room_joined` ve `snapshot` mesajlarını kontrol edin. Token içeren kendi `room_joined` mesajınızı ekran görüntüsü/log olarak paylaşmayın.
- HTTPS sitede `wss://`, HTTP yerel testte `ws://`. Yanlış protokol mixed-content ile engellenir.
- 404: kod geçersiz / TTL doldu / endpoint yanlış. 409 veya `Oda dolu`: iki slot ya da pending socket sınırı. 429: oda admission limiti. 5xx / Error1027: kota, deployment veya runtime hatası olabilir; otomatik Paid’e geçiş yoktur.
- Binding / migration: config’de `DIRECTORY` → RoomDirectory, `ROOMS` → GameRoom ve `new_sqlite_classes` isimlerinin export’larla tam eşleştiğini kontrol edin. Free’da `new_classes` kullanmayın.
- HTML düzgün ama API HTML dönüyorsa assets routing yanlış yapılandırılmıştır. Kök dosyanın `dist/index.html` içinde olduğunu ve API/WS run_worker_first kurallarını kontrol edin.
- Origin/CORS: aynı HTTPS host varsayılandır; null Origin yalnızca açık ayarla. Cloudflare Access veya üçüncü taraf proxy’nin WebSocket’i engellemediğini kontrol edin.
- Reconnect: aynı sekmede 30sn içinde doğru ID/token gerekir; bozuk/yanlış token ile başka oyuncunun slotuna geçilemez. Grace bitmişse yeni oda açın.
- `npx wrangler tail` canlı runtime hatalarını gösterir. Kod token’ları loglamaz; debug için ham mesaj / Authorization / cookie basmayın. Tarayıcı Console ve read-only `lastBondDiagnostics()` istemci Hz/kalite/revision değerlerini verir.
- Test ortamında `uv_interface_addresses` veya `uv_resident_set_memory` hatası sandbox’a özgü olabilir. Bu teslimde yerel ağ testinde yalnızca ortam için loopback ağ arayüzü shim’i kullanıldı; ürün kodunda platform shim’i yoktur. Normal bilgisayarda standart npm komutları kullanılmalıdır.

## Üretim kabul testi (henüz tamamlanmamış)

1. `npm run deploy` başarılı olmalı ve deploy URL’si kaydedilmeli; dry-run yetmez.
2. Aynı URL’de `/` HTML, `/api/health` JSON ve oda POST’unun 201 döndüğünü doğrulayın.
3. Farklı iki internetten aynı odaya katılıp WS101, eşzamanlı hareket, ortak düşman/XP ve upgrade pause’u görün.
4. Bir kişiyi düşürün: yaşayanın hızı/saldırısı50%, eksik can yarısı iyileşme, tek buff; ruh hareketi, F rescue, respawn, iki ölümde game over.
5. Boss telegraph’ları, ikinci faz, boss ölünce zafer ve iki oyla replay çalışmalı.
6. Bir oyuncuyu 10sn koparıp reconnect edin; 30sn üstü grace biter. Lobi, seçim ve sonuçta 20Hz interval olmamalı.
7. İki gerçek cihazda 15dk maç için FPS, ping, snapshot byte, entity count ve Cloudflare Metrics’i izleyin. Uzun oynanış dengesi / bellek sızıntısı garantisi ancak bu ölçümle verilebilir.

## Açık sınırlamalar / kapsam

Bu çalışan kaynak sürümü bütün temel online mekanikleri uygular; aşağıdaki öğeler tam ürün kalitesi olarak iddia edilmez:

- Rarity renkleri/sunum vardır; ayrı rarity hasar çarpanları yoktur. Seçimlerin davranışı weapon/passive türü ve seviye ile değişir.
- Sınıflar ve dokuz düşman türü kod içinde çizilmiş pixel sprite kullanır; çayır karo desenleri ve efektler Canvas üzerinde üretilir. Müzik soundtrack’i yoktur, sentezlenmiş efektler vardır.
- Gölge pasifi zayıflatılmış hedefte uygulanır; yönsel arkadan vuruş modeli yoktur. Temel silah levelleri veri tabanlı katsayı/attack-count ile ilerler; her silaha ayrı beş özel animasyon yoktur.
- Arı Sürüsü bağımsız kalıcı AI pet değil, homing sürü projectile’dır. Ses tonu saldırı olaylarıyla sentezlenir; her silah için ayrı uzun ses tasarımı yapılmadı.
- Nadir elit ödülü anında açılır; yerde fiziksel sandık açma etkileşimi yoktur. Evre/boss girişinde bildirim ve efekt vardır; sinematik cutscene yoktur.
- Sunucu Backpressure API’si Cloudflare WebSocket’te sınırlı; browser bufferedAmount varsa koruma kullanılır. Payload/Hz/cap sınırları asıl korumadır.
- IPv4/IPv6, değişik bölge gecikmeleri, 60 FPS ve gerçek 15dk üretim maçı henüz cihazlar arası kabul testinden geçmedi.

## Resmi kaynaklar (deploy öncesi tekrar bakın)

- [Workers limitleri](https://developers.cloudflare.com/workers/platform/limits/)
- [Durable Objects fiyatlandırma / Free kotalar](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Durable Objects limitleri](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [DO lifecycle ve aktif timer koşulları](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/)
- [Static Assets Worker routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Wrangler yapılandırma](https://developers.cloudflare.com/workers/wrangler/configuration/)
