# LAST BOND — doğrulama raporu

Tarih: 2026-10-13. Kaynak v1.0.0. Wrangler 4.150.0; Node v24.19.0.

| Kontrol                         | Sonuç         | Kapsam                                                                                                      |
| ------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm test`                      | 28/28 geçti   | Oyun kuralları, protokol, gerçek SQLite ile DO lifecycle; Cloudflare base class / socket fixture kullanılır |
| Yerel WebSocket network testi   | 14/14 geçti   | Gerçek Wrangler/workerd, HTTP ve WebSocket101; iki istemcide aynı tick ve dünya                             |
| `npm run check:deploy`          | Başarılı      | Wrangler dry-run; gerçek yayın değildir                                                                     |
| İstemci JavaScript parse        | Başarılı      | Tüm gömülü JS derlenebilir; görsel render doğrulaması değildir                                              |
| 18.000 tick yerel yük testi     | Başarılı      | 900 sn simüle zaman; iki build / 150 düşman; son 150 sn sentetik450 mermi stresi                            |
| Chromium görsel / etkileşim QA  | Tamamlanamadı | Çalışma ortamında Chromium SIGTRAP / başlatma sorunu; görsel hata yoktur iddiası yapılmaz                   |
| Canlı Cloudflare publish        | Tamamlanamadı | Static Assets yüklemesi HTTP401 Unauthorized; Worker kodu yayınlanmadı                                      |
| İki ayrı gerçek internetten maç | Yapılmadı     | Üretim kabul testi halen gerekli                                                                            |

## Oyun / lifecycle test kapsamı

Normalize hareket, eski sequence, HP tampering, Son Nöbet yarım eksik HP iyileşmesi ve tek buff, ruhun normalde saldırmaması, respawn HP/dokunulmazlık/Anka, F kurtarma kesintisi ve tek kullanım, çift ölüm / İkinci Şans, artan respawn bekleme süresi, ortak XP ve pause, bağımsız upgrade / tekrar reddi, 13 silahın gerçek hasarı, 8 sinerji, 6 evrim, Bağ oylaması, 12. dakika boss ve zafer, checkpoint deterministik restore, schema/UTF-8 payload sınırı, delta entity silme, slot-limitli teklifler.

Lobi / sonuçta interval olmaması; seçimde loop durup tek alarm ile otomatik seçim; son socket kopunca timer temizleme; SQLite + attachment’tan slot/sequence restore; TTL temizliği; grace bitince maç sonu; bozuk mesaj kapanışı; eşzamanlı Directory admission limiti; boş Directory alarm silme; açık ayrılmada sınırsız botun önlenmesi; iki rematch oyunda build sıfırlama ve monoton kimlik/revision; son slota yarışan iki kişinin yalnızca birinin girişi; üretimde donuk saat için timer kredi hesabı.

## Gerçek yerel WebSocket kontrolleri

Health, aynı-origin tek HTML, güvenli altı karakterli kod / kurucu token, iki ayrı slot, 11 saniyelik boş lobide tick/broadcast yokluğu, üçüncü oyuncu reddi, ortak countdown, sunucu kaynaklı hareket, iki istemcide aynı tick ve düşman durumu, HP hilesi reddi, token gizliliği, aynı slota reconnect, sahte token reddi, üç odalık global koruma.

## Ölçüm

`benchmark-result.json` tekrar üretilebilir ham sonuçları içerir. Bu çalıştırmada 150 düşman / en fazla450 projectile; tick ortalaması yaklaşık0,44ms, p95 yaklaşık0,93ms, p99 yaklaşık1,59ms. En yavaş tick yaklaşık21,94ms. Heap tepe yaklaşık43,9MiB. Full snapshot ortalaması yaklaşık32,6kB, delta ortalaması27,0kB. CPU ölçümü yerel Node içindir; Cloudflare Dashboard CPU/GB-s ölçümü yerine geçmez. Üretimde performance.now I/O aralarında donabileceği için uygulama içi CPU sayacı garanti değildir; scheduler sapması ayrıca raporlanır.

Bu ölçüm otomatik bot build’leri, yapay dayanıklı düşmanlar, hasar bağışıklığı, XP pause engelleme ve sentetik projectile doyurma içerir. İnsanların 15dk oynadığı bir denge / performans kabul testi değildir. Bellek ve entity sayıları bounded olsa da bu tek çalıştırma her koşulda sızıntısızlık kanıtı değildir.

## Üretime geçiş

README’de ücretsiz hesap, SQLite migration, `npm install`, `wrangler login`, build/dev/deploy, API/WS kontrolü, iki ağda test, quota hesabı, checkpoint kayıp penceresi ve hata ayıklama bulunur. Ücretli plan veya başka sunucu gerekmez; quota altında sıfır maliyet mümkün, garanti değildir.
