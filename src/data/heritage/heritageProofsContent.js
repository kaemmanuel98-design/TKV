/** Preuves historiques — articles détaillés (croyants, non-croyants, sceptiques) */

const W = 'heritage_credit_wikimedia';

export const HERITAGE_PROOFS_CONTENT = {
  tacitus: {
    titleKey: 'heritage_proof_tacitus_title',
    heroAltKey: 'heritage_proof_tacitus_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Publia Cornelius Tacitus (vers 56-120 apr. J.-C.) est un historien romain majeur, sénateur et ancien consul. Il n\'est pas chrétien et écrit avec froideur politique sur l\'Empire.' },
        { type: 'h2', text: 'Texte clé — Annales XV, 44 (vers 116)' },
        { type: 'quote', text: '« Nero… imputa aux chrétiens, haïs pour leur abomination, le crime d\'avoir incendié Rome… Christus, de qui le nom vient, avait été mis à mort par le procurateur Ponce Pilate sous le règne de Tibère. »', source: 'Tacite, Annales (traduction adaptée)' },
        { type: 'h2', text: 'Ce que les spécialistes en déduisent' },
        { type: 'list', items: [
          'Existence de Jésus (« Christus ») et exécution sous Pilate — admis par un auteur païen hostile',
          'Existence d\'une communauté « chrétiens » identifiable à Rome vers 64',
          'Aucun intérêt apologétique chrétien : Tacite déteste Nero et méprise les chrétiens',
        ]},
        { type: 'p', text: 'Objection rare : certains contestent l\'authenticité du passage (interpolation) ; la majorité des philologues le tiennent pour authentique ou partiellement authentique. TKV présente le consensus sans le caricaturer.' },
      ],
      en: [
        { type: 'p', text: 'Publius Cornelius Tacitus (c. AD 56-120) is a major Roman historian, senator, and former consul. He is not Christian and writes with political coldness about the Empire.' },
        { type: 'h2', text: 'Key text — Annals 15.44 (c. AD 116)' },
        { type: 'quote', text: '"Nero… charged Christians, hated for their abominations, with burning Rome… Christ, from whom the name comes, was executed by the procurator Pontius Pilate under Tiberius."', source: 'Tacitus, Annals (adapted translation)' },
        { type: 'h2', text: 'What scholars infer' },
        { type: 'list', items: [
          'Jesus\' existence ("Christus") and execution under Pilate — admitted by a hostile pagan author',
          'A identifiable "Christian" community in Rome around AD 64',
          'No Christian apologetic interest: Tacitus hates Nero and despises Christians',
        ]},
        { type: 'p', text: 'Rare objection: some challenge the passage\'s authenticity (interpolation); most philologists accept it as authentic or largely authentic. TKV presents the consensus without caricature.' },
      ],
    },
  },
  josephus: {
    titleKey: 'heritage_proof_josephus_title',
    heroAltKey: 'heritage_proof_josephus_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Flavius Josèphe (37-100 apr. J.-C.) est un historien juif, pharisien devenu collaborateur romain après la guerre de 66-70. Il n\'est pas chrétien.' },
        { type: 'h2', text: 'Antiquités XVIII, 63-64 (Testimonium Flavianum)' },
        { type: 'p', text: 'Le passage sur Jésus a été retouché par des copistes chrétiens (mentions du Messie, résurrection). La version « minimale » retenue par beaucoup d\'érudits dit au minimum :' },
        { type: 'quote', text: '« À cette époque apparut Jésus, homme sage… Pilate le condamna à la croix… Ses disciples n\'ont pas cessé de l\'aimer ; ils ont dit qu\'il était apparu vivant le troisième jour. »', source: 'Reconstruction critique' },
        { type: 'h2', text: 'Passage sur Jacques (Antiquités XX, 200)' },
        { type: 'p', text: '« Ananus… fit condamner à mort Jacques, frère de celui qu\'on appelle le Christ. » — Texte peu contesté, indépendant des Évangiles, confirmant l\'existence de Jésus et de Jacques frère du Seigneur.' },
        { type: 'p', text: 'Les historiens sceptiques (B. Ehrman, J. Meier) admettent généralement qu\'un noyau historique sur Jésus chez Josèphe est plausible.' },
      ],
      en: [
        { type: 'p', text: 'Flavius Josephus (AD 37-100) is a Jewish historian, Pharisee turned Roman collaborator after the war of 66-70. He is not Christian.' },
        { type: 'h2', text: 'Antiquities 18.63-64 (Testimonium Flavianum)' },
        { type: 'p', text: 'The passage on Jesus was edited by Christian scribes (Messiah, resurrection). A "minimal" version accepted by many scholars at least says:' },
        { type: 'quote', text: '"At this time appeared Jesus, a wise man… Pilate condemned him to the cross… His disciples did not cease to love him; they said he appeared alive on the third day."', source: 'Critical reconstruction' },
        { type: 'h2', text: 'Passage on James (Antiquities 20.200)' },
        { type: 'p', text: '"Ananus… had James put to death, brother of the one called Christ." — Largely uncontested text, independent of Gospels, confirming Jesus and James his brother.' },
        { type: 'p', text: 'Skeptical historians (B. Ehrman, J. Meier) generally admit a historical core about Jesus in Josephus is plausible.' },
      ],
    },
  },
  'pliny-trajan': {
    titleKey: 'heritage_proof_pliny_title',
    heroAltKey: 'heritage_proof_pliny_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Pline le Jeune, gouverneur de Bithynie, écrit à l\'empereur Trajan vers 112 apr. J.-C. pour demander comment juger les chrétiens.' },
        { type: 'quote', text: '« Ils se réunissaient avant l\'aube, chantaient un hymne à Christus comme à un dieu… j\'ai contraint deux esclaves, ministres de leur culte, à avouer sous la torture. »', source: 'Lettre 10.96' },
        { type: 'list', items: [
          'Culte du Christ comme divinité déjà en Asie Mineure au début du IIe siècle',
          'Assemblées régulières, repas fraternels (eucharistie probable)',
          'Persécution administrative, pas mythe tardif',
        ]},
        { type: 'p', text: 'Trajan répond de ne pas chercher les chrétiens activement mais de punir s\'ils persistent — preuve d\'une politique impériale consciente du mouvement.' },
      ],
      en: [
        { type: 'p', text: 'Pliny the Younger, governor of Bithynia, writes to Emperor Trajan c. AD 112 on how to try Christians.' },
        { type: 'quote', text: '"They met before dawn, sang a hymn to Christus as to a god… I forced two slave deacons to confess under torture."', source: 'Letter 10.96' },
        { type: 'list', items: [
          'Worship of Christ as deity in Asia Minor early 2nd century',
          'Regular meetings, fellowship meals (likely Eucharist)',
          'Administrative persecution, not late myth',
        ]},
        { type: 'p', text: 'Trajan replies not to hunt Christians actively but to punish if they persist — evidence of imperial policy aware of the movement.' },
      ],
    },
  },
  suetonius: {
    titleKey: 'heritage_proof_suetonius_title',
    heroAltKey: 'heritage_proof_suetonius_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Suétone (vers 69-122), biographe impérial romain, mentionne les chrétiens dans La Vie des douze Césars.' },
        { type: 'h2', text: 'Claudius, 25' },
        { type: 'p', text: '« Il chassa de Rome les Juifs à cause des troubles provoqués par Chrestus. » — Interprétation débattue : Christus ou agitateur juif ? Beaucoup voient une allusion au christianisme naissant à Rome.' },
        { type: 'h2', text: 'Néron, 16' },
        { type: 'p', text: 'Néron punit les « chrétiens », groupe haï de l\'humanité — corroboration indépendante de Tacite sur la persécution de 64.' },
      ],
      en: [
        { type: 'p', text: 'Suetonius (c. AD 69-122), imperial biographer, mentions Christians in The Twelve Caesars.' },
        { type: 'h2', text: 'Claudius 25' },
        { type: 'p', text: '"He expelled Jews from Rome because of disturbances caused by Chrestus." — Debated: Christus or Jewish agitator? Many see a reference to emerging Christianity in Rome.' },
        { type: 'h2', text: 'Nero 16' },
        { type: 'p', text: 'Nero punishes "Christians," a group hated by mankind — independent corroboration of Tacitus on the persecution of AD 64.' },
      ],
    },
  },
  'talmud-mentions': {
    titleKey: 'heritage_proof_talmud_title',
    heroAltKey: 'heritage_proof_talmud_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Les textes rabbiniques tardifs (Talmud babylonien, Tosefta) contiennent des allusions hostiles à Jésus (« Yeshu »), parfois difficiles à dater.' },
        { type: 'h2', text: 'Valeur historique' },
        { type: 'list', items: [
          'Témoignage juif non chrétien (souvent polémique) d\'une figure historique',
          'Mention d\'une exécution par lapidation / pendaison — diverge des Évangiles (crucifixion sous Rome)',
          'Confirme que Jésus n\'est pas une invention médiévale',
        ]},
        { type: 'p', text: 'Les spécialistes utilisent ces textes avec prudence : copie tardive, agenda polémique. Ils complètent Tacite et Josèphe, ne les remplacent pas.' },
      ],
      en: [
        { type: 'p', text: 'Later rabbinic texts (Babylonian Talmud, Tosefta) contain hostile allusions to Jesus ("Yeshu"), sometimes hard to date.' },
        { type: 'h2', text: 'Historical value' },
        { type: 'list', items: [
          'Non-Christian Jewish witness (often polemical) to a historical figure',
          'Mention of execution by stoning/hanging — diverges from Gospels (crucifixion under Rome)',
          'Confirms Jesus is not a medieval invention',
        ]},
        { type: 'p', text: 'Specialists use these texts cautiously: late copies, polemical agenda. They complement Tacitus and Josephus, not replace them.' },
      ],
    },
  },
  'early-creeds': {
    titleKey: 'heritage_proof_creeds_title',
    heroAltKey: 'heritage_proof_creeds_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Avant les Évangiles canoniques complets, des formules de foi circulent oralement puis par écrit — preuve d\'une croyance structurée très tôt.' },
        { type: 'h2', text: '1 Corinthiens 15, 3-7 (Paul, vers 55 apr. J.-C.)' },
        { type: 'quote', text: '« Christ est mort pour nos péchés selon les Écritures, a été enseveli, est ressuscité le troisième jour… est apparu à Céphas, puis aux Douze… à plus de cinq cents frères… »', source: 'Paul cite une tradition reçue' },
        { type: 'p', text: 'Paul dit transmettre ce qu\'il a « reçu » — formulation antérieure à sa lettre, souvent datée quelques années après Pâques. Les sceptiques sérieux (Ehrman, Lüdemann) débattent l\'interprétation, pas toujours l\'antiquité du noyau.' },
        { type: 'h2', text: 'Autres témoins précoces' },
        { type: 'list', items: [
          'Philippiens 2, 6-11 — cantique christologique pré-paulinien',
          'Actes 2 (Pentecôte) — prédication résurrection quelques semaines après les faits (selon chronologie lucanienne)',
          'Inscriptions et papyrus du IIe siècle',
        ]},
      ],
      en: [
        { type: 'p', text: 'Before complete canonical Gospels, faith formulas circulate orally then in writing — evidence of structured belief very early.' },
        { type: 'h2', text: '1 Corinthians 15:3-7 (Paul, c. AD 55)' },
        { type: 'quote', text: '"Christ died for our sins according to the Scriptures, was buried, rose on the third day… appeared to Cephas, then the Twelve… to more than five hundred brothers…"', source: 'Paul citing received tradition' },
        { type: 'p', text: 'Paul says he "received" this — formulation before his letter, often dated within years of Easter. Serious skeptics (Ehrman, Lüdemann) debate interpretation, not always the core\'s antiquity.' },
        { type: 'h2', text: 'Other early witnesses' },
        { type: 'list', items: [
          'Philippians 2:6-11 — pre-Pauline Christ hymn',
          'Acts 2 (Pentecost) — resurrection preaching weeks after events (Luke\'s chronology)',
          '2nd-century inscriptions and papyri',
        ]},
      ],
    },
  },
  'early-martyrdom': {
    titleKey: 'heritage_proof_martyrdom_title',
    heroAltKey: 'heritage_proof_martyrdom_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Des chrétiens meurent pour leur foi dès le Ier-IIe siècle. Leur attitude face à la mort suggère une conviction profonde, pas une supercherie collective consciente.' },
        { type: 'list', items: [
          'Martyre de Polycarpe (vers 155) — récit ancien, refus de maudire Christ',
          'Ignace d\'Antioche (vers 107) — lettres en route vers Rome',
          'Persécutions documentées par sources romaines et chrétiennes',
        ]},
        { type: 'p', text: 'Argument : peu de gens meurent pour un mensonge qu\'ils savent inventé. Critique : cela prouve la sincérité des croyants, pas automatiquement la vérité des faits (résurrection). TKV distingue les deux.' },
      ],
      en: [
        { type: 'p', text: 'Christians die for faith from the 1st-2nd century. Their attitude toward death suggests deep conviction, not a conscious collective hoax.' },
        { type: 'list', items: [
          'Martyrdom of Polycarp (c. AD 155) — ancient account, refusal to curse Christ',
          'Ignatius of Antioch (c. AD 107) — letters en route to Rome',
          'Persecutions documented by Roman and Christian sources',
        ]},
        { type: 'p', text: 'Argument: few die for a lie they know they invented. Critique: this proves believers\' sincerity, not automatically the facts (resurrection). TKV distinguishes both.' },
      ],
    },
  },
  'pagan-critics': {
    titleKey: 'heritage_proof_pagan_title',
    heroAltKey: 'heritage_proof_pagan_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Les adversaires païens du IIe siècle connaissent le christianisme et l\'attaquent — preuve qu\'il est déjà répandu et structuré.' },
        { type: 'h2', text: 'Celse (vers 178)' },
        { type: 'p', text: 'Son œuvre « La Vraie Doctrine » (perdue, connue par Origène) nie la naissance virginale, la résurrection, critique les Évangiles. Il ne dit pas que Jésus n\'a jamais existé : il combat une religion qu\'il prend au sérieux.' },
        { type: 'h2', text: 'Lucien de Samosate' },
        { type: 'p', text: 'Moque le christianisme comme superstition, mentionne le fondateur crucifié en Palestine — témoin profane sarcastique mais informatif.' },
      ],
      en: [
        { type: 'p', text: '2nd-century pagan opponents know and attack Christianity — proof it is already widespread and structured.' },
        { type: 'h2', text: 'Celsus (c. AD 178)' },
        { type: 'p', text: 'His "True Doctrine" (lost, known through Origen) denies virgin birth, resurrection, critiques Gospels. He does not say Jesus never existed: he fights a religion he takes seriously.' },
        { type: 'h2', text: 'Lucian of Samosate' },
        { type: 'p', text: 'Mocks Christianity as superstition, mentions the founder crucified in Palestine — sarcastic but informative secular witness.' },
      ],
    },
  },
  'minimal-facts': {
    titleKey: 'heritage_proof_minimal_title',
    heroAltKey: 'heritage_proof_minimal_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'L\'approche « faits minimaux » (Habermas, Licona, Wright) part de données acceptées par une majorité de spécialistes, croyants ou non.' },
        { type: 'list', items: [
          'Mort de Jésus par crucifixion sous Pilate',
          'Disciples sincèrement convaincus d\'avoir vu Jésus vivant après sa mort',
          'Paul, ennemi devenu apôtre, peu après',
          'Prédication de la résurrection à Jérusalem peu après les événements',
          'Conversion de Jacques (frère sceptique) et de nombreux Juifs',
        ]},
        { type: 'p', text: 'Les explications naturelles (hallucinations, légende lente) sont discutées point par point dans la littérature. TKV encourage la lecture des deux camps : Habermas, Wright, Ehrman, Carrier.' },
      ],
      en: [
        { type: 'p', text: 'The "minimal facts" approach (Habermas, Licona, Wright) starts from data accepted by a majority of specialists, believing or not.' },
        { type: 'list', items: [
          'Jesus\' death by crucifixion under Pilate',
          'Disciples sincerely convinced they saw Jesus alive after death',
          'Paul, enemy turned apostle, shortly after',
          'Resurrection preached in Jerusalem soon after events',
          'Conversion of James (skeptical brother) and many Jews',
        ]},
        { type: 'p', text: 'Natural explanations (hallucinations, slow legend) are debated point by point in literature. TKV encourages reading both sides: Habermas, Wright, Ehrman, Carrier.' },
      ],
    },
  },
  'modern-skeptics': {
    titleKey: 'heritage_proof_modern_title',
    heroAltKey: 'heritage_proof_modern_img_alt',
    blocks: {
      fr: [
        { type: 'h2', text: 'Sceptiques et historiens laïcs' },
        { type: 'list', items: [
          'Bart Ehrman (agnostique) : Jésus historique certain ; débat sur miracles et résurrection',
          'Gerd Lüdemann (athée) : disciples ont eu des « expériences » ; rejet surnaturel',
          'Richard Carrier (mythiciste) : minorité — Jésus peut-être mythique ; contesté par la majorité',
          'Maurice Casey, James Dunn : Jésus juif du Ier siècle, Évangiles contiennent mémoire réelle',
        ]},
        { type: 'h2', text: 'Croyants chercheurs' },
        { type: 'list', items: [
          'N.T. Wright, Craig Evans, Brant Pitre — résurrection et contexte juif',
          'Gary Habermas — faits minimaux',
          'Peter Williams — fiabilité des Évangiles',
        ]},
        { type: 'p', text: 'TKV ne cache pas le désaccord : la foi chrétienne repose aussi sur une rencontre vivante, pas seulement sur un consensus académique.' },
      ],
      en: [
        { type: 'h2', text: 'Skeptics and secular historians' },
        { type: 'list', items: [
          'Bart Ehrman (agnostic): historical Jesus certain; debate on miracles and resurrection',
          'Gerd Lüdemann (atheist): disciples had "experiences"; rejects supernatural',
          'Richard Carrier (mythicist): minority — Jesus possibly mythical; challenged by majority',
          'Maurice Casey, James Dunn: 1st-century Jewish Jesus, Gospels contain real memory',
        ]},
        { type: 'h2', text: 'Believing scholars' },
        { type: 'list', items: [
          'N.T. Wright, Craig Evans, Brant Pitre — resurrection and Jewish context',
          'Gary Habermas — minimal facts',
          'Peter Williams — Gospel reliability',
        ]},
        { type: 'p', text: 'TKV does not hide disagreement: Christian faith also rests on living encounter, not only academic consensus.' },
      ],
    },
  },
  'archaeology-proofs': {
    titleKey: 'heritage_proof_archaeo_title',
    heroAltKey: 'heritage_proof_archaeo_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Synthèse des découvertes archéologiques utiles à l\'apologétique historique (voir aussi l\'article Archéologie et Bible).' },
        { type: 'list', items: [
          'Pilate : inscription « Pontius Pilatus praefectus Iudaeae » à Césarée (1961)',
          'Caïphe : ossuaire familial (débat d\'authenticité partielle)',
          'Maison de Pierre, synagogue de Capernaüm, piscine de Béthesda',
          'Golgotha / tombeau : sites traditionnels disputés mais anciens',
          'Manuscrits de la mer Morte : texte biblique stable sur 1000 ans',
        ]},
        { type: 'p', text: 'Aucune pierre ne « prouve » la résurrection ; l\'archéologie ancre le récit dans l\'histoire réelle du Ier siècle.' },
      ],
      en: [
        { type: 'p', text: 'Synthesis of archaeological finds useful for historical apologetics (see also Archaeology and the Bible article).' },
        { type: 'list', items: [
          'Pilate: "Pontius Pilatus praefectus Iudaeae" inscription at Caesarea (1961)',
          'Caiaphas: family ossuary (partial authenticity debate)',
          'House of Peter, Capernaum synagogue, Pool of Bethesda',
          'Golgotha/tomb: disputed but ancient traditional sites',
          'Dead Sea Scrolls: stable biblical text over 1000 years',
        ]},
        { type: 'p', text: 'No stone "proves" resurrection; archaeology anchors the story in real 1st-century history.' },
      ],
    },
  },
  'manuscript-proofs': {
    titleKey: 'heritage_proof_manuscript_title',
    heroAltKey: 'heritage_proof_manuscript_img_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Comparaison avec textes antiques classiques (données souvent citées par croyants et non-croyants) :' },
        { type: 'list', items: [
          'Homère : ~650 copies, écart ~500 ans avec original supposé',
          'Tacite : ~20 copies partielles',
          'Nouveau Testament : >5 800 manuscrits grecs, certains à 25-50 ans des originaux',
        ]},
        { type: 'p', text: 'Daniel Wallace (évangélique) et Bart Ehrman (sceptique) s\'accordent sur l\'abondance des copies ; ils divergent sur l\'interprétation théologique des variantes.' },
        { type: 'p', text: 'Les traductions modernes signalent les passages incertains — transparence académique.' },
      ],
      en: [
        { type: 'p', text: 'Comparison with classical ancient texts (data cited by believers and non-believers):' },
        { type: 'list', items: [
          'Homer: ~650 copies, ~500-year gap to supposed original',
          'Tacitus: ~20 partial copies',
          'New Testament: >5,800 Greek manuscripts, some within 25-50 years of originals',
        ]},
        { type: 'p', text: 'Daniel Wallace (evangelical) and Bart Ehrman (skeptic) agree on abundance of copies; they diverge on theological interpretation of variants.' },
        { type: 'p', text: 'Modern translations note uncertain passages — academic transparency.' },
      ],
    },
  },
};
