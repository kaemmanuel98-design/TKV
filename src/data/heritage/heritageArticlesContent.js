/** Articles Héritage — contenu détaillé (blocs FR / EN) */

export const HERITAGE_ARTICLES_CONTENT = {
  jesus: {
    titleKey: 'heritage_article_jesus_title',
    heroAltKey: 'heritage_img_jesus_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'L\'existence historique de Jésus de Nazareth est aujourd\'hui largement admise par les spécialistes, y compris ceux qui ne partagent pas la foi chrétienne. Les sources antiques — romaines, juives et chrétiennes — convergent sur un personnage réel, crucifié sous Ponce Pilate vers l\'an 30.' },
        { type: 'h2', text: 'Ce que disent les sources profanes' },
        { type: 'p', text: 'Tacite (vers 116 apr. J.-C.) mentionne « Christus » exécuté par Ponce Pilate sous Tibère. Josèphe, Flavius, rapporte l\'existence de Jésus et l\'exécution de Jacques « le frère de celui qu\'on appelle le Christ ». Ces témoignages, indépendants des Évangiles, ancrent Jésus dans l\'histoire romaine et juive du Ier siècle.' },
        { type: 'list', items: [
          'Tacite, Annales XV, 44 — exécution sous Pilate',
          'Josèphe, Antiquités XVIII, 63-64 (passage discuté mais largement étudié)',
          'Lettre de Pline le Jeune à Trajan (vers 112) — culte du « Christ » en Asie Mineure',
        ]},
        { type: 'h2', text: 'La question centrale' },
        { type: 'p', text: 'La question n\'est pas seulement « a-t-il existé ? » mais « qui était-il réellement ? ». Les Évangiles le présentent comme Fils de Dieu incarné, mort et ressuscité pour le salut du monde. Cette affirmation transforme toute lecture de l\'histoire — personnelle et collective.' },
        { type: 'quote', text: '« Qui dites-vous que je suis ? »', source: 'Marc 8,29' },
        { type: 'img', altKey: 'heritage_img_transfig_alt', captionKey: 'heritage_img_transfig_cap' },
        { type: 'p', text: 'TKV invite à examiner les textes, les contextes et les objections avec honnêteté intellectuelle — sans caricaturer ni le scepticisme ni la foi. Utilisez Bible Strong pour explorer les passages évangéliques mot à mot.' },
      ],
      en: [
        { type: 'p', text: 'The historical existence of Jesus of Nazareth is widely accepted by scholars today, including those who do not share Christian faith. Ancient Roman, Jewish, and Christian sources converge on a real figure crucified under Pontius Pilate around AD 30.' },
        { type: 'h2', text: 'What non-Christian sources say' },
        { type: 'p', text: 'Tacitus (c. AD 116) mentions "Christus" executed by Pontius Pilate under Tiberius. Josephus reports Jesus\' existence and the execution of James "the brother of the one called Christ." These witnesses, independent of the Gospels, anchor Jesus in first-century Roman and Jewish history.' },
        { type: 'list', items: [
          'Tacitus, Annals 15.44 — execution under Pilate',
          'Josephus, Antiquities 18.63-64 (debated passage, widely studied)',
          'Pliny the Younger to Trajan (c. AD 112) — worship of "Christ" in Asia Minor',
        ]},
        { type: 'h2', text: 'The central question' },
        { type: 'p', text: 'The question is not only "did he exist?" but "who was he really?" The Gospels present him as the incarnate Son of God who died and rose for the salvation of the world. This claim transforms how we read all of history — personal and collective.' },
        { type: 'quote', text: '"Who do you say that I am?"', source: 'Mark 8:29' },
        { type: 'img', altKey: 'heritage_img_transfig_alt', captionKey: 'heritage_img_transfig_cap' },
        { type: 'p', text: 'TKV invites you to examine texts, contexts, and objections with intellectual honesty — without caricaturing either skepticism or faith. Use Bible Strong to explore Gospel passages word by word.' },
      ],
    },
  },
  manuscripts: {
    titleKey: 'heritage_article_manuscripts_title',
    heroAltKey: 'heritage_img_codex_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Le Nouveau Testament est l\'œuvre antique la mieux attestée par les manuscrits : plus de 5 800 fragments et codices grecs, en plus des traductions anciennes (latin, copte, syriaque, arménien…). Aucun auteur classique (Homère, César, Tacite) ne dispose d\'un tel volume de copies.' },
        { type: 'h2', text: 'Proximité temporelle' },
        { type: 'p', text: 'Certains papyrus (P52, fragment de Jean) sont datés du début du IIe siècle — peut-être quelques décennies après la rédaction originale. Le Codex Sinaiticus et le Codex Vaticanus (IVe siècle) transmettent presque l\'intégralité du NT en grec. Pour comparer : les manuscrits d\'Homère les plus anciens sont séparés de l\'original par plus de 500 ans.' },
        { type: 'img', altKey: 'heritage_img_sinaiticus_alt', captionKey: 'heritage_img_sinaiticus_cap' },
        { type: 'h2', text: 'Critique textuelle : transparence, pas dissimulation' },
        { type: 'p', text: 'La critique textuelle ne « cache » pas des variantes : elle les classe, les date et évalue leur impact doctrinal. La grande majorité des différences sont des fautes de copie (orthographe, ordre des mots) sans conséquence théologique. Les passages longs discutés (ex. Jean 7:53-8:11) sont signalés dans les traductions modernes.' },
        { type: 'list', items: [
          'Plus de 5800 manuscrits grecs du NT',
          'Traductions anciennes dès le IIe siècle',
          'Variantes majeures : moins de 1 % du texte, aucune ne change le cœur du message',
        ]},
        { type: 'p', text: 'Comprendre ce processus renforce une lecture confiante des Écritures, sans naïveté — une foi informée, pas aveugle.' },
      ],
      en: [
        { type: 'p', text: 'The New Testament is the best-attested ancient work by manuscripts: over 5,800 Greek fragments and codices, plus ancient translations (Latin, Coptic, Syriac, Armenian…). No classical author (Homer, Caesar, Tacitus) has comparable copy volume.' },
        { type: 'h2', text: 'Temporal proximity' },
        { type: 'p', text: 'Some papyri (P52, a John fragment) are dated to the early 2nd century — perhaps decades after the original writing. Codex Sinaiticus and Codex Vaticanus (4th century) transmit nearly the full NT in Greek. By comparison: the earliest Homer manuscripts are 500+ years from the original.' },
        { type: 'img', altKey: 'heritage_img_sinaiticus_alt', captionKey: 'heritage_img_sinaiticus_cap' },
        { type: 'h2', text: 'Textual criticism: transparency, not hiding' },
        { type: 'p', text: 'Textual criticism does not "hide" variants: it classifies, dates, and assesses their doctrinal impact. The vast majority of differences are copyist errors (spelling, word order) with no theological consequence. Disputed longer passages (e.g. John 7:53-8:11) are noted in modern translations.' },
        { type: 'list', items: [
          'Over 5,800 Greek NT manuscripts',
          'Ancient translations from the 2nd century onward',
          'Major variants: under 1% of text; none change the core message',
        ]},
        { type: 'p', text: 'Understanding this process supports a confident reading of Scripture without naivety — an informed faith, not a blind one.' },
      ],
    },
  },
  resurrection: {
    titleKey: 'heritage_article_resurrection_title',
    heroAltKey: 'heritage_img_tomb_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'La résurrection de Jésus est le cœur de la prédication chrétienne dès les premiers jours (1 Co 15). Paul écrit vers 55 apr. J.-C. que plus de 500 témoins ont vu le Christ ressuscité, dont beaucoup « sont encore vivants » — une affirmation vérifiable à l\'époque.' },
        { type: 'h2', text: 'Arguments historiques souvent avancés' },
        { type: 'list', items: [
          'Tombeau vide : expliqué tôt par les disciples, pas contredit efficacement par les autorités',
          'Apparitions multiples : hommes et femmes, individuelles et collectives',
          'Naissance soudaine du mouvement : des juifs monothéistes proclament un crucifié ressuscité — fait historique difficile à expliquer sans un événement fondateur',
          'Transformation des disciples : de la fuite à la mission, y compris au prix du martyre',
        ]},
        { type: 'h2', text: 'Objections et dialogue honnête' },
        { type: 'p', text: 'Les explications alternatives (hallucinations collectives, vol du corps, coma…) ont été examinées en détail par des historiens et philosophes des deux bords. TKV encourage à lire ces débats — notamment N.T. Wright, Gary Habermas, et leurs interlocuteurs — sans caricature.' },
        { type: 'quote', text: '« S\'il n\'y a pas de résurrection des morts, le Christ non plus n\'a pas été ressuscité… et votre foi est vaine. »', source: '1 Corinthiens 15,13-17' },
        { type: 'p', text: 'La résurrection n\'est pas un appendice sentimental : elle fonde l\'espérance chrétienne face à la mort et donne sens à l\'histoire entière.' },
      ],
      en: [
        { type: 'p', text: 'Jesus\' resurrection is the heart of Christian preaching from the earliest days (1 Cor 15). Paul writes around AD 55 that more than 500 witnesses saw the risen Christ, many "still alive" — a claim checkable at the time.' },
        { type: 'h2', text: 'Historical arguments often presented' },
        { type: 'list', items: [
          'Empty tomb: proclaimed early by disciples, not effectively refuted by authorities',
          'Multiple appearances: men and women, individual and group settings',
          'Sudden birth of the movement: monotheistic Jews proclaim a crucified man risen — hard to explain without a founding event',
          'Transformation of disciples: from flight to mission, including martyrdom',
        ]},
        { type: 'h2', text: 'Objections and honest dialogue' },
        { type: 'p', text: 'Alternative explanations (mass hallucination, stolen body, swoon theory…) have been examined in depth by historians and philosophers on all sides. TKV encourages reading these debates — including N.T. Wright, Gary Habermas, and their critics — without caricature.' },
        { type: 'quote', text: '"If there is no resurrection of the dead, then Christ has not been raised… and your faith is futile."', source: '1 Corinthians 15:13-17' },
        { type: 'p', text: 'Resurrection is not sentimental add-on: it grounds Christian hope before death and gives meaning to all of history.' },
      ],
    },
  },
  'problem-evil': {
    titleKey: 'heritage_article_evil_title',
    heroAltKey: 'heritage_img_cross_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Le mal dans le monde est l\'une des objections les plus sérieuses contre la foi en un Dieu bon et tout-puissant. Le christianisme ne le minimise pas : la croix place Dieu au cœur de la souffrance, non comme spectateur indifférent.' },
        { type: 'h2', text: 'Plusieurs réponses complémentaires' },
        { type: 'list', items: [
          'Liberté humaine : l\'amour authentique exige la possibilité du choix, donc du mal moral',
          'Réalité du péché et de la chute : le monde est brisé, pas tel que Dieu l\'a voulu à l\'origine',
          'Dieu qui souffre avec nous : la croix et l\'immanence du Christ souffrant',
          'Espérance eschatologique : justice finale, résurrection, « essuyer toute larme » (Ap 21)',
        ]},
        { type: 'p', text: 'Aucune formule ne dissout toute douleur ici et maintenant. L\'apologétique chrétienne mature reconnaît le silence nécessaire devant la souffrance injuste — et refuse les réponses faciles qui blessent les victimes.' },
        { type: 'quote', text: '« Mon Dieu, mon Dieu, pourquoi m\'as-tu abandonné ? »', source: 'Psaume 22 / Matthieu 27' },
        { type: 'p', text: 'Face à quelqu\'un qui souffre : écouter d\'abord, prier ensemble, argumenter seulement si la personne le souhaite. Parfois la présence compatissante parle plus qu\'un discours.' },
      ],
      en: [
        { type: 'p', text: 'Evil in the world is one of the most serious objections to faith in a good, all-powerful God. Christianity does not minimize it: the cross places God at the heart of suffering, not as an indifferent spectator.' },
        { type: 'h2', text: 'Several complementary responses' },
        { type: 'list', items: [
          'Human freedom: authentic love requires the possibility of choice, hence moral evil',
          'Reality of sin and the fall: the world is broken, not as God originally intended',
          'God suffering with us: the cross and the presence of a suffering Christ',
          'Eschatological hope: final justice, resurrection, "wipe away every tear" (Rev 21)',
        ]},
        { type: 'p', text: 'No formula dissolves all pain here and now. Mature Christian apologetics acknowledges necessary silence before unjust suffering — and refuses easy answers that harm victims.' },
        { type: 'quote', text: '"My God, my God, why have you forsaken me?"', source: 'Psalm 22 / Matthew 27' },
        { type: 'p', text: 'With someone who suffers: listen first, pray together, argue only if they want to. Sometimes compassionate presence speaks louder than a speech.' },
      ],
    },
  },
  gospels: {
    titleKey: 'heritage_article_gospels_title',
    heroAltKey: 'heritage_img_gospels_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Les quatre Évangiles ne sont pas des biographies modernes : ce sont des récits de foi ancrés dans l\'histoire, rédigés par des communautés qui ont conservé les paroles et gestes de Jésus avec soin. Matthieu, Marc, Luc et Jean offrent des perspectives complémentaires.' },
        { type: 'h2', text: 'Fiabilité et date' },
        { type: 'p', text: 'La majorité des spécialistes situent Marc entre 65 et 75, Matthieu et Luc entre 80 et 95, Jean vers 90-100 — donc dans la mémoire de témoins directs ou de leur cercle immédiat. Les « Évangiles apocryphes » tardifs (IIe-IVe s.) ne rivalisent pas en proximité historique.' },
        { type: 'h2', text: 'Différences entre récits' },
        { type: 'p', text: 'Les divergences de détail (ordre des tentations, nombre de guérisons) sont normales dans la littérature antique. Les harmonisations forcées ou les contradictions absolues sont rares quand on lit avec les genres de l\'époque. Les accords sur les faits majeurs (crucifixion, tombeau vide, apparitions) sont remarquables.' },
        { type: 'list', items: [
          'Marc : récit le plus court, probablement le plus ancien',
          'Luc : souci historique et universalité (lettre à Théophile)',
          'Jean : théologie profonde, « signes » et discours',
        ]},
        { type: 'p', text: 'Lire un Évangile en entier — Marc en quinze chapitres — reste la meilleure introduction à Jésus. TKV vous y accompagne via Bible Strong.' },
      ],
      en: [
        { type: 'p', text: 'The four Gospels are not modern biographies: they are faith narratives rooted in history, written by communities that carefully preserved Jesus\' words and deeds. Matthew, Mark, Luke, and John offer complementary perspectives.' },
        { type: 'h2', text: 'Reliability and dating' },
        { type: 'p', text: 'Most scholars place Mark between AD 65-75, Matthew and Luke between 80-95, John around 90-100 — within the memory of eyewitnesses or their immediate circle. Late "apocryphal gospels" (2nd-4th c.) do not rival them in historical proximity.' },
        { type: 'h2', text: 'Differences between accounts' },
        { type: 'p', text: 'Detail variations (order of temptations, healing counts) are normal in ancient literature. Forced harmonizations or absolute contradictions are rare when reading with period genres. Agreement on major facts (crucifixion, empty tomb, appearances) is striking.' },
        { type: 'list', items: [
          'Mark: shortest account, likely earliest',
          'Luke: historical concern and universality (letter to Theophilus)',
          'John: deep theology, "signs" and discourses',
        ]},
        { type: 'p', text: 'Reading one Gospel whole — Mark in fifteen chapters — remains the best introduction to Jesus. TKV supports you through Bible Strong.' },
      ],
    },
  },
  archaeology: {
    titleKey: 'heritage_article_archaeology_title',
    heroAltKey: 'heritage_img_scrolls_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'L\'archéologie ne « prouve » pas la Bible mot à mot, mais elle éclaire les contextes, les lieux et les personnages — et renforce souvent la crédibilité historique des récits bibliques.' },
        { type: 'h2', text: 'Découvertes marquantes' },
        { type: 'list', items: [
          'Manuscrits de la mer Morte (1947) : textes bibliques 1000 ans plus anciens que les codices médiévaux',
          'Pilate : inscription latine à Césarée mentionnant « Pontius Pilatus, préfet de Judée »',
          'Maison de Pierre à Capharnaüm, piscine de Béthesda, rue de Siloé à Jérusalem',
          'Inscriptions et monnaies confirmant des figures du NT (Caïphe, Erode, proconsuls pauliniens)',
        ]},
        { type: 'img', altKey: 'heritage_img_scrolls_alt', captionKey: 'heritage_img_scrolls_cap' },
        { type: 'h2', text: 'Limites et humilité' },
        { type: 'p', text: 'L\'absence de preuve archéologique n\'est pas preuve d\'absence : beaucoup de sites n\'ont pas été fouillés. L\'archéologie sert la compréhension, pas une apologétique naïve. TKV encourage une foi qui accueille les questions sérieuses.' },
      ],
      en: [
        { type: 'p', text: 'Archaeology does not "prove" the Bible word for word, but it illuminates contexts, places, and figures — and often strengthens the historical credibility of biblical accounts.' },
        { type: 'h2', text: 'Landmark discoveries' },
        { type: 'list', items: [
          'Dead Sea Scrolls (1947): biblical texts 1000 years older than medieval codices',
          'Pilate: Latin inscription at Caesarea naming "Pontius Pilatus, prefect of Judea"',
          'House of Peter at Capernaum, Pool of Bethesda, Siloam road in Jerusalem',
          'Inscriptions and coins confirming NT figures (Caiaphas, Herod, Pauline proconsuls)',
        ]},
        { type: 'img', altKey: 'heritage_img_scrolls_alt', captionKey: 'heritage_img_scrolls_cap' },
        { type: 'h2', text: 'Limits and humility' },
        { type: 'p', text: 'Absence of archaeological proof is not proof of absence: many sites remain unexcavated. Archaeology serves understanding, not naive apologetics. TKV encourages faith that welcomes serious questions.' },
      ],
    },
  },
};
