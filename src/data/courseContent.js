/** Contenu des modules de cours — FR, EN, ES, NL, PT, AR */
import { COURSE_SECTIONS_EXTENDED } from './courseContentExtended.js';

function mergeExtendedSections() {
  for (const courseId of Object.keys(COURSE_SECTIONS_EXTENDED)) {
    for (const [modIdx, locales] of Object.entries(COURSE_SECTIONS_EXTENDED[courseId])) {
      const mod = COURSE_CONTENT[courseId]?.[Number(modIdx)];
      if (mod?.sections) Object.assign(mod.sections, locales);
    }
  }
}

export const COURSE_CONTENT = {
  foundations: {
    1: {
      titleKey: 'module_f1_title',
      sections: {
        fr: [
          'Chaque parcours spirituel commence quelque part. Avant de parler de doctrine, prenez un moment pour nommer ce que « Dieu » représente pour vous aujourd\'hui : présence, absence, question, espérance, blessure, silence.',
          'La Bible ne demande pas d\'effacer vos doutes. Elle invite à rencontrer un Dieu qui se révèle progressivement — dans l\'histoire d\'Israël, dans le Christ, et par l\'Esprit dans votre vie.',
          'Exercice : notez trois mots qui décrivent votre rapport actuel à Dieu. Revenez-y à la fin du module pour voir ce qui a bougé.',
        ],
        en: [
          'Every spiritual journey starts somewhere. Before doctrine, take a moment to name what "God" means to you today: presence, absence, question, hope, wound, silence.',
          'Scripture does not ask you to erase doubt. It invites you to meet a God who reveals himself progressively — in Israel\'s story, in Christ, and by the Spirit in your life.',
          'Exercise: write three words that describe your current relationship with God. Return to them at the end of this module to see what has shifted.',
        ],
      },
    },
    2: {
      titleKey: 'module_f2_title',
      sections: {
        fr: [
          'Lire la Bible avec fruit demande un cadre simple : prière brève, lecture attentive, méditation, application. Quinze minutes régulières valent mieux qu\'une heure occasionnelle.',
          'Commencez par un évangile (Marc ou Jean), un psaume par jour, ou un plan TKV. Notez une phrase qui vous frappe et une action concrète pour la semaine.',
          'L\'objectif n\'est pas d\'accumuler des informations, mais d\'entendre la Parole qui transforme — avec l\'aide de la communauté et des enseignements TKV.',
        ],
        en: [
          'Fruitful Bible reading needs a simple rhythm: brief prayer, attentive reading, meditation, application. Fifteen regular minutes beat an occasional hour.',
          'Start with a Gospel (Mark or John), a psalm a day, or a TKV plan. Note one striking phrase and one concrete action for the week.',
          'The goal is not information overload but hearing the Word that transforms — with community and TKV teaching alongside you.',
        ],
      },
    },
    3: {
      titleKey: 'module_f3_title',
      sections: {
        fr: [
          'Prier, ce n\'est pas performer une formule parfaite. C\'est parler à Dieu avec ce que vous avez : joie, fatigue, colère, gratitude, silence.',
          'Essayez trois formats courts cette semaine : louange (remercier), confession (être honnête), intercession (porter quelqu\'un d\'autre). Deux minutes suffisent pour commencer.',
          'Si la prière semble « vide », continuez. La fidélité compte plus que l\'émotion du moment. Jésus a enseigné le Notre Père comme modèle simple et profond.',
        ],
        en: [
          'Prayer is not performing a perfect formula. It is talking to God with what you have: joy, fatigue, anger, gratitude, silence.',
          'Try three short formats this week: praise (thanks), confession (honesty), intercession (carrying someone else). Two minutes are enough to start.',
          'If prayer feels "empty," keep going. Faithfulness matters more than momentary emotion. Jesus taught the Lord\'s Prayer as a simple, deep pattern.',
        ],
      },
    },
    4: {
      titleKey: 'module_f4_title',
      sections: {
        fr: [
          'Être « en Christ » signifie que votre identité la plus profonde n\'est plus définie seulement par vos réussites, vos échecs ou le regard des autres.',
          'La nouvelle naissance n\'efface pas votre personnalité : elle la libère pour aimer, pardonner et servir avec l\'aide de l\'Esprit.',
          'Réflexion : quelle étiquette vous collez-vous encore (timide, indigne, exigeant) ? Demandez à Dieu quelle identité il vous donne en Christ.',
        ],
        en: [
          'Being "in Christ" means your deepest identity is no longer defined only by success, failure, or others\' opinions.',
          'New birth does not erase your personality: it frees you to love, forgive, and serve with the Spirit\'s help.',
          'Reflection: what label do you still wear (shy, unworthy, demanding)? Ask God what identity he gives you in Christ.',
        ],
      },
    },
    5: {
      titleKey: 'module_f5_title',
      sections: {
        fr: [
          'L\'Esprit Saint n\'est pas une force vague : il consolide, guide, convainc et produit du fruit (amour, joie, paix, patience…).',
          'Discerner sa voix demande humilité : il ne contredit jamais l\'Écriture ni l\'amour du prochain. Une impression doit être éprouvée dans la prière et la communauté.',
          'Cette semaine, lisez Galates 5.22–23 et choisissez un fruit à cultiver concrètement (par exemple la patience dans une relation difficile).',
        ],
        en: [
          'The Holy Spirit is not a vague force: he comforts, guides, convicts, and produces fruit (love, joy, peace, patience…).',
          'Discerning his voice takes humility: he never contradicts Scripture or love of neighbor. Impressions should be tested in prayer and community.',
          'This week, read Galatians 5:22–23 and choose one fruit to grow in practice (for example patience in a difficult relationship).',
        ],
      },
    },
    6: {
      titleKey: 'module_f6_title',
      sections: {
        fr: [
          'La foi biblique est personnelle mais jamais solitaire. Dès les premiers chrétiens, la communion, l\'enseignement et la fraction du pain allaient ensemble.',
          'Une église locale saine n\'est pas parfaite : elle accueille, corrige avec douceur et envoie en mission. Si vous êtes blessé par une communauté, ne confondez pas Christ et ses disciples imparfaits.',
          'Action : identifiez une façon de vous relier cette semaine (culte, cellule TKV, appel à un frère ou une sœur, service concret).',
        ],
        en: [
          'Biblical faith is personal but never solitary. From the earliest Christians, fellowship, teaching, and breaking bread went together.',
          'A healthy local church is not perfect: it welcomes, corrects gently, and sends on mission. If a community hurt you, do not confuse Christ with imperfect disciples.',
          'Action: find one way to connect this week (worship, TKV cell, calling a brother or sister, practical service).',
        ],
      },
    },
    7: {
      titleKey: 'module_f7_title',
      sections: {
        fr: [
          'Les épreuves ne signifient pas que Dieu vous a abandonné. La Bible montre des hommes et des femmes de foi traversant la souffrance, le doute, parfois la nuit.',
          'L\'espérance chrétienne n\'est pas un optimisme naïf : elle s\'appuie sur la résurrection et la promesse que Dieu restaure ce qui est brisé.',
          'Si vous traversez une saison difficile, parlez-en à quelqu\'un de confiance. La prière honnête des psaumes (« jusqu\'à quand ? ») est déjà une forme de foi.',
        ],
        en: [
          'Trials do not mean God has abandoned you. Scripture shows men and women of faith walking through suffering, doubt, sometimes night.',
          'Christian hope is not naive optimism: it rests on the resurrection and the promise that God restores what is broken.',
          'If you are in a hard season, tell someone you trust. Honest psalm-prayer ("how long?") is already a form of faith.',
        ],
      },
    },
    8: {
      titleKey: 'module_f8_title',
      sections: {
        fr: [
          'Mission, ce n\'est pas seulement partir à l\'étranger : c\'est incarner l\'évangile là où vous vivez — famille, travail, école, réseaux sociaux.',
          'Votre témoignage le plus crédible combine parole claire et vie cohérente. On n\'impose pas la foi ; on propose Christ avec respect.',
          'Clôture du parcours : notez une personne à encourager et un geste concret de lumière cette semaine. Revenez aux trois mots du module 1 pour mesurer votre chemin.',
        ],
        en: [
          'Mission is not only going abroad: it is embodying the gospel where you live — family, work, school, social networks.',
          'Your most credible witness joins clear words and a coherent life. Faith is not imposed; Christ is offered with respect.',
          'Path closing: name one person to encourage and one concrete act of light this week. Return to your three words from module 1 to see how far you\'ve come.',
        ],
      },
    },
  },
  apologetics: {
    1: {
      titleKey: 'module_a1_title',
      sections: {
        fr: [
          '« Pourquoi croire ? » n\'est pas une question honteuse. La foi chrétienne s\'appuie sur le témoignage des apôtres, la résurrection annoncée dès les premiers siècles, et l\'expérience transformée de millions de disciples.',
          'Les arguments rationnels (cosmologique, moral, historique) éclairent ; ils ne remplacent pas la rencontre personnelle. TKV présente les deux : rigueur et relation.',
          'Apologétique bienveillante : écouter d\'abord, répondre avec respect, reconnaître les limites de nos preuves — et pointer vers Christ, pas vers une victoire rhétorique.',
        ],
        en: [
          '"Why believe?" is not a shameful question. Christian faith rests on apostolic witness, the resurrection proclaimed from the earliest centuries, and the transformed lives of millions of disciples.',
          'Rational arguments (cosmological, moral, historical) illuminate; they do not replace personal encounter. TKV holds both: rigor and relationship.',
          'Kind apologetics: listen first, answer with respect, admit the limits of our proofs — and point to Christ, not to a rhetorical win.',
        ],
      },
    },
    2: {
      titleKey: 'module_a2_title',
      sections: {
        fr: [
          'Le mal dans le monde est l\'une des objections les plus sérieuses contre la foi. Le christianisme ne le minimise pas : la croix place Dieu au cœur de la souffrance.',
          'Plusieurs réponses coexistent : liberté humaine, réalité du péché, espérance de justice finale, présence de Dieu qui souffre avec nous. Aucune formule ne dissout toute douleur ici-bas.',
          'Apologétique humble : écouter la personne qui souffre avant d\'argumenter. Parfois le silence compatissant parle plus qu\'un discours.',
        ],
        en: [
          'Evil in the world is one of the most serious objections to faith. Christianity does not minimize it: the cross places God at the heart of suffering.',
          'Several responses coexist: human freedom, reality of sin, hope of final justice, God\'s presence suffering with us. No formula dissolves all pain here and now.',
          'Humble apologetics: listen to the person who hurts before arguing. Sometimes compassionate silence speaks louder than a speech.',
        ],
      },
    },
    3: {
      titleKey: 'module_a3_title',
      sections: {
        fr: [
          'Science et foi ne sont pas ennemies par principe. La Bible n\'est pas un manuel scientifique ; la science ne mesure pas l\'amour ni le sens.',
          'Beaucoup de chrétiens travaillent en recherche. Le débat porte souvent sur l\'interprétation (âge de la terre, évolution guidée) plus que sur l\'existence de Dieu.',
          'Dialogue : posez des questions précises, évitez les caricatures (« tous les croyants sont anti-science » / « la science a tout expliqué »).',
        ],
        en: [
          'Science and faith are not enemies in principle. Scripture is not a science textbook; science does not measure love or meaning.',
          'Many Christians work in research. Debate often concerns interpretation (age of earth, guided evolution) more than God\'s existence.',
          'Dialogue: ask precise questions, avoid caricatures ("all believers are anti-science" / "science explained everything").',
        ],
      },
    },
    4: {
      titleKey: 'module_a4_title',
      sections: {
        fr: [
          'La fiabilité des Écritures repose sur des milliers de manuscrits, une transmission soignée et une cohérence thématique remarquable sur des siècles et des auteurs variés.',
          'L\'archéologie ne « prouve » pas chaque verset, mais elle éclaire souvent les contextes bibliques et renforce la crédibilité historique de nombreux récits.',
          'En apologétique : distinguez faits historiques, interprétation théologique et application personnelle. Invitez votre interlocuteur à lire un évangile avec vous.',
        ],
        en: [
          'Scripture\'s reliability rests on thousands of manuscripts, careful transmission, and striking thematic coherence across centuries and diverse authors.',
          'Archaeology does not "prove" every verse, but it often illuminates biblical contexts and strengthens the historical credibility of many accounts.',
          'In apologetics: distinguish historical facts, theological interpretation, and personal application. Invite your conversation partner to read a Gospel with you.',
        ],
      },
    },
    5: {
      titleKey: 'module_a5_title',
      sections: {
        fr: [
          'Le dialogue interreligieux exige respect et vérité : reconnaître la sincérité d\'autrui sans nier l\'unicité de Christ telle que l\'Évangile la présente.',
          'Évitez les comparaisons caricaturales. Cherchez ce que l\'autre cherche (paix, sens, pardon) et montrez comment le Christ y répond — sans mépris.',
          'Pratique : une question ouverte (« Qu\'est-ce qui vous a le plus marqué dans votre chemin spirituel ? ») vaut mieux qu\'un monologue de conviction.',
        ],
        en: [
          'Interfaith dialogue requires respect and truth: honor others\' sincerity without denying the uniqueness of Christ as the Gospel presents it.',
          'Avoid caricatured comparisons. Discover what the other person seeks (peace, meaning, forgiveness) and show how Christ answers — without contempt.',
          'Practice: one open question ("What has marked you most on your spiritual path?") beats a one-sided lecture on belief.',
        ],
      },
    },
    6: {
      titleKey: 'module_a6_title',
      sections: {
        fr: [
          'Partager sa foi commence souvent par une vie cohérente et une écoute attentive, plus qu\'avec un discours parfait.',
          'Votre témoignage personnel (avant / après la rencontre avec Christ) est irremplaçable : personne d\'autre ne peut raconter ce que Dieu a fait pour vous.',
          'Clôture du parcours apologétique : choisissez une personne, priez pour elle, et proposez un café ou une lecture commune de Marc — sans pression, avec respect.',
        ],
        en: [
          'Sharing faith often starts with a coherent life and attentive listening more than a flawless speech.',
          'Your personal testimony (before / after meeting Christ) is irreplaceable: no one else can tell what God has done for you.',
          'Apologetics path closing: choose one person, pray for them, and offer coffee or reading Mark together — without pressure, with respect.',
        ],
      },
    },
  },
  teleios: {
    1: {
      titleKey: 'module_t1_title',
      sections: {
        fr: [
          'Teleios signifie « parvenu à la maturité ». Ce parcours s\'adresse à ceux qui veulent aller au-delà des bases et vivre une foi stable, profonde et transmissible.',
          'La maturité biblique n\'est pas l\'âge ni le statut : c\'est la croissance en Christ, mesurée par l\'amour, la fidélité et le fruit de l\'Esprit.',
          'Exercice : lisez Colossiens 1.28–29 et notez ce que Paul appelle « présenter chacun parfait (teleios) en Christ ».',
        ],
        en: [
          'Teleios means "having reached maturity." This path is for those who want to go beyond basics and live a stable, deep, transmissible faith.',
          'Biblical maturity is not age or status: it is growth in Christ, measured by love, faithfulness, and the fruit of the Spirit.',
          'Exercise: read Colossians 1:28–29 and note what Paul calls "presenting everyone perfect (teleios) in Christ."',
        ],
      },
    },
    2: {
      titleKey: 'module_t2_title',
      sections: {
        fr: [
          'Le caractère christique se forme dans le quotidien : parole vraie, maîtrise de soi, générosité, paix intérieure.',
          'Galates 5 liste le fruit de l\'Esprit comme preuve visible d\'une vie habitée par Dieu — pas comme performance religieuse.',
          'Choisissez un fruit à cultiver cette semaine et une situation concrète où le pratiquer.',
        ],
        en: [
          'Christlike character is formed in daily life: truthful speech, self-control, generosity, inner peace.',
          'Galatians 5 lists the fruit of the Spirit as visible proof of a God-inhabited life — not religious performance.',
          'Choose one fruit to grow this week and one concrete situation to practice it in.',
        ],
      },
    },
    3: {
      titleKey: 'module_t3_title',
      sections: {
        fr: [
          'Le discernement consiste à distinguer ce qui vient de Dieu, de soi, ou des pressions extérieures — avant de décider.',
          'La sagesse pratique combine Écriture, prière et conseil de frères et sœurs matures.',
          'Avant une décision importante, posez trois questions : Est-ce conforme à la Parole ? Est-ce motivé par l\'amour ? Est-ce confirmé dans la communauté ?',
        ],
        en: [
          'Discernment means distinguishing what comes from God, self, or external pressure — before deciding.',
          'Practical wisdom combines Scripture, prayer, and counsel from mature brothers and sisters.',
          'Before a major decision, ask three questions: Is it aligned with the Word? Motivated by love? Confirmed in community?',
        ],
      },
    },
    4: {
      titleKey: 'module_t4_title',
      sections: {
        fr: [
          'La maturité se révèle aussi dans la capacité de servir et de transmettre : faire grandir d\'autres disciples, pas seulement soi-même.',
          'Paul dit aux Corinthiens : « Devenez mes imitateurs, comme je le suis du Christ. » L\'imitation saine est un modèle de vie, pas un culte de personnalité.',
          'Identifiez une personne que vous pouvez encourager cette semaine — par la Parole, la prière ou un accompagnement simple.',
        ],
        en: [
          'Maturity also shows in serving and passing on: helping others grow as disciples, not only yourself.',
          'Paul tells the Corinthians: "Imitate me as I imitate Christ." Healthy imitation is a life model, not personality worship.',
          'Identify one person you can encourage this week — through the Word, prayer, or simple mentoring.',
        ],
      },
    },
    5: {
      titleKey: 'module_t5_title',
      sections: {
        fr: [
          'Les épreuves révèlent la profondeur de la racine. Teleios ne signifie pas l\'absence de lutte, mais la persévérance fidèle.',
          'Jacques 1 invite à considérer les épreuves comme laboratoire de patience et de maturité.',
          'Si vous traversez une saison difficile, partagez-la avec un accompagnateur spirituel de confiance.',
        ],
        en: [
          'Trials reveal root depth. Teleios does not mean absence of struggle, but faithful perseverance.',
          'James 1 invites us to see trials as a laboratory for patience and maturity.',
          'If you are in a hard season, share it with a trusted spiritual mentor.',
        ],
      },
    },
    6: {
      titleKey: 'module_t6_title',
      sections: {
        fr: [
          'Vivre Teleios au quotidien, c\'est unir adoration, Parole, service et mission dans une vie cohérente.',
          'La maturité n\'est pas un diplôme : c\'est une marche continue vers la ressemblance du Christ.',
          'Clôture du parcours Teleios : écrivez une prière de consécration et un engagement concret pour les trois prochains mois.',
        ],
        en: [
          'Living Teleios daily means joining worship, Word, service, and mission in a coherent life.',
          'Maturity is not a diploma: it is an ongoing walk toward Christlikeness.',
          'Teleios path closing: write a prayer of consecration and one concrete commitment for the next three months.',
        ],
      },
    },
  },
};

mergeExtendedSections();
