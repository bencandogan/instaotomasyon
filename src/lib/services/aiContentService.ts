// Evlilik İlanları - AI İçerik Üretim Motoru (OpenAI & Türkçe Prompt Mühendisliği)
import { ContentCategory, ContentIdea, VideoCategoryType } from '@/types';
import { PlatformRepository } from '@/lib/store/repository';

export interface GenerateContentRequest {
  categoryKey: VideoCategoryType;
  customTopic?: string;
  forceFresh?: boolean;
}

export class AIContentService {
  /**
   * Benzersiz içerik hash'i üreterek tekrarları denetler
   */
  private static computeHash(title: string, scenario: string): string {
    const combined = `${title.toLowerCase().trim()}_${scenario.toLowerCase().slice(0, 50)}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Kategoriye özel hazır senaryo şablonları (OpenAI API anahtarı girilene kadar veya test modunda)
   */
  private static getCategoryFallback(categoryKey: VideoCategoryType, customTopic?: string): Omit<ContentIdea, 'id' | 'createdAt' | 'updatedAt' | 'repetitionCheckHash'> {
    const templates: Record<VideoCategoryType, Array<Omit<ContentIdea, 'id' | 'createdAt' | 'updatedAt' | 'repetitionCheckHash'>>> = {
      romantic_cinematic: [
        {
          categoryId: 'cat-1',
          categoryKey: 'romantic_cinematic',
          title: 'İstanbul Boğazı’nda İlk Söz: Gerçek Sevgi Sabır İster',
          scenario: 'Gün batımında Boğaz kıyısında yürüyen genç çift. Rüzgar hafifçe eserken birbirlerinin gözlerine sevgi ve güvenle bakarlar. Arka planda martı sesleri ve yumuşak ney/piyano ezgisi.',
          sceneDescription: 'Sinematik 4K dikey çekim, altın saat ışığı, samimi Türk çifti, sıcak renk tonları, derin odak.',
          generationPrompt: 'Cinematic 4k vertical 9:16 video, golden hour warm sunlight, beautiful young Turkish couple standing gracefully near Istanbul Bosphorus shoreline, gentle breeze, looking at each other with deep affection and genuine trust, high production quality, realistic emotion, 30fps.',
          turkishSubtitles: [
            { start: 0, end: 3, text: 'Doğru insanı bulmak bir tesadüf değil...' },
            { start: 3.2, end: 7, text: 'Aynı niyetle aynı yola çıkma kararlılığıdır.' },
            { start: 7.2, end: 11, text: 'Evlilik İlanları ile ciddi ve güvenilir yuvanı kur.' },
          ],
          caption: 'Kader gayrete aşıktır derler... Hayat yolculuğunda elini hiç bırakmayacak, aynı değerleri paylaştığın o özel insanı bulmak artık zor değil. 💍\n\nCiddi, dürüst ve evlilik odaklı profillerle tanışmak için profildeki bağlantıya tıkla!\n\n#evlilik #ciddiilişki #evlilikilanlari #doğruinsan #huzur #istanbul #aşk #yuva',
          hashtags: ['#evlilik', '#ciddiilişki', '#evlilikilanlari', '#yuva', '#huzur', '#evlilikteklifi', '#güven'],
          coverPrompt: 'Romantic Turkish couple smiling warmly at golden hour, wearing elegant modest clothes, sunset background.',
          status: 'approved',
        },
        {
          categoryId: 'cat-1',
          categoryKey: 'romantic_cinematic',
          title: 'İki Kalbin Sessiz Anlaşması: Güven Dolu Bakışlar',
          scenario: 'Karaköy sokaklarında sıcak bir sonbahar günü. Kahve fincanlarını tutarken gülümseyen ve geleceğe dair hayaller kuran iki insanın samimi buluşması.',
          sceneDescription: 'Pastel sonbahar tonları, kahve fincanı buharı, yumuşak tebessüm, 9:16 sinematik lens.',
          generationPrompt: 'Close up cinematic 9:16 vertical video, cozy autumn cafe setting, handsome Turkish man and elegant woman exchanging warm genuine smiles, soft bokeh background, filmic colors.',
          turkishSubtitles: [
            { start: 0, end: 3.5, text: 'Gözlerinin içine baktığında huzur bulduğun biri...' },
            { start: 3.8, end: 8, text: 'İşte gerçek evlilik böyle bir güvende başlar.' },
            { start: 8.2, end: 12, text: 'Senin gibi ciddi düşünenler burada buluşuyor.' },
          ],
          caption: 'Bir ömür aynı çatı altında huzurla uyanmak... Yanında kendin olabildiğin insanla hayat çok daha güzel. ✨\n\nEvlilik İlanları ailesine katıl, hayalindeki yuvayı inşa et.\n\n#evlilik #huzur #güven #nasip #ciddiarkadaşlık',
          hashtags: ['#evlilik', '#huzur', '#güven', '#nasip', '#evliliksitesi'],
          coverPrompt: 'Warm cozy coffee shop encounter between mature, respectful Turkish couple, cinematic 4k.',
          status: 'approved',
        },
        {
          categoryId: 'cat-1',
          categoryKey: 'romantic_cinematic',
          title: 'Nasip Vaktine Esirdir: Sahilde Huzurlu Adımlar',
          scenario: 'Sakin bir deniz kıyısında dalga sesleri eşliğinde el ele yürüyen çift. Sessizlik içinde konuşan iki kalbin huzuru.',
          sceneDescription: 'Sahil gün batımı, hafif rüzgar, telifsiz huzurlu gitar melodisi, dikey 9:16.',
          generationPrompt: 'Peaceful sunset walk on beach 9:16 vertical video, calm waves, gentle romance.',
          turkishSubtitles: [
            { start: 0, end: 3.2, text: 'Her şey doğru zamanda, doğru insanla güzelleşir.' },
            { start: 3.5, end: 7.5, text: 'Kalbine denk bir eş ile yuva kurmak senin de hakkın.' },
            { start: 7.8, end: 11, text: 'Yeni başlangıçlar için Evlilik İlanları seninle.' },
          ],
          caption: 'Nasip bazen sakin bir sahil yürüyüşünde, bazen içten bir tebessümde gizlidir... 🌅 Hayat yolunda sana eşlik edecek dürüst yol arkadaşını bulmak için şimdi aramıza katıl.\n\n#nasip #yuva #huzur #evlilik #sevgi #reels',
          hashtags: ['#nasip', '#yuva', '#huzur', '#evlilik', '#ciddiilişki'],
          coverPrompt: 'Sunset sea shore couple walking gently, peaceful.',
          status: 'approved',
        },
        {
          categoryId: 'cat-1',
          categoryKey: 'romantic_cinematic',
          title: 'Bir Ömür Boyu Sadakat: Birlikte Yaşlanmak',
          scenario: 'Parkta yeşillikler arasında yan yana yürüyen, birbirine saygı ve muhabbetle bakan iki eş.',
          sceneDescription: 'Doğal park atmosferi, yumuşak gün ışığı, dikey Reels.',
          generationPrompt: 'Serene park walkway couple, respectful love, 9:16 vertical.',
          turkishSubtitles: [
            { start: 0, end: 3.5, text: 'Gönlü güzel olanın nasibi de güzel olur...' },
            { start: 3.8, end: 7.5, text: 'Bir ömür elini bırakmayacak yol arkadaşını ara.' },
            { start: 7.8, end: 11.5, text: 'Ciddi niyetle yola çıkanlar Evlilik İlanları’nda.' },
          ],
          caption: 'Dünyanın en büyük zenginliği; seni anlayan, sana değer veren ve Allah rızası için seven bir eştir. 🤍\n\nCiddi yuva arayışındaysan profildeki bağlantıyı tıkla.\n\n#evlilik #sadakat #huzur #aşk #yuva',
          hashtags: ['#evlilik', '#sadakat', '#huzur', '#ciddiarkadaşlık', '#keşfet'],
          coverPrompt: 'Autumn park green path modest couple, cinematic.',
          status: 'approved',
        },
        {
          categoryId: 'cat-1',
          categoryKey: 'romantic_cinematic',
          title: 'Aynı Yöne Bakabilmek: Ortak Değerler, Güçlü Yuvalar',
          scenario: 'Manzara karşısında yan yana durup geleceğe umutla bakan çift. Samimiyet, ciddiyet ve zarafet.',
          sceneDescription: 'Şehir manzarası, zarif dikey kadraj, sıcak renk tonları.',
          generationPrompt: 'City overlook terrace, couple smiling into distance, elegant modest, 9:16.',
          turkishSubtitles: [
            { start: 0, end: 3.2, text: 'Evlilik sadece birbirine bakmak değil...' },
            { start: 3.5, end: 7.2, text: 'Birlikte aynı yöne ve aynı geleceğe bakabilmektir.' },
            { start: 7.5, end: 11.0, text: 'Değerlerine uygun eş adayları burada.' },
          ],
          caption: 'Aynı değerleri, aynı inancı ve aynı hayalleri paylaştığın bir insanla hayat çok daha anlamlı. 💍 Yuva kurma yolculuğunda ilk adımı güvenle at.\n\n#evlilik #ortakdeğerler #güvenliyuva #huzur #evlilikilanlari',
          hashtags: ['#evlilik', '#ortakdeğerler #güven #yuva #reels'],
          coverPrompt: 'Terrace city view elegant couple.',
          status: 'approved',
        },
      ],
      realistic_selfie: [
        {
          categoryId: 'cat-2',
          categoryKey: 'realistic_selfie',
          title: 'Ben de Yorulmuştum Diyorlar Ya: Yalnız Değilsiniz!',
          scenario: 'Genç bir kadın oturma odasında telefonunun ön kamerasına bakarak samimi ve dürüstçe konuşuyor. Gözlerinde içten bir dost tavsiyesi var.',
          sceneDescription: 'Doğal oda ışığı, net ön kamera açısı, samimi jestler, dikey Reels formatı.',
          generationPrompt: 'POV smartphone selfie video 9:16, natural daylight, friendly Turkish woman in her late 20s speaking sincerely directly into front camera, casual living room, extremely realistic natural facial expressions.',
          turkishSubtitles: [
            { start: 0, end: 3, text: '"Artık boş sohbetlerden çok yoruldum" diyorsan...' },
            { start: 3.2, end: 7, text: 'Yalnız değilsin. Ciddi niyetli insanlar da seni arıyor.' },
            { start: 7.2, end: 10.5, text: 'Vaktini boşa harcama, doğru platformda yerini al.' },
          ],
          caption: 'Geçici heveslerle vakit kaybetmek yerine, hayatı beraber göğüsleyecek bir yol arkadaşı arayanlar burada. Sen de aramıza katıl! 🤍\n\n#ilişkitavsiyeleri #evlilikyolunda #samimiyet #gerçeksevgi #evlilikilanlari',
          hashtags: ['#ilişkitavsiyeleri', '#evlilikyolunda', '#samimiyet', '#evlilikilanlari'],
          coverPrompt: 'Authentic Turkish woman smiling encouragingly holding smartphone at eye level.',
          status: 'approved',
        },
      ],
      relationship_advice: [
        {
          categoryId: 'cat-3',
          categoryKey: 'relationship_advice',
          title: 'Sağlıklı Bir Evliliğin 3 Temel Taşı',
          scenario: 'Minimalist estetik arka plan. Ekranda sırasıyla beliren 3 altın kural: 1. Dinleme Sanatı, 2. Karşılıklı Saygı, 3. Ortak Gelecek İnancı.',
          sceneDescription: 'Zarif tipografi animasyonları, dingin renkler, odaklayıcı geçişler.',
          generationPrompt: 'Minimalist high-end motion graphics 9:16, sleek aesthetic typography showing relationship wisdom, soft beige aesthetic, modern graphic cuts.',
          turkishSubtitles: [
            { start: 0, end: 3.5, text: '1. Karşındaki insanı değiştirmeye değil anlamaya çalış.' },
            { start: 3.7, end: 7.2, text: '2. En zor anlarda bile saygıyı asla elden bırakma.' },
            { start: 7.5, end: 11, text: '3. Evlilik bir yarış değil, el ele yürüyüştür.' },
          ],
          caption: 'Sevgi evi kurar, saygı ise o evi ayakta tutar. Sizin için bir evlilikte en önemli özellik hangisi? Yorumlarda paylaşın! 👇\n\n#evlilik #ilişkiler #mutluluk #tavsiye #evlilikrehberi',
          hashtags: ['#evlilik', '#ilişkiler', '#mutluluk', '#tavsiye', '#evlilikrehberi'],
          coverPrompt: 'Minimalist typography with wedding bands and warm coffee cup, aesthetic beige.',
          status: 'approved',
        },
      ],
      app_promo: [
        {
          categoryId: 'cat-4',
          categoryKey: 'app_promo',
          title: 'Neden Evlilik İlanları? Güvenli ve Onaylı Profiller',
          scenario: 'Modern telefon arayüzünde Evlilik İlanları uygulamasının gezintisi, profil doğrulama rozeti, detaylı filtreleme (şehir, yaş, niyet) özellikleri.',
          sceneDescription: 'Canlı renk geçişleri, güven veren mavi ve gül kurusu tonları, hızlı dinamik kurgu.',
          generationPrompt: 'Dynamic 3D smartphone mockup rotating vertically 9:16, showing clean wedding platform UI with verified badge glow, energetic motion, professional marketing look.',
          turkishSubtitles: [
            { start: 0, end: 3.2, text: 'Sahte profillerden ve boş vaatlerden sıkıldın mı?' },
            { start: 3.4, end: 7.5, text: 'Evlilik İlanları: Kimlik doğrulamalı, gizliliğe saygılı.' },
            { start: 7.8, end: 11, text: 'Ömürlük mutluluğun için ilk adımı bugün at!' },
          ],
          caption: 'Hayatının kararını alırken güven her şeydir. %100 onaylı profiller ve ciddi adaylarla Evlilik İlanları senin yanında! 🚀\n\nÜcretsiz kayıt için biyografideki linke tıkla.\n\n#evlilikilanlari #güvenlievlilik #yuva #evliliksitesi #ciddiilişki',
          hashtags: ['#evlilikilanlari', '#güvenlievlilik', '#evliliksitesi', '#ciddiilişki', '#reklam'],
          coverPrompt: 'Modern 3D smartphone screen displaying verified marriage app profile with gold ring icon.',
          status: 'approved',
        },
      ],
      viral_story: [
        {
          categoryId: 'cat-5',
          categoryKey: 'viral_story',
          title: 'İlk Görüşte Evlenmeye Karar Verenler Burada mı?',
          scenario: 'Merak uyandıran büyük yazılı soru: "Eşinizle tanıştıktan kaç gün sonra ‘işte o insan’ dediniz?" Ardından şaşırtıcı ve tatlı bir evlilik hikayesi anlatımı.',
          sceneDescription: 'Sarı ve beyaz büyük dikkat çekici altyazı, hızlı kurgu, sokak röportajı ritmi.',
          generationPrompt: 'Street interview POV style video 9:16 vertical, vibrant city background, fast punchy cuts, curious expressions, high engagement hook aesthetic.',
          turkishSubtitles: [
            { start: 0, end: 2.8, text: 'Eşinizle ilk karşılaştığınızda ne hissettiniz?' },
            { start: 3.0, end: 6.8, text: 'Bazıları ilk bakışta anlar, bazıları zamanla aşık olur.' },
            { start: 7.0, end: 10.5, text: 'Senin hikayen ne? Yorumlara yaz, sabitleyelim!' },
          ],
          caption: 'Kimi ilk saniyede anladım der, kimi "bir kahve içtik ve hayatım değişti" der... Sizin tanışma hikayeniz nasıl başladı? En güzel yorumu başa sabitleyeceğiz! 💬👇\n\n#tanışma #evlilik #aşk #yorum #keşfet #reelsviral',
          hashtags: ['#tanışma', '#evlilik', '#aşk', '#yorum', '#keşfet', '#reelsviral'],
          coverPrompt: 'Bold yellow and white typography on expressive reaction background, high CTR cover.',
          status: 'approved',
        },
      ],
    };

    const list = templates[categoryKey] || templates.romantic_cinematic;
    const item = list[Math.floor(Math.random() * list.length)];
    if (customTopic) {
      return {
        ...item,
        title: `${customTopic}: ${item.title}`,
      };
    }
    return item;
  }

  /**
   * OpenAI API kullanarak veya test modunda özgün Reels içeriği üretir
   */
  static async generateIdea(req: GenerateContentRequest): Promise<ContentIdea> {
    const aiSettings = await PlatformRepository.getAISettings();
    const categories = await PlatformRepository.getCategories();
    const category = categories.find((c) => c.key === req.categoryKey) || categories[0];

    const apiKey = process.env.OPENAI_API_KEY;
    const hasOpenAI = Boolean(apiKey && apiKey.trim() !== '');

    let generated: Omit<ContentIdea, 'id' | 'createdAt' | 'updatedAt' | 'repetitionCheckHash'>;

    if (hasOpenAI) {
      try {
        const startTime = Date.now();
        // Gerçek OpenAI API çağrısı
        const prompt = `
Sen "Evlilik İlanları" markası için Instagram Reels içerik üreticisisin.
Aşağıdaki kategori için Türkçe, 8-15 saniyelik, 9:16 formatında, son derece özgün ve izletme oranı yüksek bir video içeriği hazırla:

Kategori: ${category.name} (${category.description})
Kılavuz Prompt: ${category.promptGuideline}
${req.customTopic ? `Özel Konu/Tema: ${req.customTopic}` : ''}

Yanıtını kesinlikle aşağıdaki JSON şemasına uygun olarak sadece saf JSON formatında ver:
{
  "title": "Kısa çarpıcı video başlığı",
  "scenario": "8-15 saniyelik detaylı sahne anlatımı",
  "sceneDescription": "Işık, mekan, oyuncu ve açı detayları",
  "generationPrompt": "English detailed prompt for fal.ai video generator (vertical 9:16, 4k, realistic)",
  "turkishSubtitles": [
    {"start": 0, "end": 3.0, "text": "Altyazı satırı 1"},
    {"start": 3.2, "end": 7.0, "text": "Altyazı satırı 2"},
    {"start": 7.2, "end": 11.0, "text": "Altyazı satırı 3"}
  ],
  "caption": "Instagram açıklaması, emojili, samimi ve harekete geçirici mesajlı",
  "hashtags": ["#evlilik", "#ciddiilişki", "#evlilikilanlari"],
  "coverPrompt": "Kapak görseli promptu"
}
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: aiSettings.openaiModel === 'gpt-4o' ? 'gpt-4o-mini' : (aiSettings.openaiModel || 'gpt-4o-mini'),
            messages: [
              { role: 'system', content: aiSettings.systemPromptBase },
              { role: 'user', content: prompt },
            ],
            temperature: aiSettings.temperature || 0.7,
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI API Hatası: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const contentStr = data.choices[0]?.message?.content;
        const parsed = JSON.parse(contentStr);

        generated = {
          categoryId: category.id,
          categoryKey: category.key,
          title: parsed.title,
          scenario: parsed.scenario,
          sceneDescription: parsed.sceneDescription,
          generationPrompt: parsed.generationPrompt,
          turkishSubtitles: parsed.turkishSubtitles || [],
          caption: parsed.caption,
          hashtags: parsed.hashtags || [],
          coverPrompt: parsed.coverPrompt || '',
          status: 'approved',
        };

        const durationMs = Date.now() - startTime;
        const totalTokens = data.usage?.total_tokens || 500;
        const costUsd = (totalTokens / 1000) * 0.005;

        await PlatformRepository.recordApiUsage({
          provider: 'openai',
          endpoint: 'chat/completions',
          unitsUsed: totalTokens,
          unitType: 'tokens',
          costUsd,
          durationMs,
          status: 'success',
        });

        await PlatformRepository.log('INFO', 'AI_CONTENT', 'IDEA_GENERATED_OPENAI', `OpenAI ile yeni içerik üretildi: "${generated.title}"`, {
          tokens: totalTokens,
          costUsd,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await PlatformRepository.log('ERROR', 'AI_CONTENT', 'OPENAI_FAIL_FALLBACK', `OpenAI çağrısı başarısız oldu, şablon fallback kullanılıyor: ${errorMsg}`);
        generated = this.getCategoryFallback(req.categoryKey, req.customTopic);
      }
    } else {
      // Test modu / Anahtar henüz girilmedi
      generated = this.getCategoryFallback(req.categoryKey, req.customTopic);
      await PlatformRepository.log('INFO', 'AI_CONTENT', 'IDEA_GENERATED_TEST_MODE', `Test modu ile içerik hazırlandı: "${generated.title}" (${category.name})`);
    }

    const hash = this.computeHash(generated.title, generated.scenario);

    // Tekrar Kontrolü: Daha önce bu hash üretilmiş mi?
    const existingIdeas = await PlatformRepository.getIdeas();
    const isDuplicate = existingIdeas.some((i) => i.repetitionCheckHash === hash);

    if (isDuplicate && !req.forceFresh) {
      generated.title = `${generated.title} [Yeni Seri ${Math.floor(Math.random() * 90 + 10)}]`;
    }

    const newIdea: ContentIdea = {
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...generated,
      repetitionCheckHash: hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await PlatformRepository.saveIdea(newIdea);
    return newIdea;
  }

  /**
   * Günlük 5 adet farklı içerik setini otomatik hazırlar
   */
  static async generateDailyBatch(): Promise<ContentIdea[]> {
    const categories: VideoCategoryType[] = [
      'romantic_cinematic',
      'realistic_selfie',
      'relationship_advice',
      'app_promo',
      'viral_story',
    ];

    const results: ContentIdea[] = [];
    for (const catKey of categories) {
      const idea = await this.generateIdea({ categoryKey: catKey });
      results.push(idea);
    }

    await PlatformRepository.log(
      'INFO',
      'AI_CONTENT',
      'DAILY_BATCH_GENERATED',
      `Günlük 5 farklı kategori için Reels içerik senaryoları hazırlandı.`
    );

    return results;
  }
}
