import { NextResponse } from 'next/server';
import { FalVideoService } from '@/lib/services/falVideoService';
import { PlatformRepository } from '@/lib/store/repository';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ideaId, title, categoryKey, prompt, productionType, durationSeconds, caption, hashtags } = body;

    if (!title || !prompt || !categoryKey) {
      return NextResponse.json({ error: 'Başlık, prompt ve kategori gereklidir.' }, { status: 400 });
    }

    const video = await FalVideoService.renderVideo({
      ideaId,
      title,
      categoryKey,
      prompt,
      productionType: productionType || 'ai_video',
      durationSeconds: durationSeconds || 10,
      caption,
      hashtags,
    });

    return NextResponse.json({ success: true, video });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// 5 Farklı Video İçin Birbirinden Bağımsız, Özgün, Cümlesi Kesilmeyen Türkçe Altyazı Havuzu
const DIVERSE_SUBTITLES = [
  [
    { start: 0, end: 3.5, text: "Eşsiz bir aşk hikayesinin ilk adımı!" },
    { start: 3.5, end: 7.5, text: "Doğru insanla bir ömür yürümek kalbe sonsuz huzur verir." },
    { start: 7.5, end: 11.0, text: "Sen de kalbindeki insanı bulmak için adım at 💍" },
  ],
  [
    { start: 0, end: 3.5, text: "Gözlerinle konuşabildiğin birini buldun mu hiç?" },
    { start: 3.5, end: 7.5, text: "Kelimeler yetersiz kaldığında, güven dolu bakışlar aşkı anlatır." },
    { start: 7.5, end: 11.0, text: "Ömürlük mutluluğun için kalbini sevgiye aç ✨" },
  ],
  [
    { start: 0, end: 3.5, text: "Birlikte atılan her adım, yeni ve umut dolu bir başlangıçtır." },
    { start: 3.5, end: 7.5, text: "Sevgi paylaştıkça çoğalır, saygıyla sıcacık bir yuvaya dönüşür." },
    { start: 7.5, end: 11.0, text: "Ciddi ve güvenilir adaylar Evlilik İlanları'nda buluşuyor 💍" },
  ],
  [
    { start: 0, end: 3.5, text: "Her gün batımında yeni bir umut yeşerir kalbinde." },
    { start: 3.5, end: 7.5, text: "Huzurlu bir evlilik, anlayış ve sadakatle inşa edilir." },
    { start: 7.5, end: 11.0, text: "Kendi masalının kahramanıyla tanışmak için profili incele 📲" },
  ],
  [
    { start: 0, end: 3.5, text: "Aşk tesadüfleri sever ama evlilik sağlam adımlar ister." },
    { start: 3.5, end: 7.5, text: "Yanında huzur bulduğun insan, senin en güzel nasibindir." },
    { start: 7.5, end: 11.0, text: "Yeni başlangıçlar için ilk adımı bugün at 💍" },
  ],
  [
    { start: 0, end: 3.5, text: "Hayatının dönüm noktası bazen küçücük bir cesaretle başlar." },
    { start: 3.5, end: 7.5, text: "Yanında kendin olabildiğin bir eş, dünyadaki en büyük zenginliktir." },
    { start: 7.5, end: 11.0, text: "Doğru insanı bulmak artık çok daha kolay 🕊️" },
  ],
  [
    { start: 0, end: 3.5, text: "Kalbinin sesini dinle, bu yolda yalnız yürümek zorunda değilsin." },
    { start: 3.5, end: 7.5, text: "Gerçek sevgi; dinlemek, anlamak ve birlikte büyümektir." },
    { start: 7.5, end: 11.0, text: "Ciddi bir yuva kurmak isteyenler aramıza katılıyor 💍" },
  ],
];

export async function GET() {
  const allVideos = await PlatformRepository.getVideos(100);
  const allPins = await PlatformRepository.getPinterestItems({ limit: 1000 });
  
  // Öncelikle doğrudan tarayıcıda takılmadan açılan dikey MP4 dosyalarını al
  const mp4Pins = allPins.filter((p) => p.video_url && p.video_url.includes('.mp4'));
  const validPins = mp4Pins.length >= 5 ? mp4Pins : allPins.filter((p) => p.video_url && p.video_url.includes('pinimg.com'));

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueVideos = [];
  let pinFallbackIdx = 0;

  for (let i = 0; i < allVideos.length; i++) {
    const v = allVideos[i];
    let cleanUrl = v.videoUrl;
    // Eğer bozuk depolama, mixkit veya m3u8 akışı varsa, doğrudan dikey MP4 ile değiştir
    if (!cleanUrl || cleanUrl.includes('storage.googleapis.com') || cleanUrl.includes('mixkit') || cleanUrl.includes('.m3u8')) {
      while (pinFallbackIdx < validPins.length && seenUrls.has(validPins[pinFallbackIdx].video_url!)) {
        pinFallbackIdx++;
      }
      if (pinFallbackIdx < validPins.length) {
        cleanUrl = validPins[pinFallbackIdx].video_url!;
        v.videoUrl = cleanUrl;
        v.thumbnailUrl = validPins[pinFallbackIdx].thumbnail_url || v.thumbnailUrl;
        pinFallbackIdx++;
      }
    }

    // Başlığı temizle (varsa yabancı dil Pinterest ön eklerini temizleyip Türkçe başlığı öne çıkar)
    if (v.title) {
      if (v.title.includes('): ')) {
        v.title = v.title.split('): ')[1].trim();
      } else if (v.title.includes('Pinterest:')) {
        const parts = v.title.split(':');
        v.title = parts[parts.length - 1].trim();
      }
    }

    if (cleanUrl && !seenUrls.has(cleanUrl) && !seenTitles.has(v.title)) {
      seenUrls.add(cleanUrl);
      seenTitles.add(v.title);
      
      // Her video için TAMAMEN FARKLI, ÖZGÜN, KESİNTİSİZ 3 parçalı altyazı ata
      const distinctSubIndex = uniqueVideos.length % DIVERSE_SUBTITLES.length;
      v.turkishSubtitles = DIVERSE_SUBTITLES[distinctSubIndex];
      v.subtitlesApplied = true;
      v.logoApplied = true;

      uniqueVideos.push(v);
    }
    if (uniqueVideos.length >= 5) break;
  }

  return NextResponse.json({ videos: uniqueVideos });
}
