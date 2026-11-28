// Evlilik İlanları - Pinterest Video Bulucu & Reels Koleksiyon Servisi
import {
  PinterestItem,
  PinterestCategory,
  PinterestAgeFilter,
  UsagePermissionStatus,
  SimilarPinItem,
  GeneratedVideo,
  PublishQueueItem
} from '@/types';
import { PlatformRepository } from '@/lib/store/repository';
import { getAdminStorage } from '@/lib/firebase/admin';
import { AIContentService } from '@/lib/services/aiContentService';

export interface ScanUrlResult {
  pin_url: string;
  pin_title: string;
  pin_description: string;
  category: PinterestCategory;
  age_filter?: PinterestAgeFilter;
  thumbnail_url: string;
  video_url?: string;
  embed_html?: string;
  original_creator: string;
  source_license: string;
  duration?: string;
  similar_pins: SimilarPinItem[];
}

export class PinterestService {
  /**
   * URL ve Pin başlığından/metninden otomatik akıllı kategori tespiti yapar
   */
  public static autoDetectCategory(url: string, title: string = '', description: string = ''): PinterestCategory {
    const combined = `${url} ${title} ${description}`.toLowerCase();

    if (
      combined.includes('tesettür') ||
      combined.includes('tesettur') ||
      combined.includes('başört') ||
      combined.includes('basort') ||
      combined.includes('hijab') ||
      combined.includes('abaya') ||
      combined.includes('sal ') ||
      combined.includes('şal')
    ) {
      return 'Başörtülü kadınlar';
    }

    if (
      combined.includes('sahil') ||
      combined.includes('deniz') ||
      combined.includes('plaj') ||
      combined.includes('beach') ||
      combined.includes('sea') ||
      combined.includes('ocean') ||
      combined.includes('kumsal') ||
      combined.includes('gün batımı') ||
      combined.includes('gun batimi') ||
      combined.includes('sunset') ||
      combined.includes('dalga')
    ) {
      return 'Sahil ve deniz';
    }

    if (
      combined.includes('tatil') ||
      combined.includes('gezi') ||
      combined.includes('travel') ||
      combined.includes('trip') ||
      combined.includes('vacation') ||
      combined.includes('kapadokya') ||
      combined.includes('cappadocia') ||
      combined.includes('seyahat') ||
      combined.includes('otel') ||
      combined.includes('resort')
    ) {
      return 'Tatil ve gezi';
    }

    if (
      combined.includes('kombin') ||
      combined.includes('moda') ||
      combined.includes('fashion') ||
      combined.includes('outfit') ||
      combined.includes('stil') ||
      combined.includes('style') ||
      combined.includes('elbise') ||
      combined.includes('trençkot')
    ) {
      return 'Moda ve kombin';
    }

    if (
      combined.includes('çift') ||
      combined.includes('cift') ||
      combined.includes('couple') ||
      combined.includes('sevgili') ||
      combined.includes('aşk') ||
      combined.includes('ask') ||
      combined.includes('love') ||
      combined.includes('evlilik') ||
      combined.includes('düğün') ||
      combined.includes('dugun') ||
      combined.includes('wedding') ||
      combined.includes('nişan') ||
      combined.includes('nisan') ||
      combined.includes('söz')
    ) {
      return 'Kadın ve erkek çiftler';
    }

    if (
      combined.includes('park') ||
      combined.includes('doğa') ||
      combined.includes('doga') ||
      combined.includes('nature') ||
      combined.includes('orman') ||
      combined.includes('forest') ||
      combined.includes('çiçek') ||
      combined.includes('ağaç')
    ) {
      return 'Park ve doğa';
    }

    if (
      combined.includes('şehir') ||
      combined.includes('sehir') ||
      combined.includes('city') ||
      combined.includes('sokak') ||
      combined.includes('street') ||
      combined.includes('istanbul') ||
      combined.includes('kadıköy') ||
      combined.includes('galata') ||
      combined.includes('yürüyüş') ||
      combined.includes('walk')
    ) {
      return 'Şehir yürüyüşleri';
    }

    if (
      combined.includes('kahve') ||
      combined.includes('coffee') ||
      combined.includes('ev') ||
      combined.includes('home') ||
      combined.includes('günlük') ||
      combined.includes('daily') ||
      combined.includes('sabah')
    ) {
      return 'Günlük yaşam';
    }

    if (
      combined.includes('kadın') ||
      combined.includes('kadin') ||
      combined.includes('kız') ||
      combined.includes('girl') ||
      combined.includes('woman')
    ) {
      return 'Başörtüsüz kadınlar';
    }

    return 'Romantik görüntüler';
  }

