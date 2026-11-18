# Sprout Hop

[![CI](https://github.com/hayrullah-zafer-yilmaz/sprout-hop/actions/workflows/ci.yml/badge.svg)](https://github.com/hayrullah-zafer-yilmaz/sprout-hop/actions/workflows/ci.yml)
[![Lisans: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[Vue 3](https://vuejs.org), [TresJS](https://tresjs.org) ve [Three.js](https://threejs.org) ile yapılmış, yandan kaydırmalı bir 2.5D platform oyunu. Dünya tamamen 3D: derinlik, paralaks ve gerçek gölgeler var. Oynanış ise tek bir 2D düzlemde kalır.

**[Tarayıcıda oynayın](https://hayrullah-zafer-yilmaz.github.io/sprout-hop/)** · [English](../README.md)

![Sprout Hop oynanışı: iki yapraklı bir filizi olan toprak saksı Sprout bir sandıktan altın çıkarıyor, bir tuğlayı kırıyor, mor bir jölenin üstüne basıyor, bir çukurun üstünden atlıyor ve taş merdivenleri tırmanıp altın topluyor](assets/demo.gif)

## Özellikler

- **Seçilebilen üç saksı kahraman**: oyunun adına uygun olarak her biri, toprağından bir filiz çıkan küçük bir saksıdır. Seçtiğiniz kahraman canlı bir 3B önizlemeyle gösterilir. Her kahramanın parlak, iri gözleri ve hareketle değişen bir yüzü var: göz kırpar, koşarken gözlerini kısar, havada şaşırır ve bayrakta sevinir.
  - İki büyük yapraklı toprak saksı **Sprout** dengelidir.
  - Kenarında gözlüğü ve geriye yatık yaprakları olan sarı saksı **Zip** en hızlı koşar.
  - Pembe kenarlı, tavşan kulağı gibi iki uzun yapraklı krem saksı **Bun** en yükseğe zıplar ve zıplama tuşunu basılı tuttuğunuzda süzülür.
- **Üç bölüm**: her birinin kendi görünümü ve kendi en iyi puanı var. Bir bölümü bitirdiğinizde sıradaki bölüm beş saniyelik bir geri sayımın ardından kendiliğinden başlar. Kahraman ekranında da istediğiniz bölümü seçebilirsiniz.
  - **Güneşli Çayır** yaklaşık 220 karo genişliğindedir. Çukurlar, merdivenler, tek yönlü kalaslar, dikenler, bir kontrol noktası, biri yatay biri dikey iki hareketli platform ve sonunda bir bayrak var.
  - **Sisli Şelale** yaklaşık 200 karo genişliğinde bir nehir kanyonudur. Nehrin üstünde basamak taşları, tahta bir köprü, bir asansör ve hareketli bir platform var. Arka planda üç şelale nehre dökülür; sis yükselir, dipte köpük oluşur ve bir gökkuşağı görünür.
  - **Magma Dağı** yaklaşık 210 karo genişliğinde, bir lav gölünün üstünden geçen bir yoldur. Bazalt sütunlar, kalastan bir köprü, bir asansör ve hareketli bir platform var. Gökten taşlar düşer: yerde büyüyen bir gölge ve yukarıdan dökülen çakıllar taşın nereye düşeceğini gösterir; kahramana çarpan taş bir cana mal olur. Arka planda tüten bir yanardağ, süzülen duman, kayalıklardan dökülen lav şelaleleri ve yükselen közler var.
- **İnce ayarlı platform kontrolleri**: hızlanma ve frenleme, koşma tuşu, basılı tutma süresine göre değişen zıplama yüksekliği, "coyote time" ve zıplama tamponu.
- **Alttan vurulan bloklar**: altın sandıkları, can sandıkları ve kırılan tuğlalar.
- **İki düşman türü**: üstüne basılarak yenilen jöleler (art arda basınca puan katlanır) ve üstünden atlanması gereken dikenli toplar.
- **Hiç asset dosyası yok**: tüm dokular açılışta bir canvas üzerine çizilir, tüm sesler Web Audio API ile sentezlenir. Modeller Three.js temel geometrileriyle kurulur; kahramanların yüzleri de canvas üzerine çizilir.
- **Puan, altın, can ve süre**. Kalan süre bonus puana dönüşür, her bölümün en iyi puanı `localStorage` içinde saklanır.
- **Klavye ve oyun kumandası** desteği, duraklatma menüsü, İngilizce ve Türkçe arayüz.

![Sisli Şelale: gözlüklü sarı saksı Zip, bir şelalenin ve soluk bir gökkuşağının önünde iki sandıktan altın çıkarıyor, sonra nehrin üstündeki taş sütunlarda zıplayarak ilerliyor](assets/misty-falls.gif)

![Magma Dağı: tavşan kulağı gibi yaprakları olan krem saksı Bun bir sandıktan altın çıkarıyor, yerdeki bir gölge düşecek taşı gösteriyor, taş Bun'un hemen yanında bir toz bulutuyla parçalanıyor ve yol tüten bir yanardağın altında, kayalıklardan dökülen bir lav şelalesinin önünden geçip lav gölünün üstünden devam ediyor](assets/magma-mountain.gif)

## Kontroller

| Eylem             | Klavye                                | Oyun kumandası          |
| ----------------- | ------------------------------------- | ----------------------- |
| Kahraman seçme    | Kahraman ekranında `←` `→`            | Sol analog, yön tuşları |
| Bölüm seçme       | Kahraman ekranında `↑` `↓`            | Sol analog, yön tuşları |
| Hareket           | `←` `→` veya `A` `D`                  | Sol analog, yön tuşları |
| Zıplama           | `Space`, `W` veya `↑`                 | `A`                     |
| Süzülme (Bun)     | Düşerken zıplama tuşunu basılı tutun  | `A` basılı              |
| Koşma             | `Shift`                               | `X`                     |
| Duraklatma        | `Esc` veya `P`                        | `Start`                 |
| Yeniden başlatma  | `R`                                   |                         |
| Ses               | `M`                                   |                         |

Daha yükseğe zıplamak için zıplama tuşunu basılı tutun. Koşarken yapılan zıplamalar biraz daha uzağa gider.

## Başlarken

Node.js 22.12 veya daha yeni bir sürüm gerekir.

```bash
npm install
npm run dev
```

Ardından Vite tarafından yazılan adresi açın.

| Komut               | Ne yapar                                         |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Geliştirme sunucusunu başlatır                   |
| `npm run build`     | Tip denetimi yapar ve `dist/` klasörüne derler   |
| `npm run preview`   | Üretim derlemesini sunar                         |
| `npm run typecheck` | `vue-tsc` çalıştırır                             |
| `npm test`          | Vitest testlerini çalıştırır                     |

Arayüz dilini seçmek için adrese `?lang=en` veya `?lang=tr` ekleyin.

## Nasıl çalışır

Oyun mantığı ile çizim birbirinden ayrıdır.

- **`src/game/`** kuralları Three.js ve Vue içermeyen düz TypeScript ile tutar:
  - `config.ts`: fizik ve kurallar
  - `characters.ts`: üç kahraman ve hareket özellikleri
  - `level.ts` ve `levels/`: harita okuyucu ve oynanma sırasına göre bölüm haritaları
  - `collision.ts`: karo ızgarasına karşı AABB çarpışması
  - `entities.ts`: varlık tipleri ve oluşturucuları
  - `world.ts`: oyun kuralları

  Dünya 1/120 saniyelik sabit adımlarla ilerler. Düz kod olduğu için Vitest onu doğrudan test eder; küçük bir bot her bölümü her kahramanla baştan sona oynar.
- **`src/components/scene/LevelScene.vue`** her oyun için bir dünya oluşturur ve onu TresJS `useLoop().onBeforeRender` döngüsü içinde ilerletir. Karedeki sırayı `src/scene/context.ts` içindeki adlandırılmış öncelikler belirler: önce dünya ilerler, sonra modeller onun durumunu kopyalar, en son kamera ve gökyüzü takip eder.
- **Her bölümün bir teması var** (`src/scene/themes.ts`): gökyüzü, sis, ışık, karo ve bitki renkleri ile hangi arka planın kurulacağı. Statik manzara her bölüm için tohumlu bir rastgele sayı üreteciyle bir kez oluşturulur ve yeniden başlatmalarda korunur. Çayırda tepeler ve vadide bir orman var. Şelale ve Magma Dağı aynı kanyon kurucusunu kullanır (`src/scene/canyon.ts`): kayalıklar, sudan ya da lavdan şelaleler, köpük ve alttaki deniz her karede hareket eder. Magma Dağı'nda bulutlar ve güneş yerine süzülen duman var; ayrıca tüten bir yanardağ ve yükselen közler eklenir (`src/scene/volcano.ts`); açık renkli bazalt platformlar lavın önünde net seçilir. Yalnızca oyun sırasında değişen parçalar yeniden kurulur.
- **Kahramanlar** aynı saksıyı paylaşır: bir profilin döndürülmesiyle kurulan yuvarlak bir gövde, üstünde bir kenar bandı ve toprak. Sır rengi, bitki, aksesuar ve yüzle ayrışırlar (`src/scene/hero.ts`, `heroKit.ts`, `heroGear.ts`). Yapraklar, damarları canvas üzerine çizilmiş, kalınlık verilmiş şekillerdir. Her yüz, saksıya yansıtılan sekiz ifadelik bir canvas atlasıdır ve model her karede oyunun durumuna göre birini seçer (`heroFace.ts`). İnce bir dış çizgi ve yumuşak bir kenar ışığı, kahramanların kalabalık arka planlarda da kolayca seçilmesini sağlar.
- **Çizim çağrısı sayısı düşük tutulur**:
  - Karolar, altınlar, bulutlar, efektler ve manzara `InstancedMesh` ile çizilir.
  - Düşmanlar geometri ve materyallerini paylaşır.
  - Gözler gibi çift parçalar tek geometride birleştirilir.
  - Tipik bir kare çayırda yaklaşık 70, şelalede yaklaşık 80, Magma Dağı'nda yaklaşık 100 çizim çağrısıyla çizilir.
- **Vue reaktivitesi yalnızca HUD ve menüler için kullanılır.** 3B modeller bir kez çizilir, sonra her karede template ref üzerinden hareket ettirilir.

## Bölümleri düzenlemek

Bölümler, [`src/game/levels/`](../src/game/levels/) klasöründeki ASCII haritalardır ve her bölüm ayrı bir dosyadadır. Her karakter bir karodur, en alt satır `y = 0` konumudur.

| Karakter | Anlamı |
| -------- | ------ |
| `#`  | Zemin (üstü çimen, altı toprak) |
| `X`  | Taş blok |
| `B`  | Tuğla, alttan vurulunca kırılır |
| `C`  | Altın sandığı |
| `L`  | Can sandığı |
| `-`  | Tek yönlü kalas: alttan içinden geçip zıplayabilirsiniz |
| `o`  | Altın |
| `s`  | Jöle |
| `k`  | Dikenli top |
| `^`  | Dikenler |
| `r`  | Düşen taş: önce uyarı verir, sonra bu sütuna tekrar tekrar düşer |
| `m` … `M` | Yatay hareketli platform: başlangıç ve bitiş aynı satırda |
| `v` … `V` | Dikey hareketli platform: başlangıç ve bitiş aynı sütunda |
| `K`  | Kontrol noktası |
| `P`  | Oyuncunun başlangıç yeri |
| `F`  | Bitiş bayrağı |

Varsayılan fizikle, basılı tutulan bir zıplama 4 karodan biraz daha yükseğe çıkar. Yürürken yapılan zıplama 5 karoluk, koşarken yapılan zıplama 8 karoluk bir boşluğu geçer. Bir haritayı değiştirdikten sonra `npm test`, botun her bölümü her kahramanla hala bitirip bitiremediğini söyler.

Yeni bir bölüm eklemek için haritasını `src/game/levels/` içinde yeni bir dosyaya koyun ve oradaki `index.ts` dosyasında listeye ekleyin. Ardından `src/scene/themes.ts` içinde ona bir tema, `src/app/i18n.ts` içinde bir ad verin. Eksik kalan bir yer varsa TypeScript bunu bildirir.

## Proje yapısı

```
src/
  game/              düz TypeScript ile kurallar: ayarlar, harita okuyucu, varlıklar, çarpışma, dünya
  game/levels/       ASCII bölüm haritaları ve oynanma sırası
  scene/             Three.js kurucuları ve paylaşılan parçalar: dokular, temalar, karolar, manzara, kanyonlar, yanardağ, kahramanlar, modeller, bayrak
  app/               tarayıcı durumu ve servisler: arayüz durumu, i18n, giriş, ses
  components/scene/  dünyayı çizen Tres bileşenleri
  components/ui/     Vue HUD ve menüler
tests/               çarpışma, dünya kuralları, kahramanlar ve her bölümü her kahramanla oynayan bot için Vitest testleri
```

## Yayınlama

`.github/workflows/pages.yml`, `main` dalına yapılan her push sonrasında oyunu derler ve GitHub Pages üzerinde yayınlar. Depo ayarlarındaki **Pages** bölümünde **Source** seçeneğini **GitHub Actions** yapın. Vite `base` değeri `./` olduğu için derleme her depo adıyla çalışır.

## Lisans

[MIT](../LICENSE)