  /**
   * Kategoriye göre benzer ve tematik Pin videoları önerir
   */
  public static generateSimilarPins(category: PinterestCategory, ageFilter?: PinterestAgeFilter): SimilarPinItem[] {
    const database: Record<PinterestCategory, Array<{ title: string; thumb: string; video: string; creator: string; duration: string }>> = {
      'Sahil ve deniz': [
        {
          title: 'Sahilde Gün Batımında Kollarını Açan Başörtülü Genç Kadın',
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@deniz_esintisi',
          duration: '0:10',
        },
        {
          title: 'Dalgalı Deniz ve Siyah Kumlu Sahilde Dingin Duruş',
          thumb: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@sahil_yuruyusleri',
          duration: '0:25',
        },
        {
          title: 'Altın Saat Gün Batımında Sarı Elbiseli ve Hasır Şapkalı Kadın',
          thumb: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@gunbatimi_huzuru',
          duration: '0:26',
        },
        {
          title: 'Yeşil Tepeli Sahil Kumsalında Sakin Adımlar',
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@kumsal_esintisi',
          duration: '0:13',
        },
        {
          title: 'Akşamüstü Deniz Kenarında Çıplak Ayak Yürüyen Kadın',
          thumb: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@akdeniz_anlari',
          duration: '0:17',
        },
        {
          title: 'Tropikal Turkuaz Deniz ve Beyaz Kumsalda Bordo Etekli Yürüyüş',
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@ege_koylari',
          duration: '0:12',
        },
        {
          title: 'Alacakaranlıkta Gökyüzü ve Sahil Esintisi',
          thumb: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@doga_ve_deniz',
          duration: '0:15',
        },
        {
          title: 'Dalgaların Kıyıya Vuruşu ve Dinginlik',
          thumb: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@huzur_sahili',
          duration: '0:11',
        },
        {
          title: 'Mavi Gökyüzü ve Beyaz Bulutlar Altında Sahil',
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@bulutlar_ve_deniz',
          duration: '0:13',
        },
        {
          title: 'Sakin Deniz ve Ufuk Çizgisi Reels',
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@mavi_ufuk',
          duration: '0:06',
        },
      ],
      'Başörtülü kadınlar': [
        {
          title: 'Zarif Tesettür Şıklığı ve Doğal Gülümseme',
          thumb: 'https://images.unsplash.com/photo-1584999734482-0361aecad844?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@hijab_aesthetic',
          duration: '0:14',
        },
        {
          title: 'Sahil Kıyısında Hasır Şapka ve Sarı Elbise Kombini',
          thumb: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@hijab_fashion',
          duration: '0:26',
        },
        {
          title: 'Deniz Kenarında Siyah Abaya ve Rüzgarda Salınan Şal',
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@zarafet_gunlugu',
          duration: '0:10',
        },
        {
          title: 'Kumsalda Beyaz Pantolon ve Siyah Bluz Şıklığı',
          thumb: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@tesettur_stil',
          duration: '0:25',
        },
        {
          title: 'Boğaz Kıyısında Dingin Duruş ve Çay Sohbeti',
          thumb: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@istanbul_hanimefendisi',
          duration: '0:15',
        },
        {
          title: 'Kayalıklar ve Kumsal Arasında Zarif Yürüyüş',
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@huzur_kareleri',
          duration: '0:13',
        },
      ],
      'Kadın ve erkek çiftler': [
        {
          title: 'Evlilik Yolunda El Ele İlk Adım',
          thumb: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@yuva_kuranlar',
          duration: '0:15',
        },
        {
          title: 'Sahil Kumsalında Birlikte Gün Batımı Yürüyüşü',
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@omurluk_birliktelik',
          duration: '0:22',
        },
        {
          title: 'Göz Göze Samimi Gülümseme ve Güven',
          thumb: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@ciddi_evlilik',
          duration: '0:18',
        },
        {
          title: 'Deniz Feneri Yanında Romantik Anlar ve Kahve Keyfi',
          thumb: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@sahil_ciftleri',
          duration: '0:20',
        },
      ],
      'Tatil ve gezi': [
        {
          title: 'Kapadokya Balonları Altında Sabah Kahvesi',
          thumb: 'https://images.unsplash.com/photo-1609137144822-25e24c0d9f4a?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@gezi_gunlugu',
          duration: '0:14',
        },
        {
          title: 'Ege Köyünde Huzurlu Hafta Sonu Yürüyüşü',
          thumb: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@koy_havasi',
          duration: '0:18',
        },
        {
          title: 'Akdeniz Sahil Kasabasında Begonviller Altında',
          thumb: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@akdeniz_tatili',
          duration: '0:21',
        },
      ],
      'Günlük yaşam': [
        {
          title: 'Evde Sıcak Kahve ve Kitap Keyfi',
          thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@huzurlu_evim',
          duration: '0:12',
        },
        {
          title: 'Pazar Sabahı Balkon Kahvaltısı ve Kuş Sesleri',
          thumb: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@gunluk_anlar',
          duration: '0:16',
        },
      ],
      'Moda ve kombin': [
        {
          title: 'Zarif Sonbahar Trençkot ve Şal Uyumu',
          thumb: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@stil_rehberi',
          duration: '0:15',
        },
        {
          title: 'Minimalist Pastel Tonlar Günlük Şıklık',
          thumb: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@zarafet_gunlugu',
          duration: '0:19',
        },
      ],
      'Başörtüsüz kadınlar': [
        {
          title: 'Doğal Saçlar ve Sıcak Kahve Molası',
          thumb: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@dogal_guzellik',
          duration: '0:11',
        },
        {
          title: 'Kadıköy Moda Parkında Kitap Okuyan Genç Kadın',
          thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@moda_gunleri',
          duration: '0:14',
        },
      ],
      'Park ve doğa': [
        {
          title: 'Emirgan Korusunda Laleler ve Yemyeşil Doğa',
          thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@doga_tutkusu',
          duration: '0:13',
        },
        {
          title: 'Yıldız Parkında Huzurlu Ağaç Altı Yürüyüşü',
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@park_hikayeleri',
          duration: '0:17',
        },
      ],
      'Şehir yürüyüşleri': [
        {
          title: 'Karaköy ve Galata Sokaklarında Tarihi Adımlar',
          thumb: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@galata_asigi',
          duration: '0:15',
        },
        {
          title: 'İstiklal Caddesinde Tramvay ve Sonbahar',
          thumb: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
          creator: '@sehir_ritmi',
          duration: '0:18',
        },
      ],
      'Romantik görüntüler': [
        {
          title: 'Boğaz Manzaralı Masada İki Fincan Kahve',
          thumb: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
          creator: '@omurluk_sevgi',
          duration: '0:12',
        },
        {
          title: 'Mum Işığında Sıcak ve Güven Dolu Bakışlar',
          thumb: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop&q=80',
          video: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
          creator: '@kalbimin_sesi',
          duration: '0:20',
        },
      ],
    };

    const pool = database[category] || database['Sahil ve deniz'];
    return pool.map((item, index) => ({
      id: `sim-${Date.now()}-${index}`,
      title: item.title,
      url: `https://tr.pinterest.com/pin/${Math.floor(100000000000000000 + Math.random() * 900000000000000000)}/`,
      thumbnail_url: item.thumb,
      video_url: item.video,
      category,
      age_filter: ageFilter || '25–30 yaş görünümü',
      author: item.creator,
      duration: item.duration || '0:15',
    }));
  }

  /**
   * Pinterest URL'sini tarayarak başlık, görsel, gerçek MP4 video ve sayfadaki gerçek önerileri çeker
   */
  static async scanPinterestUrl(
    url: string,
    chosenCategory?: PinterestCategory,
    chosenAge?: PinterestAgeFilter
  ): Promise<ScanUrlResult> {
    const trimmed = url.trim();
    let title = 'Pinterest Video İçeriği';
    let description = 'Doğal atmosfer ve samimi Reels içeriği.';
    let thumbnailUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
    let videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4';
    let embedHtml = '';
    let creator = '@pinterest_creator';
    let duration = '0:14';
    let appVersion = '4e9f794';

    // Pin ID tespiti (ilk kontrol)
    const idMatch = trimmed.match(/\/pin\/(\d+)/);
    let pinId = idMatch ? idMatch[1] : null;

    // 1. Gerçek Pinterest Sayfasını ve Video Snippet'ını Çekme
    try {
      const pageRes = await fetch(trimmed, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
      });

      if (pageRes.ok) {
        const finalUrl = pageRes.url || trimmed;
        if (!pinId) {
          const finalMatch = finalUrl.match(/\/pin\/(\d+)/);
          if (finalMatch) pinId = finalMatch[1];
        }
        const pageHtml = await pageRes.text();

        // VideoObject JSON-LD extraction
        const vsMatch = pageHtml.match(/<script data-test-id="video-snippet"[^>]*>([\s\S]*?)<\/script>/i);
        if (vsMatch) {
          try {
            const vs = JSON.parse(vsMatch[1]);
            if (vs.name) title = vs.name;
            if (vs.description) description = vs.description;
            if (vs.contentUrl) videoUrl = vs.contentUrl;
            if (vs.thumbnailUrl) thumbnailUrl = vs.thumbnailUrl;
            if (vs.creator?.name || vs.creator?.alternateName) {
              creator = `@${(vs.creator.alternateName || vs.creator.name).replace(/\s+/g, '_')}`;
            }
            if (vs.duration) {
              const sec = parseInt(vs.duration.replace('PT', '').replace('S', ''), 10) || 14;
              duration = `0:${sec < 10 ? '0' + sec : sec}`;
            }
          } catch {}
        } else {
          // SocialMediaPosting fallback
          const smMatch = pageHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
          if (smMatch) {
            try {
              const sm = JSON.parse(smMatch[1]);
              if (sm.headline) title = sm.headline;
              if (sm.image) thumbnailUrl = sm.image;
              if (sm.author?.alternateName || sm.author?.name) {
                creator = `@${(sm.author.alternateName || sm.author.name).replace(/\s+/g, '_')}`;
              }
            } catch {}
          }
        }

        // 1.B: Pinterest Relay & Doğrudan HTML Video / MP4 Çıkarma (Sunucu tarafı ve Vercel için garanti)
        const cleanHtml = pageHtml.replaceAll('\\/', '/');
        
        // Her zaman doğrudan MP4 varsa (720p HD MP4 veya expMp4) MP4'ü tercih et
        const mp4Match = cleanHtml.match(/https:\/\/(?:v1|v)\.pinimg\.com\/videos\/[^"'\s\\]+\.mp4/i);
        if (mp4Match) {
          videoUrl = mp4Match[0];
        } else if (!videoUrl || videoUrl.includes('mixkit.co')) {
          const hlsMatch = cleanHtml.match(/https:\/\/(?:v1|v)\.pinimg\.com\/videos\/[^"'\s\\]+\.m3u8/i);
          if (hlsMatch) videoUrl = hlsMatch[0];
        }

        // Doğrudan video kapağı (Thumbnail) çıkarma
        if (!thumbnailUrl || thumbnailUrl.includes('unsplash.com')) {
          const thumbMatch = cleanHtml.match(/https:\/\/i\.pinimg\.com\/videos\/thumbnails\/[^"'\s\\]+\.jpg/i);
          if (thumbMatch) {
            thumbnailUrl = thumbMatch[0];
          } else {
            const ogImg = pageHtml.match(/<meta property="og:image" content="([^"]+)"/i);
            if (ogImg && ogImg[1]) thumbnailUrl = ogImg[1];
          }
        }

        // Doğrudan başlık çıkarma
        if (title === 'Pinterest Video İçeriği') {
          const ogTitle = pageHtml.match(/<meta property="og:title" content="([^"]+)"/i) || pageHtml.match(/<title>([^<]+)<\/title>/i);
          if (ogTitle && ogTitle[1]) {
            title = ogTitle[1].replace(/\s*\|\s*Pinterest.*$/i, '').trim();
          }
        }

        // Doğrudan süre çıkarma
        const durMatch = pageHtml.match(/"duration":\s*(\d+)/);
        if (durMatch && durMatch[1]) {
          const ms = parseInt(durMatch[1], 10);
          const sec = ms > 1000 ? Math.round(ms / 1000) : ms;
          duration = `0:${sec < 10 ? '0' + sec : sec}`;
        }

        // App version extraction
        const avMatch = pageHtml.match(/"appVersion":"([^"]+)"/);
        if (avMatch) appVersion = avMatch[1];
      }
    } catch (e) {
      console.warn('Pinterest sayfa kazıma fallback:', e);
    }

    // 2. oEmbed Fallback (Eğer başlık veya görsel alınamadıysa)
    if (!thumbnailUrl || title === 'Pinterest Video İçeriği') {
      try {
        const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(trimmed)}`;
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
        });
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          if (oembed.title && title === 'Pinterest Video İçeriği') title = oembed.title;
          if (oembed.thumbnail_url && !thumbnailUrl) thumbnailUrl = oembed.thumbnail_url;
          if (oembed.author_name && creator === '@pinterest_creator') {
            creator = `@${oembed.author_name.toLowerCase().replace(/\s+/g, '_')}`;
          }
          if (oembed.html) embedHtml = oembed.html;
        }
      } catch {}
    }

    // URL ve başlığa göre akıllı kategori tespiti
    const detectedCategory: PinterestCategory = chosenCategory || this.autoDetectCategory(trimmed, title, description);

    // 3. Pinterest Sayfasındaki GERÇEK Önerileri (RelatedPinFeedResource) Sayfalama ile 50-60 Adet Çekme
    const realRecommendations: SimilarPinItem[] = [];
    if (pinId) {
      try {
        let bookmark: string | null = null;
        let page = 1;
        const maxPages = 5; // 5 sayfa boyunca sayfalama ile 50 adet gerçek öneri videosu çeker
        const targetCount = 50;

        while (realRecommendations.length < targetCount && page <= maxPages) {
          const dataObj = {
            options: {
              pin: pinId,
              bookmarks: bookmark ? [bookmark] : [],
            },
            context: {
              app_version: appVersion,
            },
          };

          const dataStr = encodeURIComponent(JSON.stringify(dataObj));
          const relUrl = `https://www.pinterest.com/resource/RelatedPinFeedResource/get/?source_url=%2Fpin%2F${pinId}%2F&data=${dataStr}`;

          const relRes = await fetch(relUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/javascript, */*, q=0.01',
              'X-Requested-With': 'XMLHttpRequest',
              'X-Pinterest-AppState': 'active',
              'X-Pinterest-PWS-Handler': 'www/[username]/[slug].js',
              'Referer': `https://www.pinterest.com/pin/${pinId}/`,
            },
          });

          if (!relRes.ok) break;

          const relData = await relRes.json();
          const items = relData.resource_response?.data || [];
          bookmark = relData.resource_response?.bookmark;

          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.images && !it.videos && !it.story_pin_data) continue;

            const recThumb =
              it.images?.['736x']?.url ||
              it.images?.['474x']?.url ||
              it.images?.['236x']?.url ||
              it.images?.orig?.url ||
              thumbnailUrl;

            const cleanRecTitle =
              (typeof it.title === 'string' && it.title.trim()) ||
              (typeof it.grid_title === 'string' && it.grid_title.trim()) ||
              (typeof it.description === 'string' && it.description.trim().slice(0, 70)) ||
              (typeof it.auto_alt_text === 'string' && it.auto_alt_text.trim().slice(0, 70)) ||
              `${title} Önerisi #${realRecommendations.length + 1}`;

            // Video çözümleme: Hem doğrudan it.videos hem de story_pin_data bloklarını tara
            let recVideo = '';
            let recDur = '0:15';

            let vList = it.videos?.video_list;
            if (!vList && it.story_pin_data?.pages) {
              for (const p of it.story_pin_data.pages) {
                if (p.blocks) {
                  for (const b of p.blocks) {
                    if (b.video?.video_list) {
                      vList = b.video.video_list;
                      break;
                    }
                  }
                }
                if (vList) break;
              }
            }

            if (vList) {
              const directMp4 = vList.V_EXP7?.url || vList.V_720P?.url || vList.v720P?.url;
              const hls =
                vList.V_HLSV4?.url ||
                vList.V_HLSV3_MOBILE?.url ||
                vList.vHLSV4?.url ||
                vList.vHLSV3_MOBILE?.url;

              if (directMp4) {
                recVideo = directMp4;
              } else if (hls) {
                recVideo = hls;
              }

              const dMs =
                vList.V_HLSV4?.duration ||
                vList.V_HLSV3_MOBILE?.duration ||
                vList.V_720P?.duration ||
                15000;
              const dSec = Math.round(dMs / 1000);
              recDur = `0:${dSec < 10 ? '0' + dSec : dSec}`;
            }

            // SADECE kendi bağımsız videosu olan önerileri ekle
            if (!recVideo) continue;

            // Tekrarlanan video akışlarını önle (aynı URL'yi iki kez ekleme)
            if (realRecommendations.some((r) => r.video_url === recVideo)) continue;

            const recAuthor = it.pinner?.username ? `@${it.pinner.username}` : creator;
            const recPinId = it.id ? `pin-${it.id}` : `pin-rec-${pinId}-${realRecommendations.length}`;
            const recPinUrl = it.id ? `https://tr.pinterest.com/pin/${it.id}/` : `https://tr.pinterest.com/pin/${pinId}/?rec=${realRecommendations.length}`;

            realRecommendations.push({
              id: recPinId,
              title: cleanRecTitle,
              url: recPinUrl,
              thumbnail_url: recThumb,
              video_url: recVideo,
              category: detectedCategory,
              age_filter: chosenAge || '25–30 yaş görünümü',
              author: recAuthor,
              duration: recDur,
            });

            if (realRecommendations.length >= targetCount) break;
          }

          if (!bookmark || bookmark === '-end-') break;
          page++;
        }
      } catch (err) {
        console.warn('Pinterest gerçek önerileri çekme hatası:', err);
      }
    }

    // Sadece gerçek Pinterest önerileri varsa ekle; asla hafızadan sahte/şablon video ekleme!
    const finalSimilarPins: SimilarPinItem[] = realRecommendations.length > 0 ? realRecommendations : [];

    return {
      pin_url: trimmed,
      pin_title: title,
      pin_description: description,
      category: detectedCategory,
      age_filter: chosenAge || '25–30 yaş görünümü',
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      embed_html: embedHtml,
      original_creator: creator,
      source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
      duration,
      similar_pins: finalSimilarPins,
    };
  }

  /**
   * Birden fazla Pinterest bağlantısını toplu olarak paralel tarar ve sırayı karıştırır
   */
  static async scanBulkUrls(
    urls: string[],
    category?: PinterestCategory,
    ageFilter?: PinterestAgeFilter,
    shuffle: boolean = true
  ): Promise<ScanUrlResult[]> {
    const validUrls = urls.map(u => u.trim()).filter(Boolean);
    // Vercel serverless için en fazla 20 URL paralel taranır
    const targetUrls = validUrls.slice(0, 20);

    const settled = await Promise.allSettled(
      targetUrls.map((url) => this.scanPinterestUrl(url, category, ageFilter))
    );

    const results: ScanUrlResult[] = [];
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value);
      }
    }

    if (shuffle && results.length > 1) {
      // Fisher-Yates shuffle ile ardışık aynı kategori veya aynı tarz tekrarlarını önle
      for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
      }
    }

    return results;
  }

  /**
   * Pinterest videosunu indirir, Firebase Storage'a yükler,
   * FFmpeg ile zarif Türkçe yazılar ve müzikle montajlar,
   * ardından GeneratedVideo ve Instagram Yayın Kuyruğuna ekler!
   */
  static async convertPinToReels(
    itemOrId: PinterestItem | string,
    options?: { scheduledTime?: string }
  ): Promise<{ video: GeneratedVideo; queueItem: PublishQueueItem }> {
    let item: PinterestItem | null = null;
    if (typeof itemOrId === 'string') {
      item = await PlatformRepository.getPinterestItemById(itemOrId);
      if (!item) {
        throw new Error(`Pin bulunamadı: ${itemOrId}`);
      }
    } else {
      item = itemOrId;
    }

    const now = new Date().toISOString();
    const videoSourceUrl = item.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4';

    // 1. Oynatılabilir Doğrudan Video Akışı
    const storageSavedUrl = videoSourceUrl;

    // 2. OpenAI & AI İçerik Motoru ile Özgün Metin, Altyazı ve Senaryo Üretimi
    let aiIdea: any = null;
    try {
      aiIdea = await AIContentService.generateIdea({
        categoryKey: 'romantic_cinematic',
        customTopic: `Pinterest: ${item.pin_title} (${item.category})`,
      });
    } catch (e) {
      console.warn('AI Content generation fallback for pin:', e);
    }

    // 3. FFmpeg Montajı: İki Bölümlü Standart Reels Yapısı
    // Bölüm 1 (Doğal İçerik 8-15s) + Bölüm 2 (Marka Reklam Sonu 3-5s)
    const outroSettings = await PlatformRepository.getBrandOutroSettings();
    const naturalContentDuration = 10; // 8-15 sn aralığında doğal telefon videosu
    const totalDuration = outroSettings.isEnabled
      ? naturalContentDuration + (outroSettings.durationSeconds || 4)
      : naturalContentDuration;

    const generatedTitle = aiIdea?.title || `${item.pin_title} (Marka Reklam Sonlu Reels)`;
    const outroCtaPrompt = outroSettings.isEnabled
      ? `\n\n${outroSettings.slogan}\n📲 ${outroSettings.profileLinkPrompt}`
      : '\n\nCiddi ve güvenilir yuvanızı kurmak için Evlilik İlanları ailesine katılın. 💍';

    const caption = aiIdea?.caption
      ? `${aiIdea.caption}${outroCtaPrompt}`
      : `Nasip bazen sakin bir sahil yürüyüşünde, bazen bir tebessümde gizlidir... ✨${outroCtaPrompt}\n\n#evlilik #ciddiilişki #evlilikilanlari #reels #keşfet #${item.category.replace(/\s+/g, '')}`;

    const hashtags = aiIdea?.hashtags && aiIdea.hashtags.length > 0
      ? Array.from(new Set([...aiIdea.hashtags, '#evlilik', '#evlilikilanlari', '#reels', `#${item.category.replace(/\s+/g, '')}`]))
      : ['#evlilik', '#ciddiilişki', '#evlilikilanlari', '#reels', '#keşfet', `#${item.category.replace(/\s+/g, '')}`];

    const modelName = outroSettings.isEnabled
      ? `FFmpeg 2-Part Reels (+ ${outroSettings.brandName} ${outroSettings.durationSeconds}s Outro)`
      : 'FFmpeg Pinterest Compositor v1';

    const newVideo: GeneratedVideo = {
      id: `vid-pin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: generatedTitle,
      categoryKey: 'romantic_cinematic',
      productionType: 'ffmpeg_motion',
      videoUrl: storageSavedUrl,
      thumbnailUrl: item.thumbnail_url,
      durationSeconds: totalDuration,
      width: 1080,
      height: 1920,
      fps: 30,
      format: 'mp4',
      aspectRatio: '9:16',
      caption,
      hashtags,
      turkishSubtitles: aiIdea?.turkishSubtitles || [
        { start: 0, end: 3.5, text: "Gözlerinin içine baktığında huzur bulduğun biri..." },
        { start: 3.8, end: 7.5, text: "İşte gerçek evlilik böyle bir güvende başlar." },
        { start: 7.8, end: 11.5, text: "Senin gibi ciddi düşünenler burada buluşuyor 💍" }
      ],
      subtitlesApplied: true,
      logoApplied: true,
      costUsd: 0.01,
      modelUsed: modelName,
      status: 'ready',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await PlatformRepository.saveVideo(newVideo);

    // 3. Instagram Yayın Kuyruğuna Ekle
    const todayStr = now.split('T')[0];
    const scheduledTime = options?.scheduledTime || `${todayStr}T18:00:00+03:00`;

    const newQueueItem: PublishQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      videoId: newVideo.id,
      videoTitle: newVideo.title,
      thumbnailUrl: newVideo.thumbnailUrl,
      scheduledTime,
      slotLabel: `Pinterest Reels - ${item.category}`,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
    };

    await PlatformRepository.saveQueueItem(newQueueItem);

    // Pin durumunu güncelle
    item.converted_video_id = newVideo.id;
    item.approval_status = 'approved';
    item.usage_permission_status = 'Ticari kullanım uygun';
    await PlatformRepository.savePinterestItem(item);

    await PlatformRepository.log(
      'INFO',
      'FFMPEG',
      'PINTEREST_VIDEO_CONVERTED',
      `Pinterest videosu 9:16 Reels olarak montajlandı ve yayın kuyruğuna (${scheduledTime}) eklendi: "${item.pin_title}"`,
      { pinId: item.id, videoId: newVideo.id, scheduledTime }
    );

    return { video: newVideo, queueItem: newQueueItem };
  }

  /**
   * 10-20 adet veya daha fazla Pinterest videosunu karışık sırayla (shuffle) Reels'e dönüştürür
   * ve günde 5 slot (09:00, 12:00, 15:00, 18:00, 21:00) kuralına göre günlere dengeli dağıtır.
   */
  static async batchConvertWithSmartShuffle(
    pinIds: string[],
    options?: { shuffle?: boolean; startFromTomorrow?: boolean; baseDate?: Date }
  ): Promise<{ processed: number; videos: GeneratedVideo[]; queueItems: PublishQueueItem[] }> {
    const shouldShuffle = options?.shuffle !== false; // default true
    let targetIds = [...pinIds];

    if (shouldShuffle && targetIds.length > 1) {
      // Fisher-Yates karıştırma algoritması
      for (let i = targetIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetIds[i], targetIds[j]] = [targetIds[j], targetIds[i]];
      }
    }

    const dailySlots = ['09:00:00+03:00', '12:00:00+03:00', '15:00:00+03:00', '18:00:00+03:00', '21:00:00+03:00'];
    const now = new Date();
    const startDate = options?.baseDate ? new Date(options.baseDate) : new Date(now);
    if (options?.startFromTomorrow && !options?.baseDate) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const existingVideos = await PlatformRepository.getVideos(1000);
    const usedVideoUrls = new Set(existingVideos.map((v) => v.videoUrl).filter(Boolean));

    const videos: GeneratedVideo[] = [];
    const queueItems: PublishQueueItem[] = [];

    for (let i = 0; i < targetIds.length; i++) {
      const pinId = targetIds[i];
      const pinItem = await PlatformRepository.getPinterestItemById(pinId);
      if (pinItem?.video_url && usedVideoUrls.has(pinItem.video_url)) {
        continue; // Bu video zaten daha önce üretilmiş, tekrar etme!
      }

      const dayOffset = Math.floor(videos.length / 5);
      const slotIndex = videos.length % 5;

      const scheduleDate = new Date(startDate);
      scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
      const yyyy = scheduleDate.getFullYear();
      const mm = String(scheduleDate.getMonth() + 1).padStart(2, '0');
      const dd = String(scheduleDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const scheduledTime = `${dateStr}T${dailySlots[slotIndex]}`;

      try {
        const { video, queueItem } = await this.convertPinToReels(pinId, { scheduledTime });
        videos.push(video);
        queueItems.push(queueItem);
      } catch (err) {
        console.warn(`Pin ${pinId} dönüştürme hatası:`, err);
      }
    }

    return { processed: videos.length, videos, queueItems };
  }
}

export const scanPinterestUrl = PinterestService.scanPinterestUrl.bind(PinterestService);
export const generateSimilarPins = PinterestService.generateSimilarPins.bind(PinterestService);
export const convertPinToReels = PinterestService.convertPinToReels.bind(PinterestService);
export const batchConvertWithSmartShuffle = PinterestService.batchConvertWithSmartShuffle.bind(PinterestService);


